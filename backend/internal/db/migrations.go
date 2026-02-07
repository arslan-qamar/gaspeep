package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// MigrationRunner executes SQL migration files
type MigrationRunner struct {
	db *sql.DB
}

// NewMigrationRunner creates a new migration runner
func NewMigrationRunner(db *sql.DB) *MigrationRunner {
	return &MigrationRunner{db: db}
}

// RunMigrations executes all .up.sql files from the migrations directory
func (m *MigrationRunner) RunMigrations(migrationsDir string) error {
	// Create migrations tracking table if it doesn't exist
	_, err := m.db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id SERIAL PRIMARY KEY,
			migration VARCHAR(255) NOT NULL UNIQUE,
			applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get all migration files
	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	// Filter and sort .up.sql files
	var migrationFiles []string
	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".up.sql") {
			migrationFiles = append(migrationFiles, file.Name())
		}
	}
	sort.Strings(migrationFiles)

	// Run each migration
	for _, filename := range migrationFiles {
		// Check if already applied
		var applied bool
		err := m.db.QueryRow(
			"SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE migration = $1)",
			filename,
		).Scan(&applied)
		if err != nil {
			return fmt.Errorf("failed to check migration status: %w", err)
		}

		if applied {
			log.Printf("✓ Migration already applied: %s", filename)
			continue
		}

		// Read migration file
		content, err := os.ReadFile(filepath.Join(migrationsDir, filename))
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", filename, err)
		}

		// Execute migration
		_, err = m.db.Exec(string(content))
		if err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", filename, err)
		}

		// Mark as applied
		_, err = m.db.Exec(
			"INSERT INTO schema_migrations (migration) VALUES ($1)",
			filename,
		)
		if err != nil {
			return fmt.Errorf("failed to mark migration as applied: %w", err)
		}

		log.Printf("✓ Migration applied: %s", filename)
	}

	return nil
}
