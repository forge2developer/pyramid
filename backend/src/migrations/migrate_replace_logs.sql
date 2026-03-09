-- Migration: Restructure Replace logs & replacedproduct table
-- Date: 2026-02-23
-- Description: 
--   1. Convert existing "Replace" activity logs to "Replacement Return"
--   2. Add replacementID and product columns to replacedproduct table
--      so we can track exactly which product replaced which.

-- ============================================================
-- Step 1: Migrate existing "Replace" activity_logs
-- ============================================================
UPDATE activity_logs
SET log = 'Replacement Return'
WHERE log = 'Replace';

-- ============================================================
-- Step 2: Add replacementID and product columns to replacedproduct
-- ============================================================
ALTER TABLE replacedproduct
  ADD COLUMN replacementID INT NULL,
  ADD COLUMN product VARCHAR(50) NULL;

-- ============================================================
-- Verification Queries (run manually to confirm)
-- ============================================================
-- Check no "Replace" logs remain:
-- SELECT COUNT(*) AS remaining FROM activity_logs WHERE log = 'Replace';

-- Check new columns exist:
-- DESCRIBE replacedproduct;

-- Find which product replaced which:
-- SELECT * FROM replacedproduct ORDER BY date DESC;
