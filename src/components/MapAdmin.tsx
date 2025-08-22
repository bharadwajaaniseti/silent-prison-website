import React, { useState, useEffect } from 'react';
import { uploadImage } from '../utils/imageUpload';
import DynamicInteractiveMap from './DynamicInteractiveMap';
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
  connections?: string[];
  imageUrl?: string; // New: region icon/image
}

// Modal form for adding/editing a region
const RegionForm: React.FC<{
  region?: any;
  regions: any[];
  onSubmit: (data: any) => void;
  onClose: () => void;
}> = ({ region, regions, onSubmit, onClose }) => {
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
    connections: region?.connections || [],
    region_icon: region?.region_icon || '', // Supabase Storage URL
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      position: { x: Number(formData.positionX), y: Number(formData.positionY) },
      keyLocations: formData.keyLocations.split(',').map((k: string) => k.trim()).filter((k: string): boolean => !!k),
      region_icon: formData.region_icon,
    });
  };
  const handleConnectionToggle = (regionId: string) => {
    setFormData(prev => ({
      ...prev,
      connections: prev.connections.includes(regionId)
        ? prev.connections.filter((id: string) => id !== regionId)
        : [...prev.connections, regionId]
    }));
  };

  // Get available regions for connections (exclude current region being edited)
  const availableRegions = regions.filter(r => r.id !== region?.id);


  return (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
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
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subtitle</label>
              <input 
                type="text" 
                value={formData.subtitle} 
                onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))} 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" 
              />
            </div>
          </div>
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Region Icon/Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploading(true);
                  setUploadError(null);
                  const result = await uploadImage(file, 'region-icons');
                  setUploading(false);
                  if (result.success && result.url) {
                    setFormData(prev => ({ ...prev, region_icon: result.url }));
                  } else {
                    setUploadError(result.error || 'Upload failed');
                  }
                }
              }}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={uploading}
            />
            {uploading && <div className="text-blue-400 mt-2">Uploading...</div>}
            {uploadError && <div className="text-red-400 mt-2">{uploadError}</div>}
            {formData.region_icon && (
              <img src={formData.region_icon} alt="Region Icon Preview" className="mt-2 w-24 h-24 object-contain rounded-lg border border-gray-600" />
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position X (0-100)</label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={formData.positionX} 
                onChange={e => setFormData(prev => ({ ...prev, positionX: e.target.value }))} 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position Y (0-100)</label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={formData.positionY} 
                onChange={e => setFormData(prev => ({ ...prev, positionY: e.target.value }))} 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color (Tailwind gradient e.g. from-blue-500 to-blue-600)</label>
            <input 
              type="text" 
              value={formData.color} 
              onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))} 
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 h-32" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Key Locations (comma separated)</label>
            <input 
              type="text" 
              value={formData.keyLocations} 
              onChange={e => setFormData(prev => ({ ...prev, keyLocations: e.target.value }))} 
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" 
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Population</label>
              <input 
                type="text" 
                value={formData.population} 
                onChange={e => setFormData(prev => ({ ...prev, population: e.target.value }))} 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Threat</label>
              <input 
                type="text" 
                value={formData.threat} 
                onChange={e => setFormData(prev => ({ ...prev, threat: e.target.value }))} 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" 
              />
            </div>
          </div>

          {/* Region Connections Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Connected Regions</label>
            <div className="bg-gray-700 rounded-lg p-4 space-y-2">
              {availableRegions.length > 0 ? (
                availableRegions.map((availableRegion) => (
                  <label key={availableRegion.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.connections.includes(availableRegion.id)}
                      onChange={() => handleConnectionToggle(availableRegion.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-300">{availableRegion.name}</span>
                    <span className="text-gray-500 text-sm">({availableRegion.subtitle})</span>
                  </label>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No other regions available for connections</p>
              )}
              {formData.connections.length === 0 && (
                <p className="text-yellow-400 text-sm mt-2">⚠️ This region will appear as unconnected</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
            >
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
    const updatedRegion = await apiUpdateRegion(editingRegion.id, regionData);
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
      <div className="mb-4">
        <button 
          onClick={() => { setEditingRegion(null); setShowForm(true); }} 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Add New Region
        </button>
      </div>

      {showForm && (
        <RegionForm
          region={editingRegion}
          regions={regions}
          onSubmit={editingRegion ? handleEdit : handleAdd}
          onClose={() => { setShowForm(false); setEditingRegion(null); }}
        />
      )}
      
      <DynamicInteractiveMap regions={regions} />
      
      <div className="mt-6">
        <h3 className="text-xl font-bold text-white mb-4">Manage Regions</h3>
        <div className="grid gap-4">
          {regions.map(region => (
            <div key={region.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h4 className="text-white font-semibold">{region.name}</h4>
                <p className="text-gray-300 text-sm">{region.subtitle}</p>
                <p className="text-gray-400 text-xs">
                  Connections: {region.connections?.length || 0} 
                  {region.connections?.length > 0 && ` (${region.connections.map((id: string) => regions.find(r => r.id === id)?.name).filter(Boolean).join(', ')})`}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEditingRegion(region); setShowForm(true); }} 
                  className="text-blue-400 hover:text-blue-300 px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleRemove(region.id)} 
                  className="text-red-400 hover:text-red-300 px-3 py-1 rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapAdmin;
