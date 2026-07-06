package handlers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"github.com/laundry-oms/backend/internal/models"
)

// OrderHandler handles order-related API requests.
type OrderHandler struct {
	getDB func() *sql.DB
}

// NewOrderHandler creates a new order handler.
func NewOrderHandler(db func() *sql.DB) *OrderHandler {
	return &OrderHandler{getDB: db}
}

// Create handles POST /api/v1/orders
// Creates an order with its line items in a single transaction.
func (h *OrderHandler) Create(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Begin transaction
	tx, err := h.getDB().Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				log.Printf("Rollback error: %v", rbErr)
			}
		}
	}()

	// Insert order
	var order models.Order
	err = tx.QueryRow(
		`INSERT INTO orders (customer_id, status, total_amount, tax_amount, promised_date, notes)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, customer_id, status, total_amount, tax_amount, promised_date, notes, created_at, updated_at`,
		req.CustomerID,
		models.StatusReceived,
		req.TotalAmount,
		req.TaxAmount,
		req.PromisedDate,
		req.Notes,
	).Scan(
		&order.ID,
		&order.CustomerID,
		&order.Status,
		&order.TotalAmount,
		&order.TaxAmount,
		&order.PromisedDate,
		&order.Notes,
		&order.CreatedAt,
		&order.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order: " + err.Error()})
		return
	}

	// Insert order items
	order.Items = make([]models.OrderItem, 0, len(req.Items))
	for _, itemReq := range req.Items {
		var item models.OrderItem
		err = tx.QueryRow(
			`INSERT INTO order_items (order_id, service_type, weight_kg, quantity, unit_price, subtotal)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 RETURNING id, order_id, service_type, weight_kg, quantity, unit_price, subtotal`,
			order.ID,
			itemReq.ServiceType,
			itemReq.WeightKg,
			itemReq.Quantity,
			itemReq.UnitPrice,
			itemReq.Subtotal,
		).Scan(
			&item.ID,
			&item.OrderID,
			&item.ServiceType,
			&item.WeightKg,
			&item.Quantity,
			&item.UnitPrice,
			&item.Subtotal,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order item: " + err.Error()})
			return
		}
		order.Items = append(order.Items, item)
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, order)
}

// ListActive handles GET /api/v1/orders
// Returns active orders with pagination and optional status filter.
func (h *OrderHandler) ListActive(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	statusFilter := c.Query("status")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	var limitInt, offsetInt int
	if _, err := fmt.Sscanf(limit, "%d", &limitInt); err != nil || limitInt < 1 || limitInt > 200 {
		limitInt = 50
	}
	if _, err := fmt.Sscanf(offset, "%d", &offsetInt); err != nil || offsetInt < 0 {
		offsetInt = 0
	}

	var rows *sql.Rows
	var err error

	if statusFilter != "" {
		if !models.IsValidStatus(statusFilter) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status filter"})
			return
		}
		rows, err = h.getDB().Query(
			`SELECT o.id, o.customer_id, c.name, c.phone, o.status, o.total_amount, o.tax_amount,
			        o.promised_date, o.notes, o.created_at, o.updated_at
			 FROM orders o
			 JOIN customers c ON c.id = o.customer_id
			 WHERE o.status = $1
			 ORDER BY o.created_at DESC
			 LIMIT $2 OFFSET $3`,
			statusFilter, limitInt, offsetInt,
		)
	} else {
		rows, err = h.getDB().Query(
			`SELECT o.id, o.customer_id, c.name, c.phone, o.status, o.total_amount, o.tax_amount,
			        o.promised_date, o.notes, o.created_at, o.updated_at
			 FROM orders o
			 JOIN customers c ON c.id = o.customer_id
			 WHERE o.status != 'Delivered'
			 ORDER BY o.created_at DESC
			 LIMIT $1 OFFSET $2`,
			limitInt, offsetInt,
		)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders: " + err.Error()})
		return
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.ID, &o.CustomerID, &o.CustomerName, &o.CustomerPhone,
			&o.Status, &o.TotalAmount, &o.TaxAmount,
			&o.PromisedDate, &o.Notes, &o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan order: " + err.Error()})
			return
		}
		orders = append(orders, o)
	}

	// Fetch items for all orders
	if len(orders) > 0 {
		orderIDList := make([]string, len(orders))
		orderMap := make(map[string]*models.Order)

		for i := range orders {
			orderIDList[i] = orders[i].ID
			orders[i].Items = []models.OrderItem{}
			orderMap[orders[i].ID] = &orders[i]
		}

		// Use pq.Array for safe PostgreSQL array parameter
		itemRows, err := h.getDB().Query(
			`SELECT id, order_id, service_type, weight_kg, quantity, unit_price, subtotal
			 FROM order_items WHERE order_id = ANY($1)`,
			pq.Array(orderIDList),
		)
		if err != nil {
			log.Printf("Warning: Failed to fetch order items: %v", err)
		} else {
			defer itemRows.Close()
			for itemRows.Next() {
				var item models.OrderItem
				if err := itemRows.Scan(
					&item.ID, &item.OrderID, &item.ServiceType,
					&item.WeightKg, &item.Quantity, &item.UnitPrice, &item.Subtotal,
				); err != nil {
					log.Printf("Warning: Failed to scan order item: %v", err)
					continue
				}
				if order, ok := orderMap[item.OrderID]; ok {
					order.Items = append(order.Items, item)
				}
			}
		}
	}

	if orders == nil {
		orders = []models.Order{}
	}

	c.JSON(http.StatusOK, models.OrderListResponse{
		Orders: orders,
		Count:  len(orders),
	})
}

