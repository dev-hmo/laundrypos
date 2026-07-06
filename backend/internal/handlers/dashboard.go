package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	db *sql.DB
}

func NewDashboardHandler(db *sql.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

func (h *DashboardHandler) Stats(c *gin.Context) {
	today := time.Now().Format("2006-01-02")

	var stats struct {
		OrdersToday    int     `json:"orders_today"`
		RevenueToday   float64 `json:"revenue_today"`
		PendingOrders  int     `json:"pending_orders"`
		TotalCustomers int     `json:"total_customers"`
	}

	h.db.QueryRow(`SELECT COUNT(*) FROM orders WHERE created_at::date = $1`, today).Scan(&stats.OrdersToday)
	h.db.QueryRow(`SELECT COALESCE(SUM(amount), 0) FROM payments WHERE paid_at::date = $1`, today).Scan(&stats.RevenueToday)
	h.db.QueryRow(`SELECT COUNT(*) FROM orders WHERE status NOT IN ('Delivered', 'Cancelled')`).Scan(&stats.PendingOrders)
	h.db.QueryRow(`SELECT COUNT(*) FROM customers`).Scan(&stats.TotalCustomers)

	c.JSON(http.StatusOK, stats)
}
