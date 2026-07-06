package router

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	"github.com/laundry-oms/backend/internal/config"
	"github.com/laundry-oms/backend/internal/handlers"
	"github.com/laundry-oms/backend/internal/middleware"
)

// Setup initializes the Gin router with all routes and middleware.
func Setup(db *sql.DB, cfg *config.Config) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	middleware.InitAuth(cfg.AuthSecret)

	r := gin.New()
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger())
	r.Use(middleware.Security())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(cfg.CORSOrigins))
	r.Use(middleware.RateLimit(cfg.RateLimitRPS, cfg.RateLimitBurst))

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(db)
	customerHandler := handlers.NewCustomerHandler(db)
	orderHandler := handlers.NewOrderHandler(db)
	serviceHandler := handlers.NewServiceHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db)
	invoiceHandler := handlers.NewInvoiceHandler(db)
	authHandler := handlers.NewAuthHandler(db)
	userHandler := handlers.NewUserHandler(db)
	reportHandler := handlers.NewReportHandler(db)
	dashboardHandler := handlers.NewDashboardHandler(db)

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Health (public)
		v1.GET("/health", healthHandler.Check)

		// Auth (public)
		v1.POST("/auth/login", authHandler.Login)

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.RequireAuth)
		{
			// Auth
			protected.GET("/auth/me", authHandler.Me)

			// Customers CRUD
			protected.GET("/customers", customerHandler.ListAll)
			protected.GET("/customers/search", customerHandler.Search)
			protected.GET("/customers/:id", customerHandler.GetByID)
			protected.POST("/customers", customerHandler.Create)
			protected.PUT("/customers/:id", customerHandler.Update)
			protected.DELETE("/customers/:id", customerHandler.Delete)

			// Orders
			protected.GET("/orders", orderHandler.ListActive)
			protected.GET("/orders/all", orderHandler.ListAll)
			protected.POST("/orders", orderHandler.Create)
			protected.GET("/orders/:id", orderHandler.GetByID)
			protected.PUT("/orders/:id", orderHandler.Update)
			protected.PATCH("/orders/:id/status", orderHandler.UpdateStatus)
			protected.PATCH("/orders/:id/cancel", orderHandler.Cancel)

			// Payments
			protected.POST("/orders/:orderId/payments", paymentHandler.Create)
			protected.GET("/orders/:orderId/payments", paymentHandler.ListByOrder)

			// Invoices
			protected.GET("/orders/:orderId/invoice", invoiceHandler.GetByOrder)
			protected.PATCH("/orders/:orderId/invoice/printed", invoiceHandler.MarkPrinted)

			// Services CRUD
			protected.GET("/services", serviceHandler.List)
			protected.GET("/services/:id", serviceHandler.GetByID)
			protected.POST("/services", serviceHandler.Create)
			protected.PUT("/services/:id", serviceHandler.Update)
			protected.DELETE("/services/:id", serviceHandler.Delete)

			// Dashboard
			protected.GET("/dashboard/stats", dashboardHandler.Stats)

			// Reports
			protected.GET("/reports/daily", reportHandler.DailySummary)
			protected.GET("/reports/revenue", reportHandler.RevenueByRange)
			protected.GET("/reports/services", reportHandler.ServiceBreakdown)
			protected.GET("/reports/top-customers", reportHandler.TopCustomers)
		}

		// Admin-only routes
		admin := v1.Group("/users")
		admin.Use(middleware.RequireAuth)
		admin.Use(middleware.RequireRole("admin"))
		{
			admin.GET("", userHandler.List)
			admin.GET("/:id", userHandler.GetByID)
			admin.POST("", userHandler.Create)
			admin.PUT("/:id", userHandler.Update)
			admin.DELETE("/:id", userHandler.Delete)
		}
	}

	return r
}
