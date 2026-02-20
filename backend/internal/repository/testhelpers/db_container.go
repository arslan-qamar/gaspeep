package testhelpers

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	_ "github.com/lib/pq"
)

var testContainer testcontainers.Container

// SetupTestDB creates an isolated PostgreSQL database for testing.
// Returns a connection to the test database and a cleanup function.
func SetupTestDB(t *testing.T) (*sql.DB, func()) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Start PostgreSQL container with PostGIS on first test, reuse for subsequent tests
	if testContainer == nil {
		container, err := createPostGISContainer(ctx)
		if err != nil {
			if isDockerUnavailableErr(err) {
				t.Skipf("Skipping Docker-dependent test: %v", err)
			}
			t.Fatalf("Failed to create PostgreSQL container: %v", err)
		}
		testContainer = container
	}

	// Get container connection details
	host, err := testContainer.Host(ctx)
	if err != nil {
		t.Fatalf("Failed to get container host: %v", err)
	}

	port, err := testContainer.MappedPort(ctx, "5432")
	if err != nil {
		t.Fatalf("Failed to get container port: %v", err)
	}

	// Create a unique test database for this test
	dbName := fmt.Sprintf("gas_peep_test_%d", time.Now().UnixNano())
	rootDB := connectDB(t, host, port.Port(), "postgres", "postgres", "postgres")
	defer rootDB.Close()

	_, err = rootDB.Exec(fmt.Sprintf("CREATE DATABASE %s", dbName))
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	// Connect to the new test database
	testDB := connectDB(t, host, port.Port(), dbName, "postgres", "postgres")

	// Run migrations on the test database
	if err := RunMigrations(t, testDB); err != nil {
		testDB.Close()
		t.Fatalf("Failed to run migrations: %v", err)
	}

	// Cleanup function
	cleanup := func() {
		testDB.Close()
		// Drop the test database
		rootDB := connectDB(t, host, port.Port(), "postgres", "postgres", "postgres")
		defer rootDB.Close()
		_, _ = rootDB.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s", dbName))
	}

	return testDB, cleanup
}

func isDockerUnavailableErr(err error) bool {
	if err == nil {
		return false
	}

	errMsg := strings.ToLower(err.Error())
	return strings.Contains(errMsg, "docker") &&
		(strings.Contains(errMsg, "permission denied") ||
			strings.Contains(errMsg, "connect: operation not permitted") ||
			strings.Contains(errMsg, "no such file or directory") ||
			strings.Contains(errMsg, "cannot connect"))
}

// SetupTestDBWithCleanup is like SetupTestDB but calls cleanup automatically on test failure
func SetupTestDBWithCleanup(t *testing.T) *sql.DB {
	db, cleanup := SetupTestDB(t)
	t.Cleanup(cleanup)
	return db
}

// createPostGISContainer creates a PostgreSQL container with PostGIS extension
func createPostGISContainer(ctx context.Context) (container testcontainers.Container, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("docker unavailable: %v", r)
		}
	}()

	req := testcontainers.ContainerRequest{
		Image:        "postgis/postgis:16-3.4",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     "postgres",
			"POSTGRES_PASSWORD": "postgres",
			"POSTGRES_DB":       "postgres",
		},
		WaitingFor: wait.ForLog("database system is ready to accept connections").
			WithOccurrence(2).
			WithStartupTimeout(30 * time.Second),
	}

	container, err = testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})

	return container, err
}

// connectDB creates a connection to a PostgreSQL database
func connectDB(t *testing.T, host, port, dbName, user, password string) *sql.DB {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbName,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		t.Fatalf("Failed to ping test database: %v", err)
	}

	return db
}

// RunMigrations applies all SQL migrations from the migrations directory
func RunMigrations(t *testing.T, db *sql.DB) error {
	// Try to find the migrations directory by walking up from current package
	cwd, err := os.Getwd()
	if err != nil {
		cwd = "/home/ubuntu/gaspeep/backend"
	}

	// Check if we can find migrations in current working directory structure
	possiblePaths := []string{
		filepath.Join(cwd, "internal", "migrations"),
		"/home/ubuntu/gaspeep/backend/internal/migrations",
		"./internal/migrations",
		"../../../internal/migrations",
	}

	var migDir string
	for _, p := range possiblePaths {
		if info, err := os.Stat(p); err == nil && info.IsDir() {
			migDir = p
			break
		}
	}

	if migDir == "" {
		return fmt.Errorf("could not find migrations directory")
	}

	// Read all .up.sql files from migrations directory
	entries, err := os.ReadDir(migDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	var migrations []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			migrations = append(migrations, filepath.Join(migDir, entry.Name()))
		}
	}

	// Sort migrations by filename to ensure correct order
	// (should already be numbered, e.g., 001_*.sql, 002_*.sql, etc.)
	// Standard library sorting works fine for numbered files

	// Execute each migration
	for _, migFile := range migrations {
		content, err := os.ReadFile(migFile)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", migFile, err)
		}

		// Split by semicolon to handle multiple statements
		statements := strings.Split(string(content), ";")
		for _, stmt := range statements {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				continue
			}

			if _, err := db.Exec(stmt); err != nil {
				return fmt.Errorf("failed to execute migration %s: %w\nStatement: %s", migFile, err, stmt)
			}
		}
	}

	return nil
}

// TeardownTestContainer should be called at the end of all tests to clean up the container
func TeardownTestContainer() error {
	if testContainer == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return testContainer.Terminate(ctx)
}
