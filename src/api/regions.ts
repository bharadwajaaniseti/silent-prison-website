// API endpoints for region management
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export const apiFetchRegions = async () => {
  try {
    const response = await fetch(`${API_BASE}/regions`);
    if (response.ok) {
      const data = await response.json();
      return data.regions || [];
    }
    throw new Error('Failed to fetch from backend');
  } catch (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
};

export const apiAddRegion = async (region: any) => {
  try {
    const response = await fetch(`${API_BASE}/regions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region })
    });
    if (!response.ok) throw new Error('Failed to add region');
    const data = await response.json();
    return data.region;
  } catch (error) {
    console.error('Error adding region:', error);
    throw error;
  }
};

export const apiDeleteRegion = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE}/regions/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete region');
    return true;
  } catch (error) {
    console.error('Error deleting region:', error);
    throw error;
  }
};

export const apiUpdateRegion = async (id: string, updates: any) => {
  try {
    const response = await fetch(`${API_BASE}/regions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update region');
    const data = await response.json();
    return data.region;
  } catch (error) {
    console.error('Error updating region:', error);
    throw error;
  }
};

export const apiBulkAddRegions = async (regions: any[]) => {
  try {
    const response = await fetch(`${API_BASE}/regions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regions })
    });
    if (!response.ok) throw new Error('Failed to bulk add regions');
    const data = await response.json();
    return data.regions;
  } catch (error) {
    console.error('Error bulk adding regions:', error);
    throw error;
  }
};

// Function to fetch regions based on user type
export const apiFetchRegionsForUserType = async (userType: 'free' | 'signed_in' | 'premium' = 'free') => {
  try {
    const response = await fetch(`${API_BASE}/regions/user-type/${userType}`);
    if (response.ok) {
      const data = await response.json();
      return data.regions || [];
    }
    throw new Error('Failed to fetch regions for user type');
  } catch (error) {
    console.error('Error fetching regions for user type:', error);
    return [];
  }
};

// Function to update region visibility
export const apiUpdateRegionVisibility = async (
  id: string, 
  visibility: {
    freeUsers: boolean;
    signedInUsers: boolean;
    premiumUsers: boolean;
  }
) => {
  try {
    const response = await fetch(`${API_BASE}/regions/${id}/visibility`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility })
    });
    if (!response.ok) throw new Error('Failed to update region visibility');
    const data = await response.json();
    return data.region;
  } catch (error) {
    console.error('Error updating region visibility:', error);
    throw error;
  }
};