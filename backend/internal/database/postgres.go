package database

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/lib/pq"
)

// Connect establishes a connection pool to PostgreSQL with retry logic.
func Connect(databaseURL string) (*sql.DB, error) {
	var db *sql.DB
	var err error

	// Retry connection up to 5 times (useful when waiting for container startup)
	for i := 0; i < 5; i++ {
		db, err = sql.Open("postgres", databaseURL)
		if err != nil {
			log.Printf("Attempt %d: Failed to open database: %v", i+1, err)
			time.Sleep(2 * time.Second)
			continue
		}

		err = db.Ping()
		if err != nil {
			log.Printf("Attempt %d: Failed to ping database: %v", i+1, err)
			time.Sleep(2 * time.Second)
			continue
		}

		break
	}

	if err != nil {
		return nil, err
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	return db, nil
}
