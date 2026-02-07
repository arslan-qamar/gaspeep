package db

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/lib/pq"
)

func NewDB() (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	// Configure connection pool for production-like usage
	db.SetMaxOpenConns(25)           // Max 25 concurrent connections
	db.SetMaxIdleConns(5)            // Keep 5 idle connections ready
	db.SetConnMaxLifetime(5 * time.Minute)  // Close connections after 5 minutes
	db.SetConnMaxIdleTime(10 * time.Second) // Close idle connections after 10 seconds

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}
