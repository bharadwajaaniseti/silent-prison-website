// Test script to add some connections between regions
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testConnections() {
  try {
    // Get all regions first
    const response = await fetch(`${API_BASE}/regions`);
    const data = await response.json();
    const regions = data.regions;
    
    console.log('Current regions:', regions.map(r => ({ id: r.id, name: r.name, connections: r.connections })));
    
    if (regions.length >= 2) {
      // Connect the first two regions
      const region1 = regions[0];
      const region2 = regions[1];
      
      console.log(`\nConnecting ${region1.name} to ${region2.name}...`);
      
      // Update first region to connect to second
      const updateResponse1 = await fetch(`${API_BASE}/regions/${region1.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connections: [region2.id] })
      });
      
      if (updateResponse1.ok) {
        console.log(`✅ ${region1.name} connected to ${region2.name}`);
      }
      
      // Update second region to connect back to first
      const updateResponse2 = await fetch(`${API_BASE}/regions/${region2.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connections: [region1.id] })
      });
      
      if (updateResponse2.ok) {
        console.log(`✅ ${region2.name} connected to ${region1.name}`);
      }
      
      // Verify the connections
      const verifyResponse = await fetch(`${API_BASE}/regions`);
      const verifyData = await verifyResponse.json();
      console.log('\nUpdated connections:', verifyData.regions.map(r => ({ id: r.id, name: r.name, connections: r.connections })));
    }
  } catch (error) {
    console.error('Error testing connections:', error);
  }
}

testConnections();
