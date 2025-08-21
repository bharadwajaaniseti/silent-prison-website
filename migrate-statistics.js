// Database migration script to add statistics column
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://quwqleajqpyppdoadmdk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE || ''
);

async function runMigration() {
  console.log('🚀 Starting database migration...');
  
  try {
    // Add statistics column
    console.log('📝 Adding statistics column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE characters ADD COLUMN IF NOT EXISTS statistics jsonb DEFAULT '[]'::jsonb;`
    });
    
    if (alterError && !alterError.message.includes('already exists')) {
      console.error('❌ Error adding column:', alterError);
      return;
    }
    
    console.log('✅ Statistics column added');
    
    // Add index
    console.log('📊 Adding index...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_characters_statistics ON characters USING GIN(statistics);`
    });
    
    if (indexError) {
      console.error('⚠️  Index error (may already exist):', indexError);
    } else {
      console.log('✅ Index added');
    }
    
    // Update existing characters with default statistics
    console.log('🔄 Updating existing characters...');
    const { error: updateError } = await supabase
      .from('characters')
      .update({
        statistics: [
          { name: 'Combat Skill', value: 50 },
          { name: 'Intelligence', value: 50 },
          { name: 'Leadership', value: 50 },
          { name: 'Emotional Resilience', value: 50 },
          { name: 'Stealth', value: 50 },
          { name: 'Social Skills', value: 50 }
        ]
      })
      .is('statistics', null);
    
    if (updateError) {
      console.error('❌ Error updating characters:', updateError);
    } else {
      console.log('✅ Existing characters updated with default statistics');
    }
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    const { data: characters, error: fetchError } = await supabase
      .from('characters')
      .select('name, statistics')
      .limit(3);
    
    if (fetchError) {
      console.error('❌ Verification error:', fetchError);
    } else {
      console.log('✅ Migration successful! Sample data:');
      characters?.forEach(char => {
        console.log(`  - ${char.name}: ${char.statistics ? char.statistics.length : 0} statistics`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
