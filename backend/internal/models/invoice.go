package models

import "time"

type Invoice struct {
	ID            string    `json:"id"`
	OrderID       string    `json:"order_id"`
	InvoiceNumber string    `json:"invoice_number"`
	IssuedAt      time.Time `json:"issued_at"`
	Printed       bool      `json:"printed"`
}

type InvoiceResponse struct {
	Invoice
	CustomerName  string      `json:"customer_name"`
	CustomerPhone string      `json:"customer_phone"`
	Items         []OrderItem `json:"items"`
	TotalAmount   float64     `json:"total_amount"`
	TaxAmount     float64     `json:"tax_amount"`
	Payments      []Payment   `json:"payments"`
	BalanceDue    float64     `json:"balance_due"`
}
