// Manually add statistics to existing characters via API
// This script will update characters to have statistics even if the DB column doesn't exist yet

const API_BASE = 'http://localhost:3001/api';

async function addStatisticsToCharacters() {
  console.log('🔄 Adding statistics to existing characters...');
  
  try {
    // Fetch all characters
    const response = await fetch(`${API_BASE}/characters`);
    const data = await response.json();
    const characters = data.characters || [];
    
    console.log(`📊 Found ${characters.length} characters`);
    
    // Standard statistics template
    const standardStats = [
      { name: 'Combat Skill', value: 50 },
      { name: 'Intelligence', value: 50 },
      { name: 'Leadership', value: 50 },
      { name: 'Emotional Resilience', value: 50 },
      { name: 'Stealth', value: 50 },
      { name: 'Social Skills', value: 50 }
    ];
    
    // Update each character
    for (const character of characters) {
      console.log(`⚡ Updating ${character.name}...`);
      
      try {
        const updateResponse = await fetch(`${API_BASE}/characters/${character.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            statistics: standardStats
          })
        });
        
        if (updateResponse.ok) {
          console.log(`✅ ${character.name} updated successfully`);
        } else {
          console.log(`❌ Failed to update ${character.name}: ${updateResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Error updating ${character.name}:`, error.message);
      }
    }
    
    // Verify updates
    console.log('\n🔍 Verifying updates...');
    const verifyResponse = await fetch(`${API_BASE}/characters`);
    const verifyData = await verifyResponse.json();
    
    verifyData.characters?.forEach(char => {
      const hasStats = char.statistics && char.statistics.length > 0;
      console.log(`  ${char.name}: ${hasStats ? '✅' : '❌'} Statistics (${char.statistics?.length || 0} items)`);
    });
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

addStatisticsToCharacters();
