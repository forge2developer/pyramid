-- Migration: Add replacement_status to all product tables
-- Run this SQL against your database before restarting the backend

ALTER TABLE laptop ADD COLUMN replacement_status ENUM('none','pending','completed') NOT NULL DEFAULT 'none';
ALTER TABLE monitor ADD COLUMN replacement_status ENUM('none','pending','completed') NOT NULL DEFAULT 'none';
ALTER TABLE system ADD COLUMN replacement_status ENUM('none','pending','completed') NOT NULL DEFAULT 'none';
ALTER TABLE workstation ADD COLUMN replacement_status ENUM('none','pending','completed') NOT NULL DEFAULT 'none';
ALTER TABLE mobileworkstation ADD COLUMN replacement_status ENUM('none','pending','completed') NOT NULL DEFAULT 'none';
ALTER TABLE ram ADD COLUMN replacement_status ENUM('none','pending','completed') NOT NULL DEFAULT 'none';
ALTER TABLE ssd ADD COLUMN replacement_status ENUM('none','pending','completed') NOT NULL DEFAULT 'none';
ALTER TABLE hdd ADD COLUMN replacement_status ENUM('none','pending','completed') NOT NULL DEFAULT 'none';
ALTER TABLE nvme ADD COLUMN replacement_status ENUM('none','pending','completed') NOT NULL DEFAULT 'none';
ALTER TABLE graphicscard ADD COLUMN replacement_status ENUM('none','pending','completed') NOT NULL DEFAULT 'none';
ALTER TABLE m_2 ADD COLUMN replacement_status ENUM('none','pending','completed') NOT NULL DEFAULT 'none';
