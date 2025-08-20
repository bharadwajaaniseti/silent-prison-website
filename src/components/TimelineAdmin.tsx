import React, { useState, useEffect } from 'react';
import Timeline from './Timeline';
import { apiFetchTimelineEvents, apiAddTimelineEvent, apiDeleteTimelineEvent, apiUpdateTimelineEvent } from '../api/timeline-events';
import { X, Save } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  era: string;
  year: string;
  title: string;
  type: string;
  summary: string;
  details: string;
  impact: string;
}

const initialEvents: TimelineEvent[] = [
  // ...copy from Timeline or load from storage/api...
];

// Admin wrapper for Timeline with add/edit/remove functionality
const TimelineAdmin: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{ id: string } | null>(null);

  useEffect(() => {
    apiFetchTimelineEvents().then(setEvents);
  }, []);

  // Add/Edit/Remove handlers
  const handleAdd = async (eventData: any) => {
    const newEvent = await apiAddTimelineEvent(eventData);
    setEvents([...events, newEvent]);
    setShowForm(false);
  };
  const handleEdit = async (eventData: any) => {
    if (!editingEvent) return;
    const updatedEvent = await apiUpdateTimelineEvent(editingEvent.id, eventData);
    setEvents(prev => prev.map(e => e.id === editingEvent.id ? updatedEvent : e));
    setEditingEvent(null);
    setShowForm(false);
  };
  const handleRemove = async (id: string) => {
    const success = await apiDeleteTimelineEvent(id);
    if (success) setEvents(prev => prev.filter(e => e.id !== id));
  };

  const TimelineEventForm: React.FC<{
    event?: any;
    onSubmit: (data: any) => void;
    onClose: () => void;
  }> = ({ event, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
      era: event?.era || '',
      year: event?.year || '',
      title: event?.title || '',
      type: event?.type || '',
      summary: event?.summary || '',
      details: event?.details || '',
      impact: event?.impact || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="font-orbitron text-2xl font-bold text-blue-300">{event ? 'Edit' : 'Add'} Timeline Event</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Era</label>
                <input type="text" value={formData.era} onChange={e => setFormData(prev => ({ ...prev, era: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                <input type="text" value={formData.year} onChange={e => setFormData(prev => ({ ...prev, year: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input type="text" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <input type="text" value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Summary</label>
              <input type="text" value={formData.summary} onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Details</label>
              <textarea value={formData.details} onChange={e => setFormData(prev => ({ ...prev, details: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 h-32" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Impact</label>
              <input type="text" value={formData.impact} onChange={e => setFormData(prev => ({ ...prev, impact: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors">
                <Save size={18} />
                <span>{event ? 'Update' : 'Create'} Event</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // For now, reuse Timeline for display. Add admin controls here later.
  return (
    <div>
      <button onClick={() => { setEditingEvent(null); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">Add Event</button>
      {showForm && (
        <TimelineEventForm
          event={editingEvent}
          onSubmit={editingEvent ? handleEdit : handleAdd}
          onClose={() => { setShowForm(false); setEditingEvent(null); }}
        />
      )}
      <Timeline events={events} />
      <ul className="mt-4">
        {events.map(event => (
          <li key={event.id} className="flex items-center gap-2 mb-2">
            <span>{event.title}</span>
            <button onClick={() => { setEditingEvent(event); setShowForm(true); }} className="text-blue-400">Edit</button>
            <button onClick={() => handleRemove(event.id)} className="text-red-400">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TimelineAdmin;
