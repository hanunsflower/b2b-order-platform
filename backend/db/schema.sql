CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  role          VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'buyer')),
  status        VARCHAR(10) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  brand       VARCHAR(100),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE product_variants (
  id             SERIAL PRIMARY KEY,
  product_id     INT NOT NULL REFERENCES products(id),
  sku            VARCHAR(50) UNIQUE NOT NULL,
  shade          VARCHAR(50),
  size           VARCHAR(50),
  price          NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock_on_hand  INT NOT NULL DEFAULT 0 CHECK (stock_on_hand >= 0),
  stock_reserved INT NOT NULL DEFAULT 0 CHECK (stock_reserved >= 0),
  CHECK (stock_reserved <= stock_on_hand)
);

CREATE TABLE carts (
  id       SERIAL PRIMARY KEY,
  buyer_id INT NOT NULL REFERENCES users(id)
);

CREATE TABLE cart_items (
  id         SERIAL PRIMARY KEY,
  cart_id    INT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id INT NOT NULL REFERENCES product_variants(id),
  quantity   INT NOT NULL CHECK (quantity > 0),
  UNIQUE (cart_id, variant_id)
);

CREATE TABLE orders (
  id                 SERIAL PRIMARY KEY,
  buyer_id           INT NOT NULL REFERENCES users(id),
  status             VARCHAR(20) NOT NULL DEFAULT 'pending_payment'
                     CHECK (status IN ('pending_payment','payment_submitted',
                       'payment_verified','payment_rejected','ready_for_pickup',
                       'out_for_delivery','completed','cancelled')),
  fulfillment_method VARCHAR(10) NOT NULL CHECK (fulfillment_method IN ('pickup','delivery')),
  delivery_address   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (fulfillment_method = 'pickup' OR delivery_address IS NOT NULL)
);

CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id INT NOT NULL REFERENCES product_variants(id),
  quantity   INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL   -- price snapshot at order time
);

CREATE TABLE payments (
  id               SERIAL PRIMARY KEY,
  order_id         INT NOT NULL REFERENCES orders(id),
  reference_number VARCHAR(100) UNIQUE NOT NULL,
  status           VARCHAR(10) NOT NULL DEFAULT 'submitted'
                   CHECK (status IN ('submitted','verified','rejected')),
  verified_by      INT REFERENCES users(id),
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id             SERIAL PRIMARY KEY,
  order_id       INT UNIQUE NOT NULL REFERENCES orders(id),
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id         SERIAL PRIMARY KEY,
  actor_id   INT REFERENCES users(id),
  action     VARCHAR(50) NOT NULL,   -- e.g. 'payment_verified'
  entity     VARCHAR(50) NOT NULL,   -- e.g. 'order'
  entity_id  INT,
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);