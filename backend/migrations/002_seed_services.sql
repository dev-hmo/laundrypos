-- ============================================================
-- Laundry OMS — Seed Data: Service Types & Reference Pricing
-- Idempotent: only inserts if the services reference table
-- is empty. This is a reference catalog for the POS frontend.
-- ============================================================

-- Create the reference table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_catalog (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id  VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    unit        VARCHAR(10)  NOT NULL CHECK (unit IN ('kg', 'item')),
    unit_price  NUMERIC(10,2) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Only seed if table is empty
INSERT INTO service_catalog (service_id, name, description, unit, unit_price)
SELECT * FROM (VALUES
    ('wash-fold',       'Wash & Fold',      'Standard wash, dry, and fold service',        'kg',   2.50),
    ('dry-cleaning',    'Dry Cleaning',     'Professional solvent-based cleaning',          'kg',   8.00),
    ('pressing',        'Pressing Only',    'Steam press and finishing',                    'item', 3.00),
    ('stain-treatment', 'Stain Treatment',  'Targeted stain removal service',               'item', 5.00),
    ('alterations',     'Alterations',      'Hemming, repairs, and adjustments',            'item', 12.00)
) AS data(service_id, name, description, unit, unit_price)
WHERE NOT EXISTS (SELECT 1 FROM service_catalog LIMIT 1);
