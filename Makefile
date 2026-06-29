# Laundry OMS — Development & Build Commands

.PHONY: help backend-build backend-run backend-lint frontend-install frontend-dev frontend-build frontend-lint docker-up docker-down docker-build db-shell clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Backend ─────────────────────────────────────────────

backend-build: ## Build the Go API binary
	cd backend && go build -o server ./cmd/server

backend-run: ## Run the Go API locally (requires PostgreSQL)
	cd backend && go run ./cmd/server

backend-lint: ## Lint Go code
	cd backend && go vet ./...

backend-test: ## Run Go tests
	cd backend && go test ./... -v -count=1

# ─── Frontend ────────────────────────────────────────────

frontend-install: ## Install frontend dependencies
	cd frontend && npm ci

frontend-dev: ## Start Next.js dev server
	cd frontend && npm run dev

frontend-build: ## Build frontend for production
	cd frontend && npm run build

frontend-lint: ## Lint frontend code
	cd frontend && npm run lint

# ─── Docker ──────────────────────────────────────────────

docker-up: ## Start all services with Docker Compose
	docker compose up -d

docker-down: ## Stop all services
	docker compose down

docker-build: ## Rebuild all Docker images
	docker compose build --no-cache

docker-logs: ## Tail logs from all services
	docker compose logs -f

# ─── Database ────────────────────────────────────────────

db-shell: ## Connect to PostgreSQL with psql
	docker compose exec postgres psql -U laundry -d laundry_oms

db-reset: ## Reset database (WARNING: destroys data)
	docker compose down -v
	docker compose up -d

# ─── Utility ─────────────────────────────────────────────

clean: ## Clean build artifacts
	rm -f backend/server
	rm -rf frontend/.next
