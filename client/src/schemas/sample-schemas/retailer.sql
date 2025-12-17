-- Retailer Database Schema

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  parent_category_id INTEGER REFERENCES categories(id)
);

CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  contact_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  brand VARCHAR(100),
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  sku VARCHAR(100),
  created_at TIMESTAMP
);

CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  phone VARCHAR(20),
  manager_id INTEGER REFERENCES employees(id)
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  position VARCHAR(100),
  hire_date DATE,
  salary DECIMAL(10,2)
);

CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  store_id INTEGER REFERENCES stores(id),
  quantity INTEGER,
  warehouse_location VARCHAR(100),
  last_updated TIMESTAMP
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  loyalty_points INTEGER,
  created_at TIMESTAMP
);

-- 1:1 relationship example: Each customer has exactly one profile
CREATE TABLE customer_profiles (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER UNIQUE REFERENCES customers(id),  -- UNIQUE FK = 1:1
  preferences TEXT,
  newsletter_subscribed BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  store_id INTEGER REFERENCES stores(id),
  order_date TIMESTAMP,
  status VARCHAR(50),
  total_amount DECIMAL(10,2),
  shipping_address TEXT,
  tracking_number VARCHAR(100)
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  subtotal DECIMAL(10,2)
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  payment_method VARCHAR(50),
  amount DECIMAL(10,2),
  status VARCHAR(50),
  transaction_id VARCHAR(100),
  payment_date TIMESTAMP
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  customer_id INTEGER REFERENCES customers(id),
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP
);

CREATE TABLE promotions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  description TEXT,
  discount_percent DECIMAL(5,2),
  start_date DATE,
  end_date DATE,
  active BOOLEAN
);

CREATE TABLE product_promotions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  promotion_id INTEGER REFERENCES promotions(id)
);

-- N:N relationship example: Products can have multiple tags, tags can be on multiple products
-- Tag name is not a primary key and not unique, creating N:N relationship
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),  -- Not unique, not a PK - allows duplicates
  category VARCHAR(50)
);

CREATE TABLE product_tags (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  tag_name VARCHAR(100) REFERENCES tags(name),  -- References non-unique column = N:N
  added_at TIMESTAMP
);

-- Another 1:1 relationship example: Each order has exactly one shipping detail
CREATE TABLE order_shipping (
  id SERIAL PRIMARY KEY,
  order_id INTEGER UNIQUE REFERENCES orders(id),  -- UNIQUE FK = 1:1
  carrier VARCHAR(100),
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

