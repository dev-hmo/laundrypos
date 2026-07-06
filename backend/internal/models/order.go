package models

import "time"

// OrderStatus represents the lifecycle stages of a laundry order.
type OrderStatus string

const (
	StatusReceived  OrderStatus = "Received"
	StatusWashing   OrderStatus = "Washing"
	StatusPressing  OrderStatus = "Pressing"
	StatusReady     OrderStatus = "Ready"
	StatusDelivered OrderStatus = "Delivered"
)

// ValidStatuses is the ordered list of valid status transitions.
var ValidStatuses = []OrderStatus{
	StatusReceived,
	StatusWashing,
	StatusPressing,
	StatusReady,
	StatusDelivered,
}

// IsValidStatus checks if a given string is a valid order status.
func IsValidStatus(s string) bool {
	for _, v := range ValidStatuses {
		if string(v) == s {
			return true
		}
	}
	return false
}

// Order represents a laundry order.
type Order struct {
	ID            string      `json:"id"`
	CustomerID    string      `json:"customer_id"`
	CustomerName  string      `json:"customer_name,omitempty"`
	CustomerPhone string      `json:"customer_phone,omitempty"`
	Status        OrderStatus `json:"status"`
	TotalAmount   float64     `json:"total_amount"`
	TaxAmount     float64     `json:"tax_amount"`
	PromisedDate  *time.Time  `json:"promised_date,omitempty"`
	Notes         string      `json:"notes,omitempty"`
	Items         []OrderItem `json:"items,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
}

// OrderItem represents a single service line-item in an order.
type OrderItem struct {
	ID          string  `json:"id"`
	OrderID     string  `json:"order_id"`
	ServiceType string  `json:"service_type"`
	WeightKg    float64 `json:"weight_kg"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Subtotal    float64 `json:"subtotal"`
}

// CreateOrderRequest is the payload for creating a new order.
type CreateOrderRequest struct {
	CustomerID   string                `json:"customer_id" binding:"required"`
	PromisedDate *time.Time            `json:"promised_date"`
	Notes        string                `json:"notes"`
	TaxAmount    float64               `json:"tax_amount"`
	TotalAmount  float64               `json:"total_amount"`
	Items        []CreateOrderItemBody `json:"items" binding:"required,min=1"`
}

// CreateOrderItemBody is a single item in the create order request.
type CreateOrderItemBody struct {
	ServiceType string  `json:"service_type" binding:"required"`
	WeightKg    float64 `json:"weight_kg"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price" binding:"required"`
	Subtotal    float64 `json:"subtotal" binding:"required"`
}

// UpdateStatusRequest is the payload for updating an order's status.
type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

// UpdateOrderRequest is the payload for updating an order.
type UpdateOrderRequest struct {
	PromisedDate *time.Time `json:"promised_date"`
	Notes        *string    `json:"notes"`
}

// CancelOrderRequest is the payload for cancelling an order.
type CancelOrderRequest struct {
	Reason string `json:"reason"`
}

// OrderListRequest holds optional filters for listing all orders.
type OrderListRequest struct {
	Status     string `json:"status" form:"status"`
	From       string `json:"from" form:"from"`
	To         string `json:"to" form:"to"`
	CustomerID string `json:"customer_id" form:"customer_id"`
	Limit      int    `json:"limit" form:"limit"`
	Offset     int    `json:"offset" form:"offset"`
}

// CustomerOrderHistory represents a customer's order history summary.
type CustomerOrderHistory struct {
	CustomerID      string  `json:"customer_id"`
	CustomerName    string  `json:"customer_name"`
	CustomerPhone   string  `json:"customer_phone"`
	TotalOrders     int     `json:"total_orders"`
	TotalAmount     float64 `json:"total_amount"`
	LastOrderDate   string  `json:"last_order_date"`
}

// OrderListResponse wraps a list of orders for API responses.
type OrderListResponse struct {
	Orders []Order `json:"orders"`
	Count  int     `json:"count"`
}
