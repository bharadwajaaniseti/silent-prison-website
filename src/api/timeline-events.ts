// API endpoints for timeline event management
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export const apiFetchTimelineEvents = async () => {
  try {
    const response = await fetch(`${API_BASE}/timeline-events`);
    if (response.ok) {
      const data = await response.json();
      return data.events || [];
    }
    throw new Error('Failed to fetch from backend');
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    return [];
  }
};

export const apiAddTimelineEvent = async (event) => {
  try {
    const response = await fetch(`${API_BASE}/timeline-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event })
    });
    if (!response.ok) throw new Error('Failed to add event');
    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error('Error adding timeline event:', error);
    throw error;
  }
};

export const apiDeleteTimelineEvent = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE}/timeline-events/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete event');
    return true;
  } catch (error) {
    console.error('Error deleting timeline event:', error);
    throw error;
  }
};

export const apiUpdateTimelineEvent = async (id: string, updates: any) => {
  try {
    const response = await fetch(`${API_BASE}/timeline-events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update event');
    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error('Error updating timeline event:', error);
    throw error;
  }
};
