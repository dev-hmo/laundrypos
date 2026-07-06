package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthHandler provides system health check endpoints.
type HealthHandler struct {
	getDB func() *sql.DB
}

// NewHealthHandler creates a new health handler.
func NewHealthHandler(db func() *sql.DB) *HealthHandler {
	return &HealthHandler{getDB: db}
}

// Check returns the health status of the API and database.
func (h *HealthHandler) Check(c *gin.Context) {
	dbStatus := "up"
	if h.getDB() != nil {
		err := h.getDB().Ping()
		if err != nil {
			dbStatus = "down"
		}
	} else {
		dbStatus = "disconnected"
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
