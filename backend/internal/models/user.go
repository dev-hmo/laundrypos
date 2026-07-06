package models

import "time"

type User struct {
	ID                    string    `json:"id"`
	Email                 string    `json:"email"`
	Name                  string    `json:"name"`
	Role                  string    `json:"role"`
	IsActive              bool      `json:"is_active"`
	PasswordResetRequired bool      `json:"password_reset_required"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

type LoginResponse struct {
	Token                 string `json:"token"`
	User                  User   `json:"user"`
	PasswordResetRequired bool   `json:"password_reset_required,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type CreateUserRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=admin manager staff"`
}

type UpdateUserRequest struct {
	Email    *string `json:"email"`
	Name     *string `json:"name"`
	Role     *string `json:"role" binding:"omitempty,oneof=admin manager staff"`
	IsActive *bool   `json:"is_active"`
}
