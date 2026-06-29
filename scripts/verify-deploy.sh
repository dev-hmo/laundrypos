#!/usr/bin/env bash
# ============================================================
# Laundry OMS — Post-Deployment Verification Script
# Run after a production deploy to validate all services.
# ============================================================
set -euo pipefail

API_URL="${API_URL:-https://api.laundry.example.com}"
FRONTEND_URL="${FRONTEND_URL:-https://laundry.example.com}"
MAX_RETRIES=12
RETRY_INTERVAL=10

echo "⏳ Verifying deployment..."
echo "   API:      $API_URL"
echo "   Frontend: $FRONTEND_URL"
echo ""

# ─── Health check with retries ────────────────────────────
check_endpoint() {
    local url=$1
    local name=$2
    local retries=0

    while [ $retries -lt $MAX_RETRIES ]; do
        status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
        if [ "$status" = "200" ] || [ "$status" = "301" ] || [ "$status" = "307" ] || [ "$status" = "308" ]; then
            echo "✓ $name is UP  ($status)"
            return 0
        fi
        retries=$((retries + 1))
        echo "   Waiting for $name... ($status, attempt $retries/$MAX_RETRIES)"
        sleep "$RETRY_INTERVAL"
    done

    echo "✕ $name is DOWN after $MAX_RETRIES attempts"
    return 1
}

check_endpoint "${API_URL}/health" "API Health"
check_endpoint "$FRONTEND_URL" "Frontend"

echo ""
echo "✓ Deployment verification complete"
