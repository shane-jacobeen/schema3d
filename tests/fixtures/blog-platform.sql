-- Blog Platform Database Schema

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP NOT NULL
);

-- Optional profile (0..1:1 relationship) - user_id is nullable
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NULL REFERENCES users(id),  -- Explicit NULL = optional relationship
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  location VARCHAR(200),
  website VARCHAR(255),
  social_links JSONB
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  parent_category_id INTEGER NULL REFERENCES categories(id)  -- Explicit NULL = top-level categories have no parent
);

-- Required user (1:N), optional category (0..1:N)
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),  -- NOT NULL = required relationship
  category_id INTEGER NULL REFERENCES categories(id),  -- Explicit NULL = draft posts might not have category yet
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url VARCHAR(255),
  published BOOLEAN,
  views INTEGER,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);

-- Required post and user (1:N relationships) - both NOT NULL
-- Optional parent comment (0..1:1 relationship) - nullable
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id),  -- NOT NULL = required relationship
  user_id INTEGER NOT NULL REFERENCES users(id),  -- NOT NULL = required relationship
  parent_comment_id INTEGER NULL REFERENCES comments(id),  -- Explicit NULL = top-level comments have no parent
  content TEXT NOT NULL,
  approved BOOLEAN,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL
);

-- Many-to-many relationship - both required (1:N on each side)
CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id),  -- NOT NULL = required
  tag_id INTEGER NOT NULL REFERENCES tags(id),  -- NOT NULL = required
  PRIMARY KEY (post_id, tag_id)
);

-- Required user and post (1:N relationships) - both NOT NULL
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),  -- NOT NULL = required relationship
  post_id INTEGER NOT NULL REFERENCES posts(id),  -- NOT NULL = required relationship
  created_at TIMESTAMP NOT NULL
);

-- Required follower and following (1:N relationships) - both NOT NULL
CREATE TABLE follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id),  -- NOT NULL = required relationship
  following_id INTEGER NOT NULL REFERENCES users(id),  -- NOT NULL = required relationship
  created_at TIMESTAMP NOT NULL
);

-- Required user (1:N), optional post (0..1:N) - post_id nullable
CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),  -- NOT NULL = required relationship
  post_id INTEGER NULL REFERENCES posts(id),  -- Explicit NULL = media can exist without being attached to a post
  file_url VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER,
  alt_text VARCHAR(255),
  created_at TIMESTAMP NOT NULL
);

-- Required user (1:N), optional post and user (0..1:N) - both nullable
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),  -- NOT NULL = required relationship
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  related_post_id INTEGER NULL REFERENCES posts(id),  -- Explicit NULL = not all notifications relate to posts
  related_user_id INTEGER NULL REFERENCES users(id),  -- Explicit NULL = not all notifications relate to other users
  read BOOLEAN,
  created_at TIMESTAMP NOT NULL
);

-- Required user and post (1:N relationships) - both NOT NULL
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),  -- NOT NULL = required relationship
  post_id INTEGER NOT NULL REFERENCES posts(id),  -- NOT NULL = required relationship
  created_at TIMESTAMP NOT NULL
);

CREATE VIEW published_posts_view AS
SELECT 
  p.id,
  p.title,
  p.slug,
  p.created_at,
  u.username AS author_username,
  c.name AS category_name
FROM posts p
JOIN users u ON p.user_id = u.id
JOIN categories c ON p.category_id = c.id
WHERE p.published = true;

CREATE VIEW user_posts_summary_view AS
SELECT 
  p.id,
  p.title,
  p.views,
  p.created_at,
  u.username AS author_username,
  u.email AS author_email
FROM posts p
JOIN users u ON p.user_id = u.id;

CREATE VIEW recent_comments_view AS
SELECT 
  c.id,
  c.content,
  c.created_at,
  c.approved,
  u.username AS commenter_username,
  p.title AS post_title
FROM comments c
JOIN users u ON c.user_id = u.id
JOIN posts p ON c.post_id = p.id;

