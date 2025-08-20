// API endpoints for character management
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export const apiFetchCharacters = async () => {
  try {
    const response = await fetch(`${API_BASE}/characters`);
    if (response.ok) {
      const data = await response.json();
      return data.characters || [];
    }
    throw new Error('Failed to fetch from backend');
  } catch (error) {
    console.error('Error fetching characters:', error);
    return [];
  }
};

export const apiAddCharacter = async (character) => {
  try {
    const response = await fetch(`${API_BASE}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character })
    });
    if (!response.ok) throw new Error('Failed to add character');
    const data = await response.json();
    return data.character;
  } catch (error) {
    console.error('Error adding character:', error);
    throw error;
  }
};

export const apiDeleteCharacter = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE}/characters/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete character');
    return true;
  } catch (error) {
    console.error('Error deleting character:', error);
    throw error;
  }
};

export const apiUpdateCharacter = async (id: string, updates: any) => {
  try {
    const response = await fetch(`${API_BASE}/characters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update character');
    const data = await response.json();
    return data.character;
  } catch (error) {
    console.error('Error updating character:', error);
    throw error;
  }
};
