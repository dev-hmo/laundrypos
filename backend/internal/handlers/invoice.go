package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/laundry-oms/backend/internal/models"
)

type InvoiceHandler struct {
	getDB func() *sql.DB
}

func NewInvoiceHandler(db func() *sql.DB) *InvoiceHandler {
	return &InvoiceHandler{getDB: db}
}

func (h *InvoiceHandler) GetByOrder(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	orderID := c.Param("id")

	var invoice models.Invoice
	err := h.getDB().QueryRow(
		`SELECT id, order_id, invoice_number, issued_at, printed
		 FROM invoices WHERE order_id = $1`, orderID,
	).Scan(&invoice.ID, &invoice.OrderID, &invoice.InvoiceNumber, &invoice.IssuedAt, &invoice.Printed)

	if err == sql.ErrNoRows {
		now := time.Now()
		invoiceNumber := fmt.Sprintf("INV-%s-%04d", now.Format("20060102"), now.UnixMilli()%10000)

		err = h.getDB().QueryRow(
			`INSERT INTO invoices (order_id, invoice_number)
			 VALUES ($1, $2)
			 RETURNING id, order_id, invoice_number, issued_at, printed`,
			orderID, invoiceNumber,
		).Scan(&invoice.ID, &invoice.OrderID, &invoice.InvoiceNumber, &invoice.IssuedAt, &invoice.Printed)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice: " + err.Error()})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoice: " + err.Error()})
		return
	}

	resp, err := h.buildInvoiceResponse(orderID, invoice)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *InvoiceHandler) MarkPrinted(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	orderID := c.Param("id")

	result, err := h.getDB().Exec(`UPDATE invoices SET printed = TRUE WHERE order_id = $1`, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invoice marked as printed"})
}

func (h *InvoiceHandler) buildInvoiceResponse(orderID string, invoice models.Invoice) (models.InvoiceResponse, error) {
	var resp models.InvoiceResponse
	resp.Invoice = invoice

	err := h.getDB().QueryRow(
		`SELECT c.name, c.phone, o.total_amount, o.tax_amount
		 FROM orders o JOIN customers c ON c.id = o.customer_id
		 WHERE o.id = $1`, orderID,
	).Scan(&resp.CustomerName, &resp.CustomerPhone, &resp.TotalAmount, &resp.TaxAmount)
	if err != nil {
		return resp, fmt.Errorf("failed to fetch order details: %w", err)
	}

	itemRows, err := h.getDB().Query(
		`SELECT id, order_id, service_type, weight_kg, quantity, unit_price, subtotal
		 FROM order_items WHERE order_id = $1`, orderID,
	)
	if err != nil {
		return resp, fmt.Errorf("failed to fetch order items: %w", err)
	}
	defer itemRows.Close()

	for itemRows.Next() {
		var item models.OrderItem
		if err := itemRows.Scan(&item.ID, &item.OrderID, &item.ServiceType, &item.WeightKg, &item.Quantity, &item.UnitPrice, &item.Subtotal); err != nil {
			return resp, fmt.Errorf("failed to scan order item: %w", err)
		}
		resp.Items = append(resp.Items, item)
	}

	payRows, err := h.getDB().Query(
		`SELECT id, order_id, amount, method, reference, paid_at, created_at
		 FROM payments WHERE order_id = $1 ORDER BY paid_at ASC`, orderID,
	)
	if err != nil {
		return resp, fmt.Errorf("failed to fetch payments: %w", err)
	}
	defer payRows.Close()

	for payRows.Next() {
		var p models.Payment
		if err := payRows.Scan(&p.ID, &p.OrderID, &p.Amount, &p.Method, &p.Reference, &p.PaidAt, &p.CreatedAt); err != nil {
			return resp, fmt.Errorf("failed to scan payment: %w", err)
		}
		resp.Payments = append(resp.Payments, p)
	}

	totalPaid := 0.0
	for _, p := range resp.Payments {
		totalPaid += p.Amount
	}
	resp.BalanceDue = resp.TotalAmount - totalPaid
	if resp.BalanceDue < 0 {
		resp.BalanceDue = 0
	}

	if resp.Items == nil {
		resp.Items = []models.OrderItem{}
	}
	if resp.Payments == nil {
		resp.Payments = []models.Payment{}
	}

	return resp, nil
}
