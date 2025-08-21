// Simple script to test database connection and verify statistics column
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://quwqleajqpyppdoadmdk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE || 'your-service-role-key'
);

async function checkDatabase() {
  console.log('🔍 Checking database schema...');
  
  // Test connection
  try {
    const { data: tableInfo } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'characters');
    
    console.log('📋 Current columns in characters table:');
    tableInfo?.forEach(col => console.log(`  - ${col.column_name}`));
    
    const hasStatistics = tableInfo?.some(col => col.column_name === 'statistics');
    console.log(`\n📊 Statistics column exists: ${hasStatistics ? '✅ YES' : '❌ NO'}`);
    
    if (!hasStatistics) {
      console.log('\n🚨 MIGRATION NEEDED:');
      console.log('Run this SQL in your Supabase SQL editor:');
      console.log('ALTER TABLE characters ADD COLUMN statistics jsonb DEFAULT \'[]\'::jsonb;');
      console.log('CREATE INDEX IF NOT EXISTS idx_characters_statistics ON characters USING GIN(statistics);');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
}

checkDatabase();