// UpdateStatus handles PATCH /api/v1/orders/:id/status
func (h *OrderHandler) UpdateStatus(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	orderID := c.Param("id")

	var req models.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if !models.IsValidStatus(req.Status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Must be one of: Received, Washing, Pressing, Ready, Delivered"})
		return
	}

	var order models.Order
	err := h.getDB().QueryRow(
		`UPDATE orders SET status = $1 WHERE id = $2
		 RETURNING id, customer_id, status, total_amount, tax_amount, promised_date, notes, created_at, updated_at`,
		req.Status, orderID,
	).Scan(
		&order.ID, &order.CustomerID, &order.Status, &order.TotalAmount, &order.TaxAmount,
		&order.PromisedDate, &order.Notes, &order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// GetByID handles GET /api/v1/orders/:id
func (h *OrderHandler) GetByID(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	id := c.Param("id")

	var order models.Order
	err := h.getDB().QueryRow(
		`SELECT o.id, o.customer_id, c.name, c.phone, o.status, o.total_amount, o.tax_amount,
		        o.promised_date, o.notes, o.created_at, o.updated_at
		 FROM orders o
		 JOIN customers c ON c.id = o.customer_id
		 WHERE o.id = $1`, id,
	).Scan(
		&order.ID, &order.CustomerID, &order.CustomerName, &order.CustomerPhone,
		&order.Status, &order.TotalAmount, &order.TaxAmount,
		&order.PromisedDate, &order.Notes, &order.CreatedAt, &order.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order: " + err.Error()})
		return
	}

	itemRows, err := h.getDB().Query(
		`SELECT id, order_id, service_type, weight_kg, quantity, unit_price, subtotal
		 FROM order_items WHERE order_id = $1`, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order items: " + err.Error()})
		return
	}
	defer itemRows.Close()

	order.Items = []models.OrderItem{}
	for itemRows.Next() {
		var item models.OrderItem
		if err := itemRows.Scan(&item.ID, &item.OrderID, &item.ServiceType, &item.WeightKg, &item.Quantity, &item.UnitPrice, &item.Subtotal); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan order item: " + err.Error()})
			return
		}
		order.Items = append(order.Items, item)
	}

	c.JSON(http.StatusOK, order)
}

// Update handles PUT /api/v1/orders/:id
func (h *OrderHandler) Update(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	id := c.Param("id")

	var req models.UpdateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	query := `UPDATE orders SET `
	args := []interface{}{}
	argIdx := 1

	if req.PromisedDate != nil {
		query += `promised_date = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.PromisedDate)
		argIdx++
	}
	if req.Notes != nil {
		query += `notes = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.Notes)
		argIdx++
	}

	if len(args) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	query = query[:len(query)-2]
	query += ` WHERE id = $` + string(rune('0'+argIdx)) + ` RETURNING id, customer_id, status, total_amount, tax_amount, promised_date, notes, created_at, updated_at`
	args = append(args, id)

	var order models.Order
	err := h.getDB().QueryRow(query, args...).Scan(
		&order.ID, &order.CustomerID, &order.Status, &order.TotalAmount, &order.TaxAmount,
		&order.PromisedDate, &order.Notes, &order.CreatedAt, &order.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// Cancel handles PATCH /api/v1/orders/:id/cancel
func (h *OrderHandler) Cancel(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	id := c.Param("id")

	var order models.Order
	err := h.getDB().QueryRow(
		`UPDATE orders SET status = 'Cancelled' WHERE id = $1 AND status NOT IN ('Delivered', 'Cancelled')
		 RETURNING id, customer_id, status, total_amount, tax_amount, promised_date, notes, created_at, updated_at`,
		id,
	).Scan(
		&order.ID, &order.CustomerID, &order.Status, &order.TotalAmount, &order.TaxAmount,
		&order.PromisedDate, &order.Notes, &order.CreatedAt, &order.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found or already delivered/cancelled"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel order: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// ListAll handles GET /api/v1/orders/all
func (h *OrderHandler) ListAll(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	statusFilter := c.Query("status")
	from := c.Query("from")
	to := c.Query("to")
	customerID := c.Query("customer_id")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	var limitInt, offsetInt int
	if _, err := fmt.Sscanf(limit, "%d", &limitInt); err != nil || limitInt < 1 || limitInt > 200 {
		limitInt = 50
	}
	if _, err := fmt.Sscanf(offset, "%d", &offsetInt); err != nil || offsetInt < 0 {
		offsetInt = 0
	}

	query := `SELECT o.id, o.customer_id, c.name, c.phone, o.status, o.total_amount, o.tax_amount,
	                  o.promised_date, o.notes, o.created_at, o.updated_at
	           FROM orders o
	           JOIN customers c ON c.id = o.customer_id
	           WHERE 1=1`
	countQuery := `SELECT COUNT(*) FROM orders o WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if statusFilter != "" {
		query += ` AND o.status = $` + string(rune('0'+argIdx))
		countQuery += ` AND o.status = $` + string(rune('0'+argIdx))
		args = append(args, statusFilter)
		argIdx++
	}
	if from != "" {
		query += ` AND o.created_at::date >= $` + string(rune('0'+argIdx))
		countQuery += ` AND o.created_at::date >= $` + string(rune('0'+argIdx))
		args = append(args, from)
		argIdx++
	}
	if to != "" {
		query += ` AND o.created_at::date <= $` + string(rune('0'+argIdx))
		countQuery += ` AND o.created_at::date <= $` + string(rune('0'+argIdx))
		args = append(args, to)
		argIdx++
	}
	if customerID != "" {
		query += ` AND o.customer_id = $` + string(rune('0'+argIdx))
		countQuery += ` AND o.customer_id = $` + string(rune('0'+argIdx))
		args = append(args, customerID)
		argIdx++
	}

	query += ` ORDER BY o.created_at DESC LIMIT $` + string(rune('0'+argIdx)) + ` OFFSET $` + string(rune('0'+(argIdx+1)))
	limitArgs := append(args, limitInt, offsetInt)

	var totalCount int
	err := h.getDB().QueryRow(countQuery, args...).Scan(&totalCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count orders: " + err.Error()})
		return
	}

	rows, err := h.getDB().Query(query, limitArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders: " + err.Error()})
		return
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.ID, &o.CustomerID, &o.CustomerName, &o.CustomerPhone,
			&o.Status, &o.TotalAmount, &o.TaxAmount,
			&o.PromisedDate, &o.Notes, &o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan order: " + err.Error()})
			return
		}
		orders = append(orders, o)
	}

	if orders == nil {
		orders = []models.Order{}
	}

	c.JSON(http.StatusOK, models.OrderListResponse{
		Orders: orders,
		Count:  totalCount,
	})
}
