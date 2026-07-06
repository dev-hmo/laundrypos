package models

import "time"

type Payment struct {
	ID        string    `json:"id"`
	OrderID   string    `json:"order_id"`
	Amount    float64   `json:"amount"`
	Method    string    `json:"method"`
	Reference string    `json:"reference"`
	PaidAt    time.Time `json:"paid_at"`
	CreatedAt time.Time `json:"created_at"`
}

type CreatePaymentRequest struct {
	Amount    float64 `json:"amount" binding:"required"`
	Method    string  `json:"method" binding:"required,oneof=cash card mobile"`
	Reference string  `json:"reference"`
}
