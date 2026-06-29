-- ============================================================
-- Laundry OMS — Database Initialization Script
-- PostgreSQL 16+
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE order_status AS ENUM (
    'Received',
    'Washing',
    'Pressing',
    'Ready',
    'Delivered'
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255)    NOT NULL,
    phone       VARCHAR(20)     NOT NULL UNIQUE,
    email       VARCHAR(255),
    preferences TEXT            DEFAULT '',
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers (phone);
CREATE INDEX idx_customers_name  ON customers (name);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID            NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status          order_status    NOT NULL DEFAULT 'Received',
    total_amount    NUMERIC(10, 2)  NOT NULL DEFAULT 0.00,
    tax_amount      NUMERIC(10, 2)  NOT NULL DEFAULT 0.00,
    promised_date   TIMESTAMPTZ,
    notes           TEXT            DEFAULT '',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_orders_status      ON orders (status);
CREATE INDEX idx_orders_created_at  ON orders (created_at DESC);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    service_type    VARCHAR(100)    NOT NULL,
    weight_kg       NUMERIC(6, 3)   NOT NULL DEFAULT 0.000,
    quantity        INTEGER         NOT NULL DEFAULT 1,
    unit_price      NUMERIC(10, 2)  NOT NULL,
    subtotal        NUMERIC(10, 2)  NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update on row modification)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA (sample services reference — not a table, for docs)
-- ============================================================
-- Service Types & Default Pricing:
--   Wash & Fold        $2.50/kg
--   Dry Cleaning       $8.00/kg
--   Pressing Only      $3.00/item
--   Stain Treatment    $5.00/item
--   Alterations        $12.00/item
-- ============================================================
