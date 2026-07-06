package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/laundry-oms/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	getDB func() *sql.DB
}

func NewUserHandler(db func() *sql.DB) *UserHandler {
	return &UserHandler{getDB: db}
}

func (h *UserHandler) List(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	rows, err := h.getDB().Query(
		`SELECT id, email, name, role, is_active, created_at, updated_at
		 FROM users ORDER BY name ASC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users: " + err.Error()})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan user: " + err.Error()})
			return
		}
		users = append(users, u)
	}

	if users == nil {
		users = []models.User{}
	}

	c.JSON(http.StatusOK, gin.H{"users": users, "count": len(users)})
}

func (h *UserHandler) GetByID(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	id := c.Param("id")
	var u models.User
	err := h.getDB().QueryRow(
		`SELECT id, email, name, role, is_active, created_at, updated_at
		 FROM users WHERE id = $1`, id,
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, u)
}

func (h *UserHandler) Create(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	var u models.User
	err = h.getDB().QueryRow(
		`INSERT INTO users (email, password_hash, name, role)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, email, name, role, is_active, created_at, updated_at`,
		req.Email, string(hashedPassword), req.Name, req.Role,
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, u)
}

func (h *UserHandler) Update(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	id := c.Param("id")

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	query := `UPDATE users SET `
	args := []interface{}{}
	argIdx := 1

	if req.Email != nil {
		query += `email = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.Email)
		argIdx++
	}
	if req.Name != nil {
		query += `name = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.Name)
		argIdx++
	}
	if req.Role != nil {
		query += `role = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.Role)
		argIdx++
	}
	if req.IsActive != nil {
		query += `is_active = $` + string(rune('0'+argIdx)) + `, `
		args = append(args, *req.IsActive)
		argIdx++
	}

	query = query[:len(query)-2]
	query += ` WHERE id = $` + string(rune('0'+argIdx)) + ` RETURNING id, email, name, role, is_active, created_at, updated_at`
	args = append(args, id)

	var u models.User
	err := h.getDB().QueryRow(query, args...).Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, u)
}

func (h *UserHandler) Delete(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	id := c.Param("id")

	result, err := h.getDB().Exec(`UPDATE users SET is_active = FALSE WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate user: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deactivated successfully"})
}
