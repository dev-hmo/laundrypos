package handlers

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/laundry-oms/backend/internal/models"
)

// CustomerHandler handles customer-related API requests.
type CustomerHandler struct {
	db *sql.DB
}

// NewCustomerHandler creates a new customer handler.
func NewCustomerHandler(db *sql.DB) *CustomerHandler {
	return &CustomerHandler{db: db}
}

// Create handles POST /api/v1/customers
func (h *CustomerHandler) Create(c *gin.Context) {
	var req models.CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var customer models.Customer
	err := h.db.QueryRow(
		`INSERT INTO customers (name, phone, email, preferences)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, phone, email, preferences, created_at, updated_at`,
		req.Name, req.Phone, req.Email, req.Preferences,
	).Scan(
		&customer.ID,
		&customer.Name,
		&customer.Phone,
		&customer.Email,
		&customer.Preferences,
		&customer.CreatedAt,
		&customer.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, customer)
}

// ListAll handles GET /api/v1/customers
func (h *CustomerHandler) ListAll(c *gin.Context) {
	query := c.Query("q")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	var limitInt, offsetInt int
	fmt.Sscanf(limit, "%d", &limitInt)
	fmt.Sscanf(offset, "%d", &offsetInt)

	if limitInt < 1 || limitInt > 200 {
		limitInt = 50
	}
	if offsetInt < 0 {
		offsetInt = 0
	}

	var rows *sql.Rows
	var err error
	if query != "" {
		searchPattern := "%" + query + "%"
		rows, err = h.db.Query(
			`SELECT id, name, phone, email, preferences, created_at, updated_at
			 FROM customers
			 WHERE phone ILIKE $1 OR name ILIKE $1 OR email ILIKE $1
			 ORDER BY name ASC
			 LIMIT $2 OFFSET $3`,
			searchPattern, limitInt, offsetInt,
		)
	} else {
		rows, err = h.db.Query(
			`SELECT id, name, phone, email, preferences, created_at, updated_at
			 FROM customers
			 ORDER BY name ASC
			 LIMIT $1 OFFSET $2`,
			limitInt, offsetInt,
		)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customers: " + err.Error()})
		return
	}
	defer rows.Close()

	var customers []models.Customer
	for rows.Next() {
		var cust models.Customer
		if err := rows.Scan(
			&cust.ID, &cust.Name, &cust.Phone, &cust.Email,
			&cust.Preferences, &cust.CreatedAt, &cust.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan customer: " + err.Error()})
			return
		}
		customers = append(customers, cust)
	}

	if customers == nil {
		customers = []models.Customer{}
	}

	var totalCount int
	if query != "" {
		searchPattern := "%" + query + "%"
		h.db.QueryRow(
			`SELECT COUNT(*) FROM customers WHERE phone ILIKE $1 OR name ILIKE $1 OR email ILIKE $1`,
			searchPattern,
		).Scan(&totalCount)
	} else {
		h.db.QueryRow(`SELECT COUNT(*) FROM customers`).Scan(&totalCount)
	}

	c.JSON(http.StatusOK, gin.H{"customers": customers, "count": totalCount})
}

// GetByID handles GET /api/v1/customers/:id
func (h *CustomerHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var cust models.Customer
	err := h.db.QueryRow(
		`SELECT id, name, phone, email, preferences, created_at, updated_at
		 FROM customers WHERE id = $1`, id,
	).Scan(&cust.ID, &cust.Name, &cust.Phone, &cust.Email, &cust.Preferences, &cust.CreatedAt, &cust.UpdatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customer: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, cust)
}

// Update handles PUT /api/v1/customers/:id
func (h *CustomerHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	query := `UPDATE customers SET `
	args := []interface{}{}
	argIdx := 1

	if req.Name != nil {
		query += `name = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.Name)
		argIdx++
	}
	if req.Phone != nil {
		query += `phone = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.Phone)
		argIdx++
	}
	if req.Email != nil {
		query += `email = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.Email)
		argIdx++
	}
	if req.Preferences != nil {
		query += `preferences = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.Preferences)
		argIdx++
	}

	query = query[:len(query)-2]
	query += ` WHERE id = $` + string(rune('0'+argIdx)) + ` RETURNING id, name, phone, email, preferences, created_at, updated_at`
	args = append(args, id)

	var cust models.Customer
	err := h.db.QueryRow(query, args...).Scan(
		&cust.ID, &cust.Name, &cust.Phone, &cust.Email, &cust.Preferences, &cust.CreatedAt, &cust.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update customer: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, cust)
}

// Delete handles DELETE /api/v1/customers/:id
func (h *CustomerHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	result, err := h.db.Exec(`DELETE FROM customers WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete customer: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer deleted successfully"})
}

// Search handles GET /api/v1/customers/search?q=...
func (h *CustomerHandler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query 'q' is required"})
		return
	}

	searchPattern := "%" + query + "%"

	rows, err := h.db.Query(
		`SELECT id, name, phone, email, preferences, created_at, updated_at
		 FROM customers
		 WHERE phone ILIKE $1 OR name ILIKE $1
		 ORDER BY name ASC
		 LIMIT 10`,
		searchPattern,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed: " + err.Error()})
		return
	}
	defer rows.Close()

	var customers []models.Customer
	for rows.Next() {
		var cust models.Customer
		if err := rows.Scan(
			&cust.ID, &cust.Name, &cust.Phone, &cust.Email,
			&cust.Preferences, &cust.CreatedAt, &cust.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan customer: " + err.Error()})
			return
		}
		customers = append(customers, cust)
	}

	if customers == nil {
		customers = []models.Customer{}
	}

	c.JSON(http.StatusOK, gin.H{
		"customers": customers,
		"count":     len(customers),
	})
}
