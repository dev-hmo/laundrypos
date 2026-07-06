package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret []byte

func InitAuth(secret string) {
	jwtSecret = []byte(secret)
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("default-dev-secret-change-in-production")
	}
}

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(userID, email, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func parseAndSetToken(c *gin.Context, tokenStr string) bool {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return false
	}
	c.Set("user_id", claims.UserID)
	c.Set("user_email", claims.Email)
	c.Set("user_role", claims.Role)
	return true
}

func RequireAuth(c *gin.Context) {
	// Try cookie first
	tokenStr, err := c.Cookie("auth_token")
	if err == nil && tokenStr != "" {
		if parseAndSetToken(c, tokenStr) {
			c.Next()
			return
		}
	}

	// Fallback to Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && parts[0] == "Bearer" {
			if parseAndSetToken(c, parts[1]) {
				c.Next()
				return
			}
		}
	}

	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, _ := c.Get("user_role")
		roleStr, _ := userRole.(string)

		for _, r := range roles {
			if r == roleStr {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
	}
}
