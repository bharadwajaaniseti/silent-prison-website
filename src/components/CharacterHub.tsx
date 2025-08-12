import React, { useState } from 'react';
import { Users, Search, Filter, Zap, Heart, Skull, Eye, AlertTriangle } from 'lucide-react';

const CharacterHub: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const characters = [
    {
      id: 'kael',
      name: 'Kael Vorthak',
      title: 'The Void Walker',
      status: 'alive',
      affiliation: 'Liberators',
      powerType: 'Void Manipulation',
      powerLevel: 85,
      image: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'A former Guardian who awakened to void manipulation abilities after witnessing the true horror of the Silent Prison. Now leads a cell of the Liberation Front.',
      background: `Born in the outer districts of Oris, Kael was recruited into the Guardian ranks at age 16 due to his tactical brilliance. For three years, he served faithfully, believing he was protecting innocent people from nightmare incursions.

      Everything changed during the Ashfall Incident, when he discovered that the Guardians were intentionally allowing controlled nightmare breaches to maintain fear and compliance among the population. His horror at this revelation triggered his awakening to void manipulation.

      Now 23, Kael leads covert operations against Guardian installations while searching for a way to break the dimensional barriers that trap Tenjiku in the Silent Prison. His ability to manipulate void space makes him one of the most dangerous individuals to the Architect regime.`,
      relationships: [
        { name: 'Lyra Nightwhisper', type: 'Ally/Love Interest', status: 'Strong Bond' },
        { name: 'Commander Thorne', type: 'Former Superior', status: 'Enemy' },
        { name: 'Zara Stormwind', type: 'Mentor', status: 'Deceased' }
      ],
      abilities: [
        'Void Rifts - Create tears in space for instant travel',
        'Null Fields - Suppress other awakened abilities',
        'Reality Anchor - Prevent dimensional manipulation',
        'Void Strike - Erase matter from existence temporarily'
      ]
    },
    {
      id: 'lyra',
      name: 'Lyra Nightwhisper',
      title: 'The Dreamweaver',
      status: 'alive',
      affiliation: 'Liberators',
      powerType: 'Dream Manipulation',
      powerLevel: 78,
      image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'A powerful dreamweaver who can enter and manipulate the collective unconscious. Partner to Kael and intelligence specialist for the resistance.',
      background: `Lyra\'s awakening came not through trauma but through deep meditation in the ancient ruins beneath Mistveil. Her connection to the collective unconscious allows her to navigate the dream-realm that borders the Silent Prison.

      Before her awakening, she was a historian studying pre-Convergence artifacts. Her research into the old world\'s connection to dream energy led her to uncover suppressed knowledge about the true nature of the Architects.

      Her ability to enter the dreams of others makes her invaluable for intelligence gathering, but the constant exposure to nightmare energy has begun to blur the lines between dreams and reality for her.`,
      relationships: [
        { name: 'Kael Vorthak', type: 'Partner/Love Interest', status: 'Strong Bond' },
        { name: 'Elder Mirin', type: 'Teacher', status: 'Neutral' },
        { name: 'The Nightmare Court', type: 'Antagonistic', status: 'Hunted' }
      ],
      abilities: [
        'Dream Walking - Enter others\' dreams and nightmares',
        'Memory Weaving - Implant or extract memories',
        'Collective Unconscious Access - Tap into shared dreams',
        'Nightmare Shields - Protect minds from psychic attacks'
      ]
    },
    {
      id: 'thorne',
      name: 'Commander Thorne',
      title: 'The Iron Fist',
      status: 'alive',
      affiliation: 'Guardians',
      powerType: 'Metal Manipulation',
      powerLevel: 92,
      image: 'https://images.pexels.com/photos/1121796/pexels-photo-1121796.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'A ruthless Guardian commander who views the current order as necessary for humanity\'s survival, regardless of the cost in freedom.',
      background: `Commander Thorne was one of the first to awaken after the Moon\'s destruction, gaining the ability to manipulate metal at a molecular level. His rapid rise through Guardian ranks was built on unwavering loyalty to the Architect vision and brutal efficiency in suppressing dissent.

      Unlike many Guardians who joined for personal power, Thorne genuinely believes that the strict control imposed by the Architects is the only thing preventing total chaos. He has witnessed firsthand the devastation that uncontrolled nightmare incursions can cause.

      His pursuit of former subordinate Kael has become personal, viewing Kael\'s defection as the ultimate betrayal of everything they once fought to protect.`,
      relationships: [
        { name: 'Kael Vorthak', type: 'Former Subordinate', status: 'Hunted Enemy' },
        { name: 'The Architects', type: 'Superior', status: 'Loyal Servant' },
        { name: 'Captain Reis', type: 'Subordinate', status: 'Trusted Lieutenant' }
      ],
      abilities: [
        'Molecular Metal Control - Reshape metal at atomic level',
        'Iron Blood - Transform body parts into living metal',
        'Magnetic Fields - Control electromagnetic forces',
        'Metal Storm - Launch devastating metal projectile attacks'
      ]
    },
    {
      id: 'zara',
      name: 'Zara Stormwind',
      title: 'The Lightning Saint',
      status: 'deceased',
      affiliation: 'Independent',
      powerType: 'Weather Control',
      powerLevel: 95,
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'A legendary figure who refused to bow to either Guardians or Liberators, believing that true freedom required individual strength rather than collective action.',
      background: `Zara Stormwind was perhaps the most powerful awakened individual in Tenjiku\'s recorded history. Her mastery over weather patterns was so complete that she could create localized storms or bring rain to drought-stricken areas with a thought.

      She lived as a nomad after the Convergence, helping communities defend themselves from nightmare incursions while refusing to be drawn into the larger conflict between Guardians and Liberators. Her philosophy was that dependence on any organization, even well-intentioned ones, ultimately led to weakness.

      Her death during the Battle of the Fractured Skies remains controversial, with both sides claiming she died defending their cause. In truth, she died protecting civilians from both Guardian artillery and Liberator sabotage, staying true to her principles until the end.`,
      relationships: [
        { name: 'Kael Vorthak', type: 'Student', status: 'Mentor (deceased)' },
        { name: 'Various Communities', type: 'Protector', status: 'Legendary' },
        { name: 'The Storm Spirits', type: 'Mystical Connection', status: 'Unknown' }
      ],
      abilities: [
        'Storm Calling - Summon powerful weather systems',
        'Lightning Avatar - Transform into living electricity',
        'Wind Walking - Fly on currents of air',
        'Pressure Control - Manipulate atmospheric pressure'
      ]
    }
  ];

  const statusFilters = [
    { id: 'all', name: 'All Characters', icon: Users },
    { id: 'alive', name: 'Alive', icon: Heart },
    { id: 'deceased', name: 'Deceased', icon: Skull },
    { id: 'unknown', name: 'Unknown', icon: Eye },
    { id: 'nightmare', name: 'Nightmare', icon: AlertTriangle },
  ];

  const filteredCharacters = characters.filter(character => {
    const matchesStatus = filterStatus === 'all' || character.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.affiliation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.powerType.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const selectedChar = characters.find(c => c.id === selectedCharacter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'alive': return 'text-green-400 bg-green-400/20';
      case 'deceased': return 'text-red-400 bg-red-400/20';
      case 'unknown': return 'text-yellow-400 bg-yellow-400/20';
      case 'nightmare': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getPowerLevelColor = (level: number) => {
    if (level >= 90) return 'from-red-500 to-red-600';
    if (level >= 75) return 'from-orange-500 to-orange-600';
    if (level >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-blue-500 to-blue-600';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 lg:ml-20">
      <div className="max-w-7xl mx-auto px-6 pt-[4.5rem] pb-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-orbitron text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Character Codex
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Discover the heroes, villains, and complex figures that shape the world of Tenjiku
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statusFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all duration-300 ${
                  filterStatus === filter.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-blue-400'
                }`}
              >
                <filter.icon size={16} />
                <span>{filter.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Character List */}
          <div className="lg:col-span-1 space-y-4">
            {filteredCharacters.map(character => (
              <div
                key={character.id}
                onClick={() => setSelectedCharacter(character.id)}
                className={`bg-gray-800/50 backdrop-blur-sm border rounded-xl p-4 cursor-pointer transition-all duration-300 hover:transform hover:scale-105 ${
                  selectedCharacter === character.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-16 h-16 rounded-lg object-cover border-2 border-gray-600"
                  />
                  <div className="flex-1">
                    <h3 className="font-orbitron font-bold text-lg text-blue-300">
                      {character.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">{character.title}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(character.status)}`}>
                        {character.status}
                      </span>
                      <span className="text-xs text-gray-500">{character.affiliation}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Character Detail */}
          <div className="lg:col-span-2">
            {selectedChar ? (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
                {/* Character Header */}
                <div className="relative h-64 bg-gradient-to-br from-blue-900/50 to-purple-900/50">
                  <img
                    src={selectedChar.image}
                    alt={selectedChar.name}
                    className="w-full h-full object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <h2 className="font-orbitron text-3xl font-bold text-white mb-2">
                      {selectedChar.name}
                    </h2>
                    <p className="text-xl text-blue-300 mb-2">{selectedChar.title}</p>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedChar.status)}`}>
                        {selectedChar.status}
                      </span>
                      <span className="text-gray-300">{selectedChar.affiliation}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Power Level */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-300">Power Level</span>
                      <span className="text-2xl font-bold text-white">{selectedChar.powerLevel}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full bg-gradient-to-r ${getPowerLevelColor(selectedChar.powerLevel)} transition-all duration-1000`}
                        style={{ width: `${selectedChar.powerLevel}%` }}
                      />
                    </div>
                    <p className="text-sm text-blue-400 mt-2">
                      <Zap size={16} className="inline mr-1" />
                      {selectedChar.powerType}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="font-orbitron font-bold text-xl mb-3 text-blue-300">Overview</h3>
                    <p className="text-gray-300 leading-relaxed">{selectedChar.description}</p>
                  </div>

                  {/* Background */}
                  <div className="mb-6">
                    <h3 className="font-orbitron font-bold text-xl mb-3 text-blue-300">Background</h3>
                    <div className="text-gray-300 leading-relaxed space-y-3">
                      {selectedChar.background.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph.trim()}</p>
                      ))}
                    </div>
                  </div>

                  {/* Abilities */}
                  <div className="mb-6">
                    <h3 className="font-orbitron font-bold text-xl mb-3 text-blue-300">Abilities</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {selectedChar.abilities.map((ability, index) => (
                        <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                          <p className="text-sm text-gray-300">{ability}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Relationships */}
                  <div>
                    <h3 className="font-orbitron font-bold text-xl mb-3 text-blue-300">Relationships</h3>
                    <div className="space-y-3">
                      {selectedChar.relationships.map((rel, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700/30 rounded-lg p-3">
                          <div>
                            <p className="font-semibold text-gray-200">{rel.name}</p>
                            <p className="text-sm text-gray-400">{rel.type}</p>
                          </div>
                          <span className="text-sm text-blue-400">{rel.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl h-96 flex items-center justify-center">
                <div className="text-center">
                  <Users className="mx-auto mb-4 text-gray-600" size={64} />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a Character</h3>
                  <p className="text-gray-500">Choose a character from the list to view their detailed profile</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterHub;