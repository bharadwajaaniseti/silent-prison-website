import React, { useState, useEffect } from 'react';
import { uploadImage } from '../utils/imageUpload';
import DynamicInteractiveMap from './DynamicInteractiveMap';
import { apiFetchRegions, apiAddRegion, apiDeleteRegion, apiUpdateRegion, apiBulkAddRegions, apiUpdateRegionVisibility } from '../api/regions';
import { X, Save, Upload, FileText, Eye, EyeOff } from 'lucide-react';

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
  imageUrl?: string;
  places?: Place[];
  visibility?: {
    freeUsers: boolean;
    signedInUsers: boolean;
    premiumUsers: boolean;
  };
}

export interface Place {
  id: string;
  name: string;
  type: 'city' | 'town' | 'outpost' | 'landmark' | 'facility' | 'ruins';
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  importance: number;
  description: string;
  connections?: string[];
}

// JSON Upload Component
const JsonUploadModal: React.FC<{
  onClose: () => void;
  onUpload: (regions: Region[]) => void;
}> = ({ onClose, onUpload }) => {
  const [jsonContent, setJsonContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonContent(content);
        setError(null);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    if (!jsonContent.trim()) {
      setError('Please provide JSON content');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const parsedData = JSON.parse(jsonContent);
      
      // Validate the structure
      if (!Array.isArray(parsedData)) {
        throw new Error('JSON must be an array of regions');
      }

      const regions: Region[] = parsedData.map((item: any, index: number) => {
        // Validate required fields
        if (!item.name || !item.subtitle) {
          throw new Error(`Region at index ${index} is missing required fields (name, subtitle)`);
        }

        return {
          id: item.id || `region-${Date.now()}-${index}`,
          name: item.name,
          subtitle: item.subtitle,
          position: {
            x: item.position?.x || Math.random() * 80 + 10,
            y: item.position?.y || Math.random() * 80 + 10
          },
          color: item.color || 'from-blue-500 to-blue-600',
          description: item.description || '',
          keyLocations: Array.isArray(item.keyLocations) ? item.keyLocations : [],
          population: item.population || 'Unknown',
          threat: item.threat || 'Unknown',
          connections: Array.isArray(item.connections) ? item.connections : [],
          imageUrl: item.imageUrl || '',
          places: Array.isArray(item.places) ? item.places : [],
          visibility: {
            freeUsers: item.visibility?.freeUsers ?? true,
            signedInUsers: item.visibility?.signedInUsers ?? true,
            premiumUsers: item.visibility?.premiumUsers ?? true,
          }
        };
      });

      onUpload(regions);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    } finally {
      setIsProcessing(false);
    }
  };

  const sampleJson = `[
  {
    "name": "Neo-Tokyo Central",
    "subtitle": "Corporate Megacity",
    "position": { "x": 30, "y": 40 },
    "color": "from-cyan-400 via-blue-500 to-purple-600",
    "description": "The heart of the corporate empire...",
    "keyLocations": ["Corporate Plaza", "Data Center Alpha"],
    "population": "12.5M",
    "threat": "High Security",
    "connections": [],
    "imageUrl": "https://example.com/image.jpg",
    "visibility": {
      "freeUsers": true,
      "signedInUsers": true,
      "premiumUsers": true
    },
    "places": [
      {
        "id": "place-1",
        "name": "Corporate Plaza",
        "type": "landmark",
        "position": { "x": -20, "y": -30 },
        "size": "large",
        "importance": 5,
        "description": "Central hub of corporate power",
        "connections": []
      }
    ]
  }
]`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="font-orbitron text-2xl font-bold text-blue-300">Upload Regions JSON</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload JSON File</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Or Paste JSON Content</label>
            <textarea
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              placeholder="Paste your JSON content here..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 h-64 font-mono text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Sample JSON Format:</h3>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{sampleJson}</code>
            </pre>
          </div>

          <div className="flex justify-end space-x-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload size={18} />
              <span>{isProcessing ? 'Processing...' : 'Upload Regions'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    imageUrl: region?.imageUrl || '',
    visibility: {
      freeUsers: region?.visibility?.freeUsers ?? true,
      signedInUsers: region?.visibility?.signedInUsers ?? true,
      premiumUsers: region?.visibility?.premiumUsers ?? true,
    },
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      position: { x: Number(formData.positionX), y: Number(formData.positionY) },
      keyLocations: formData.keyLocations.split(',').map((k: string) => k.trim()).filter((k: string): boolean => !!k),
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
                    setFormData(prev => ({ ...prev, imageUrl: result.url }));
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
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="Region Icon Preview" className="mt-2 w-24 h-24 object-contain rounded-lg border border-gray-600" />
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

          {/* Visibility Controls Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Region Visibility</label>
            <div className="bg-gray-700 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-400 mb-3">Choose which user types can see this region:</p>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.visibility.freeUsers}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    visibility: { ...prev.visibility, freeUsers: e.target.checked }
                  }))}
                  className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
                />
                <span className="text-green-400 font-medium">Free Users</span>
                <span className="text-gray-500 text-sm">(Visitors without accounts)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.visibility.signedInUsers}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    visibility: { ...prev.visibility, signedInUsers: e.target.checked }
                  }))}
                  className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                />
                <span className="text-blue-400 font-medium">Signed-In Users</span>
                <span className="text-gray-500 text-sm">(Users with accounts)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.visibility.premiumUsers}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    visibility: { ...prev.visibility, premiumUsers: e.target.checked }
                  }))}
                  className="w-4 h-4 text-yellow-600 bg-gray-600 border-gray-500 rounded focus:ring-yellow-500"
                />
                <span className="text-yellow-400 font-medium">Premium Users</span>
                <span className="text-gray-500 text-sm">(Users with premium subscription)</span>
              </label>

              {!formData.visibility.freeUsers && !formData.visibility.signedInUsers && !formData.visibility.premiumUsers && (
                <p className="text-red-400 text-sm mt-2">⚠️ This region will be hidden from all users!</p>
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
  const [showJsonUpload, setShowJsonUpload] = useState(false);
  const [editingRegion, setEditingRegion] = useState<{ id: string } | null>(null);

  useEffect(() => {
    apiFetchRegions().then(setRegions);
  }, []);

  // Add/Edit/Remove handlers
  const handleAdd = async (regionData: any) => {
    try {
      const newRegion = await apiAddRegion(regionData);
      setRegions([...regions, newRegion]);
      setShowForm(false);
    } catch (error) {
      console.error('Error adding region:', error);
    }
  };

  const handleEdit = async (regionData: any) => {
    if (!editingRegion) return;
    try {
      const updatedRegion = await apiUpdateRegion(editingRegion.id, regionData);
      setRegions(prev => prev.map(r => r.id === editingRegion.id ? updatedRegion : r));
      setEditingRegion(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error updating region:', error);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const success = await apiDeleteRegion(id);
      if (success) setRegions(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting region:', error);
    }
  };

  const handleJsonUpload = async (uploadedRegions: Region[]) => {
    try {
      const addedRegions = await apiBulkAddRegions(uploadedRegions);
      setRegions(prev => [...prev, ...addedRegions]);
    } catch (error) {
      console.error('Error uploading regions:', error);
    }
  };

  const toggleRegionVisibility = async (regionId: string, userType: 'freeUsers' | 'signedInUsers' | 'premiumUsers') => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;

    const updatedVisibility = {
      ...region.visibility,
      [userType]: !region.visibility?.[userType]
    };

    try {
      const updatedRegion = await apiUpdateRegionVisibility(regionId, updatedVisibility);
      setRegions(prev => prev.map(r => r.id === regionId ? updatedRegion : r));
    } catch (error) {
      console.error('Error updating region visibility:', error);
    }
  };

  const getVisibilityIcon = (visible: boolean) => {
    return visible ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} className="text-red-400" />;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-4">
        <button 
          onClick={() => { setEditingRegion(null); setShowForm(true); }} 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Save size={18} />
          <span>Add New Region</span>
        </button>
        
        <button 
          onClick={() => setShowJsonUpload(true)} 
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <FileText size={18} />
          <span>Upload JSON</span>
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

      {showJsonUpload && (
        <JsonUploadModal
          onClose={() => setShowJsonUpload(false)}
          onUpload={handleJsonUpload}
        />
      )}
      
      <DynamicInteractiveMap regions={regions} />
      
      <div className="mt-6">
        <h3 className="text-xl font-bold text-white mb-4">Manage Regions</h3>
        <div className="grid gap-4">
          {regions.map(region => (
            <div key={region.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
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
              
              {/* Visibility Controls */}
              <div className="border-t border-gray-600 pt-3">
                <h5 className="text-sm font-medium text-gray-300 mb-2">Visibility Controls:</h5>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => toggleRegionVisibility(region.id, 'freeUsers')}
                    className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
                  >
                    {getVisibilityIcon(region.visibility?.freeUsers ?? true)}
                    <span className="text-green-400 text-sm">Free Users</span>
                  </button>
                  
                  <button
                    onClick={() => toggleRegionVisibility(region.id, 'signedInUsers')}
                    className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
                  >
                    {getVisibilityIcon(region.visibility?.signedInUsers ?? true)}
                    <span className="text-blue-400 text-sm">Signed-In Users</span>
                  </button>
                  
                  <button
                    onClick={() => toggleRegionVisibility(region.id, 'premiumUsers')}
                    className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
                  >
                    {getVisibilityIcon(region.visibility?.premiumUsers ?? true)}
                    <span className="text-yellow-400 text-sm">Premium Users</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapAdmin;