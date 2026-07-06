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
    .

# --- Stage 2: Runtime ---
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/server .

CMD ["/app/server"]
