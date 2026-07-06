package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/laundry-oms/backend/internal/models"
)

type PaymentHandler struct {
	getDB func() *sql.DB
}

func NewPaymentHandler(db func() *sql.DB) *PaymentHandler {
	return &PaymentHandler{getDB: db}
}

func (h *PaymentHandler) Create(c *gin.Context) {
	orderID := c.Param("id")

	var req models.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var p models.Payment
	err := h.getDB().QueryRow(
		`INSERT INTO payments (order_id, amount, method, reference)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, order_id, amount, method, reference, paid_at, created_at`,
		orderID, req.Amount, req.Method, req.Reference,
	).Scan(&p.ID, &p.OrderID, &p.Amount, &p.Method, &p.Reference, &p.PaidAt, &p.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, p)
}

func (h *PaymentHandler) ListByOrder(c *gin.Context) {
	orderID := c.Param("id")

	rows, err := h.getDB().Query(
		`SELECT id, order_id, amount, method, reference, paid_at, created_at
		 FROM payments WHERE order_id = $1 ORDER BY paid_at ASC`,
		orderID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments: " + err.Error()})
		return
	}
	defer rows.Close()

	var payments []models.Payment
	for rows.Next() {
		var p models.Payment
		if err := rows.Scan(&p.ID, &p.OrderID, &p.Amount, &p.Method, &p.Reference, &p.PaidAt, &p.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan payment: " + err.Error()})
			return
		}
		payments = append(payments, p)
	}

	if payments == nil {
		payments = []models.Payment{}
	}

	c.JSON(http.StatusOK, payments)
}
