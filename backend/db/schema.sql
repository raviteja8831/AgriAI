-- Smart Agriculture Assistant Database Schema
CREATE DATABASE IF NOT EXISTS agri_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agri_ai;

-- Users / Farmers
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(100),
  password_hash VARCHAR(255),
  role ENUM('farmer', 'admin', 'expert') DEFAULT 'farmer',
  language ENUM('en', 'hi', 'te') DEFAULT 'en',
  profile_image VARCHAR(500),
  otp_code VARCHAR(6),
  otp_expires_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  fcm_token VARCHAR(500),
  last_login DATETIME,
  referred_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Adds referred_by to a users table created before this column existed (no-op on fresh installs)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INT AFTER last_login;

-- Farms
CREATE TABLE IF NOT EXISTS farms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  survey_number VARCHAR(50),
  village VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  area_acres DECIMAL(10, 2),
  irrigation_type ENUM('rain_fed', 'canal', 'borewell', 'drip', 'sprinkler') DEFAULT 'rain_fed',
  soil_type ENUM('clay', 'sandy', 'loamy', 'silt', 'black', 'red') DEFAULT 'loamy',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crops
CREATE TABLE IF NOT EXISTS crops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farm_id INT NOT NULL,
  crop_name VARCHAR(100) NOT NULL,
  crop_variety VARCHAR(100),
  season ENUM('kharif', 'rabi', 'zaid', 'annual') DEFAULT 'kharif',
  sowing_date DATE,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  area_acres DECIMAL(10, 2),
  seed_quantity_kg DECIMAL(10, 2),
  status ENUM('planned', 'sowing', 'growing', 'flowering', 'harvesting', 'harvested', 'failed') DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Soil Reports
CREATE TABLE IF NOT EXISTS soil_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farm_id INT NOT NULL,
  ph DECIMAL(4, 2),
  nitrogen_kg_ha DECIMAL(8, 2),
  phosphorus_kg_ha DECIMAL(8, 2),
  potassium_kg_ha DECIMAL(8, 2),
  organic_carbon_percent DECIMAL(5, 2),
  moisture_percent DECIMAL(5, 2),
  ec_ds_m DECIMAL(6, 3),
  boron DECIMAL(6, 3),
  zinc DECIMAL(6, 3),
  report_date DATE,
  lab_name VARCHAR(100),
  ai_recommendation TEXT,
  suitable_crops JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Weather History
CREATE TABLE IF NOT EXISTS weather_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farm_id INT NOT NULL,
  recorded_date DATE NOT NULL,
  temperature_max DECIMAL(5, 2),
  temperature_min DECIMAL(5, 2),
  rainfall_mm DECIMAL(7, 2),
  humidity_percent DECIMAL(5, 2),
  wind_speed_kmh DECIMAL(6, 2),
  uv_index DECIMAL(4, 2),
  weather_condition VARCHAR(100),
  ai_suggestion TEXT,
  irrigation_advised BOOLEAN DEFAULT FALSE,
  spray_advised BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Daily Crop Images
CREATE TABLE IF NOT EXISTS daily_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crop_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  captured_at DATETIME,
  health_score DECIMAL(4, 2),
  ai_prediction TEXT,
  growth_stage VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Disease Reports
CREATE TABLE IF NOT EXISTS disease_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crop_id INT NOT NULL,
  image_id INT,
  disease_name VARCHAR(200),
  confidence_score DECIMAL(5, 2),
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  affected_area_percent DECIMAL(5, 2),
  medicine_recommendation TEXT,
  dosage_details TEXT,
  recovery_estimate_days INT,
  is_treated BOOLEAN DEFAULT FALSE,
  treatment_date DATE,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
  FOREIGN KEY (image_id) REFERENCES daily_images(id) ON DELETE SET NULL
);

-- Crop Calendar Tasks
CREATE TABLE IF NOT EXISTS crop_calendar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crop_id INT NOT NULL,
  task_name VARCHAR(200) NOT NULL,
  task_type ENUM('land_preparation', 'sowing', 'fertilizer', 'irrigation', 'pesticide', 'weeding', 'harvesting', 'other') DEFAULT 'other',
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status ENUM('pending', 'in_progress', 'completed', 'skipped') DEFAULT 'pending',
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crop_id INT NOT NULL,
  category ENUM('seeds', 'fertilizer', 'pesticide', 'labour', 'machinery', 'irrigation', 'transport', 'other') DEFAULT 'other',
  description VARCHAR(300),
  amount DECIMAL(12, 2) NOT NULL,
  quantity DECIMAL(10, 2),
  unit VARCHAR(50),
  expense_date DATE NOT NULL,
  receipt_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Harvest Records
CREATE TABLE IF NOT EXISTS harvests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crop_id INT NOT NULL,
  yield_kg DECIMAL(12, 2),
  yield_per_acre DECIMAL(10, 2),
  quality_grade ENUM('A', 'B', 'C', 'rejected') DEFAULT 'A',
  market_price_per_kg DECIMAL(10, 2),
  total_revenue DECIMAL(14, 2),
  total_expenses DECIMAL(14, 2),
  profit_loss DECIMAL(14, 2),
  harvest_date DATE,
  sold_to VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Market Prices
CREATE TABLE IF NOT EXISTS market_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crop_name VARCHAR(100) NOT NULL,
  market_name VARCHAR(200),
  district VARCHAR(100),
  state VARCHAR(100),
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  modal_price DECIMAL(10, 2),
  msp_price DECIMAL(10, 2),
  unit VARCHAR(50) DEFAULT 'quintal',
  price_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('weather', 'disease', 'task', 'market', 'harvest', 'system') DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  sent_via JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Fertilizer Recommendations
CREATE TABLE IF NOT EXISTS fertilizer_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crop_id INT NOT NULL,
  soil_report_id INT,
  growth_stage VARCHAR(100),
  fertilizer_name VARCHAR(200),
  quantity_kg DECIMAL(10, 2),
  application_method VARCHAR(200),
  recommended_date DATE,
  ai_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
  FOREIGN KEY (soil_report_id) REFERENCES soil_reports(id) ON DELETE SET NULL
);

-- Expert Consultations
CREATE TABLE IF NOT EXISTS consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  expert_id INT,
  crop_id INT,
  subject VARCHAR(300),
  status ENUM('pending', 'active', 'resolved', 'cancelled') DEFAULT 'pending',
  type ENUM('chat', 'voice', 'video') DEFAULT 'chat',
  scheduled_at DATETIME,
  ended_at DATETIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL
);

-- Satellite Data
CREATE TABLE IF NOT EXISTS satellite_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farm_id INT NOT NULL,
  ndvi_value DECIMAL(6, 4),
  moisture_index DECIMAL(6, 4),
  crop_health_score DECIMAL(5, 2),
  water_stress_level ENUM('low', 'moderate', 'high', 'severe') DEFAULT 'low',
  image_url VARCHAR(500),
  captured_date DATE,
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_farms_user ON farms(user_id);
CREATE INDEX idx_crops_farm ON crops(farm_id);
CREATE INDEX idx_soil_farm ON soil_reports(farm_id);
CREATE INDEX idx_weather_farm_date ON weather_history(farm_id, recorded_date);
CREATE INDEX idx_images_crop ON daily_images(crop_id);
CREATE INDEX idx_disease_crop ON disease_reports(crop_id);
CREATE INDEX idx_expenses_crop ON expenses(crop_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_market_crop_date ON market_prices(crop_name, price_date);
CREATE INDEX idx_calendar_crop ON crop_calendar(crop_id, scheduled_date);
