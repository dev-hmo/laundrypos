package models

import "time"

// Customer represents a laundry service customer.
type Customer struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Phone       string    `json:"phone"`
	Email       string    `json:"email,omitempty"`
	Preferences string    `json:"preferences,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreateCustomerRequest is the payload for creating a new customer.
type CreateCustomerRequest struct {
	Name        string `json:"name" binding:"required"`
	Phone       string `json:"phone" binding:"required"`
	Email       string `json:"email"`
	Preferences string `json:"preferences"`
}

// UpdateCustomerRequest is the payload for updating a customer.
type UpdateCustomerRequest struct {
	Name        *string `json:"name"`
	Phone       *string `json:"phone"`
	Email       *string `json:"email"`
	Preferences *string `json:"preferences"`
}
