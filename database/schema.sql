-- Run this once to set up your database
CREATE DATABASE IF NOT EXISTS pipeline_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pipeline_db;

-- ─────────────────────────────────────────────
-- TABLE 1: pipeline  (Opportunities file)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  opportunity_number  VARCHAR(50) NOT NULL,
  created_date        DATE,
  account_name        VARCHAR(255),
  industry            VARCHAR(100),
  mailing_state       VARCHAR(100),
  opportunity_owner   VARCHAR(150),
  proposal_person     VARCHAR(150),
  stage               VARCHAR(100),
  feed_rate           DECIMAL(15,2),
  unit_of_feed_rate   VARCHAR(50),
  quoted_value        DECIMAL(15,2),
  final_price         DECIMAL(15,2),
  close_date          DATE,
  department          VARCHAR(50),
  uploaded_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_stage        (stage),
  INDEX idx_created_date (created_date),
  INDEX idx_close_date   (close_date),
  INDEX idx_industry     (industry),
  INDEX idx_department   (department)
);

-- ─────────────────────────────────────────────
-- TABLE 2: leads  (Leads Detail Report file)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  lead_number   VARCHAR(50) NOT NULL,
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  company       VARCHAR(255),
  industry_type VARCHAR(100),
  email         VARCHAR(150),
  lead_source   VARCHAR(100),
  rating        VARCHAR(50),
  street        VARCHAR(255),
  lead_owner    VARCHAR(150),
  lead_status   VARCHAR(100),
  create_date   DATE,
  state         VARCHAR(100),
  department    VARCHAR(50),          -- derived from prefix: B=Biofuels P=Spares S=Sugar W=Water
  fy_suffix     CHAR(1),              -- G = current FY, F = previous FY
  uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_lead_status  (lead_status),
  INDEX idx_create_date  (create_date),
  INDEX idx_industry     (industry_type),
  INDEX idx_lead_owner   (lead_owner),
  INDEX idx_department   (department),
  INDEX idx_state        (state)
);
