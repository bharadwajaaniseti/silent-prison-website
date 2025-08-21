-- Migration: Add statistics column to characters table
-- Run this script to add statistics support to existing databases

-- Add statistics column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'characters' AND column_name = 'statistics'
    ) THEN
        ALTER TABLE characters ADD COLUMN statistics jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add index for statistics column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_characters_statistics ON characters USING GIN(statistics);

-- Update existing characters to have standard statistics if they don't have any
UPDATE characters 
SET statistics = '[
  {"name": "Combat Skill", "value": 50},
  {"name": "Intelligence", "value": 50},
  {"name": "Leadership", "value": 50},
  {"name": "Emotional Resilience", "value": 50},
  {"name": "Stealth", "value": 50},
  {"name": "Social Skills", "value": 50}
]'::jsonb
WHERE statistics = '[]'::jsonb OR statistics IS NULL;

-- Verification query (run after migration to check)
-- SELECT name, statistics FROM characters;
