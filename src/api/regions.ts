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

export const apiAddRegion = async (region) => {
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
