import React, { useState } from 'react';
import { Archive, ChevronDown, ChevronRight, Search, Filter, Zap, Users, Globe, Clock } from 'lucide-react';

const LoreArchive: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loreCategories = [
    { id: 'all', name: 'All Categories', icon: Archive },
    { id: 'factions', name: 'Factions', icon: Users },
    { id: 'powers', name: 'Power Systems', icon: Zap },
    { id: 'continents', name: 'Continents', icon: Globe },
    { id: 'events', name: 'Historical Events', icon: Clock },
  ];

  const loreData = [
    {
      id: 'architects',
      category: 'factions',
      title: 'The Architects',
      summary: 'Mysterious beings who orchestrated the Moon\'s destruction',
      content: `The Architects remain one of the greatest mysteries of Tenjiku. These enigmatic entities are believed to be the architects of the Silent Prison itself, having orchestrated the Moon's destruction to trap the world in its current state.

      Very little is known about their true nature or motivations. Some scholars theorize they were once human, while others believe they are extradimensional beings drawn to Tenjiku by the concentration of nightmare energy.

      What is certain is their immense power and their apparent goal of maintaining the current order through their network of Guardians and the Guild system.`,
      tags: ['mysterious', 'powerful', 'antagonists']
    },
    {
      id: 'void-manipulation',
      category: 'powers',
      title: 'Void Manipulation',
      summary: 'The rare ability to control the space between reality',
      content: `Void Manipulation is one of the rarest and most dangerous awakened abilities in Tenjiku. Practitioners, known as Void Walkers, can manipulate the empty space between matter and energy, effectively controlling nothingness itself.

      This power manifests in various ways:
      - Void Rifts: Tears in reality that can transport matter instantly
      - Null Fields: Areas where other powers are completely suppressed  
      - Reality Erasure: The ability to temporarily remove objects from existence
      - Dimensional Anchoring: Preventing teleportation and dimensional abilities

      The psychological toll of channeling void energy is immense, as practitioners must regularly interface with true nothingness, leading many to develop a detached, nihilistic worldview.`,
      tags: ['rare', 'dangerous', 'spatial', 'psychological-effects']
    },
    {
      id: 'oris',
      category: 'continents',
      title: 'Oris - The Fractured Crown',
      summary: 'Central continent and seat of Guardian power',
      content: `Oris stands as the political and military heart of Tenjiku, dominated by the massive Guardian Citadel that rises like a black spear into the perpetually clouded sky. The continent is characterized by its crystalline formations and floating islands held aloft by residual lunar energy.

      Key Locations:
      - Guardian Citadel: The primary stronghold of the Architects' forces
      - The Shattered Plaza: Site of the first awakening event
      - Crystal Gardens: Fields of lunar crystal that amplify nightmare energy
      - The Undermarch: Underground resistance networks

      The population lives under strict Guardian oversight, with awakened individuals either recruited into service or monitored constantly. Despite the oppression, Oris maintains the highest standard of living in Tenjiku, leading many to accept the bargain of safety for freedom.`,
      tags: ['central', 'political', 'guardian-controlled', 'crystals']
    },
    {
      id: 'moon-destruction',
      category: 'events',
      title: 'The Moon\'s Destruction',
      summary: 'The cataclysmic event that changed everything',
      content: `On the night that would become known as the Silent Convergence, Tenjiku's moon was shattered by forces still not fully understood. The event released massive waves of nightmare energy across the world, fundamentally altering the nature of reality itself.

      Immediate Effects:
      - Spontaneous awakening of latent psychic abilities in 30% of the population
      - Manifestation of nightmare entities from collective unconscious
      - Disruption of natural day/night cycles
      - Creation of the Silent Prison dimensional barrier

      Long-term Consequences:
      - Establishment of the Guardian system
      - Rise of the Architect hierarchy
      - Formation of resistance movements
      - Ongoing dimensional instability

      Many believe the destruction was intentional, designed to trap Tenjiku's population in a controllable state between dreams and reality.`,
      tags: ['catastrophic', 'mysterious', 'world-changing', 'nightmare-energy']
    }
  ];

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredLore = loreData.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 lg:ml-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-orbitron text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            The Lore Archive
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Delve deep into the mysteries of Tenjiku, from ancient powers to the architects of reality itself
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search the archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {loreCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-blue-400'
                }`}
              >
                <category.icon size={16} />
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lore Entries */}
        <div className="space-y-6">
          {filteredLore.map(entry => (
            <div
              key={entry.id}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300"
            >
              <button
                onClick={() => toggleSection(entry.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    {loreCategories.find(cat => cat.id === entry.category)?.icon && 
                      React.createElement(loreCategories.find(cat => cat.id === entry.category)!.icon, { size: 24, className: "text-white" })
                    }
                  </div>
                  <div className="text-left">
                    <h3 className="font-orbitron text-xl font-bold text-blue-300 mb-1">
                      {entry.title}
                    </h3>
                    <p className="text-gray-400">{entry.summary}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {expandedSections[entry.id] ? 
                    <ChevronDown className="text-blue-400" size={20} /> : 
                    <ChevronRight className="text-gray-400" size={20} />
                  }
                </div>
              </button>
              
              {expandedSections[entry.id] && (
                <div className="px-6 pb-6 border-t border-gray-700">
                  <div className="pt-6">
                    <div className="prose prose-lg max-w-none text-gray-300">
                      {entry.content.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="mb-4 leading-relaxed">
                          {paragraph.trim()}
                        </p>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-700">
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full hover:bg-blue-600/20 hover:text-blue-400 transition-colors cursor-pointer"
                            onClick={() => setSearchTerm(tag)}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredLore.length === 0 && (
          <div className="text-center py-16">
            <Archive className="mx-auto mb-4 text-gray-600" size={64} />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No entries found</h3>
            <p className="text-gray-500">Try adjusting your search terms or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoreArchive;