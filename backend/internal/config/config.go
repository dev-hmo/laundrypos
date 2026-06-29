package config

import (
	"fmt"
	"log/slog"
	"os"
	"strings"
)

type Config struct {
	DatabaseURL      string
	Port             string
	CORSOrigins      []string
	AuthSecret       string
	LogLevel         string
	RateLimitRPS     int
	RateLimitBurst   int
	MigrationsDir    string
}

func Load() *Config {
	originsRaw := getEnv("CORS_ORIGINS", "http://localhost:3000")
	var origins []string
	for _, o := range strings.Split(originsRaw, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			origins = append(origins, o)
		}
	}

	return &Config{
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://laundry:laundry_secret@localhost:5432/laundry_oms?sslmode=disable"),
		Port:           getEnv("PORT", "8080"),
		CORSOrigins:    origins,
		AuthSecret:     getEnv("AUTH_SECRET", ""),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
		RateLimitRPS:   getEnvInt("RATE_LIMIT_RPS", 50),
		RateLimitBurst: getEnvInt("RATE_LIMIT_BURST", 100),
		MigrationsDir:  getEnv("MIGRATIONS_DIR", "migrations"),
	}
}

func (c *Config) Validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.Port == "" {
		return fmt.Errorf("PORT is required")
	}
	if len(c.CORSOrigins) == 0 {
		return fmt.Errorf("at least one CORS_ORIGINS value is required")
	}
	if c.RateLimitRPS <= 0 {
		return fmt.Errorf("RATE_LIMIT_RPS must be positive")
	}
	if c.RateLimitBurst <= 0 {
		return fmt.Errorf("RATE_LIMIT_BURST must be positive")
	}
	return nil
}

func (c *Config) LogLevelSlog() slog.Level {
	switch c.LogLevel {
	case "debug":
		return slog.LevelDebug
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	val, ok := os.LookupEnv(key)
	if !ok {
		return fallback
	}
	var i int
	fmt.Sscanf(val, "%d", &i)
	return i
}
