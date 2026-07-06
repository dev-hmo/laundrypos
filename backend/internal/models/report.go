package models

type DailySummary struct {
	Date          string  `json:"date"`
	TotalOrders   int     `json:"total_orders"`
	TotalRevenue  float64 `json:"total_revenue"`
	TotalTax      float64 `json:"total_tax"`
	TotalDiscount float64 `json:"total_discount"`
	CashAmount    float64 `json:"cash_amount"`
	CardAmount    float64 `json:"card_amount"`
	MobileAmount  float64 `json:"mobile_amount"`
	AvgOrderValue float64 `json:"avg_order_value"`
}

type RevenueReport struct {
	Date   string  `json:"date"`
	Amount float64 `json:"amount"`
}

type ServiceBreakdown struct {
	ServiceName string  `json:"service_name"`
	Count       int     `json:"count"`
	Revenue     float64 `json:"revenue"`
}

type TopCustomer struct {
	CustomerID   string  `json:"customer_id"`
	CustomerName string  `json:"customer_name"`
	OrderCount   int     `json:"order_count"`
	TotalSpent   float64 `json:"total_spent"`
}
