import React, { useState, useEffect, useRef } from 'react';
import { Compass, Eye, Shield, Skull, Users, MapPin, Zap, Search, Filter, Maximize2 } from 'lucide-react';
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
  places?: Place[];
  connections?: string[]; // IDs of other regions this connects to
}

export interface Place {
  id: string;
  name: string;
  type: 'city' | 'town' | 'outpost' | 'landmark' | 'facility' | 'ruins';
  position: { x: number; y: number }; // Relative to region
  size: 'small' | 'medium' | 'large';
  importance: number; // 1-5, affects visual prominence
  description: string;
  connections?: string[]; // IDs of other places this connects to
  routes?: Route[];
}

export interface Route {
  to: string; // Place ID or Region ID
  type: 'trade' | 'military' | 'secret' | 'abandoned';
  danger: 'safe' | 'moderate' | 'dangerous' | 'lethal';
  description?: string;
}

interface InteractiveMapProps {
  regions?: Region[];
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ regions }) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'immersive'>('overview');
  const [filterThreat, setFilterThreat] = useState<string | null>(null);
  const [loadedRegions, setLoadedRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanVelocity, setLastPanVelocity] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [lastPanTime, setLastPanTime] = useState(0);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [hoveredConnections, setHoveredConnections] = useState<string[]>([]);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [radarSweep, setRadarSweep] = useState(0);
  const [pulseRegions, setPulseRegions] = useState<string[]>([]);
  const [drillDownRegion, setDrillDownRegion] = useState<string | null>(null);
  const [showLocations, setShowLocations] = useState(false);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Load regions from API if no regions prop provided
  useEffect(() => {
    if (!regions) {
      setIsLoading(true);
      apiFetchRegions()
        .then((apiRegions) => {
          setLoadedRegions(apiRegions);
          
          // Initialize node positions from region data
          const positions: Record<string, { x: number; y: number }> = {};
          apiRegions.forEach(region => {
            positions[region.id] = {
              x: (region.position?.x || Math.random() * 80 + 10) * 8,
              y: (region.position?.y || Math.random() * 60 + 10) * 6
            };
          });
          setNodePositions(positions);
        })
        .catch((error) => {
          console.error('Error loading regions from API:', error);
          setLoadedRegions([]); // Will fall back to default regions
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      
      // Initialize node positions for provided regions
      const positions: Record<string, { x: number; y: number }> = {};
      regions.forEach(region => {
        positions[region.id] = {
          x: (region.position?.x || Math.random() * 80 + 10) * 8,
          y: (region.position?.y || Math.random() * 60 + 10) * 6
        };
      });
      setNodePositions(positions);
    }
  }, [regions]);

  // Use regions prop if provided, else fallback to default
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
      places: [
        {
          id: 'guardian-citadel',
          name: 'Guardian Citadel',
          type: 'city',
          position: { x: 0, y: -20 },
          size: 'large',
          importance: 5,
          description: 'The massive fortress-city where the Guardians rule from crystalline towers.',
          connections: ['shattered-plaza', 'crystal-gardens'],
          routes: [
            { to: 'shattered-plaza', type: 'military', danger: 'safe', description: 'Patrol route' },
            { to: 'mistveil', type: 'trade', danger: 'moderate', description: 'Supply line' }
          ]
        },
        {
          id: 'shattered-plaza',
          name: 'Shattered Plaza',
          type: 'landmark',
          position: { x: -25, y: 15 },
          size: 'medium',
          importance: 3,
          description: 'A vast plaza of broken crystal where public executions take place.',
          connections: ['guardian-citadel', 'crystal-gardens']
        },
        {
          id: 'crystal-gardens',
          name: 'Crystal Gardens',
          type: 'facility',
          position: { x: 25, y: 10 },
          size: 'medium',
          importance: 4,
          description: 'Experimental gardens where the Guardians cultivate nightmare-infused crystals.',
          connections: ['guardian-citadel']
        }
      ]
    },
    {
      id: 'askar',
      name: 'Askar',
      subtitle: 'The Burning Wastes',
      position: { x: 25, y: 60 },
      color: 'from-orange-500 to-red-600',
      description: 'Desert continent where nightmare energy has crystallized into dangerous formations that amplify psychic abilities.',
      keyLocations: ['The Glass Citadel', 'Crimson Dunes', 'The Howling Spires'],
      population: '~800,000',
      threat: 'Extreme Nightmare Activity',
      connections: ['voidlands'],
      places: [
        {
          id: 'glass-citadel',
          name: 'The Glass Citadel',
          type: 'city',
          position: { x: 0, y: -15 },
          size: 'large',
          importance: 5,
          description: 'A fortress made entirely of nightmare-crystal glass, home to the Crimson Order.',
          connections: ['crimson-dunes'],
          routes: [
            { to: 'voidlands', type: 'secret', danger: 'lethal', description: 'Void expedition route' }
          ]
        },
        {
          id: 'crimson-dunes',
          name: 'Crimson Dunes',
          type: 'landmark',
          position: { x: -20, y: 20 },
          size: 'large',
          importance: 3,
          description: 'Blood-red sand dunes that shift and move with psychic energy.',
          connections: ['glass-citadel', 'howling-spires']
        },
        {
          id: 'howling-spires',
          name: 'The Howling Spires',
          type: 'ruins',
          position: { x: 25, y: 15 },
          size: 'small',
          importance: 2,
          description: 'Ancient towers that emit constant psychic screams from trapped souls.',
          connections: ['crimson-dunes']
        }
      ]
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
      places: [
        {
          id: 'umbral-gate',
          name: 'The Umbral Gate',
          type: 'landmark',
          position: { x: 0, y: -18 },
          size: 'large',
          importance: 5,
          description: 'A massive portal between the physical and dream realms.',
          connections: ['whisper-valley', 'dreaming-spires', 'shadow-library'],
          routes: [
            { to: 'mistveil', type: 'secret', danger: 'dangerous', description: 'Dream realm passage' }
          ]
        },
        {
          id: 'whisper-valley',
          name: 'Whisper Valley',
          type: 'town',
          position: { x: -22, y: 12 },
          size: 'medium',
          importance: 3,
          description: 'A village where the inhabitants communicate only through telepathy.',
          connections: ['umbral-gate']
        },
        {
          id: 'dreaming-spires',
          name: 'The Dreaming Spires',
          type: 'facility',
          position: { x: 20, y: 18 },
          size: 'medium',
          importance: 4,
          description: 'Towers that pierce into the dream realm, used for psychic research.',
          connections: ['umbral-gate', 'shadow-library']
        },
        {
          id: 'shadow-library',
          name: 'The Shadow Library',
          type: 'facility',
          position: { x: 12, y: -8 },
          size: 'medium',
          importance: 4,
          description: 'A vast library containing knowledge from across multiple realities.',
          connections: ['umbral-gate', 'dreaming-spires']
        }
      ]
    },
    {
      id: 'mistveil',
      name: 'Mistveil',
      subtitle: 'The Hidden Shores',
      position: { x: 30, y: 25 },
      color: 'from-emerald-400 to-teal-600',
      description: 'Mysterious island continent cloaked in perpetual mist, rumored to hide pre-Convergence technology.',
      keyLocations: ['The Ancient Archive', 'Fog Harbor', 'The Sunken City'],
      population: '~500,000',
      threat: 'Unknown Entities',
      connections: ['oris', 'duskar'],
      places: [
        {
          id: 'ancient-archive',
          name: 'The Ancient Archive',
          type: 'facility',
          position: { x: 0, y: -15 },
          size: 'large',
          importance: 5,
          description: 'A pre-Convergence data center still operational after centuries.',
          connections: ['fog-harbor'],
          routes: [
            { to: 'oris', type: 'trade', danger: 'moderate', description: 'Information trade route' }
          ]
        },
        {
          id: 'fog-harbor',
          name: 'Fog Harbor',
          type: 'town',
          position: { x: -18, y: 12 },
          size: 'medium',
          importance: 3,
          description: 'A port town constantly shrouded in supernatural mist.',
          connections: ['ancient-archive', 'sunken-city']
        },
        {
          id: 'sunken-city',
          name: 'The Sunken City',
          type: 'ruins',
          position: { x: 20, y: 20 },
          size: 'large',
          importance: 2,
          description: 'Ruins of an ancient metropolis that phases in and out of reality.',
          connections: ['fog-harbor']
        }
      ]
    },
    {
      id: 'voidlands',
      name: 'The Voidlands',
      subtitle: 'The Shattered Expanse',
      position: { x: 60, y: 70 },
      color: 'from-gray-500 to-slate-700',
      description: 'A devastated region where reality itself has been torn apart by void energy, creating floating landmasses.',
      keyLocations: ['The Null Zone', 'Floating Ruins', 'The Event Horizon'],
      population: '~50,000 (estimated)',
      threat: 'Reality Breakdown',
      connections: ['askar'],
      places: [
        {
          id: 'null-zone',
          name: 'The Null Zone',
          type: 'landmark',
          position: { x: 0, y: 0 },
          size: 'large',
          importance: 5,
          description: 'The epicenter of reality breakdown where nothing can exist.',
          connections: ['floating-ruins']
        },
        {
          id: 'floating-ruins',
          name: 'Floating Ruins',
          type: 'ruins',
          position: { x: -25, y: -20 },
          size: 'medium',
          importance: 2,
          description: 'Fragments of destroyed cities floating in dimensional void.',
          connections: ['null-zone', 'event-horizon']
        },
        {
          id: 'event-horizon',
          name: 'The Event Horizon',
          type: 'landmark',
          position: { x: 25, y: 18 },
          size: 'small',
          importance: 1,
          description: 'The boundary where reality ends and pure void begins.',
          connections: ['floating-ruins']
        }
      ]
    }
  ];
  
  // Use regions prop if provided, else use loaded regions, else fallback to default
  const regionList = regions || (loadedRegions.length > 0 ? loadedRegions : defaultRegions);

  // Track mouse movement for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Radar sweep animation
  useEffect(() => {
    const animate = () => {
      setRadarSweep(prev => (prev + 2) % 360);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Auto-pulse regions based on threat level
  useEffect(() => {
    const interval = setInterval(() => {
      const highThreatRegions = regionList
        .filter(r => r.threat.toLowerCase().includes('extreme') || r.threat.toLowerCase().includes('high'))
        .map(r => r.id);
      setPulseRegions(highThreatRegions);
      
      setTimeout(() => setPulseRegions([]), 2000);
    }, 5000);

    return () => clearInterval(interval);
  }, [regionList]);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (mapRef.current && mapRef.current.contains(e.target as Node)) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Smooth drag functionality with global mouse events and momentum
  useEffect(() => {
    let animationId: number;
    let momentumId: number;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const now = performance.now();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Calculate velocity for momentum
        if (lastPanTime > 0) {
          const deltaTime = now - lastPanTime;
          const velocityX = (newX - lastPanPosition.x) / deltaTime;
          const velocityY = (newY - lastPanPosition.y) / deltaTime;
          setLastPanVelocity({ x: velocityX, y: velocityY });
        }
        
        setLastPanPosition({ x: newX, y: newY });
        setLastPanTime(now);
        
        // Use requestAnimationFrame for smooth updates
        cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(() => {
          // Add pan boundaries to keep content visible
          const maxPan = 200 * zoom; // Adjust based on zoom level
          const boundedX = Math.max(-maxPan, Math.min(maxPan, newX));
          const boundedY = Math.max(-maxPan, Math.min(maxPan, newY));
          setPan({ x: boundedX, y: boundedY });
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      cancelAnimationFrame(animationId);
      
      // Apply momentum after releasing mouse
      if (Math.abs(lastPanVelocity.x) > 0.5 || Math.abs(lastPanVelocity.y) > 0.5) {
        let currentVelocityX = lastPanVelocity.x * 0.3; // Damping factor
        let currentVelocityY = lastPanVelocity.y * 0.3;
        
        const applyMomentum = () => {
          if (Math.abs(currentVelocityX) < 0.1 && Math.abs(currentVelocityY) < 0.1) {
            return; // Stop momentum when velocity is very low
          }
          
          setPan(prevPan => {
            const newX = prevPan.x + currentVelocityX * 16;
            const newY = prevPan.y + currentVelocityY * 16;
            
            // Apply same boundaries to momentum
            const maxPan = 200 * zoom;
            const boundedX = Math.max(-maxPan, Math.min(maxPan, newX));
            const boundedY = Math.max(-maxPan, Math.min(maxPan, newY));
            
            // Stop momentum if hitting boundaries
            if (boundedX !== newX) currentVelocityX = 0;
            if (boundedY !== newY) currentVelocityY = 0;
            
            return { x: boundedX, y: boundedY };
          });
          
          currentVelocityX *= 0.95; // Friction
          currentVelocityY *= 0.95;
          
          momentumId = requestAnimationFrame(applyMomentum);
        };
        
        momentumId = requestAnimationFrame(applyMomentum);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp, { passive: true });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationId);
      cancelAnimationFrame(momentumId);
    };
  }, [isDragging, dragStart, lastPanVelocity, lastPanPosition, lastPanTime]);

  // Simple mouse down handler for map
  const handleMapMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - pan.x, 
      y: e.clientY - pan.y 
    });
    // Reset momentum tracking
    setLastPanVelocity({ x: 0, y: 0 });
    setLastPanPosition({ x: 0, y: 0 });
    setLastPanTime(0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c') setConnectionMode(!connectionMode);
      if (e.key === 'r') {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        exitDrillDown();
      }
      if (e.key >= '1' && e.key <= '5') {
        const regionIndex = parseInt(e.key) - 1;
        if (regionList[regionIndex]) {
          drillDownToRegion(regionList[regionIndex].id);
        }
      }
      if (e.key === 'Escape') {
        exitDrillDown();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [connectionMode, regionList]);

  // Node dragging functions
  const handleNodeMouseDown = (e: React.MouseEvent, regionId: string) => {
    e.stopPropagation();
    setIsDraggingNode(true);
    setDraggingNodeId(regionId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleNodeDrag = (e: React.MouseEvent) => {
    if (!isDraggingNode || !draggingNodeId) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setNodePositions(prev => {
      const newPositions = { ...prev };
      const region = regionList.find(r => r.id === draggingNodeId);
      
      // Move the dragged node
      newPositions[draggingNodeId] = {
        x: prev[draggingNodeId].x + deltaX,
        y: prev[draggingNodeId].y + deltaY
      };
      
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
  };

  const handleNodeMouseUp = () => {
    setIsDraggingNode(false);
    setDraggingNodeId(null);
  };

  // Connection highlighting on hover
  const handleNodeHover = (regionId: string) => {
    const region = regionList.find(r => r.id === regionId);
    const connections = region?.connections || [];
    setHoveredConnections([regionId, ...connections]);
    setHoveredRegion(regionId);
  };

  const handleNodeLeave = () => {
    setHoveredConnections([]);
    setHoveredRegion(null);
  };
    const region = regionList.find(r => r.id === regionId);
    if (!region) return;

    setDrillDownRegion(regionId);
    setSelectedRegion(regionId);
    setShowLocations(true);
    
    // Calculate zoom and pan to focus on the region
    const targetZoom = 1.5; // Reduced from 2.5 to 1.5 for less aggressive zoom
    const regionScreenX = (region.position.x / 100) * (mapRef.current?.clientWidth || 600);
    const regionScreenY = (region.position.y / 100) * (mapRef.current?.clientHeight || 600);
    const centerX = (mapRef.current?.clientWidth || 600) / 2;
    const centerY = (mapRef.current?.clientHeight || 600) / 2;
    
    const targetPanX = (centerX - regionScreenX) * targetZoom;
    const targetPanY = (centerY - regionScreenY) * targetZoom;
    
    // Smooth animation to target
    animateToPosition(targetZoom, targetPanX, targetPanY);
  };

  const exitDrillDown = () => {
    setDrillDownRegion(null);
    setShowLocations(false);
    setHoveredLocation(null);
    
    // Animate back to overview
    animateToPosition(1, 0, 0);
  };

  const animateToPosition = (targetZoom: number, targetPanX: number, targetPanY: number) => {
    const startZoom = zoom;
    const startPanX = pan.x;
    const startPanY = pan.y;
    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      const easedProgress = easeInOutCubic(progress);
      
      const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;
      const currentPanX = startPanX + (targetPanX - startPanX) * easedProgress;
      const currentPanY = startPanY + (targetPanY - startPanY) * easedProgress;
      
      setZoom(currentZoom);
      setPan({ x: currentPanX, y: currentPanY });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'city': return <Shield className="w-3 h-3" />;
      case 'town': return <Users className="w-3 h-3" />;
      case 'facility': return <Zap className="w-3 h-3" />;
      case 'ruins': return <Skull className="w-3 h-3" />;
      case 'landmark': return <MapPin className="w-3 h-3" />;
      case 'outpost': return <Eye className="w-3 h-3" />;
      default: return <Eye className="w-3 h-3" />;
    }
  };

  const getPlaceSize = (size: string, importance: number) => {
    const baseSize = size === 'large' ? 12 : size === 'medium' ? 10 : 8;
    const importanceMultiplier = 1 + (importance - 1) * 0.2;
    return Math.round(baseSize * importanceMultiplier);
  };

  const getRouteColor = (type: string, danger: string) => {
    const colors = {
      trade: { safe: '#10b981', moderate: '#f59e0b', dangerous: '#ef4444', lethal: '#dc2626' },
      military: { safe: '#3b82f6', moderate: '#1d4ed8', dangerous: '#1e40af', lethal: '#1e3a8a' },
      secret: { safe: '#8b5cf6', moderate: '#7c3aed', dangerous: '#6d28d9', lethal: '#5b21b6' },
      abandoned: { safe: '#6b7280', moderate: '#4b5563', dangerous: '#374151', lethal: '#1f2937' }
    };
    return colors[type as keyof typeof colors]?.[danger as keyof typeof colors.trade] || '#6b7280';
  };

  const selectedRegionData = regionList.find(r => r.id === selectedRegion);

  const getThreatIcon = (threat: string) => {
    if (threat.toLowerCase().includes('extreme') || threat.toLowerCase().includes('nightmare')) return <Skull className="w-4 h-4 text-red-400" />;
    if (threat.toLowerCase().includes('high') || threat.toLowerCase().includes('guardian')) return <Shield className="w-4 h-4 text-blue-400" />;
    if (threat.toLowerCase().includes('reality') || threat.toLowerCase().includes('breakdown')) return <Zap className="w-4 h-4 text-purple-400" />;
    return <Eye className="w-4 h-4 text-yellow-400" />;
  };

  const getThreatColor = (threat: string) => {
    if (threat.toLowerCase().includes('extreme') || threat.toLowerCase().includes('nightmare')) return 'text-red-400';
    if (threat.toLowerCase().includes('high') || threat.toLowerCase().includes('guardian')) return 'text-blue-400';
    if (threat.toLowerCase().includes('reality') || threat.toLowerCase().includes('breakdown')) return 'text-purple-400';
    return 'text-yellow-400';
  };

  return (
    <div className="min-h-screen bg-black text-white lg:ml-20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-800">
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" 
               style={{
                 backgroundImage: `
                   linear-gradient(90deg, #00ffff 1px, transparent 1px),
                   linear-gradient(0deg, #00ffff 1px, transparent 1px)
                 `,
                 backgroundSize: '40px 40px'
               }} 
          />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[4.5rem] pb-8">
        {/* Header with Cyber Aesthetic */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-3 mb-4">
            <Compass className="w-8 h-8 text-cyan-400 animate-spin-slow" />
            <h1 className="font-orbitron text-4xl lg:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              TENJIKU NEXUS
            </h1>
            <Compass className="w-8 h-8 text-cyan-400 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
          </div>
          <p className="text-lg text-cyan-300 font-mono">
            [ DIMENSIONAL MAPPING PROTOCOL ACTIVE ]
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mt-4" />
        </div>

        {/* Main Interface */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* View Mode Selector */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
              <h3 className="font-orbitron text-cyan-400 mb-3 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                VIEW MODE
              </h3>
              <div className="space-y-2">
                {[
                  { mode: 'overview', label: 'TACTICAL', icon: <Eye className="w-4 h-4" /> },
                  { mode: 'detailed', label: 'ANALYSIS', icon: <Search className="w-4 h-4" /> },
                  { mode: 'immersive', label: 'IMMERSION', icon: <Maximize2 className="w-4 h-4" /> }
                ].map(({ mode, label, icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded border transition-all duration-300 ${
                      viewMode === mode
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-cyan-500/50'
                    }`}
                  >
                    {icon}
                    <span className="font-mono text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Controls */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
              <h3 className="font-orbitron text-cyan-400 mb-3 flex items-center">
                <Compass className="w-4 h-4 mr-2" />
                CONTROLS
              </h3>
              <div className="space-y-3">
                {/* Zoom Controls */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">ZOOM</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                      className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded text-cyan-400 flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono text-white w-12 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                      className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded text-cyan-400 flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setSelectedRegion(null);
                    exitDrillDown();
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-cyan-400 py-2 rounded font-mono text-sm transition-colors"
                >
                  RESET VIEW
                </button>

                {/* Drill Down Controls */}
                {drillDownRegion && (
                  <button
                    onClick={exitDrillDown}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 rounded font-mono text-sm transition-colors"
                  >
                    EXIT DRILL DOWN
                  </button>
                )}

                {selectedRegion && !drillDownRegion && (
                  <button
                    onClick={() => drillDownToRegion(selectedRegion)}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded font-mono text-sm transition-colors"
                  >
                    DRILL INTO REGION
                  </button>
                )}

                {/* Connection Mode Toggle */}
                <button
                  onClick={() => setConnectionMode(!connectionMode)}
                  className={`w-full py-2 rounded font-mono text-sm transition-colors border ${
                    connectionMode
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-cyan-500/50'
                  }`}
                >
                  {connectionMode ? 'HIDE ROUTES' : 'SHOW ROUTES'}
                </button>

                {/* Keyboard Shortcuts */}
                <div className="text-xs font-mono text-slate-500 space-y-1 pt-2 border-t border-slate-700">
                  <div>C - Toggle connections</div>
                  <div>R - Reset view</div>
                  <div>ESC - Exit drill down</div>
                  <div>1-5 - Drill into region</div>
                  <div>Mouse wheel - Zoom</div>
                  <div>Drag - Pan map</div>
                </div>
              </div>
            </div>

            {/* Region Quick Access */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
              <h3 className="font-orbitron text-cyan-400 mb-3 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                REGIONS
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {regionList.map(region => (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region.id)}
                    className={`w-full text-left p-3 rounded border transition-all duration-300 ${
                      selectedRegion === region.id
                        ? 'bg-cyan-500/20 border-cyan-400'
                        : 'bg-slate-800/50 border-slate-600 hover:border-cyan-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm font-bold text-white">{region.name.toUpperCase()}</span>
                      {getThreatIcon(region.threat)}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{region.subtitle}</div>
                    <div className={`text-xs font-mono mt-1 ${getThreatColor(region.threat)}`}>
                      {region.threat}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map Canvas */}
          <div className="lg:col-span-2">
            <div 
              ref={mapRef}
              className="relative h-[600px] bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg overflow-hidden select-none"
              onMouseDown={handleMapMouseDown}
              style={{ 
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              {/* Scan Lines Effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-pulse" />
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-full h-px bg-cyan-400/10"
                    style={{ top: `${i * 5}%` }}
                  />
                ))}
              </div>

              {/* Radar Sweep */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="absolute w-full h-full rounded-full"
                  style={{
                    background: `conic-gradient(from ${radarSweep}deg, transparent 0deg, cyan 10deg, transparent 20deg)`,
                    opacity: 0.1
                  }}
                />
              </div>

              {/* Radar Grid */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[1, 2, 3, 4].map(ring => (
                  <div
                    key={ring}
                    className={`absolute border border-cyan-400/20 rounded-full ${
                      viewMode === 'immersive' ? 'animate-ping' : ''
                    }`}
                    style={{
                      width: `${ring * 25}%`,
                      height: `${ring * 25}%`,
                      animationDelay: `${ring * 0.5}s`,
                      animationDuration: '4s'
                    }}
                  />
                ))}
              </div>

              {/* Region Markers */}
              <div 
                className="relative w-full h-full will-change-transform"
                style={{
                  transform: `scale3d(${zoom}, ${zoom}, 1) translate3d(${pan.x / zoom}px, ${pan.y / zoom}px, 0)`,
                  transformOrigin: 'center center'
                }}
              >
                {regionList.map(region => (
                  <div
                    key={region.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ 
                      left: `${region.position.x}%`, 
                      top: `${region.position.y}%`,
                      transform: `translate(-50%, -50%) translateX(${mousePosition.x * (viewMode === 'immersive' ? 10 : 5)}px) translateY(${mousePosition.y * (viewMode === 'immersive' ? 10 : 5)}px)`
                    }}
                    onClick={() => {
                      if (drillDownRegion === region.id) {
                        exitDrillDown();
                      } else {
                        drillDownToRegion(region.id);
                      }
                    }}
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    {/* Pulse Effect for High Threat Regions */}
                    {pulseRegions.includes(region.id) && (
                      <div className="absolute inset-0 w-24 h-24 -translate-x-1/2 -translate-y-1/2 translate-x-1/2 translate-y-1/2 bg-red-500/30 rounded-full animate-ping" />
                    )}

                    {/* Outer Ring - Different styling for unconnected regions */}
                    <div className={`absolute inset-0 w-20 h-20 rounded-full border-2 transition-all duration-500 ${
                      selectedRegion === region.id 
                        ? 'border-cyan-300 animate-spin scale-150' 
                        : hoveredRegion === region.id
                        ? 'border-cyan-400/70 animate-pulse scale-125'
                        : (!region.connections || region.connections.length === 0)
                        ? 'border-red-400/60 border-dashed animate-pulse' // Unconnected regions
                        : 'border-cyan-400/50 animate-spin'
                    }`} />
                    
                    {/* Inner Core */}
                    <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${region.color} border border-white/30 shadow-2xl transition-all duration-300 ${
                      selectedRegion === region.id 
                        ? 'scale-125 shadow-cyan-400/50 shadow-2xl' 
                        : hoveredRegion === region.id
                        ? 'scale-115 shadow-cyan-400/30'
                        : 'group-hover:scale-110'
                    }`}>
                      <div className="absolute inset-2 rounded-full bg-black/20 flex items-center justify-center">
                        <div className={`w-8 h-8 bg-white/90 rounded-full flex items-center justify-center transition-all duration-300 ${
                          selectedRegion === region.id || hoveredRegion === region.id ? 'animate-pulse' : ''
                        }`}>
                          {getThreatIcon(region.threat)}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Holographic Label */}
                    {(selectedRegion === region.id || hoveredRegion === region.id || viewMode === 'detailed') && (
                      <div className={`absolute top-24 left-1/2 transform -translate-x-1/2 text-center transition-all duration-300 ${
                        selectedRegion === region.id ? 'scale-110' : ''
                      }`}>
                        <div className="bg-black/90 border border-cyan-400/50 px-3 py-2 rounded backdrop-blur-sm">
                          <p className="font-orbitron font-bold text-cyan-300 text-sm">{region.name}</p>
                          <p className="text-xs text-cyan-500 font-mono">{region.subtitle}</p>
                          {hoveredRegion === region.id && (
                            <p className={`text-xs font-mono mt-1 ${getThreatColor(region.threat)}`}>
                              {region.threat}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Radar Sweep Effect for Selected Region */}
                    {selectedRegion === region.id && (
                      <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-conic from-transparent via-cyan-400/30 to-transparent animate-spin opacity-100 transition-opacity duration-300" />
                    )}
                  </div>
                ))}

                {/* Detailed Locations - Only show when drilled down */}
                {showLocations && drillDownRegion && regionList.find(r => r.id === drillDownRegion)?.places?.map(place => {
                  const parentRegion = regionList.find(r => r.id === drillDownRegion);
                  if (!parentRegion) return null;
                  
                  // Calculate absolute position based on parent region
                  const absoluteX = parentRegion.position.x + place.position.x * 0.3; // Scale down the offset
                  const absoluteY = parentRegion.position.y + place.position.y * 0.3;
                  
                  const placeSize = getPlaceSize(place.size, place.importance);
                  
                  return (
                    <div
                      key={place.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{ 
                        left: `${absoluteX}%`, 
                        top: `${absoluteY}%`
                      }}
                      onMouseEnter={() => setHoveredLocation(place.id)}
                      onMouseLeave={() => setHoveredLocation(null)}
                    >
                      {/* Place Marker */}
                      <div className={`relative rounded-full border-2 transition-all duration-300 ${
                        hoveredLocation === place.id ? 'scale-150 shadow-lg' : 'scale-100'
                      } ${
                        place.type === 'city' ? 'bg-blue-500/80 border-blue-300' :
                        place.type === 'town' ? 'bg-green-500/80 border-green-300' :
                        place.type === 'facility' ? 'bg-yellow-500/80 border-yellow-300' :
                        place.type === 'ruins' ? 'bg-red-500/80 border-red-300' :
                        place.type === 'landmark' ? 'bg-purple-500/80 border-purple-300' :
                        'bg-gray-500/80 border-gray-300'
                      }`}
                      style={{
                        width: `${placeSize}px`,
                        height: `${placeSize}px`
                      }}>
                        <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center">
                          <div className="text-white transition-all duration-300">
                            {getPlaceIcon(place.type)}
                          </div>
                        </div>
                      </div>

                      {/* Place Label */}
                      {hoveredLocation === place.id && (
                        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-center z-20">
                          <div className="bg-black/90 border border-cyan-400/50 px-2 py-1 rounded backdrop-blur-sm min-w-max">
                            <p className="font-mono font-bold text-cyan-300 text-xs">{place.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{place.type}</p>
                            <p className="text-xs text-cyan-300 capitalize">Size: {place.size}</p>
                            <p className="text-xs text-yellow-300">Importance: {place.importance}/5</p>
                          </div>
                        </div>
                      )}

                      {/* Connection lines between places */}
                      {place.routes?.map(route => {
                        const connectedPlace = parentRegion.places?.find(p => p.id === route.to);
                        if (!connectedPlace) return null;
                        
                        const connectedAbsoluteX = parentRegion.position.x + connectedPlace.position.x * 0.3;
                        const connectedAbsoluteY = parentRegion.position.y + connectedPlace.position.y * 0.3;
                        
                        return (
                          <svg 
                            key={route.to}
                            className="absolute pointer-events-none"
                            style={{
                              left: '-200px',
                              top: '-200px',
                              width: '400px',
                              height: '400px',
                            }}
                          >
                            <line
                              x1="200"
                              y1="200"
                              x2={200 + (connectedAbsoluteX - absoluteX) * 6}
                              y2={200 + (connectedAbsoluteY - absoluteY) * 6}
                              stroke={getRouteColor(route.type, route.danger)}
                              strokeWidth={route.type === 'military' ? "2" : "1"}
                              strokeDasharray={route.type === 'secret' ? "3,3" : route.type === 'abandoned' ? "2,2" : "none"}
                              opacity="0.8"
                              className="transition-all duration-300"
                            />
                          </svg>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Connection Network */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="connectionLine" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="activeConnection" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00ffff" stopOpacity="1" />
                      <stop offset="50%" stopColor="#ff00ff" stopOpacity="1" />
                      <stop offset="100%" stopColor="#00ffff" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  
                  {/* Region connections based on connections array */}
                  {regionList.map(region => 
                    region.connections?.map(connectionId => {
                      const targetRegion = regionList.find(r => r.id === connectionId);
                      if (!targetRegion) return null;
                      
                      const isActive = selectedRegion === region.id || selectedRegion === targetRegion.id || 
                                     hoveredRegion === region.id || hoveredRegion === targetRegion.id;
                      return (
                        <g key={`${region.id}-${connectionId}`}>
                          {/* Main connection line */}
                          <line
                            x1={`${region.position.x}%`}
                            y1={`${region.position.y}%`}
                            x2={`${targetRegion.position.x}%`}
                            y2={`${targetRegion.position.y}%`}
                            stroke={isActive ? "url(#activeConnection)" : "url(#connectionLine)"}
                            strokeWidth={isActive ? "3" : "1"}
                            strokeDasharray="3,3"
                            className={isActive ? "animate-pulse" : ""}
                            opacity={isActive ? "1" : "0.4"}
                          />
                          {/* Energy flow animation */}
                          {isActive && (
                            <circle
                              cx={`${region.position.x}%`}
                              cy={`${region.position.y}%`}
                              r="2"
                              fill="#00ffff"
                              opacity="0.8"
                            >
                              <animateMotion
                                dur="2s"
                                repeatCount="indefinite"
                                path={`M ${region.position.x},${region.position.y} L ${targetRegion.position.x},${targetRegion.position.y}`}
                              />
                            </circle>
                          )}
                        </g>
                      );
                    })
                  )}
                </svg>
              </div>

              {/* Interactive Minimap */}
              <div className="absolute top-4 right-4 w-32 h-24 bg-black/80 border border-cyan-400/50 rounded backdrop-blur-sm p-2">
                <div className="relative w-full h-full bg-slate-800/50 rounded">
                  {regionList.map(region => (
                    <div
                      key={`mini-${region.id}`}
                      className={`absolute w-2 h-2 rounded-full cursor-pointer transition-all duration-200 ${
                        selectedRegion === region.id ? 'bg-cyan-300 scale-150' : 'bg-cyan-500/70 hover:scale-125'
                      }`}
                      style={{ 
                        left: `${region.position.x * 0.8}%`, 
                        top: `${region.position.y * 0.8}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => setSelectedRegion(region.id)}
                    />
                  ))}
                  
                  {/* Viewport indicator */}
                  <div 
                    className="absolute border border-yellow-400/50 rounded"
                    style={{
                      left: `${50 - (pan.x / zoom / 10)}%`,
                      top: `${50 - (pan.y / zoom / 10)}%`,
                      width: `${100 / zoom}%`,
                      height: `${100 / zoom}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                </div>
              </div>

              {/* Holographic Overlay */}
              <div className="absolute bottom-4 left-4 bg-black/80 border border-cyan-400/50 rounded p-3 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isLoading ? 'bg-yellow-400' : 'bg-green-400'}`} />
                  <span className="text-xs font-mono text-cyan-300">
                    {isLoading ? 'LOADING...' : 'NEXUS ONLINE'}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400 space-y-1">
                  <div>SECTORS: {regionList.length} | STATUS: ACTIVE</div>
                  <div>ZOOM: {Math.round(zoom * 100)}% | CONNECTIONS: {connectionMode ? 'ON' : 'OFF'}</div>
                  {drillDownRegion && (
                    <div className="text-purple-400">
                      MODE: DRILL DOWN | REGION: {regionList.find(r => r.id === drillDownRegion)?.name.toUpperCase()}
                    </div>
                  )}
                  {selectedRegion && !drillDownRegion && (
                    <div className="text-cyan-400">
                      TARGET: {regionList.find(r => r.id === selectedRegion)?.name.toUpperCase()}
                    </div>
                  )}
                  {hoveredLocation && (
                    <div className="text-green-400">
                      LOCATION: {regionList.find(r => r.id === drillDownRegion)?.places?.find(p => p.id === hoveredLocation)?.name.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data Panel */}
          <div className="lg:col-span-1">
            {selectedRegionData ? (
              <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg overflow-hidden">
                {/* Header */}
                <div className={`h-32 bg-gradient-to-br ${selectedRegionData.color} relative`}>
                  <div className="absolute inset-0 bg-black/50" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h2 className="font-orbitron text-xl font-bold">{selectedRegionData.name.toUpperCase()}</h2>
                    <p className="text-cyan-200 font-mono text-sm">{selectedRegionData.subtitle}</p>
                    {drillDownRegion === selectedRegionData.id && (
                      <p className="text-purple-300 font-mono text-xs mt-1">DRILL DOWN ACTIVE</p>
                    )}
                  </div>
                  <div className="absolute top-4 right-4">
                    {getThreatIcon(selectedRegionData.threat)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Show location details if hovering over a location */}
                  {hoveredLocation && drillDownRegion === selectedRegionData.id && (() => {
                    const place = selectedRegionData.places?.find(p => p.id === hoveredLocation);
                    return place ? (
                      <div className="bg-black/40 rounded p-3 border border-green-500/30">
                        <h3 className="font-orbitron text-green-400 text-sm mb-2 flex items-center">
                          {getPlaceIcon(place.type)}
                          <span className="ml-2">{place.name.toUpperCase()}</span>
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p className="text-slate-300 leading-relaxed">{place.description}</p>
                          <div className="flex justify-between">
                            <span className="text-slate-400 capitalize">Type: {place.type}</span>
                            <span className="text-cyan-300 capitalize">
                              Size: {place.size}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Importance: {place.importance}/5</span>
                          </div>
                          {place.routes && place.routes.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-xs mb-1">Connected to:</p>
                              <div className="flex flex-wrap gap-1">
                                {place.routes.map(route => {
                                  const connectedPlace = selectedRegionData.places?.find(p => p.id === route.to);
                                  return connectedPlace ? (
                                    <span key={route.to} className="text-xs bg-cyan-500/20 text-cyan-300 px-1 rounded">
                                      {connectedPlace.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Description */}
                  <div className="bg-black/30 rounded p-3 border border-cyan-500/20">
                    <h3 className="font-orbitron text-cyan-400 text-sm mb-2">INTEL BRIEF</h3>
                    <p className="text-slate-300 text-sm leading-relaxed font-mono">
                      {selectedRegionData.description}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-black/30 rounded p-3 border border-cyan-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-cyan-400">POPULATION</span>
                        <Users className="w-3 h-3 text-cyan-400" />
                      </div>
                      <p className="font-mono text-sm text-white">{selectedRegionData.population}</p>
                    </div>
                    
                    <div className="bg-black/30 rounded p-3 border border-red-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-red-400">THREAT LEVEL</span>
                        {getThreatIcon(selectedRegionData.threat)}
                      </div>
                      <p className={`font-mono text-sm ${getThreatColor(selectedRegionData.threat)}`}>
                        {selectedRegionData.threat}
                      </p>
                    </div>
                  </div>

                  {/* Key Locations */}
                  <div className="bg-black/30 rounded p-3 border border-cyan-500/20">
                    <h3 className="font-orbitron text-cyan-400 text-sm mb-2">
                      {drillDownRegion === selectedRegionData.id ? 'DETAILED LOCATIONS' : 'KEY LOCATIONS'}
                    </h3>
                    <div className="space-y-1">
                      {drillDownRegion === selectedRegionData.id ? (
                        selectedRegionData.places?.map((place, index) => (
                          <div key={index} className={`flex items-center text-xs font-mono transition-colors ${
                            hoveredLocation === place.id ? 'text-green-300' : 'text-slate-300'
                          }`}>
                            <div className="mr-2 text-cyan-400">
                              {getPlaceIcon(place.type)}
                            </div>
                            <span className="flex-1">{place.name}</span>
                            <span className="text-xs text-cyan-300 capitalize">
                              {place.type}
                            </span>
                          </div>
                        ))
                      ) : (
                        selectedRegionData.keyLocations.map((location, index) => (
                          <div key={index} className="flex items-center text-slate-300 text-xs font-mono">
                            <MapPin className="w-3 h-3 mr-2 text-cyan-400" />
                            {location}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-4 mx-auto" />
                  <h3 className="text-lg font-orbitron text-cyan-400 mb-2">AWAITING TARGET</h3>
                  <p className="text-slate-500 font-mono text-sm">Select a region to access data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;