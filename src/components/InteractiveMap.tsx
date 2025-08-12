import React, { useState } from 'react';
import { Map, ZoomIn, ZoomOut, Info, Navigation } from 'lucide-react';

const InteractiveMap: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const regions = [
    {
      id: 'oris',
      name: 'Oris',
      subtitle: 'The Fractured Crown',
      position: { x: 50, y: 40 },
      color: 'from-blue-500 to-blue-600',
      description: 'Central continent and seat of Guardian power, characterized by crystalline formations and floating islands.',
      keyLocations: ['Guardian Citadel', 'Shattered Plaza', 'Crystal Gardens'],
      population: '~2.3 million',
      threat: 'High Guardian Presence'
    },
    {
      id: 'askar',
      name: 'Askar',
      subtitle: 'The Burning Wastes',
      position: { x: 25, y: 60 },
      color: 'from-red-500 to-red-600',
      description: 'Desert continent where nightmare energy has crystallized into dangerous formations that amplify psychic abilities.',
      keyLocations: ['The Glass Citadel', 'Crimson Dunes', 'The Howling Spires'],
      population: '~800,000',
      threat: 'Extreme Nightmare Activity'
    },
    {
      id: 'duskar',
      name: 'Duskar',
      subtitle: 'The Twilight Realm',
      position: { x: 75, y: 30 },
      color: 'from-purple-500 to-purple-600',
      description: 'Perpetually shrouded in twilight, this continent exists partially in the dream realm.',
      keyLocations: ['The Umbral Gate', 'Whisper Valley', 'The Dreaming Spires'],
      population: '~1.1 million',
      threat: 'Reality Distortion'
    },
    {
      id: 'mistveil',
      name: 'Mistveil',
      subtitle: 'The Hidden Shores',
      position: { x: 30, y: 25 },
      color: 'from-teal-500 to-teal-600',
      description: 'Mysterious island continent cloaked in perpetual mist, rumored to hide pre-Convergence technology.',
      keyLocations: ['The Ancient Archive', 'Fog Harbor', 'The Sunken City'],
      population: '~500,000',
      threat: 'Unknown Entities'
    },
    {
      id: 'voidlands',
      name: 'The Voidlands',
      subtitle: 'The Shattered Expanse',
      position: { x: 60, y: 70 },
      color: 'from-gray-600 to-gray-700',
      description: 'A devastated region where reality itself has been torn apart by void energy, creating floating landmasses.',
      keyLocations: ['The Null Zone', 'Floating Ruins', 'The Event Horizon'],
      population: '~50,000 (estimated)',
      threat: 'Reality Breakdown'
    }
  ];

  const selectedRegionData = regions.find(r => r.id === selectedRegion);

  return (
    <div className="min-h-screen text-gray-100 lg:ml-20">
      <div className="max-w-7xl mx-auto px-6 pt-[4.5rem] pb-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-orbitron text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Map of Tenjiku
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Explore the fractured continents of a world trapped in the Silent Prison
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Interface */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
              {/* Map Controls */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Map className="text-blue-400" size={20} />
                  <span className="font-orbitron font-semibold">Interactive Map</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-sm text-gray-400 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>

              {/* Map Canvas */}
              <div className="relative h-96 lg:h-[500px] bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 overflow-hidden">
                {/* Background stars/particles */}
                <div className="absolute inset-0">
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-blue-400 opacity-20 rounded-full animate-pulse"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`
                      }}
                    />
                  ))}
                </div>

                {/* Region Markers */}
                <div 
                  className="relative w-full h-full transition-transform duration-300"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {regions.map(region => (
                    <div
                      key={region.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{ 
                        left: `${region.position.x}%`, 
                        top: `${region.position.y}%` 
                      }}
                      onClick={() => setSelectedRegion(region.id)}
                    >
                      {/* Region Circle */}
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${region.color} border-2 border-white/30 shadow-lg transition-all duration-300 group-hover:scale-125 ${
                        selectedRegion === region.id ? 'scale-125 ring-4 ring-blue-400/50' : ''
                      }`}>
                        <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white/80 rounded-full animate-pulse" />
                        </div>
                      </div>

                      {/* Region Label */}
                      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="bg-gray-800 px-3 py-1 rounded-lg border border-gray-600 whitespace-nowrap">
                          <p className="font-orbitron font-bold text-sm text-white">{region.name}</p>
                          <p className="text-xs text-gray-400">{region.subtitle}</p>
                        </div>
                      </div>

                      {/* Pulsing Effect */}
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${region.color} opacity-30 animate-ping`} />
                    </div>
                  ))}

                  {/* Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    <defs>
                      <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                    
                    {/* Example connection lines between regions */}
                    <line 
                      x1="50%" y1="40%" 
                      x2="25%" y2="60%" 
                      stroke="url(#connectionGradient)" 
                      strokeWidth="2" 
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    />
                    <line 
                      x1="50%" y1="40%" 
                      x2="75%" y2="30%" 
                      stroke="url(#connectionGradient)" 
                      strokeWidth="2" 
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    />
                    <line 
                      x1="30%" y1="25%" 
                      x2="50%" y2="40%" 
                      stroke="url(#connectionGradient)" 
                      strokeWidth="2" 
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    />
                  </svg>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-3">
                  <h4 className="font-orbitron font-bold text-sm mb-2">Legend</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Guardian Territory</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Nightmare Zone</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-1 bg-blue-400 opacity-50"></div>
                      <span>Trade Routes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Region Information Panel */}
          <div className="lg:col-span-1">
            {selectedRegionData ? (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
                <div className={`h-32 bg-gradient-to-br ${selectedRegionData.color} relative`}>
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h2 className="font-orbitron text-2xl font-bold">{selectedRegionData.name}</h2>
                    <p className="text-blue-200">{selectedRegionData.subtitle}</p>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {selectedRegionData.description}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-orbitron font-bold text-blue-300 mb-2">Key Locations</h3>
                      <ul className="space-y-1">
                        {selectedRegionData.keyLocations.map((location, index) => (
                          <li key={index} className="text-gray-400 text-sm flex items-center">
                            <Navigation size={12} className="mr-2 text-blue-400" />
                            {location}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Population</p>
                        <p className="font-semibold text-gray-200">{selectedRegionData.population}</p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Threat Level</p>
                        <p className="font-semibold text-orange-400">{selectedRegionData.threat}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl h-96 flex items-center justify-center">
                <div className="text-center">
                  <Info className="mx-auto mb-4 text-gray-600" size={64} />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a Region</h3>
                  <p className="text-gray-500">Click on any region marker to explore its lore and secrets</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {regions.map(region => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                selectedRegion === region.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${region.color} mx-auto mb-2`} />
              <p className="font-orbitron font-semibold text-sm text-center">{region.name}</p>
              <p className="text-xs text-gray-400 text-center">{region.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;