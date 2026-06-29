package handlers

import (
	"database/sql"
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
