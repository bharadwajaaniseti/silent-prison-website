import React, { useState, useEffect, useRef } from 'react';
import { Eye, Shield, Skull, MapPin, Zap } from 'lucide-react';
import { apiFetchRegions } from '../api/regions';

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
  places?: Place[];
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
  routes?: Route[];
}

export interface Route {
  to: string;
  type: 'trade' | 'military' | 'secret' | 'abandoned';
  danger: 'safe' | 'moderate' | 'dangerous' | 'lethal';
  description?: string;
}

interface InteractiveMapProps {
  regions?: Region[];
  onRegionClick?: (region: Region) => void;
}

const DynamicInteractiveMap: React.FC<InteractiveMapProps> = ({ regions, onRegionClick }) => {
  const [loadedRegions, setLoadedRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Node-specific states
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredConnections, setHoveredConnections] = useState<string[]>([]);
  const [floatingAnimation, setFloatingAnimation] = useState<Record<string, { offsetX: number; offsetY: number; speed: number }>>({});

  const mapRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Default regions data
  const defaultRegions: Region[] = [
    {
      id: 'oris',
      name: 'Oris',
      subtitle: 'The Fractured Crown',
      position: { x: 50, y: 40 },
      color: 'from-cyan-400 to-blue-600',
      description: 'Central continent and seat of Guardian power, characterized by crystalline formations and floating islands.',
      keyLocations: ['Guardian Citadel', 'Shattered Plaza', 'Crystal Gardens'],
      population: '~2.3 million',
      threat: 'High Guardian Presence',
      connections: ['mistveil', 'duskar'],
    },
    {
      id: 'askar',
      name: 'Askar',
      subtitle: 'The Burning Wastes',
      position: { x: 25, y: 60 },
      color: 'from-orange-500 to-red-600',
      description: 'Desert continent where nightmare energy has crystallized into dangerous formations.',
      keyLocations: ['The Glass Citadel', 'Crimson Dunes', 'The Howling Spires'],
      population: '~800,000',
      threat: 'Extreme Nightmare Activity',
      connections: ['voidlands'],
    },
    {
      id: 'duskar',
      name: 'Duskar',
      subtitle: 'The Twilight Realm',
      position: { x: 75, y: 30 },
      color: 'from-purple-500 to-indigo-600',
      description: 'Perpetually shrouded in twilight, this continent exists partially in the dream realm.',
      keyLocations: ['The Umbral Gate', 'Whisper Valley', 'The Dreaming Spires'],
      population: '~1.1 million',
      threat: 'Reality Distortion',
      connections: ['oris', 'mistveil'],
    },
    {
      id: 'mistveil',
      name: 'Mistveil',
      subtitle: 'The Shrouded Isles',
      position: { x: 40, y: 75 },
      color: 'from-teal-400 to-green-600',
      description: 'A chain of misty islands where reality bends and ancient secrets lie hidden.',
      keyLocations: ['The Ancient Archive', 'Fog Harbor', 'Sunken City'],
      population: '~650,000',
      threat: 'Temporal Anomalies',
      connections: ['oris', 'duskar'],
    },
    {
      id: 'voidlands',
      name: 'Voidlands',
      subtitle: 'The Shattered Reality',
      position: { x: 10, y: 25 },
      color: 'from-gray-700 to-black',
      description: 'A devastated wasteland where reality itself has been torn apart by nightmare energy.',
      keyLocations: ['The Null Zone', 'Floating Ruins', 'Event Horizon'],
      population: '~50,000',
      threat: 'Reality Collapse',
      connections: ['askar'],
    }
  ];

  const regionList = regions || loadedRegions.length > 0 ? loadedRegions : defaultRegions;

  // Load regions from API
  useEffect(() => {
    if (!regions) {
      setIsLoading(true);
      apiFetchRegions()
        .then((apiRegions: Region[]) => {
          setLoadedRegions(apiRegions);
          initializeNodePositions(apiRegions);
        })
        .catch((error) => {
          console.error('Error loading regions from API:', error);
          setLoadedRegions(defaultRegions);
          initializeNodePositions(defaultRegions);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setLoadedRegions(regions);
      initializeNodePositions(regions);
      setIsLoading(false);
    }
  }, [regions]);

  const initializeNodePositions = (regionsData: Region[]) => {
    const positions: Record<string, { x: number; y: number }> = {};
    const floating: Record<string, { offsetX: number; offsetY: number; speed: number }> = {};
    
    regionsData.forEach(region => {
      positions[region.id] = {
        x: (region.position?.x || Math.random() * 80 + 10) * 6,
        y: (region.position?.y || Math.random() * 60 + 10) * 4
      };
      
      // Initialize floating animation for unconnected regions
      if (!region.connections || region.connections.length === 0) {
        floating[region.id] = {
          offsetX: 0,
          offsetY: 0,
          speed: 0.5 + Math.random() * 1.5
        };
      }
    });
    
    setNodePositions(positions);
    setFloatingAnimation(floating);
  };

  // Floating animation for unconnected regions
  useEffect(() => {
    const animate = () => {
      setNodePositions(prev => {
        const newPositions = { ...prev };
        const time = Date.now() * 0.001;
        
        regionList.forEach(region => {
          if (floatingAnimation[region.id] && (!region.connections || region.connections.length === 0)) {
            const floating = floatingAnimation[region.id];
            const basePos = {
              x: (region.position?.x || 50) * 6,
              y: (region.position?.y || 50) * 4
            };
            
            newPositions[region.id] = {
              x: basePos.x + Math.sin(time * floating.speed) * 20,
              y: basePos.y + Math.cos(time * floating.speed * 0.7) * 15
            };
          }
        });
        
        return newPositions;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (regionList.some(r => !r.connections || r.connections.length === 0)) {
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [regionList, floatingAnimation]);

  // Node dragging functions
  const handleNodeMouseDown = (e: React.MouseEvent, regionId: string) => {
    e.stopPropagation();
    setIsDraggingNode(true);
    setDraggingNodeId(regionId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNode && draggingNodeId) {
      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;
      
      setNodePositions(prev => {
        const newPositions = { ...prev };
        const region = regionList.find(r => r.id === draggingNodeId);
        
        // Move the dragged node
        if (newPositions[draggingNodeId]) {
          newPositions[draggingNodeId] = {
            x: prev[draggingNodeId].x + deltaX,
            y: prev[draggingNodeId].y + deltaY
          };
        }
        
        // Move connected nodes together
        if (region?.connections) {
          region.connections.forEach(connectedId => {
            if (newPositions[connectedId]) {
              newPositions[connectedId] = {
                x: prev[connectedId].x + deltaX,
                y: prev[connectedId].y + deltaY
              };
            }
          });
        }
        
        return newPositions;
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isDragging) {
      // Map panning
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingNode(false);
    setDraggingNodeId(null);
    setIsDragging(false);
  };

  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (!isDraggingNode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Connection highlighting
  const handleNodeHover = (regionId: string) => {
    const region = regionList.find(r => r.id === regionId);
    const connections = region?.connections || [];
    setHoveredConnections([regionId, ...connections]);
    setHoveredNode(regionId);
  };

  const handleNodeLeave = () => {
    setHoveredConnections([]);
    setHoveredNode(null);
  };

  const getThreatIcon = (threat: string) => {
    if (threat.includes('High') || threat.includes('Extreme')) return <Shield className="w-4 h-4" />;
    if (threat.includes('Reality')) return <Eye className="w-4 h-4" />;
    if (threat.includes('Nightmare')) return <Skull className="w-4 h-4" />;
    if (threat.includes('Temporal')) return <Zap className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="w-full h-[600px] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-300 font-mono">Loading Interactive Map...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border border-cyan-400/30 rounded-lg">
      {/* Main Map Container */}
      <div
        ref={mapRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center',
        }}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {regionList.map(region => 
            region.connections?.map(connectionId => {
              const targetRegion = regionList.find(r => r.id === connectionId);
              if (!targetRegion || !nodePositions[region.id] || !nodePositions[connectionId]) return null;
              
              const isHighlighted = hoveredConnections.includes(region.id) || hoveredConnections.includes(connectionId);
              
              return (
                <line
                  key={`${region.id}-${connectionId}`}
                  x1={nodePositions[region.id].x}
                  y1={nodePositions[region.id].y}
                  x2={nodePositions[connectionId].x}
                  y2={nodePositions[connectionId].y}
                  stroke={isHighlighted ? "#00ffff" : "#06b6d4"}
                  strokeWidth={isHighlighted ? "3" : "2"}
                  strokeOpacity={isHighlighted ? "1" : "0.6"}
                  className={isHighlighted ? "animate-pulse" : ""}
                />
              );
            })
          )}
        </svg>

        {/* Region Nodes */}
        {regionList.map(region => {
          const position = nodePositions[region.id];
          if (!position) return null;
          
          const isHovered = hoveredNode === region.id;
          const isConnected = hoveredConnections.includes(region.id);
          const isSelected = selectedNode === region.id;
          const hasConnections = region.connections && region.connections.length > 0;
          
          return (
            <div
              key={region.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: position.x, top: position.y }}
              onMouseDown={(e) => handleNodeMouseDown(e, region.id)}
              onMouseEnter={() => handleNodeHover(region.id)}
              onMouseLeave={handleNodeLeave}
              onClick={() => {
                setSelectedNode(region.id);
                onRegionClick?.(region);
              }}
            >
              {/* Node Circle */}
              <div className={`relative w-16 h-16 rounded-full border-4 transition-all duration-300 ${
                isSelected 
                  ? 'border-white scale-125 shadow-lg shadow-white/50'
                  : isHovered || isConnected
                  ? 'border-cyan-300 scale-110 shadow-lg shadow-cyan-300/50'
                  : hasConnections
                  ? 'border-cyan-400/70'
                  : 'border-red-400/70 border-dashed animate-pulse'
              } bg-gradient-to-br ${region.color}`}>
                
                {/* Inner icon */}
                <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center">
                  <div className="text-white">
                    {getThreatIcon(region.threat)}
                  </div>
                </div>
                
                {/* Pulsing effect for unconnected */}
                {!hasConnections && (
                  <div className="absolute -inset-2 rounded-full border-2 border-red-400/30 animate-ping" />
                )}
              </div>

              {/* Node Label - Show name on hover or when connected nodes are highlighted */}
              {(isHovered || isSelected || isConnected) && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-black/90 border border-cyan-400/50 px-3 py-2 rounded-lg backdrop-blur-sm min-w-max">
                    <h3 className="font-mono font-bold text-cyan-300 text-sm">{region.name}</h3>
                    <p className="text-xs text-gray-400">{region.subtitle}</p>
                    <p className="text-xs text-yellow-300">
                      Connections: {region.connections?.length || 0}
                      {(region.connections?.length || 0) > 0 && (
                        <span className="block text-cyan-200 mt-1">
                          → {region.connections?.map(id => regionList.find(r => r.id === id)?.name).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </p>
                    {!hasConnections && (
                      <p className="text-red-300 text-xs mt-1">⚠️ Floating unconnected</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
          className="bg-black/80 border border-cyan-400/50 text-cyan-300 px-3 py-2 rounded hover:bg-cyan-400/20 transition-colors"
        >
          -
        </button>
        <button
          onClick={() => setZoom(Math.min(2, zoom + 0.2))}
          className="bg-black/80 border border-cyan-400/50 text-cyan-300 px-3 py-2 rounded hover:bg-cyan-400/20 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="bg-black/80 border border-cyan-400/50 text-cyan-300 px-2 py-1 rounded hover:bg-cyan-400/20 transition-colors text-xs"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default DynamicInteractiveMap;
