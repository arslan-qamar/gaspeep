package db

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	testhelpers "gaspeep/backend/internal/repository/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

func TestNewDB_Success(t *testing.T) {
	host, port, dbName, user, password := setupPostgresForEnv(t)

	t.Setenv("DB_HOST", host)
	t.Setenv("DB_PORT", port)
	t.Setenv("DB_USER", user)
	t.Setenv("DB_PASSWORD", password)
	t.Setenv("DB_NAME", dbName)

	db, err := NewDB()
	require.NoError(t, err)
	t.Cleanup(func() { _ = db.Close() })

	require.NoError(t, db.Ping())
	assert.Equal(t, 25, db.Stats().MaxOpenConnections)
}

func TestNewDB_PingFailure(t *testing.T) {
	t.Setenv("DB_HOST", "127.0.0.1")
	t.Setenv("DB_PORT", "1")
	t.Setenv("DB_USER", "postgres")
	t.Setenv("DB_PASSWORD", "postgres")
	t.Setenv("DB_NAME", "postgres")

	db, err := NewDB()
	require.Error(t, err)
	if db != nil {
		_ = db.Close()
	}
	assert.Contains(t, err.Error(), "failed to ping database")
}

func TestNewMigrationRunner(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	runner := NewMigrationRunner(db)
	require.NotNil(t, runner)
}

func TestMigrationRunner_RunMigrations_AppliesAndSkipsAlreadyApplied(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	runner := NewMigrationRunner(db)

	migrationsDir := t.TempDir()
	require.NoError(t, os.WriteFile(
		filepath.Join(migrationsDir, "001_create_runner_test_table.up.sql"),
		[]byte("CREATE TABLE IF NOT EXISTS db_runner_test_table (id SERIAL PRIMARY KEY, name TEXT NOT NULL);"),
		0o644,
	))
	require.NoError(t, os.WriteFile(
		filepath.Join(migrationsDir, "002_insert_runner_test_row.up.sql"),
		[]byte("INSERT INTO db_runner_test_table (name) VALUES ('applied-once');"),
		0o644,
	))

	require.NoError(t, runner.RunMigrations(migrationsDir))

	var rowCount int
	require.NoError(t, db.QueryRow("SELECT COUNT(*) FROM db_runner_test_table").Scan(&rowCount))
	assert.Equal(t, 1, rowCount)

	var appliedCount int
	require.NoError(t, db.QueryRow(
		"SELECT COUNT(*) FROM schema_migrations WHERE migration IN ($1, $2)",
		"001_create_runner_test_table.up.sql",
		"002_insert_runner_test_row.up.sql",
	).Scan(&appliedCount))
	assert.Equal(t, 2, appliedCount)

	// Running again should skip already tracked migrations.
	require.NoError(t, runner.RunMigrations(migrationsDir))
	require.NoError(t, db.QueryRow("SELECT COUNT(*) FROM db_runner_test_table").Scan(&rowCount))
	assert.Equal(t, 1, rowCount)
}

func TestMigrationRunner_RunMigrations_InvalidSQL(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	runner := NewMigrationRunner(db)

	migrationsDir := t.TempDir()
	require.NoError(t, os.WriteFile(
		filepath.Join(migrationsDir, "001_invalid.up.sql"),
		[]byte("THIS IS NOT VALID SQL"),
		0o644,
	))

	err := runner.RunMigrations(migrationsDir)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to execute migration 001_invalid.up.sql")
}

func setupPostgresForEnv(t *testing.T) (host, port, dbName, user, password string) {
	t.Helper()

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	t.Cleanup(cancel)

	dbName = fmt.Sprintf("gaspeep_dbpkg_%d", time.Now().UnixNano())
	user = "postgres"
	password = "postgres"

	req := testcontainers.ContainerRequest{
		Image:        "postgis/postgis:16-3.4",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     user,
			"POSTGRES_PASSWORD": password,
			"POSTGRES_DB":       dbName,
		},
		WaitingFor: wait.ForLog("database system is ready to accept connections").
			WithOccurrence(2).
			WithStartupTimeout(30 * time.Second),
	}

	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		if isDockerUnavailableError(err) {
			t.Skipf("Skipping Docker-dependent test: %v", err)
		}
		t.Fatalf("Failed to start PostgreSQL container: %v", err)
	}
	t.Cleanup(func() {
		_ = container.Terminate(context.Background())
	})

	host, err = container.Host(ctx)
	require.NoError(t, err)
	mappedPort, err := container.MappedPort(ctx, "5432")
	require.NoError(t, err)

	return host, mappedPort.Port(), dbName, user, password
}

func isDockerUnavailableError(err error) bool {
	if err == nil {
		return false
	}

	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "docker") &&
		(strings.Contains(msg, "permission denied") ||
			strings.Contains(msg, "connect: operation not permitted") ||
			strings.Contains(msg, "no such file or directory") ||
			strings.Contains(msg, "cannot connect"))
}
