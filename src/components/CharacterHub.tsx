import React, { useState, useEffect } from 'react';
import { Users, Search, Zap, Heart, Skull, Eye, AlertTriangle } from 'lucide-react';
import { apiFetchCharacters } from '../api/characters';

interface Character {
  id: string;
  name: string;
  title: string;
  status: string;
  affiliation: string;
  powerType: string;
  powerLevel: number;
  image: string;
  description: string;
  background: string;
  relationships: { name: string; type: string; status: string }[];
  abilities: string[];
  statistics?: { name: string; value: number }[];
}

interface CharacterHubProps {
  characters?: Character[];
}

const CharacterHub: React.FC<CharacterHubProps> = ({ characters }) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadedCharacters, setLoadedCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load characters from API if no characters prop provided
  useEffect(() => {
    if (!characters) {
      setIsLoading(true);
      apiFetchCharacters()
        .then((apiCharacters) => {
          setLoadedCharacters(apiCharacters);
        })
        .catch((error) => {
          console.error('Error loading characters from API:', error);
          setLoadedCharacters([]); // Will fall back to default characters
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [characters]);

  // Default characters data
  const defaultCharacters = [
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
        'Void Rifts | Create tears in space for instant travel across dimensions',
        'Null Fields | Suppress other awakened abilities within a large radius',
        'Reality Anchor | Prevent dimensional manipulation and spatial distortions',
        'Void Strike | Erase matter from existence temporarily with focused energy'
      ],
      statistics: [
        { name: 'Combat Skill', value: 88 },
        { name: 'Intelligence', value: 86 },
        { name: 'Leadership', value: 94 },
        { name: 'Emotional Resilience', value: 89 },
        { name: 'Stealth', value: 75 },
        { name: 'Social Skills', value: 82 }
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
        'Dream Walking | Enter others\' dreams and nightmares to gather information',
        'Memory Weaving | Implant or extract memories with precise control',
        'Collective Unconscious Access | Tap into shared dreams and ancient knowledge',
        'Nightmare Shields | Protect minds from psychic attacks and mental intrusion'
      ],
      statistics: [
        { name: 'Combat Skill', value: 65 },
        { name: 'Intelligence', value: 95 },
        { name: 'Leadership', value: 70 },
        { name: 'Emotional Resilience', value: 72 },
        { name: 'Stealth', value: 88 },
        { name: 'Social Skills', value: 78 }
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
        'Molecular Metal Control | Reshape metal at atomic level with perfect precision',
        'Iron Blood | Transform body parts into living metal for enhanced combat',
        'Magnetic Fields | Control electromagnetic forces and metal projectiles',
        'Metal Storm | Launch devastating metal projectile attacks in all directions'
      ],
      statistics: [
        { name: 'Combat Skill', value: 96 },
        { name: 'Intelligence', value: 78 },
        { name: 'Leadership', value: 90 },
        { name: 'Emotional Resilience', value: 84 },
        { name: 'Stealth', value: 65 },
        { name: 'Social Skills', value: 72 }
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
        'Storm Calling | Summon powerful weather systems across vast areas',
        'Lightning Avatar | Transform into living electricity and pure energy',
        'Wind Walking | Fly on currents of air with incredible speed and grace',
        'Pressure Control | Manipulate atmospheric pressure to devastating effect'
      ],
      statistics: [
        { name: 'Combat Skill', value: 98 },
        { name: 'Intelligence', value: 82 },
        { name: 'Leadership', value: 85 },
        { name: 'Emotional Resilience', value: 95 },
        { name: 'Stealth', value: 88 },
        { name: 'Social Skills', value: 60 }
      ]
    }
  ];

  // Use characters prop if provided, else use loaded characters, else fallback to default
  const displayCharacters = characters || (loadedCharacters.length > 0 ? loadedCharacters : defaultCharacters);

  const statusFilters = [
    { id: 'all', name: 'All Characters', icon: Users },
    { id: 'alive', name: 'Alive', icon: Heart },
    { id: 'deceased', name: 'Deceased', icon: Skull },
    { id: 'unknown', name: 'Unknown', icon: Eye },
    { id: 'nightmare', name: 'Nightmare', icon: AlertTriangle },
  ];

  const filteredCharacters = displayCharacters.filter(character => {
    const matchesStatus = filterStatus === 'all' || character.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.affiliation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.powerType.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const selectedChar = displayCharacters.find(c => c.id === selectedCharacter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'alive': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'deceased': return 'text-rose-400 bg-rose-400/10 border-rose-400/30';
      case 'unknown': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'nightmare': return 'text-violet-400 bg-violet-400/10 border-violet-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getPowerLevelColor = (level: number) => {
    if (level >= 90) return 'from-red-500 via-orange-500 to-yellow-500';
    if (level >= 75) return 'from-orange-500 via-yellow-500 to-green-500';
    if (level >= 50) return 'from-yellow-500 via-green-500 to-cyan-500';
    return 'from-cyan-500 via-blue-500 to-purple-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-purple-900/10 text-gray-100 lg:ml-20">
      <div className="max-w-7xl mx-auto px-6 pt-[4.5rem] pb-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-orbitron text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            Character Codex
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover the heroes, villains, and complex figures that shape the world of Tenjiku
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search characters by name, title, affiliation, or power..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 text-gray-100 placeholder-gray-400"
            />
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2">
            {statusFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                className={`flex items-center space-x-3 px-6 py-4 rounded-2xl whitespace-nowrap transition-all duration-300 transform hover:scale-105 font-medium ${
                  filterStatus === filter.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-500/50'
                    : 'bg-gray-800/80 backdrop-blur-sm text-gray-400 hover:bg-gray-700/80 hover:text-cyan-400 border border-gray-700/50 hover:border-cyan-500/30'
                }`}
              >
                <filter.icon size={18} />
                <span>{filter.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Character List */}
          <div className="lg:col-span-1 space-y-4">
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-600 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-600 rounded-lg w-3/4 mb-3"></div>
                        <div className="h-4 bg-gray-600 rounded-lg w-1/2 mb-3"></div>
                        <div className="flex items-center space-x-2">
                          <div className="h-6 bg-gray-600 rounded-full w-16"></div>
                          <div className="h-4 bg-gray-600 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCharacters.length > 0 ? (
              filteredCharacters.map(character => (
              <div
                key={character.id}
                onClick={() => setSelectedCharacter(character.id)}
                className={`group bg-gray-800/60 backdrop-blur-sm border rounded-2xl p-6 cursor-pointer transition-all duration-500 hover:transform hover:scale-[1.02] hover:shadow-xl ${
                  selectedCharacter === character.id
                    ? 'border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/20'
                    : 'border-gray-700/50 hover:border-cyan-500/30 hover:bg-gray-800/80'
                }`}
              >
                <div className="flex items-center space-x-5">
                  <div className="relative">
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-gray-600 group-hover:border-cyan-500/50 transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-gray-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-orbitron font-bold text-xl text-cyan-300 group-hover:text-cyan-200 transition-colors">
                      {character.name}
                    </h3>
                    <p className="text-gray-400 text-base mb-3 group-hover:text-gray-300 transition-colors">{character.title}</p>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(character.status)}`}>
                        {character.status}
                      </span>
                      <span className="text-sm text-gray-500 bg-gray-700/50 px-3 py-1 rounded-full group-hover:bg-gray-600/50 transition-colors">
                        {character.affiliation}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-10 text-center">
                <Users className="mx-auto mb-6 text-gray-600" size={64} />
                <h3 className="text-2xl font-semibold text-gray-400 mb-3">No Characters Found</h3>
                <p className="text-gray-500 text-lg">No characters match your current filters.</p>
              </div>
            )}
          </div>

          {/* Character Detail */}
          <div className="lg:col-span-2">
            {selectedChar ? (
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-3xl overflow-hidden shadow-2xl">
                {/* Character Header */}
                <div className="relative h-80 bg-gradient-to-br from-cyan-900/30 via-blue-900/30 to-purple-900/30">
                  <img
                    src={selectedChar.image}
                    alt={selectedChar.name}
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <h2 className="font-orbitron text-4xl font-bold text-white mb-3 drop-shadow-lg">
                      {selectedChar.name}
                    </h2>
                    <p className="text-2xl text-cyan-300 mb-4 font-medium">{selectedChar.title}</p>
                    <div className="flex items-center space-x-4">
                      <span className={`px-4 py-2 rounded-full text-base font-medium border backdrop-blur-sm ${getStatusColor(selectedChar.status)}`}>
                        {selectedChar.status}
                      </span>
                      <span className="text-gray-200 bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full text-base">
                        {selectedChar.affiliation}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {/* Statistics */}
                  {(() => {
                    // Get statistics from character or use defaults
                    const statistics = selectedChar.statistics && selectedChar.statistics.length > 0 
                      ? selectedChar.statistics 
                      : [
                          { name: 'Combat Skill', value: 75 },
                          { name: 'Intelligence', value: 80 },
                          { name: 'Leadership', value: 65 },
                          { name: 'Emotional Resilience', value: 70 },
                          { name: 'Stealth', value: 60 },
                          { name: 'Social Skills', value: 72 }
                        ];
                    
                    return statistics.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3 text-cyan-300">Statistics</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {statistics.map((stat, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-700/20 rounded-lg border border-gray-600/20">
                              <span className="text-sm text-gray-300">{stat.name}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-white">{stat.value}</span>
                                <div className="w-12 bg-gray-700/50 rounded-full h-1">
                                  <div
                                    className={`h-1 rounded-full ${
                                      stat.value >= 90 ? 'bg-emerald-500' :
                                      stat.value >= 75 ? 'bg-blue-500' :
                                      stat.value >= 50 ? 'bg-yellow-500' :
                                      'bg-red-500'
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

                  {/* Power Level */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-300 text-lg">Power Level</span>
                      <span className="text-3xl font-bold text-white">{selectedChar.powerLevel}</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full bg-gradient-to-r ${getPowerLevelColor(selectedChar.powerLevel)} transition-all duration-1000 shadow-lg`}
                        style={{ width: `${selectedChar.powerLevel}%` }}
                      />
                    </div>
                    <p className="text-base text-cyan-400 mt-3 flex items-center">
                      <Zap size={20} className="inline mr-2" />
                      {selectedChar.powerType}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="mb-8">
                    <h3 className="font-orbitron font-bold text-2xl mb-4 text-cyan-300">Overview</h3>
                    <p className="text-gray-300 leading-relaxed text-lg">{selectedChar.description}</p>
                  </div>

                  {/* Background */}
                  <div className="mb-8">
                    <h3 className="font-orbitron font-bold text-2xl mb-4 text-cyan-300">Background</h3>
                    <div className="text-gray-300 leading-relaxed space-y-4 text-lg">
                      {selectedChar.background.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph.trim()}</p>
                      ))}
                    </div>
                  </div>

                  {/* Abilities */}
                  <div className="mb-8">
                    <h3 className="font-orbitron font-bold text-2xl mb-4 text-cyan-300">Abilities</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedChar.abilities.map((ability, index) => {
                        const [abilityName, abilityDescription] = ability.includes(' | ') 
                          ? ability.split(' | ').map(s => s.trim()) 
                          : [ability, ''];
                        
                        return (
                          <div key={index} className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30 hover:border-purple-500/30 transition-all duration-300">
                            <h4 className="font-semibold text-purple-300 text-lg mb-2">{abilityName}</h4>
                            {abilityDescription && (
                              <p className="text-gray-400 text-sm leading-relaxed">{abilityDescription}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Relationships */}
                  <div>
                    <h3 className="font-orbitron font-bold text-2xl mb-4 text-cyan-300">Relationships</h3>
                    <div className="space-y-4">
                      {selectedChar.relationships.map((rel, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700/20 backdrop-blur-sm rounded-xl p-5 border border-gray-600/30 hover:border-cyan-500/30 transition-all duration-300">
                          <div>
                            <p className="font-semibold text-gray-200 text-lg">{rel.name}</p>
                            <p className="text-gray-400 text-base">{rel.type}</p>
                          </div>
                          <span className="text-cyan-400 font-medium bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">
                            {rel.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl h-96 flex items-center justify-center">
                <div className="text-center">
                  <Users className="mx-auto mb-6 text-gray-600" size={80} />
                  <h3 className="text-2xl font-semibold text-gray-400 mb-3">Select a Character</h3>
                  <p className="text-gray-500 text-lg">Choose a character from the list to view their detailed profile</p>
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