import React, { useState, useEffect } from 'react';
import InteractiveMap from './InteractiveMap';
import { apiFetchRegions, apiAddRegion, apiDeleteRegion, apiUpdateRegion } from '../api/regions';
import { X, Save } from 'lucide-react';

export interface Region {
  id: string;
  name: string;
  subtitle: string;
  position: { x: number; y: number };
  color: string;
  description: string;
  keyLocations: string[];
  population: string;
  threat: string;
}

const initialRegions: Region[] = [
  // ...copy from InteractiveMap or load from storage/api...
];

// Modal form for adding/editing a region
const RegionForm: React.FC<{
  region?: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
}> = ({ region, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: region?.name || '',
    subtitle: region?.subtitle || '',
    positionX: region?.position?.x || 0,
    positionY: region?.position?.y || 0,
    color: region?.color || '',
    description: region?.description || '',
    keyLocations: region?.keyLocations?.join(', ') || '',
    population: region?.population || '',
    threat: region?.threat || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      position: { x: Number(formData.positionX), y: Number(formData.positionY) },
      keyLocations: formData.keyLocations.split(',').map((k: string) => k.trim()).filter((k: string): boolean => !!k),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="font-orbitron text-2xl font-bold text-blue-300">{region ? 'Edit' : 'Add New'} Region</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subtitle</label>
              <input type="text" value={formData.subtitle} onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position X</label>
              <input type="number" value={formData.positionX} onChange={e => setFormData(prev => ({ ...prev, positionX: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position Y</label>
              <input type="number" value={formData.positionY} onChange={e => setFormData(prev => ({ ...prev, positionY: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color (Tailwind gradient e.g. from-blue-500 to-blue-600)</label>
            <input type="text" value={formData.color} onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 h-32" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Key Locations (comma separated)</label>
            <input type="text" value={formData.keyLocations} onChange={e => setFormData(prev => ({ ...prev, keyLocations: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Population</label>
              <input type="text" value={formData.population} onChange={e => setFormData(prev => ({ ...prev, population: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Threat</label>
              <input type="text" value={formData.threat} onChange={e => setFormData(prev => ({ ...prev, threat: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors">
              <Save size={18} />
              <span>{region ? 'Update' : 'Create'} Region</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Admin wrapper for InteractiveMap with edit functionality
const MapAdmin: React.FC = () => {
  const [regions, setRegions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState<{ id: string } | null>(null);

  useEffect(() => {
    apiFetchRegions().then(setRegions);
  }, []);

  // Add/Edit/Remove handlers
  const handleAdd = async (regionData: any) => {
    const newRegion = await apiAddRegion(regionData);
    setRegions([...regions, newRegion]);
    setShowForm(false);
  };
  const handleEdit = async (regionData: any) => {
    if (!editingRegion) return;
    const updatedRegion = await apiUpdateRegion(editingRegion.id, {
      ...regionData,
      position: { x: Number(regionData.positionX), y: Number(regionData.positionY) },
      keyLocations: regionData.keyLocations.split(',').map((k: string) => k.trim()).filter((k: string) => k),
    });
    setRegions(prev => prev.map(r => r.id === editingRegion.id ? updatedRegion : r));
    setEditingRegion(null);
    setShowForm(false);
  };
  const handleRemove = async (id: string) => {
    const success = await apiDeleteRegion(id);
    if (success) setRegions(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div>
      <button onClick={() => { setEditingRegion(null); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">Add Region</button>
      {showForm && (
        <RegionForm
          region={editingRegion}
          onSubmit={editingRegion ? handleEdit : handleAdd}
          onClose={() => { setShowForm(false); setEditingRegion(null); }}
        />
      )}
      <InteractiveMap regions={regions} />
      <ul className="mt-4">
        {regions.map(region => (
          <li key={region.id} className="flex items-center gap-2 mb-2">
            <span>{region.name}</span>
            <button onClick={() => { setEditingRegion(region); setShowForm(true); }} className="text-blue-400">Edit</button>
            <button onClick={() => handleRemove(region.id)} className="text-red-400">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MapAdmin;
