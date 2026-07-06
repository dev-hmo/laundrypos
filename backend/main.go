package main

import (
	"context"
	"database/sql"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/laundry-oms/backend/internal/config"
	"github.com/laundry-oms/backend/internal/database"
	"github.com/laundry-oms/backend/internal/router"
)

func main() {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("panic recovered", "error", r)
		}
	}()

	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: cfg.LogLevelSlog(),
	})))

	slog.Info("starting server", "port", cfg.Port, "log_level", cfg.LogLevel)

	var (
		db   *sql.DB
		dbMu sync.RWMutex
	)
	getDB := func() *sql.DB {
		dbMu.RLock()
		defer dbMu.RUnlock()
		return db
	}

	r := router.Setup(getDB, cfg)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("server listening", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	go func() {
		time.Sleep(500 * time.Millisecond)
		conn, err := database.Connect(cfg.DatabaseURL)
		if err != nil {
			slog.Error("failed to connect to database, running without DB", "error", err)
			return
		}
		dbMu.Lock()
		db = conn
		dbMu.Unlock()
		slog.Info("connected to PostgreSQL")

		if err := database.RunMigrations(conn, cfg.MigrationsDir); err != nil {
			slog.Error("failed to run migrations", "error", err)
		} else {
			slog.Info("migrations complete")
		}
	}()

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

	dbMu.RLock()
	if db != nil {
		db.Close()
	}
	dbMu.RUnlock()

	slog.Info("server exited cleanly")
}
