// Script to populate the database with dummy regions
const API_BASE = 'http://localhost:3001/api';

const defaultRegions = [
  {
    name: 'Oris',
    subtitle: 'The Fractured Crown',
    position: { x: 50, y: 40 },
    color: 'from-blue-500 to-blue-600',
    description: 'Central continent and seat of Guardian power, characterized by crystalline formations and floating islands.',
    keyLocations: ['Guardian Citadel', 'Shattered Plaza', 'Crystal Gardens'],
    population: '~2.3 million',
    threat: 'High Guardian Presence'
  },
  {
    name: 'Askar',
    subtitle: 'The Burning Wastes',
    position: { x: 25, y: 60 },
    color: 'from-red-500 to-red-600',
    description: 'Desert continent where nightmare energy has crystallized into dangerous formations that amplify psychic abilities.',
    keyLocations: ['The Glass Citadel', 'Crimson Dunes', 'The Howling Spires'],
    population: '~800,000',
    threat: 'Extreme Nightmare Activity'
  },
  {
    name: 'Duskar',
    subtitle: 'The Twilight Realm',
    position: { x: 75, y: 30 },
    color: 'from-purple-500 to-purple-600',
    description: 'Perpetually shrouded in twilight, this continent exists partially in the dream realm.',
    keyLocations: ['The Umbral Gate', 'Whisper Valley', 'The Dreaming Spires'],
    population: '~1.1 million',
    threat: 'Reality Distortion'
  },
  {
    name: 'Mistveil',
    subtitle: 'The Hidden Shores',
    position: { x: 30, y: 25 },
    color: 'from-teal-500 to-teal-600',
    description: 'Mysterious island continent cloaked in perpetual mist, rumored to hide pre-Convergence technology.',
    keyLocations: ['The Ancient Archive', 'Fog Harbor', 'The Sunken City'],
    population: '~500,000',
    threat: 'Unknown Entities'
  },
  {
    name: 'The Voidlands',
    subtitle: 'The Shattered Expanse',
    position: { x: 60, y: 70 },
    color: 'from-gray-600 to-gray-700',
    description: 'A devastated region where reality itself has been torn apart by void energy, creating floating landmasses.',
    keyLocations: ['The Null Zone', 'Floating Ruins', 'The Event Horizon'],
    population: '~50,000 (estimated)',
    threat: 'Reality Breakdown'
  }
];

async function populateRegions() {
  console.log('🗺️  Populating database with regions...');
  
  try {
    // Check if regions already exist
    const response = await fetch(`${API_BASE}/regions`);
    const data = await response.json();
    
    if (data.regions && data.regions.length > 0) {
      console.log(`📍 Found ${data.regions.length} existing regions in database`);
      console.log('Existing regions:');
      data.regions.forEach(region => {
        console.log(`  - ${region.name}: ${region.subtitle}`);
      });
      
      const answer = prompt('\nRegions already exist. Do you want to continue anyway? (y/N)');
      if (answer?.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled');
        return;
      }
    }
    
    console.log(`\n🚀 Adding ${defaultRegions.length} regions to database...`);
    
    // Add each region
    for (const region of defaultRegions) {
      console.log(`📍 Adding ${region.name}...`);
      
      try {
        const addResponse = await fetch(`${API_BASE}/regions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ region })
        });
        
        if (addResponse.ok) {
          const result = await addResponse.json();
          console.log(`✅ ${region.name} added successfully (ID: ${result.region.id})`);
        } else {
          const error = await addResponse.json();
          console.log(`❌ Failed to add ${region.name}: ${error.error}`);
        }
      } catch (error) {
        console.log(`❌ Error adding ${region.name}:`, error.message);
      }
    }
    
    // Verify the regions were added
    console.log('\n🔍 Verifying regions...');
    const verifyResponse = await fetch(`${API_BASE}/regions`);
    const verifyData = await verifyResponse.json();
    
    console.log(`✅ Total regions in database: ${verifyData.regions?.length || 0}`);
    verifyData.regions?.forEach(region => {
      console.log(`  - ${region.name}: ${region.subtitle} (${region.population})`);
    });
    
  } catch (error) {
    console.error('❌ Failed to populate regions:', error);
  }
}

// Note: This script requires a prompt function for Node.js
// Install with: npm install prompt-sync
// Then uncomment the line below:
// const prompt = require('prompt-sync')();

populateRegions();
