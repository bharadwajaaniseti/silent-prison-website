import React, { useState, useEffect } from 'react';
import { apiFetchCharacters, apiAddCharacter, apiDeleteCharacter, apiUpdateCharacter } from '../api/characters';
import { uploadImage, deleteImage, createFilePreview, compressImage } from '../utils/imageUpload';
import { X, Save, Plus, Trash2, Users, Heart, Zap } from 'lucide-react';

// Admin wrapper for CharacterHub with add/edit/remove functionality
const CharacterAdmin: React.FC = () => {
  const [characters, setCharacters] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingChar, setEditingChar] = useState<{ id: string } | null>(null);

  useEffect(() => {
    apiFetchCharacters().then(setCharacters);
  }, []);

  // Add, Edit, Remove handlers
  const handleAdd = async (charData: any) => {
    const newChar = await apiAddCharacter(charData);
    setCharacters([...characters, newChar]);
    setShowForm(false);
  };
  const handleEdit = async (charData: any) => {
    if (!editingChar) return;
    const updatedChar = await apiUpdateCharacter(editingChar.id, charData);
    setCharacters(prev => prev.map(c => c.id === editingChar.id ? updatedChar : c));
    setEditingChar(null);
    setShowForm(false);
  };
  const handleRemove = async (id: string) => {
    const success = await apiDeleteCharacter(id);
    if (success) setCharacters(prev => prev.filter(c => c.id !== id));
  };

  // Define standard statistics that all characters should have
  const standardStatistics = [
    { name: 'Combat Skill', value: 0 },
    { name: 'Intelligence', value: 0 },
    { name: 'Leadership', value: 0 },
    { name: 'Emotional Resilience', value: 0 },
    { name: 'Stealth', value: 0 },
    { name: 'Social Skills', value: 0 }
  ];

  const CharacterForm: React.FC<{
    character?: any;
    onSubmit: (data: any) => void;
    onClose: () => void;
  }> = ({ character, onSubmit, onClose }) => {
    // Initialize statistics with standard set, preserving existing values if editing
    const initializeStatistics = () => {
      if (character?.statistics && character.statistics.length > 0) {
        // If editing existing character, merge existing stats with standard ones
        return standardStatistics.map(standardStat => {
          const existingStat = character.statistics.find((stat: any) => stat.name === standardStat.name);
          return existingStat || standardStat;
        });
      }
      return standardStatistics;
    };

    const [formData, setFormData] = useState({
      name: character?.name || '',
      title: character?.title || '',
      status: character?.status || '',
      affiliation: character?.affiliation || '',
      powerType: character?.powerType || '',
      powerLevel: character?.powerLevel || 0,
      image: character?.image || '',
      imagePath: character?.imagePath || '', // For Supabase Storage path
      description: character?.description || '',
      background: character?.background || '',
      relationships: character?.relationships?.map((rel: any) => 
        typeof rel === 'string' ? { name: rel, type: 'Acquaintance', status: 'Unknown' } : rel
      ) || [],
      abilities: character?.abilities || [],
      statistics: initializeStatistics(),
    });
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Relationship management functions
    const addRelationship = () => {
      setFormData(prev => ({
        ...prev,
        relationships: [...prev.relationships, { name: '', type: '', status: '' }]
      }));
    };

    const updateRelationship = (index: number, field: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        relationships: prev.relationships.map((rel, i) => 
          i === index ? { ...rel, [field]: value } : rel
        )
      }));
    };

    const removeRelationship = (index: number) => {
      setFormData(prev => ({
        ...prev,
        relationships: prev.relationships.filter((_, i) => i !== index)
      }));
    };

    // Abilities management functions
    const addAbility = () => {
      setFormData(prev => ({
        ...prev,
        abilities: [...prev.abilities, '']
      }));
    };

    const updateAbility = (index: number, value: string) => {
      setFormData(prev => ({
        ...prev,
        abilities: prev.abilities.map((ability, i) => 
          i === index ? value : ability
        )
      }));
    };

    const removeAbility = (index: number) => {
      setFormData(prev => ({
        ...prev,
        abilities: prev.abilities.filter((_, i) => i !== index)
      }));
    };

    // Statistics management function - only update values now (names are standardized)
    const updateStatistic = (index: number, field: 'name' | 'value', value: string | number) => {
      setFormData(prev => ({
        ...prev,
        statistics: prev.statistics.map((stat, i) => 
          i === index ? { ...stat, [field]: value } : stat
        )
      }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setUploadError(null);

      try {
        // Create preview immediately
        const preview = await createFilePreview(file);
        setPreviewUrl(preview);

        // Compress image if it's large
        const compressedFile = await compressImage(file, 800, 800, 0.8);

        // Upload to Supabase Storage
        const result = await uploadImage(compressedFile, 'character-images', 'characters');
        
        if (result.success && result.url) {
          setFormData(prev => ({ 
            ...prev, 
            image: result.url!,
            imagePath: result.path || ''
          }));
        } else {
          setUploadError(result.error || 'Upload failed');
          // Fallback to base64 for now
          setFormData(prev => ({ ...prev, image: preview }));
        }
      } catch (error) {
        console.error('Image upload error:', error);
        setUploadError('Failed to upload image');
        // Fallback to base64
        const preview = await createFilePreview(file);
        setFormData(prev => ({ ...prev, image: preview }));
      } finally {
        setUploading(false);
      }
    };

    const handleRemoveImage = async () => {
      if (formData.imagePath) {
        try {
          await deleteImage(formData.imagePath, 'character-images');
        } catch (error) {
          console.error('Failed to delete image:', error);
        }
      }
      setFormData(prev => ({ ...prev, image: '', imagePath: '' }));
      setPreviewUrl(null);
      setUploadError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        ...formData,
        relationships: formData.relationships.filter((rel: any) => rel.name.trim() !== ''),
        abilities: formData.abilities.filter((ability: any) => ability.trim() !== ''),
      });
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="font-orbitron text-2xl font-bold text-blue-300">{character ? 'Edit' : 'Add New'} Character</h2>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <input type="text" value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Affiliation</label>
                <input type="text" value={formData.affiliation} onChange={e => setFormData(prev => ({ ...prev, affiliation: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Power Type</label>
                <input type="text" value={formData.powerType} onChange={e => setFormData(prev => ({ ...prev, powerType: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Power Level</label>
                <input type="number" value={formData.powerLevel} onChange={e => setFormData(prev => ({ ...prev, powerLevel: Number(e.target.value) }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Character Image</label>
              <div className="space-y-4">
                {/* File Input */}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" 
                />
                
                {/* Upload Status */}
                {uploading && (
                  <div className="flex items-center space-x-2 text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span>Uploading image...</span>
                  </div>
                )}
                
                {/* Error Display */}
                {uploadError && (
                  <div className="text-red-400 text-sm">{uploadError}</div>
                )}
                
                {/* Image Preview */}
                {formData.image && (
                  <div className="flex items-start space-x-4">
                    <img 
                      src={previewUrl || formData.image} 
                      alt="Character Preview" 
                      className="w-32 h-32 object-cover rounded-lg border border-gray-600" 
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
                
                {/* Upload Instructions */}
                <p className="text-xs text-gray-500">
                  Supported formats: JPG, PNG, WebP. Max size: 5MB. Images will be automatically compressed.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 h-32" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Background</label>
              <textarea value={formData.background} onChange={e => setFormData(prev => ({ ...prev, background: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 h-32" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Relationships
                </label>
                <button
                  type="button"
                  onClick={addRelationship}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Relationship</span>
                </button>
              </div>
              <div className="space-y-3">
                {formData.relationships.map((rel: any, index: number) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-700/30 rounded-lg">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={rel.name}
                        onChange={(e) => updateRelationship(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded focus:outline-none focus:border-blue-500 text-sm"
                        placeholder="Character name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Type</label>
                      <select
                        value={rel.type}
                        onChange={(e) => updateRelationship(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded focus:outline-none focus:border-blue-500 text-sm"
                      >
                        <option value="">Select type</option>
                        <option value="Ally">Ally</option>
                        <option value="Enemy">Enemy</option>
                        <option value="Partner">Partner</option>
                        <option value="Love Interest">Love Interest</option>
                        <option value="Friend">Friend</option>
                        <option value="Family">Family</option>
                        <option value="Mentor">Mentor</option>
                        <option value="Student">Student</option>
                        <option value="Rival">Rival</option>
                        <option value="Former Superior">Former Superior</option>
                        <option value="Subordinate">Subordinate</option>
                        <option value="Acquaintance">Acquaintance</option>
                        <option value="Neutral">Neutral</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Status</label>
                      <select
                        value={rel.status}
                        onChange={(e) => updateRelationship(index, 'status', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded focus:outline-none focus:border-blue-500 text-sm"
                      >
                        <option value="">Select status</option>
                        <option value="Strong Bond">Strong Bond</option>
                        <option value="Close">Close</option>
                        <option value="Friendly">Friendly</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Tense">Tense</option>
                        <option value="Hostile">Hostile</option>
                        <option value="Enemy">Enemy</option>
                        <option value="Deceased">Deceased</option>
                        <option value="Complicated">Complicated</option>
                        <option value="Unknown">Unknown</option>
                        <option value="Protective">Protective</option>
                        <option value="Trustworthy">Trustworthy</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeRelationship(index)}
                        className="flex items-center justify-center w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {formData.relationships.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No relationships added yet. Click "Add Relationship" to get started.</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Character Statistics
                </label>
                <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                  Standard Set
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.statistics.map((stat: any, index: number) => (
                  <div key={stat.name} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-green-300 mb-2">
                        {stat.name}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={stat.value}
                        onChange={(e) => updateStatistic(index, 'value', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded focus:outline-none focus:border-green-500"
                        placeholder="0-100"
                      />
                    </div>
                    
                    {/* Preview */}
                    {stat.value > 0 && (
                      <div className="p-2 bg-gray-800/50 rounded border border-gray-600/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">Value</span>
                          <span className="text-sm font-bold text-white">{stat.value}/100</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all ${
                              stat.value >= 90 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                              stat.value >= 75 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              stat.value >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${stat.value}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Abilities & Powers
                </label>
                <button
                  type="button"
                  onClick={addAbility}
                  className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Ability</span>
                </button>
              </div>
              <div className="space-y-3">
                {formData.abilities.map((ability: any, index: number) => {
                  // Parse existing ability format "Name | Description"
                  const [abilityName, abilityDescription] = typeof ability === 'string' 
                    ? ability.split(' | ').map(s => s.trim())
                    : [ability?.name || '', ability?.description || ''];
                  
                  return (
                    <div key={index} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-medium text-purple-300">Ability #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeAbility(index)}
                          className="flex items-center justify-center p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title="Remove Ability"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Ability Name */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Ability Name *</label>
                          <input
                            type="text"
                            value={abilityName}
                            onChange={(e) => {
                              const newAbility = `${e.target.value}${abilityDescription ? ` | ${abilityDescription}` : ''}`;
                              updateAbility(index, newAbility);
                            }}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded focus:outline-none focus:border-purple-500 text-sm"
                            placeholder="e.g., Void Rifts, Storm Calling, Lightning Avatar"
                          />
                        </div>
                        
                        {/* Ability Description */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Description *</label>
                          <textarea
                            value={abilityDescription}
                            onChange={(e) => {
                              const newAbility = `${abilityName}${e.target.value ? ` | ${e.target.value}` : ''}`;
                              updateAbility(index, newAbility);
                            }}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded focus:outline-none focus:border-purple-500 text-sm resize-none"
                            placeholder="e.g., Create tears in space for instant travel across dimensions"
                            rows={2}
                          />
                        </div>
                        
                        {/* Preview */}
                        {abilityName && abilityDescription && (
                          <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-600/50">
                            <p className="text-xs text-gray-400 mb-1">Preview:</p>
                            <p className="text-sm text-gray-300">{abilityName} | {abilityDescription}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {formData.abilities.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-gray-700/20 rounded-lg border border-gray-600/30">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-8 w-8 text-purple-400" />
                    </div>
                    <p className="mb-2 font-medium">No abilities added yet</p>
                    <p className="text-sm">Click "Add Ability" to define your character's powers and skills</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors">
                <Save size={18} />
                <span>{character ? 'Update' : 'Create'} Character</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 text-gray-100 lg:ml-20">
      <div className="max-w-7xl mx-auto px-6 pt-[4.5rem] pb-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="font-orbitron text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            Character Management
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Create and manage the heroes, villains, and complex figures that shape your world
          </p>
          
          {/* Action Button */}
          <button 
            onClick={() => { setEditingChar(null); setShowForm(true); }} 
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-300 ease-out border-2 border-cyan-500/50 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105"
          >
            <Plus className="mr-3 h-6 w-6 transition-transform group-hover:rotate-90" />
            Create New Character
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 blur-xl transition-opacity group-hover:opacity-100 opacity-0 -z-10"></div>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wide">Total Characters</p>
                <p className="text-3xl font-bold text-cyan-400">{characters.length}</p>
              </div>
              <div className="p-3 bg-cyan-500/20 rounded-xl">
                <Users className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wide">Active Characters</p>
                <p className="text-3xl font-bold text-green-400">{characters.filter(c => c.status === 'alive').length}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Heart className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wide">Avg Power Level</p>
                <p className="text-3xl font-bold text-purple-400">
                  {characters.length ? Math.round(characters.reduce((sum, c) => sum + (c.powerLevel || 0), 0) / characters.length) : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Characters Grid */}
        {characters.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-12 max-w-lg mx-auto">
              <div className="w-24 h-24 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-300 mb-4">No Characters Yet</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Start building your world by creating your first character. Add their backstory, abilities, and relationships to bring them to life.
              </p>
              <button 
                onClick={() => { setEditingChar(null); setShowForm(true); }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create First Character
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-12">
            {characters.map(char => (
              <div key={char.id} className="group relative bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/10">
                {/* Character Image */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                  <img
                    src={char.image || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={char.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                  
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingChar(char); setShowForm(true); }}
                      className="p-2.5 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg transition-all duration-300 backdrop-blur-sm hover:scale-110"
                      title="Edit Character"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemove(char.id); }}
                      className="p-2.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg transition-all duration-300 backdrop-blur-sm hover:scale-110"
                      title="Delete Character"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                      char.status === 'alive' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      char.status === 'deceased' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {char.status || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Character Info */}
                <div className="p-5">
                  <div className="mb-4">
                    <h3 className="font-orbitron text-lg font-bold text-white mb-1 line-clamp-1">{char.name}</h3>
                    <p className="text-cyan-300 text-sm font-medium line-clamp-1">{char.title}</p>
                  </div>

                  {/* Affiliation */}
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full">
                      {char.affiliation || 'Independent'}
                    </span>
                  </div>

                  {/* Power Info */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Power Level</span>
                      <span className="text-lg font-bold text-white">{char.powerLevel || 0}</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          (char.powerLevel || 0) >= 90 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                          (char.powerLevel || 0) >= 75 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                          (char.powerLevel || 0) >= 50 ? 'bg-gradient-to-r from-yellow-500 to-green-500' :
                          'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${char.powerLevel || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-cyan-400 mt-1 line-clamp-1">{char.powerType || 'Unknown Power'}</p>
                  </div>

                  {/* Statistics */}
                  {(() => {
                    const statistics = char.statistics && char.statistics.length > 0 
                      ? char.statistics 
                      : [
                          { name: 'Combat', value: 50 },
                          { name: 'Intelligence', value: 50 },
                          { name: 'Leadership', value: 50 },
                          { name: 'Resilience', value: 50 }
                        ];
                    
                    return (
                      <div className="mb-4">
                        <div className="grid grid-cols-2 gap-1">
                          {statistics.slice(0, 4).map((stat, index) => (
                            <div key={index} className="flex items-center justify-between px-2 py-1 bg-gray-700/30 rounded text-xs">
                              <span className="text-gray-400 truncate">{stat.name}</span>
                              <div className="flex items-center space-x-1">
                                <span className="text-white font-medium">{stat.value}</span>
                                <div className="w-6 bg-gray-600/50 rounded-full h-0.5">
                                  <div
                                    className={`h-0.5 rounded-full ${
                                      stat.value >= 80 ? 'bg-emerald-400' :
                                      stat.value >= 60 ? 'bg-blue-400' :
                                      stat.value >= 40 ? 'bg-yellow-400' :
                                      'bg-red-400'
                                    }`}
                                    style={{ width: `${stat.value}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Description Preview */}
                  <p className="text-gray-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                    {char.description || 'No description available.'}
                  </p>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{char.abilities?.length || 0} abilities</span>
                    <span>{char.relationships?.length || 0} relationships</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <CharacterForm
            character={editingChar}
            onSubmit={editingChar ? handleEdit : handleAdd}
            onClose={() => { setShowForm(false); setEditingChar(null); }}
          />
        )}
      </div>
    </div>
  );
};

export default CharacterAdmin;
