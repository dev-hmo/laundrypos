package models

import "time"

type Service struct {
	ID          string    `json:"id"`
	ServiceID   string    `json:"service_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Unit        string    `json:"unit"`
	UnitPrice   float64   `json:"unit_price"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateServiceRequest struct {
	ServiceID   string  `json:"service_id" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Unit        string  `json:"unit" binding:"required,oneof=kg item"`
	UnitPrice   float64 `json:"unit_price" binding:"required"`
}

type UpdateServiceRequest struct {
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	Unit        *string  `json:"unit" binding:"omitempty,oneof=kg item"`
	UnitPrice   *float64 `json:"unit_price"`
	IsActive    *bool    `json:"is_active"`
}
