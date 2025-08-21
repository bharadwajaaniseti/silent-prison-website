// API endpoints for lore entry management
import { LoreEntry } from '../types/auth';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export const apiFetchLoreEntries = async (): Promise<LoreEntry[]> => {
  try {
    const response = await fetch(`${API_BASE}/lore-entries`);
    if (response.ok) {
      const data = await response.json();
      return data.entries || [];
    }
    throw new Error('Failed to fetch from backend');
  } catch (error) {
    console.error('Error fetching lore entries:', error);
    // Fallback to localStorage
    try {
      const localLore = localStorage.getItem('loreEntries');
      return localLore ? JSON.parse(localLore) : [];
    } catch {
      return [];
    }
  }
};

export const apiAddLoreEntry = async (entry: Partial<LoreEntry>): Promise<LoreEntry> => {
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
    // Fallback to localStorage
    const newEntry: LoreEntry = {
      id: Date.now().toString(),
      title: entry.title || '',
      category: entry.category || '',
      summary: entry.summary || '',
      content: entry.content || '',
      tags: entry.tags || [],
      publishDate: new Date().toISOString(),
      isPublished: entry.isPublished || false
    };
    
    const existingEntries = JSON.parse(localStorage.getItem('loreEntries') || '[]');
    const updatedEntries = [...existingEntries, newEntry];
    localStorage.setItem('loreEntries', JSON.stringify(updatedEntries));
    return newEntry;
  }
};

export const apiDeleteLoreEntry = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/lore-entries/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete entry');
    return true;
  } catch (error) {
    console.error('Error deleting lore entry:', error);
    // Fallback to localStorage
    try {
      const existingEntries = JSON.parse(localStorage.getItem('loreEntries') || '[]');
      const updatedEntries = existingEntries.filter((entry: LoreEntry) => entry.id !== id);
      localStorage.setItem('loreEntries', JSON.stringify(updatedEntries));
      return true;
    } catch {
      return false;
    }
  }
};

export const apiUpdateLoreEntry = async (id: string, updates: Partial<LoreEntry>): Promise<LoreEntry> => {
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
    // Fallback to localStorage
    const existingEntries: LoreEntry[] = JSON.parse(localStorage.getItem('loreEntries') || '[]');
    const entryIndex = existingEntries.findIndex(entry => entry.id === id);
    
    if (entryIndex === -1) {
      throw new Error('Entry not found');
    }
    
    const updatedEntry = { ...existingEntries[entryIndex], ...updates };
    existingEntries[entryIndex] = updatedEntry;
    localStorage.setItem('loreEntries', JSON.stringify(existingEntries));
    return updatedEntry;
  }
};
