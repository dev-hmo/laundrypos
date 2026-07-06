package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/laundry-oms/backend/internal/models"
)

type ServiceHandler struct {
	db *sql.DB
}

func NewServiceHandler(db *sql.DB) *ServiceHandler {
	return &ServiceHandler{db: db}
}

func (h *ServiceHandler) List(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT id, service_id, name, description, unit, unit_price, is_active, created_at
		 FROM service_catalog ORDER BY name ASC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services: " + err.Error()})
		return
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		if err := rows.Scan(&s.ID, &s.ServiceID, &s.Name, &s.Description, &s.Unit, &s.UnitPrice, &s.IsActive, &s.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan service: " + err.Error()})
			return
		}
		services = append(services, s)
	}

	if services == nil {
		services = []models.Service{}
	}

	c.JSON(http.StatusOK, services)
}

func (h *ServiceHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var s models.Service
	err := h.db.QueryRow(
		`SELECT id, service_id, name, description, unit, unit_price, is_active, created_at
		 FROM service_catalog WHERE id = $1`, id,
	).Scan(&s.ID, &s.ServiceID, &s.Name, &s.Description, &s.Unit, &s.UnitPrice, &s.IsActive, &s.CreatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, s)
}

func (h *ServiceHandler) Create(c *gin.Context) {
	var req models.CreateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var s models.Service
	err := h.db.QueryRow(
		`INSERT INTO service_catalog (service_id, name, description, unit, unit_price)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, service_id, name, description, unit, unit_price, is_active, created_at`,
		req.ServiceID, req.Name, req.Description, req.Unit, req.UnitPrice,
	).Scan(&s.ID, &s.ServiceID, &s.Name, &s.Description, &s.Unit, &s.UnitPrice, &s.IsActive, &s.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, s)
}

func (h *ServiceHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	query := `UPDATE service_catalog SET `
	args := []interface{}{}
	argIdx := 1

	if req.Name != nil {
		query += `name = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.Name)
		argIdx++
	}
	if req.Description != nil {
		query += `description = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.Description)
		argIdx++
	}
	if req.Unit != nil {
		query += `unit = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.Unit)
		argIdx++
	}
	if req.UnitPrice != nil {
		query += `unit_price = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.UnitPrice)
		argIdx++
	}
	if req.IsActive != nil {
		query += `is_active = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.IsActive)
		argIdx++
	}

	query = query[:len(query)-2]
	query += ` WHERE id = $` + string(rune('0'+argIdx)) + ` RETURNING id, service_id, name, description, unit, unit_price, is_active, created_at`
	args = append(args, id)

	var s models.Service
	err := h.db.QueryRow(query, args...).Scan(&s.ID, &s.ServiceID, &s.Name, &s.Description, &s.Unit, &s.UnitPrice, &s.IsActive, &s.CreatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, s)
}

func (h *ServiceHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	result, err := h.db.Exec(`DELETE FROM service_catalog WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service deleted successfully"})
}
