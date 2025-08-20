import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronRight, Calendar, Zap } from 'lucide-react';

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

interface TimelineProps {
  events?: TimelineEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [selectedEra, setSelectedEra] = useState('all');

  // Use events prop if provided, else fallback to default
  const defaultEvents = [
    {
      id: 'ancient-era',
      era: 'ancient',
      year: 'Pre-History',
      title: 'The Age of Harmony',
      type: 'era',
      summary: 'Before the Convergence, when Tenjiku existed in balance',
      details: `The ancient world of Tenjiku was a place of natural harmony, where the three moons - Luna, Nox, and Astrum - maintained perfect balance over the world's psychic energies. 

      During this time, human civilization flourished across five major continents, with advanced technology that worked in harmony with natural forces. The people possessed latent psychic abilities but these were subtle, manifesting mainly as enhanced intuition and empathy.

      Archaeological evidence suggests the existence of the "Dreamwalker Councils" - governing bodies that used collective consciousness to make decisions for entire communities. The architecture of this period shows impossible geometries that could only be maintained through psychic manipulation of matter.`,
      impact: 'Foundation of modern Tenjiku culture and psychic potential'
    },
    {
      id: 'first-signs',
      era: 'pre-convergence',
      year: '3 years before Convergence',
      title: 'The Stellar Alignment Anomaly',
      type: 'warning',
      summary: 'Astronomers detect unusual gravitational fluctuations around Luna',
      details: `Dr. Elena Voss, chief astronomer of the Oris Observatory, first documented the anomalous readings that would later be recognized as the beginning of the end. Luna's orbital pattern began showing micro-variations that defied all known physics.

      The anomaly manifested as brief "flickers" where Luna would appear to phase partially out of reality for nanoseconds. These events coincided with reports of vivid nightmares across the population and a 300% increase in spontaneous psychic manifestations.

      Government officials dismissed the reports as mass hysteria, but underground research groups began preparing for what they termed "The Great Dreaming" - a catastrophic merging of conscious and unconscious reality.`,
      impact: 'First documented evidence of dimensional instability'
    },
    {
      id: 'convergence',
      era: 'convergence',
      year: 'Year 0 - The Silent Convergence',
      title: 'The Moon\'s Destruction',
      type: 'catastrophe',
      summary: 'Luna is shattered, releasing nightmare energy across Tenjiku',
      details: `At exactly 11:47 PM local time across all continents simultaneously, Luna exploded in a cascade of silver light that turned the night sky into day for exactly 7 minutes and 33 seconds. The explosion was silent - no sound reached Tenjiku despite the massive visual spectacle.

      The moon's destruction released concentrated nightmare energy that had been building in Luna's core for millennia. This energy spread across Tenjiku like an invisible tide, fundamentally altering the quantum structure of reality itself.

      Immediate effects included:
      - Spontaneous awakening of psychic abilities in 30% of the population
      - Manifestation of nightmare entities from the collective unconscious
      - Creation of the Silent Prison - dimensional barriers trapping Tenjiku
      - Complete disruption of natural day/night cycles

      The remaining two moons, Nox and Astrum, began exhibiting erratic behavior, with Nox turning blood red and Astrum becoming translucent.`,
      impact: 'Complete transformation of Tenjiku\'s reality'
    },
    {
      id: 'chaos-period',
      era: 'post-convergence',
      year: 'Years 0-2 - The Chaos Period',
      title: 'The Nightmare Wars',
      type: 'conflict',
      summary: 'Widespread chaos as nightmare entities invade reality',
      details: `In the immediate aftermath of the Convergence, Tenjiku descended into chaos as nightmare entities began manifesting physically in the world. These creatures, born from humanity's collective fears and traumas, possessed reality-warping abilities that made conventional weapons useless.

      The newly awakened psychics found themselves humanity's only defense, but most were untrained and unstable. Many lost their sanity attempting to fight creatures that fed on fear itself. Entire cities were consumed by "Fear Storms" - areas where concentrated terror created self-sustaining nightmare manifestations.

      Major battles during this period:
      - The Siege of New Astrum: 40,000 casualties as dream-spiders consumed the city
      - The Void Battle of Askar: First recorded use of coordinated psychic warfare
      - The Last Stand at Mistveil: Where the legendary Zara Stormwind first appeared

      By the end of Year 2, the human population had decreased by approximately 40%, with entire regions abandoned to nightmare control.`,
      impact: 'Near-extinction of human civilization'
    },
    {
      id: 'guardian-rise',
      era: 'post-convergence',
      year: 'Year 3-5 - The Guardian Emergence',
      title: 'Rise of the Guardian Order',
      type: 'organization',
      summary: 'The Architects establish the Guardian system to restore order',
      details: `From the chaos emerged the mysterious figures known only as the Architects. These beings, possessing power far beyond any awakened human, began systematically reclaiming territory from the nightmare entities.

      The Architects established the Guardian Order, recruiting the most powerful and stable awakened individuals to serve as humanity's protectors. The Guardian system was built on three pillars:
      - Absolute loyalty to the Architect hierarchy
      - Strict control over awakened abilities through Guild regulation
      - Protection of human settlements through contained zones

      The Guardians proved remarkably effective, using coordinated psychic warfare and advanced technology to push back the nightmare incursions. However, their methods were harsh - any awakened individual who refused to join the system was branded a "Rogue" and hunted.

      Major achievements:
      - Reclamation of Oris and establishment of the Guardian Citadel
      - Creation of the Nightmare Containment Protocols
      - Development of psychic amplification technology
      - Stabilization of dimensional barriers around major population centers`,
      impact: 'Establishment of current world order'
    },
    {
      id: 'resistance',
      era: 'modern',
      year: 'Year 8-12 - The Liberation Movement',
      title: 'Birth of the Resistance',
      type: 'rebellion',
      summary: 'Opposition groups form to challenge Guardian authority',
      details: `As Guardian control solidified, many awakened individuals began questioning the cost of their protection. Reports of Guardian experiments on captured rogues, forced conscription of children showing psychic potential, and the mysterious disappearances of those who asked too many questions sparked underground resistance.

      The Liberation Front emerged from these concerns, led by former Guardians who had witnessed the true nature of the Architect regime. Their goals included:
      - Liberation of awakened individuals from forced service
      - Investigation into the Architects' true nature and motivations
      - Discovery of methods to break the dimensional barriers of the Silent Prison
      - Protection of free awakened communities

      Key figures in the early resistance:
      - Marcus "Void-Eye" Chen: Former Guardian who exposed the Nightmare Farming operations
      - Sarah Nightwhisper: Pioneer of untraceable psychic communication networks
      - The Storm Walker: Mysterious figure later identified as Zara Stormwind

      The resistance operated in small, isolated cells to avoid detection, using pre-Convergence technology and unconventional psychic techniques to stay hidden.`,
      impact: 'Challenge to Guardian monopoly on power'
    },
    {
      id: 'current-day',
      era: 'modern',
      year: 'Year 15 - Present Day',
      title: 'The Silent Prison Endures',
      type: 'ongoing',
      summary: 'Current state of Tenjiku under the continued rule of the Architects',
      details: `Fifteen years after the Convergence, Tenjiku remains trapped in the Silent Prison with no visible means of escape. The Guardian system has evolved into a complex bureaucracy that controls every aspect of awakened life, while the resistance continues to operate in the shadows.

      Current situation:
      - Approximately 60% of the population lives in Guardian-protected zones
      - Nightmare incursions continue but are contained through regular "managed breaches"
      - New awakenings occur at a rate of roughly 1,000 per year across all continents
      - The true nature of the Architects remains unknown
      - Several resistance cells have gone silent, suggesting either capture or worse

      Recent developments include increased Guardian patrols, new restrictions on travel between continents, and disturbing reports of "something stirring" in the ruins of Luna's fragments that now orbit Tenjiku as a ring of debris.

      The question remains: Is the Guardian system truly protecting humanity, or are they complicit in maintaining a prison from which there may be no escape?`,
      impact: 'Ongoing struggle for freedom and truth'
    }
  ];
  const eventList = events || defaultEvents;

