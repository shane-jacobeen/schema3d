-- Retailer Database Schema

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_category_id INTEGER NULL REFERENCES categories(id)  -- Explicit NULL = top-level categories have no parent
);

CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP NOT NULL
);

-- Required category (1:N), optional supplier (0..1:N) - supplier_id nullable
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id),  -- NOT NULL = required relationship
  supplier_id INTEGER NULL REFERENCES suppliers(id),  -- Explicit NULL = some products might not have a supplier yet
  brand VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  sku VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- Optional manager (0..1:1 relationship) - manager_id nullable
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  phone VARCHAR(20),
  manager_id INTEGER NULL REFERENCES employees(id)  -- Explicit NULL = store might not have a manager assigned yet
);

-- Required store (1:N relationship) - store_id NOT NULL
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),  -- NOT NULL = required relationship
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  position VARCHAR(100) NOT NULL,
  hire_date DATE NOT NULL,
  salary DECIMAL(10,2)
);

-- Required product and store (1:N relationships) - both NOT NULL
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),  -- NOT NULL = required relationship
  store_id INTEGER NOT NULL REFERENCES stores(id),  -- NOT NULL = required relationship
  quantity INTEGER NOT NULL,
  warehouse_location VARCHAR(100),
  last_updated TIMESTAMP NOT NULL
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  loyalty_points INTEGER,
  created_at TIMESTAMP NOT NULL
);

-- 1:1 relationship example: Optional profile (0..1:1) - customer_id nullable and unique
CREATE TABLE customer_profiles (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NULL UNIQUE REFERENCES customers(id),  -- Explicit NULL = not all customers have profiles, UNIQUE = 1:1
  preferences TEXT,
  newsletter_subscribed BOOLEAN,
  created_at TIMESTAMP NOT NULL
);

-- Required customer and store (1:N relationships) - both NOT NULL
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),  -- NOT NULL = required relationship
  store_id INTEGER NOT NULL REFERENCES stores(id),  -- NOT NULL = required relationship
  order_date TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address TEXT NOT NULL,
  tracking_number VARCHAR(100)
);

-- Required order and product (1:N relationships) - both NOT NULL
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),  -- NOT NULL = required relationship
  product_id INTEGER NOT NULL REFERENCES products(id),  -- NOT NULL = required relationship
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- Required order (1:N relationship) - order_id NOT NULL
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),  -- NOT NULL = required relationship
  payment_method VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100),
  payment_date TIMESTAMP NOT NULL
);

-- Required product and customer (1:N relationships) - both NOT NULL
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),  -- NOT NULL = required relationship
  customer_id INTEGER NOT NULL REFERENCES customers(id),  -- NOT NULL = required relationship
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE promotions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  discount_percent DECIMAL(5,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN NOT NULL
);

-- Required product and promotion (1:N relationships) - both NOT NULL
CREATE TABLE product_promotions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),  -- NOT NULL = required relationship
  promotion_id INTEGER NOT NULL REFERENCES promotions(id)  -- NOT NULL = required relationship
);

-- N:N relationship example: Products can have multiple tags, tags can be on multiple products
-- Tag name is not a primary key and not unique, creating N:N relationship
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,  -- Not unique, not a PK - allows duplicates
  category VARCHAR(50)
);

CREATE TABLE product_tags (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),  -- NOT NULL = required
  tag_name VARCHAR(100) NOT NULL REFERENCES tags(name),  -- References non-unique column = N:N
  added_at TIMESTAMP NOT NULL
);

-- Another 1:1 relationship example: Optional shipping (0..1:1) - order_id nullable and unique
CREATE TABLE order_shipping (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NULL UNIQUE REFERENCES orders(id),  -- Explicit NULL = not all orders have shipping details yet, UNIQUE = 1:1
  carrier VARCHAR(100) NOT NULL,
  tracking_number VARCHAR(100),
  estimated_delivery DATE,
  shipped_at TIMESTAMP
);

CREATE VIEW product_summary_view AS
SELECT 
  p.id,
  p.name,
  p.price,
  p.sku,
  c.name AS category_name,
  s.name AS supplier_name
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN suppliers s ON p.supplier_id = s.id;

CREATE VIEW sales_summary_view AS
SELECT 
  o.id,
  o.order_date,
  o.total_amount,
  o.status,
  c.first_name || ' ' || c.last_name AS customer_name,
  st.name AS store_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN stores st ON o.store_id = st.id;

CREATE VIEW inventory_status_view AS
SELECT 
  i.id,
  i.quantity,
  i.warehouse_location,
  p.name AS product_name,
  st.name AS store_name
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN stores st ON i.store_id = st.id;

