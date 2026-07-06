# ============================================================
# Multi-stage Dockerfile for Go API
# Build: statically linked binary | Runtime: Alpine (non-root)
# ============================================================

# --- Stage 1: Build ---
FROM golang:1.26-alpine3.23 AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# Cache dependencies layer
COPY go.mod ./
COPY go.sum* ./
RUN go mod download 2>/dev/null || true

# Copy source code
COPY . .

# Resolve all deps (generates go.sum if missing) and compile
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /build/server \
    ./cmd/server

# --- Stage 2: Runtime ---
FROM alpine:3.23

RUN apk add --no-cache ca-certificates tzdata

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/server .
COPY --from=builder /build/migrations ./migrations

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["./server"]
