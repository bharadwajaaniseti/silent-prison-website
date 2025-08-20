import React, { useState, useEffect } from 'react';
import CharacterHub from './CharacterHub';
import { apiFetchCharacters, apiAddCharacter, apiDeleteCharacter, apiUpdateCharacter } from '../api/characters';
import { X, Save } from 'lucide-react';

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
    const updatedChar = await apiUpdateCharacter(editingChar.id, {
      ...charData,
      relationships: charData.relationships.split(',').map((r: string) => r.trim()).filter((r: string): boolean => !!r),
      abilities: charData.abilities.split(',').map((a: string) => a.trim()).filter((a: string): boolean => !!a),
    });
    setCharacters(prev => prev.map(c => c.id === editingChar.id ? updatedChar : c));
    setEditingChar(null);
    setShowForm(false);
  };
  const handleRemove = async (id: string) => {
    const success = await apiDeleteCharacter(id);
    if (success) setCharacters(prev => prev.filter(c => c.id !== id));
  };

  const CharacterForm: React.FC<{
    character?: any;
    onSubmit: (data: any) => void;
    onClose: () => void;
  }> = ({ character, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
      name: character?.name || '',
      title: character?.title || '',
      status: character?.status || '',
      affiliation: character?.affiliation || '',
      powerType: character?.powerType || '',
      powerLevel: character?.powerLevel || 0,
      image: character?.image || '',
      description: character?.description || '',
      background: character?.background || '',
      relationships: character?.relationships?.join(', ') || '',
      abilities: character?.abilities?.join(', ') || '',
    });
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      // You can replace this with your own upload logic (e.g., Supabase Storage)
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        ...formData,
  relationships: formData.relationships.split(',').map((r: string) => r.trim()).filter((r: string): boolean => !!r),
  abilities: formData.abilities.split(',').map((a: string) => a.trim()).filter((a: string): boolean => !!a),
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Image</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg" />
              {formData.image && <img src={formData.image} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg border" />}
              {uploading && <div className="text-blue-400 mt-2">Uploading...</div>}
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Relationships (comma separated)</label>
              <input type="text" value={formData.relationships} onChange={e => setFormData(prev => ({ ...prev, relationships: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Abilities (comma separated)</label>
              <input type="text" value={formData.abilities} onChange={e => setFormData(prev => ({ ...prev, abilities: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500" />
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
    <div>
      <button onClick={() => { setEditingChar(null); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">Add Character</button>
      {showForm && (
        <CharacterForm
          character={editingChar}
          onSubmit={editingChar ? handleEdit : handleAdd}
          onClose={() => { setShowForm(false); setEditingChar(null); }}
        />
      )}
      <CharacterHub characters={characters} />
      <ul className="mt-4">
        {characters.map(char => (
          <li key={char.id} className="flex items-center gap-2 mb-2">
            <span>{char.name}</span>
            <button onClick={() => { setEditingChar(char); setShowForm(true); }} className="text-blue-400">Edit</button>
            <button onClick={() => handleRemove(char.id)} className="text-red-400">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CharacterAdmin;