  const eras = [
    { id: 'all', name: 'All Events', icon: Clock },
    { id: 'ancient', name: 'Ancient Era', icon: Calendar },
    { id: 'pre-convergence', name: 'Pre-Convergence', icon: Calendar },
    { id: 'convergence', name: 'The Convergence', icon: Zap },
    { id: 'post-convergence', name: 'Post-Convergence', icon: Calendar },
    { id: 'modern', name: 'Modern Era', icon: Calendar },
  ];

  const toggleEvent = (id: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredEvents = eventList.filter(event => 
    selectedEra === 'all' || event.era === selectedEra
  );

  const getEventColor = (type: string) => {
    switch (type) {
      case 'era': return 'from-blue-500 to-blue-600';
      case 'warning': return 'from-yellow-500 to-yellow-600';
      case 'catastrophe': return 'from-red-500 to-red-600';
      case 'conflict': return 'from-orange-500 to-orange-600';
      case 'organization': return 'from-green-500 to-green-600';
      case 'rebellion': return 'from-purple-500 to-purple-600';
      case 'ongoing': return 'from-gray-500 to-gray-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'catastrophe': return '💥';
      case 'conflict': return '⚔️';
      case 'organization': return '🏛️';
      case 'rebellion': return '✊';
      case 'warning': return '⚠️';
      case 'ongoing': return '🔄';
      default: return '📅';
    }
  };

  return (
    <div className="min-h-screen text-gray-100 lg:ml-20">
      <div className="max-w-6xl mx-auto px-6 pt-[4.5rem] pb-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-orbitron text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Chronicles of Tenjiku
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Trace the timeline from the ancient harmonious era through the catastrophic Convergence to the modern struggle for freedom
          </p>
        </div>

        {/* Era Filter */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {eras.map(era => (
            <button
              key={era.id}
              onClick={() => setSelectedEra(era.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all duration-300 ${
                selectedEra === era.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-blue-400'
              }`}
            >
              <era.icon size={16} />
              <span>{era.name}</span>
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-red-500"></div>

          {/* Timeline Events */}
          <div className="space-y-8">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start space-x-6">
                {/* Timeline Marker */}
                <div className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-br ${getEventColor(event.type)} border-4 border-gray-900 flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl">{getEventIcon(event.type)}</span>
                </div>

                {/* Event Content */}
                <div className="flex-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300">
                  <button
                    onClick={() => toggleEvent(event.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-mono text-blue-400 bg-blue-400/20 px-2 py-1 rounded">
                          {event.year}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getEventColor(event.type)} text-white`}>
                          {event.type.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-orbitron text-2xl font-bold text-blue-300 mb-2">
                        {event.title}
                      </h3>
                      <p className="text-gray-400 text-lg">{event.summary}</p>
                    </div>
                    
                    <div className="ml-4">
                      {expandedEvents[event.id] ? 
                        <ChevronDown className="text-blue-400" size={24} /> : 
                        <ChevronRight className="text-gray-400" size={24} />
                      }
                    </div>
                  </button>

                  {expandedEvents[event.id] && (
                    <div className="px-6 pb-6 border-t border-gray-700">
                      <div className="pt-6">
                        <div className="prose prose-lg max-w-none text-gray-300 mb-6">
                          {event.details.split('\n\n').map((paragraph, pIndex) => (
                            <div key={pIndex} className="mb-4">
                              {paragraph.includes(':') && paragraph.split('\n').length > 1 ? (
                                <div>
                                  <p className="font-semibold text-blue-300 mb-2">
                                    {paragraph.split('\n')[0]}
                                  </p>
                                  <ul className="list-disc list-inside space-y-1 text-gray-400 ml-4">
                                    {paragraph.split('\n').slice(1).map((item, iIndex) => (
                                      item.trim() && <li key={iIndex}>{item.trim().replace(/^- /, '')}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="leading-relaxed">{paragraph.trim()}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <h4 className="font-orbitron font-bold text-blue-300 mb-2">Historical Impact</h4>
                          <p className="text-gray-300">{event.impact}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Summary */}
        <div className="mt-16 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-8 border border-blue-500/30">
          <h2 className="font-orbitron text-3xl font-bold text-center mb-6 text-blue-300">
            The Story Continues...
          </h2>
          <p className="text-xl text-gray-300 text-center leading-relaxed max-w-4xl mx-auto">
            Fifteen years after the Convergence, the people of Tenjiku remain trapped in the Silent Prison. 
            The struggle between freedom and security, between the known dangers of the past and the uncertain hope of the future, 
            continues to shape every decision made in this fractured world.
          </p>
          <div className="text-center mt-6">
            <span className="text-blue-400 font-orbitron text-lg">
              What role will you play in the chronicles yet to be written?
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;