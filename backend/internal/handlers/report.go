package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/laundry-oms/backend/internal/models"
)

type ReportHandler struct {
	getDB func() *sql.DB
}

func NewReportHandler(db func() *sql.DB) *ReportHandler {
	return &ReportHandler{getDB: db}
}

func (h *ReportHandler) DailySummary(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	date := c.DefaultQuery("date", time.Now().Format("2006-01-02"))

	var summary models.DailySummary
	summary.Date = date

	err := h.getDB().QueryRow(
		`SELECT COUNT(*) FROM orders WHERE created_at::date = $1`, date,
	).Scan(&summary.TotalOrders)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total orders: " + err.Error()})
		return
	}

	err = h.getDB().QueryRow(
		`SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.created_at::date = $1`, date,
	).Scan(&summary.TotalRevenue)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total revenue: " + err.Error()})
		return
	}

	err = h.getDB().QueryRow(
		`SELECT COALESCE(SUM(o.tax_amount), 0) FROM orders o WHERE o.created_at::date = $1`, date,
	).Scan(&summary.TotalTax)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total tax: " + err.Error()})
		return
	}

	err = h.getDB().QueryRow(
		`SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.paid_at::date = $1 AND p.method = 'cash'`, date,
	).Scan(&summary.CashAmount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get cash amount: " + err.Error()})
		return
	}

	err = h.getDB().QueryRow(
		`SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.paid_at::date = $1 AND p.method = 'card'`, date,
	).Scan(&summary.CardAmount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get card amount: " + err.Error()})
		return
	}

	err = h.getDB().QueryRow(
		`SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.paid_at::date = $1 AND p.method = 'mobile'`, date,
	).Scan(&summary.MobileAmount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mobile amount: " + err.Error()})
		return
	}

	if summary.TotalOrders > 0 {
		summary.AvgOrderValue = summary.TotalRevenue / float64(summary.TotalOrders)
	}

	c.JSON(http.StatusOK, summary)
}

func (h *ReportHandler) RevenueByRange(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	from := c.Query("from")
	to := c.Query("to")

	if from == "" {
		from = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}
	if to == "" {
		to = time.Now().Format("2006-01-02")
	}

	rows, err := h.getDB().Query(
		`SELECT p.paid_at::date AS date, COALESCE(SUM(p.amount), 0) AS amount
		 FROM payments p
		 WHERE p.paid_at::date >= $1 AND p.paid_at::date <= $2
		 GROUP BY p.paid_at::date
		 ORDER BY date ASC`,
		from, to,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get revenue data: " + err.Error()})
		return
	}
	defer rows.Close()

	var reports []models.RevenueReport
	for rows.Next() {
		var r models.RevenueReport
		if err := rows.Scan(&r.Date, &r.Amount); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan revenue: " + err.Error()})
			return
		}
		reports = append(reports, r)
	}

	if reports == nil {
		reports = []models.RevenueReport{}
	}

	c.JSON(http.StatusOK, reports)
}

func (h *ReportHandler) ServiceBreakdown(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	from := c.Query("from")
	to := c.Query("to")

	if from == "" {
		from = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}
	if to == "" {
		to = time.Now().Format("2006-01-02")
	}

	rows, err := h.getDB().Query(
		`SELECT oi.service_type AS service_name,
		        COUNT(*) AS count,
		        COALESCE(SUM(oi.subtotal), 0) AS revenue
		 FROM order_items oi
		 JOIN orders o ON o.id = oi.order_id
		 WHERE o.created_at::date >= $1 AND o.created_at::date <= $2
		 GROUP BY oi.service_type
		 ORDER BY revenue DESC`,
		from, to,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get service breakdown: " + err.Error()})
		return
	}
	defer rows.Close()

	var breakdowns []models.ServiceBreakdown
	for rows.Next() {
		var b models.ServiceBreakdown
		if err := rows.Scan(&b.ServiceName, &b.Count, &b.Revenue); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan service breakdown: " + err.Error()})
			return
		}
		breakdowns = append(breakdowns, b)
	}

	if breakdowns == nil {
		breakdowns = []models.ServiceBreakdown{}
	}

	c.JSON(http.StatusOK, breakdowns)
}

func (h *ReportHandler) TopCustomers(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	from := c.Query("from")
	to := c.Query("to")
	limit := c.DefaultQuery("limit", "10")

	if from == "" {
		from = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}
	if to == "" {
		to = time.Now().Format("2006-01-02")
	}

	var limitInt int
	if _, err := fmt.Sscanf(limit, "%d", &limitInt); err != nil || limitInt < 1 {
		limitInt = 10
	}

	rows, err := h.getDB().Query(
		`SELECT c.id, c.name,
		        COUNT(DISTINCT o.id) AS order_count,
		        COALESCE(SUM(p.amount), 0) AS total_spent
		 FROM customers c
		 JOIN orders o ON o.customer_id = c.id
		 LEFT JOIN payments p ON p.order_id = o.id
		 WHERE o.created_at::date >= $1 AND o.created_at::date <= $2
		 GROUP BY c.id, c.name
		 ORDER BY total_spent DESC
		 LIMIT $3`,
		from, to, limitInt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get top customers: " + err.Error()})
		return
	}
	defer rows.Close()

	var customers []models.TopCustomer
	for rows.Next() {
		var tc models.TopCustomer
		if err := rows.Scan(&tc.CustomerID, &tc.CustomerName, &tc.OrderCount, &tc.TotalSpent); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan top customer: " + err.Error()})
			return
		}
		customers = append(customers, tc)
	}

	if customers == nil {
		customers = []models.TopCustomer{}
	}

	c.JSON(http.StatusOK, customers)
}
