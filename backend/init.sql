-- ============================================================
-- Employee Management System — Database Initialization Script
-- Run this file against your MySQL server before starting the backend
-- Usage: mysql -u root -p < init.sql
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS employee_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE employee_db;

-- Drop and recreate table (for clean re-runs)
DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)                    NOT NULL,
  email       VARCHAR(100)       UNIQUE       NOT NULL,
  phone       VARCHAR(20)                     DEFAULT NULL,
  department  VARCHAR(50)                     DEFAULT NULL,
  position    VARCHAR(100)                    DEFAULT NULL,
  salary      DECIMAL(10, 2)                  DEFAULT NULL,
  hire_date   DATE                            DEFAULT NULL,
  status      ENUM('active', 'inactive')      NOT NULL DEFAULT 'active',
  created_at  TIMESTAMP                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP                       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Sample data ──────────────────────────────────────────────
INSERT INTO employees (name, email, phone, department, position, salary, hire_date, status) VALUES
  ('Alice Johnson',   'alice.johnson@company.com',   '+1-555-0101', 'Engineering',  'Senior Developer',    95000.00, '2021-03-15', 'active'),
  ('Bob Martinez',    'bob.martinez@company.com',    '+1-555-0102', 'Engineering',  'DevOps Engineer',     85000.00, '2022-01-10', 'active'),
  ('Carol Williams',  'carol.williams@company.com',  '+1-555-0103', 'HR',           'HR Manager',          72000.00, '2020-07-01', 'active'),
  ('David Chen',      'david.chen@company.com',      '+1-555-0104', 'Sales',        'Sales Executive',     65000.00, '2023-02-20', 'active'),
  ('Eve Thompson',    'eve.thompson@company.com',    '+1-555-0105', 'Design',       'UI/UX Designer',      78000.00, '2021-11-05', 'active'),
  ('Frank Wilson',    'frank.wilson@company.com',    '+1-555-0106', 'Engineering',  'Backend Developer',   88000.00, '2022-06-15', 'active'),
  ('Grace Lee',       'grace.lee@company.com',       '+1-555-0107', 'Marketing',    'Marketing Lead',      70000.00, '2020-04-12', 'active'),
  ('Henry Brown',     'henry.brown@company.com',     '+1-555-0108', 'Finance',      'Financial Analyst',   82000.00, '2021-09-30', 'inactive'),
  ('Iris Davis',      'iris.davis@company.com',      '+1-555-0109', 'Sales',        'Account Manager',     68000.00, '2023-05-18', 'active'),
  ('Jake Miller',     'jake.miller@company.com',     '+1-555-0110', 'Engineering',  'Frontend Developer',  80000.00, '2022-10-01', 'active');

SELECT CONCAT('✅ Database initialized with ', COUNT(*), ' sample employees') AS result FROM employees;
