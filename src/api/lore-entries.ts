// API endpoints for lore entry management
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export const apiFetchLoreEntries = async () => {
  try {
    const response = await fetch(`${API_BASE}/lore-entries`);
    if (response.ok) {
      const data = await response.json();
      return data.entries || [];
    }
    throw new Error('Failed to fetch from backend');
  } catch (error) {
    console.error('Error fetching lore entries:', error);
    return [];
  }
};

export const apiAddLoreEntry = async (entry) => {
  try {
    const response = await fetch(`${API_BASE}/lore-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry })
    });
    if (!response.ok) throw new Error('Failed to add entry');
    const data = await response.json();
    return data.entry;
  } catch (error) {
    console.error('Error adding lore entry:', error);
    throw error;
  }
};

export const apiDeleteLoreEntry = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE}/lore-entries/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete entry');
    return true;
  } catch (error) {
    console.error('Error deleting lore entry:', error);
    throw error;
  }
};

export const apiUpdateLoreEntry = async (id: string, updates: any) => {
  try {
    const response = await fetch(`${API_BASE}/lore-entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update entry');
    const data = await response.json();
    return data.entry;
  } catch (error) {
    console.error('Error updating lore entry:', error);
    throw error;
  }
};
