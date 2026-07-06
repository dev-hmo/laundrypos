package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/laundry-oms/backend/internal/middleware"
	"github.com/laundry-oms/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	getDB func() *sql.DB
}

func NewAuthHandler(db func() *sql.DB) *AuthHandler {
	return &AuthHandler{getDB: db}
}

func setTokenCookie(c *gin.Context, token string) {
	secure := c.Request.TLS != nil
	c.SetCookie("auth_token", token, 86400, "/", "", secure, true)
}

func clearTokenCookie(c *gin.Context) {
	c.SetCookie("auth_token", "", -1, "/", "", false, true)
}

func (h *AuthHandler) Login(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var user models.User
	var passwordHash string
	err := h.getDB().QueryRow(
		`SELECT id, email, password_hash, name, role, is_active, password_reset_required, created_at, updated_at
		 FROM users WHERE email = $1 AND is_active = TRUE`,
		req.Email,
	).Scan(&user.ID, &user.Email, &passwordHash, &user.Name, &user.Role, &user.IsActive, &user.PasswordResetRequired, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Login failed"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	setTokenCookie(c, token)

	c.JSON(http.StatusOK, models.LoginResponse{
		Token:                 token,
		User:                  user,
		PasswordResetRequired: user.PasswordResetRequired,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	clearTokenCookie(c)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func (h *AuthHandler) Me(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	userID, _ := c.Get("user_id")
	var user models.User
	err := h.getDB().QueryRow(
		`SELECT id, email, name, role, is_active, password_reset_required, created_at, updated_at
		 FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Role, &user.IsActive, &user.PasswordResetRequired, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	if !requireDB(h.getDB, c) { return }
	userID, _ := c.Get("user_id")

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var currentHash string
	err := h.getDB().QueryRow(
		`SELECT password_hash FROM users WHERE id = $1`, userID,
	).Scan(&currentHash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify current password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash new password"})
		return
	}

	_, err = h.getDB().Exec(
		`UPDATE users SET password_hash = $1, password_reset_required = FALSE WHERE id = $2`,
		string(newHash), userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}
