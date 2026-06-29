package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthHandler provides system health check endpoints.
type HealthHandler struct {
	db *sql.DB
}

// NewHealthHandler creates a new health handler.
func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

// Check returns the health status of the API and database.
func (h *HealthHandler) Check(c *gin.Context) {
	// Check database connectivity
	err := h.db.Ping()
	dbStatus := "up"
	if err != nil {
		dbStatus = "down"
	}

	status := http.StatusOK
	if dbStatus == "down" {
		status = http.StatusServiceUnavailable
	}

	c.JSON(status, gin.H{
		"status":   "ok",
		"database": dbStatus,
	})
}
