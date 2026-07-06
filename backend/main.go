package main

import (
	"context"
	"database/sql"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/laundry-oms/backend/internal/config"
	"github.com/laundry-oms/backend/internal/database"
	"github.com/laundry-oms/backend/internal/router"
)

func main() {
	// Load and validate configuration
	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	// Configure structured logging
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: cfg.LogLevelSlog(),
	})))

	slog.Info("starting server", "port", cfg.Port, "log_level", cfg.LogLevel)

	// Connect to database
	var (
		db  *sql.DB
		err error
	)
	db, err = database.Connect(cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database, starting without DB", "error", err)
	} else {
		defer db.Close()
		slog.Info("connected to PostgreSQL")

		// Run migrations
		if err := database.RunMigrations(db, cfg.MigrationsDir); err != nil {
			slog.Error("failed to run migrations", "error", err)
		} else {
			slog.Info("migrations complete")
		}
	}

	// Initialize router
	r := router.Setup(db, cfg)

	// Create HTTP server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		slog.Info("server listening", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("server forced to shutdown", "error", err)
		os.Exit(1)
	}

	slog.Info("server exited cleanly")
}
