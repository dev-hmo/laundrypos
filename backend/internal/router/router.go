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

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Health
		v1.GET("/health", healthHandler.Check)

		// Customers
		customers := v1.Group("/customers")
		{
			customers.POST("", customerHandler.Create)
			customers.GET("/search", customerHandler.Search)
		}

		// Orders
		orders := v1.Group("/orders")
		{
			orders.POST("", orderHandler.Create)
			orders.GET("", orderHandler.ListActive)
			orders.PATCH("/:id/status", orderHandler.UpdateStatus)
		}
	}

	return r
}
