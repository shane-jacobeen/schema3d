-- Blog Platform Database Schema

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  email VARCHAR(255),
  password_hash VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP
);

CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  location VARCHAR(200),
  website VARCHAR(255),
  social_links JSONB
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  slug VARCHAR(100),
  description TEXT,
  parent_category_id INTEGER REFERENCES categories(id)
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  title VARCHAR(200),
  slug VARCHAR(200),
  content TEXT,
  excerpt TEXT,
  featured_image_url VARCHAR(255),
  published BOOLEAN,
  views INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id),
  user_id INTEGER REFERENCES users(id),
  parent_comment_id INTEGER REFERENCES comments(id),
  content TEXT,
  approved BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  slug VARCHAR(50)
);

CREATE TABLE post_tags (
  post_id INTEGER REFERENCES posts(id),
  tag_id INTEGER REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  post_id INTEGER REFERENCES posts(id),
  created_at TIMESTAMP
);

CREATE TABLE follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id),
  following_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP
);

CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  post_id INTEGER REFERENCES posts(id),
  file_url VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  alt_text VARCHAR(255),
  created_at TIMESTAMP
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50),
  message TEXT,
  related_post_id INTEGER REFERENCES posts(id),
  related_user_id INTEGER REFERENCES users(id),
  read BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  post_id INTEGER REFERENCES posts(id),
  created_at TIMESTAMP
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

