package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func CORS(allowedOrigins []string) gin.HandlerFunc {
	originSet := make(map[string]bool, len(allowedOrigins))
	for _, o := range allowedOrigins {
		originSet[o] = true
	}

	allowed := strings.Join(allowedOrigins, ", ")

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if originSet[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
		} else if len(allowedOrigins) == 1 {
			c.Header("Access-Control-Allow-Origin", allowedOrigins[0])
		} else {
			c.Header("Access-Control-Allow-Origin", allowed)
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
