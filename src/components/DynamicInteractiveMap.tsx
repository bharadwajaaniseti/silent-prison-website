import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Network,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Menu,
  X,
  Cpu,
  Database,
  Radio,
  Target
} from 'lucide-react';
import { apiFetchRegions } from '../api/regions';

// ===== Types (same as your DB / old component) =====
export interface Region {
  id: string;
  name: string;
  subtitle: string;
  position: { x: number; y: number }; // percents 0–100 (center of node)
  color: string;                        // e.g. 'from-cyan-400 via-blue-500 to-purple-600'
  description: string;
  keyLocations: string[];
  population: string;
  threat: string;
  places?: Place[];
  connections?: string[];               // region ids
  imageUrl?: string; // region icon/image
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
  position: { x: number; y: number };   // px offsets around node
  size: 'small' | 'medium' | 'large';
  importance: number;
  description: string;
  connections?: string[];
  subplaces?: SubPlace[];
}

export interface SubPlace {
  id: string;
  name: string;
  description?: string;
  connections?: string[];
}

// Hierarchical node types for the map
export interface MapNode {
  id: string;
  name: string;
  type: 'region' | 'place' | 'subplace';
  position: { x: number; y: number };
  parentId?: string;
  data: Region | Place | SubPlace;
}

interface InteractiveMapProps {
  regions?: Region[]; // optional pre-fetched
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ regions }) => {
  // Loading real data (DB -> apiFetchRegions), with safe fallback
  const [loadedRegions, setLoadedRegions] = useState<Region[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (regions) {
        setLoadedRegions(regions);
        return;
      }
      try {
        const apiRegions = await apiFetchRegions();
        if (!cancelled) setLoadedRegions(apiRegions ?? []);
      } catch (e) {
        console.error('Failed to load regions', e);
        if (!cancelled) setLoadedRegions([]);
      }
    })();
    return () => { cancelled = true; };
  }, [regions]);

  // Make a local, editable copy so users can drag nodes
  const initialList = useMemo(() => (regions ?? loadedRegions), [regions, loadedRegions]);
  const [nodes, setNodes] = useState<Region[]>([]);
  useEffect(() => {
    setNodes(initialList.map(r => ({ ...r, position: { ...r.position } })));
  }, [initialList]);

  // Initialize map nodes from regions
  useEffect(() => {
    const regionNodes: MapNode[] = nodes.map(r => {
      // Convert keyLocations to places if places don't exist
      const places: Place[] = r.places || r.keyLocations.map((location) => ({
        id: `${r.name}_${location.replace(/\s+/g, '_')}`,
        name: location,
        type: 'landmark' as const,
        position: { x: 0, y: 0 }, // Will be calculated dynamically
        size: 'medium' as const,
        importance: 5,
        description: `A key location in ${r.name}: ${location}`,
        connections: []
      }));

      return {
        id: `region:${r.name}`,
        name: r.name,
        type: 'region' as const,
        position: r.position,
        data: { ...r, places }
      };
    });
    setMapNodes(regionNodes);
  }, [nodes]);

  // Helper function to generate stable node IDs
  const generateNodeId = (type: 'region' | 'place' | 'subplace', regionName: string, placeName?: string, subplaceName?: string) => {
    if (type === 'region') return `region:${regionName}`;
    if (type === 'place') return `place:${regionName}:${placeName}`;
    return `sub:${regionName}:${placeName}:${subplaceName}`;
  };

  // Calculate circular position around a parent node (simplified and reliable)
    // Ring calculation utilities
  const calculateTextWidth = (text: string, fontSize: number = 10): number => {
    // Approximate text width calculation (can be replaced with canvas measurement for precision)
    return text.length * fontSize * 0.6; // Average character width
  };

  const calculateRingRadius = (
    parentRadius: number,
    childRadius: number,
    childLabels: string[],
    halo: number = 4,
    linkGap: number = 12,
    labelPadding: number = 10,
    minRadius: number = 80,
    maxRadius: number = 150
  ): number => {
    const maxChildLabelWidth = Math.max(...childLabels.map(label => calculateTextWidth(label)));
    const R = parentRadius + halo + linkGap + childRadius + labelPadding + Math.max(40, 0.6 * maxChildLabelWidth);
    return Math.max(minRadius, Math.min(maxRadius, R));
  };










  // Toggle node expansion
  const toggleNodeExpansion = (nodeId: string, nodeType: 'region' | 'place' | 'subplace') => {
    const isExpanded = expandedNodes.has(nodeId);
    
    if (isExpanded) {
      // Collapse: remove children and their edges
      const newExpanded = new Set(expandedNodes);
      newExpanded.delete(nodeId);
      setExpandedNodes(newExpanded);
      
      // Remove child nodes
      setMapNodes(prev => prev.filter(node => node.parentId !== nodeId));
      
      // Remove parent-child edges
      setHierarchicalEdges(prev => prev.filter(edge => edge.from !== nodeId));
    } else {
      // Expand: add children
      const newExpanded = new Set(expandedNodes);
      newExpanded.add(nodeId);
      setExpandedNodes(newExpanded);
      
      if (nodeType === 'region') {
        const regionNode = mapNodes.find(n => n.id === nodeId);
        const region = regionNode?.data as Region;
        if (regionNode && region && region.places && region.places.length > 0) {
          // Calculate optimal ring layout with better spacing
          const parentRadius = 50; // Visual radius of region node including glow
          const childRadius = 25; // Visual radius of place node including glow
          const childLabels = region.places.map(p => p.name);
          
          // Calculate ring radius in pixels
          const ringRadiusPx = calculateRingRadius(parentRadius, childRadius, childLabels);
          
          // Convert to percentage-based radius for positioning
          const ringRadiusPercent = (ringRadiusPx / Math.min(window.innerWidth, window.innerHeight)) * 100;
          
          // Add place nodes with simple circular positioning
          const placeNodes: MapNode[] = region.places.map((place, index) => {
            const angle = (2 * Math.PI * index) / region.places!.length;
            const position = {
              x: regionNode.position.x + ringRadiusPercent * Math.cos(angle),
              y: regionNode.position.y + ringRadiusPercent * Math.sin(angle)
            };
            
            return {
              id: generateNodeId('place', region.name, place.name),
              name: place.name,
              type: 'place' as const,
              position,
              parentId: nodeId,
              data: { ...place, angle, ringRadius: ringRadiusPx }
            };
          });
          
          setMapNodes(prev => [...prev, ...placeNodes]);
          
          // Add parent-child edges with proper anchoring
          const newEdges = placeNodes.map(node => ({
            from: nodeId,
            to: node.id,
            type: 'parent' as const
          }));
          setHierarchicalEdges(prev => [...prev, ...newEdges]);
        }
      } else if (nodeType === 'place') {
        const placeNode = mapNodes.find(n => n.id === nodeId);
        if (placeNode && placeNode.type === 'place') {
          const place = placeNode.data as Place;
          const children = place.subplaces || (place.connections || []).map(name => ({ id: name, name }));
          
          if (children.length > 0) {
            const regionName = nodeId.split(':')[1];
            const placeName = nodeId.split(':')[2];
            
            // Calculate optimal ring layout for subplaces (smaller ring)
            const childRadius = 16; // Visual radius of subplace node (8px actual + glow)
            const childLabels = children.map(c => c.name);
            
            // Calculate smaller ring radius for subplaces
            const ringRadiusPx = calculateRingRadius(
              25, // parent place radius
              childRadius, 
              childLabels,
              4, 12, 8, 50, 90 // smaller min/max for subplaces
            );
            
            // Convert to percentage-based radius
            const ringRadiusPercent = (ringRadiusPx / Math.min(window.innerWidth, window.innerHeight)) * 100;
            
            // Add subplace nodes with simple circular positioning
            const subplaceNodes: MapNode[] = children.map((child, index) => {
              const angle = (2 * Math.PI * index) / children.length;
              const position = {
                x: placeNode.position.x + ringRadiusPercent * Math.cos(angle),
                y: placeNode.position.y + ringRadiusPercent * Math.sin(angle)
              };
              
              return {
                id: generateNodeId('subplace', regionName, placeName, child.name),
                name: child.name,
                type: 'subplace' as const,
                position,
                parentId: nodeId,
                data: { ...child, angle, ringRadius: ringRadiusPx }
              };
            });
            
            setMapNodes(prev => [...prev, ...subplaceNodes]);
            
            // Add parent-child edges
            const newEdges = subplaceNodes.map(node => ({
              from: nodeId,
              to: node.id,
              type: 'parent' as const
            }));
            setHierarchicalEdges(prev => [...prev, ...newEdges]);
          }
        }
      }
    }
  };

  // UI state
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'region' | 'place' | 'subplace' | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'global' | 'regional' | 'local'>('global');

  // Hierarchical nodes and edges state
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
  const [hierarchicalEdges, setHierarchicalEdges] = useState<Array<{ from: string; to: string; type: 'parent' | 'connection' }>>([]);

  // Pan & zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const mapRef = useRef<HTMLDivElement>(null);

  // Wheel zoom
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!mapRef.current || !mapRef.current.contains(e.target as Node)) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.max(0.5, Math.min(3, z + delta)));
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  // Pan (mouse drag on empty map)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isPanning) return;
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    };
    const onUp = () => setIsPanning(false);
    if (isPanning) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isPanning, panStart]);

  const onMapMouseDown = (e: React.MouseEvent) => {
    // only start panning if click started on the map canvas, not a node (node handlers stopPropagation)
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // ===== Node dragging =====
  const [dragNode, setDragNode] = useState<{ id: string; offX: number; offY: number } | null>(null);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const clientToPercent = (clientX: number, clientY: number) => {
    const el = mapRef.current!;
    const rect = el.getBoundingClientRect();
    // reverse transform: remove pan then scale
    const worldX = (clientX - rect.left - pan.x) / zoom;
    const worldY = (clientY - rect.top - pan.y) / zoom;
    return {
      x: (worldX / rect.width) * 100,
      y: (worldY / rect.height) * 100,
    };
  };

  const onNodeMouseDown = (e: React.MouseEvent, nodeId: string, nodeType: 'region' | 'place' | 'subplace') => {
    e.stopPropagation();
    e.preventDefault();
    
    if (nodeType === 'region') {
      // Handle region dragging setup
      const r = nodes.find(region => `region:${region.name}` === nodeId);
      if (r) {
        const p = clientToPercent(e.clientX, e.clientY);
        setDragNode({
          id: r.id,
          offX: r.position.x - p.x,
          offY: r.position.y - p.y,
        });
      }
    }
  };

  const onNodeClick = (nodeId: string, nodeType: 'region' | 'place' | 'subplace') => {
    // Set selection
    setSelectedNode(nodeId);
    setSelectedType(nodeType);
    
    // Toggle expansion
    toggleNodeExpansion(nodeId, nodeType);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragNode || !mapRef.current) return;
      const p = clientToPercent(e.clientX, e.clientY);
      const nx = clamp(p.x + dragNode.offX, 0, 100);
      const ny = clamp(p.y + dragNode.offY, 0, 100);
      setNodes(prev => prev.map(r => (r.id === dragNode.id ? { ...r, position: { x: nx, y: ny } } : r)));
    };
    const onUp = () => setDragNode(null);

    if (dragNode) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragNode, pan, zoom]); // include pan/zoom so dragging stays correct while zooming/panning

  // ===== Helpers =====
  const getThreatClasses = (threat: string) => {
    const t = threat?.toLowerCase() || '';
    if (t.includes('secure') || t.includes('stable')) return 'text-emerald-400 border-emerald-400/30 bg-emerald-500/10';
    if (t.includes('hazard') || t.includes('exper')) return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
    if (t.includes('unknown') || t.includes('critical')) return 'text-red-400 border-red-400/30 bg-red-500/10';
    return 'text-slate-300 border-white/10 bg-white/5';
  };
  const getPlaceIcon = (type: Place['type']) => {
    switch (type) {
      case 'facility': return <Cpu className="w-4 h-4" />;
      case 'outpost':  return <Radio className="w-4 h-4" />;
      case 'city':     return <Database className="w-4 h-4" />;
      default:         return <Target className="w-4 h-4" />;
    }
  };

  // Get selected node data
  const selectedNodeData = useMemo(() => {
    if (!selectedNode || !selectedType) return null;
    
    const node = mapNodes.find(n => n.id === selectedNode);
    if (!node) return null;
    
    return {
      node,
      type: selectedType,
      data: node.data
    };
  }, [selectedNode, selectedType, mapNodes]);

  // Unique connections
  const { pairs } = useMemo(() => {
    const seen = new Set<string>();
    const arr: Array<{ a: Region; b: Region }> = [];
    for (const a of nodes) {
      (a.connections || []).forEach(id => {
        const b = nodes.find(r => r.id === id);
        if (!b) return;
        const key = [a.id, b.id].sort().join('::');
        if (!seen.has(key)) {
          seen.add(key);
          arr.push({ a, b });
        }
      });
    }
    return { pairs: arr };
  }, [nodes]);

  return (
    <div className="h-screen text-white overflow-hidden relative ml-80 lg:ml-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-purple-950/20" />

      {/* Header */}
      <header className="relative z-50 h-16 lg:h-20 border-b border-white/10 backdrop-blur-xl bg-black/30">
        <div className="h-full flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {}}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Network className="w-8 h-8 text-cyan-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  NEURAL NEXUS
                </h1>
                <p className="text-xs text-white/60 font-mono">Global Network Monitor</p>
              </div>
            </div>
          </div>  
          <div className="hidden md:flex bg-white/5 rounded-xl border border-white/10 p-1">
          {(['global', 'regional', 'local'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                viewMode === mode
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>        
        </div>        
      </header>

      {/* Main */}
      <div className="relative flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]">
        {/* Sidebar */}
        <aside className="w-80 lg:w-96 bg-black/40 backdrop-blur-2xl border-r border-white/10 hidden lg:flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">World Nodes</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {nodes.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  const regionNodeId = `region:${r.name}`;
                  setSelectedNode(regionNodeId);
                  setSelectedType('region');
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  selectedNode === `region:${r.name}`
                    ? 'bg-cyan-500/10 border-cyan-400/30 shadow-lg shadow-cyan-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-sm">{r.name}</h3>
                    <p className="text-xs text-white/60 mt-1">{r.subtitle}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getThreatClasses(r.threat)}`}>
                    {r.threat.toUpperCase()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-white/60">Population:</span>
                    <span className="ml-2 text-white font-mono">{r.population}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Links:</span>
                    <span className="ml-2 text-cyan-400 font-mono">{r.connections?.length ?? 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Zoom: {Math.round(zoom * 100)}%</span>
              <div className="flex space-x-2">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
                setSelectedNode(null);
                setSelectedType(null);
                setExpandedNodes(new Set());
                setMapNodes(nodes.map(r => ({
                  id: `region:${r.name}`,
                  name: r.name,
                  type: 'region' as const,
                  position: r.position,
                  data: r
                })));
                setHierarchicalEdges([]);
              }}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" /> Reset View
            </button>
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative overflow-hidden bg-black">
          <div
            ref={mapRef}
            className="absolute inset-0 cursor-move select-none"
            onMouseDown={onMapMouseDown}
          >
            {/* Grid */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
                backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
              }}
            />

            {/* Connection lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0.6)" />
                  <stop offset="50%" stopColor="rgba(59, 130, 246, 0.4)" />
                  <stop offset="100%" stopColor="rgba(139, 92, 246, 0.6)" />
                </linearGradient>
              </defs>
              {pairs.map(({ a, b }) => {
                const aSelected = selectedNode === `region:${a.name}`;
                const bSelected = selectedNode === `region:${b.name}`;
                const aHovered = hoveredRegion === a.id;
                const bHovered = hoveredRegion === b.id;
                const active = aSelected || bSelected || aHovered || bHovered;
                return (
                  <line
                    key={`${a.id}-${b.id}`}
                    x1={`${a.position.x}%`}
                    y1={`${a.position.y}%`}
                    x2={`${b.position.x}%`}
                    y2={`${b.position.y}%`}
                    stroke="url(#connectionGradient)"
                    strokeWidth={active ? 3 : 1}
                    opacity={active ? 0.9 : 0.35}
                    className={active ? 'animate-pulse' : ''}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            <div
              className="absolute inset-0"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              {nodes.map((r) => (
                <div
                  key={r.id}
                  className="absolute cursor-grab active:cursor-grabbing group"
                  style={{ left: `${r.position.x}%`, top: `${r.position.y}%`, transform: 'translate(-50%, -50%)' }}
                  onMouseDown={(e) => onNodeMouseDown(e, `region:${r.name}`, 'region')}
                  onClick={() => onNodeClick(`region:${r.name}`, 'region')}
                  onMouseEnter={() => setHoveredRegion(r.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                >
                  {/* Animated glow + orbit ring */}
                  <div className="absolute -inset-3 rounded-3xl node-glow pointer-events-none" />

                  {/* Region image/icon above node */}
                  {r.imageUrl ? (
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-10">
                      <img
                        src={r.imageUrl}
                        alt={r.name + ' icon'}
                        className="w-16 h-16 lg:w-20 lg:h-20 object-contain rounded-xl border border-white/30 bg-black/40"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="p-2 rounded-lg bg-black/30 text-emerald-300">
                        <Network className="w-6 h-6" />
                      </div>
                    </div>
                  )}

                  {/* Node body */}
                  <div className={`relative w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br ${r.color} border-2 border-white/20 shadow-2xl transition-all duration-500 ${
                    selectedNode === `region:${r.name}` ? 'scale-125 border-white/60 shadow-cyan-500/50' :
                    hoveredRegion === r.id  ? 'scale-110 border-white/40' : 'hover:scale-105'
                  }`}>
                    <div className="absolute inset-2 rounded-xl bg-black/20 border border-white/10" />
                  </div>

                  {/* Node name always visible below node */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-1 text-center min-w-max">
                      <span className="font-semibold text-white text-sm">{r.name}</span>
                    </div>
                  </div>

                  {/* Label (subtitle/threat) on hover/selection */}
                  {(selectedNode === `region:${r.name}` || hoveredRegion === r.id) && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-10 transition-all">
                      <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2 text-center min-w-max">
                        <div className="text-xs text-white/60 mt-1">{r.subtitle}</div>
                        <div className="flex items-center justify-center space-x-2 mt-2 text-xs">
                          <span className="text-white/60">Threat:</span>
                          <span className={`font-mono ${getThreatClasses(r.threat).split(' ')[0]}`}>{r.threat}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ))}

              {/* Hierarchical edges SVG */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
              >
                <defs>
                  <linearGradient id="parentEdgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" />
                    <stop offset="100%" stopColor="rgba(34, 197, 94, 0.4)" />
                  </linearGradient>
                </defs>
                {hierarchicalEdges.map((edge, index) => {
                  const fromNode = mapNodes.find(n => n.id === edge.from);
                  const toNode = mapNodes.find(n => n.id === edge.to);
                  if (!fromNode || !toNode) return null;
                  
                  // Calculate direction vector
                  const dx = toNode.position.x - fromNode.position.x;
                  const dy = toNode.position.y - fromNode.position.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  
                  if (distance === 0) return null;
                  
                  const unitX = dx / distance;
                  const unitY = dy / distance;
                  
                  // Calculate visual radii in percentage units
                  const fromIsRegion = fromNode.type === 'region';
                  const fromRadiusPercent = fromIsRegion ? 4 : (fromNode.type === 'place' ? 2.5 : 1.8);
                  const toRadiusPercent = toNode.type === 'place' ? 2.5 : 1.8;
                  
                  // Calculate anchor points on node borders
                  const fromAnchor = {
                    x: fromNode.position.x + fromRadiusPercent * unitX,
                    y: fromNode.position.y + fromRadiusPercent * unitY
                  };
                  const toAnchor = {
                    x: toNode.position.x - toRadiusPercent * unitX,
                    y: toNode.position.y - toRadiusPercent * unitY
                  };
                  
                  const active = selectedNode === edge.from || selectedNode === edge.to;
                  
                  return (
                    <line
                      key={`${edge.from}-${edge.to}-${index}`}
                      x1={`${fromAnchor.x}%`}
                      y1={`${fromAnchor.y}%`}
                      x2={`${toAnchor.x}%`}
                      y2={`${toAnchor.y}%`}
                      stroke={edge.type === 'parent' ? 'url(#parentEdgeGradient)' : 'url(#connectionGradient)'}
                      strokeWidth={active ? 3 : 2}
                      opacity={active ? 1 : 0.7}
                      strokeDasharray={edge.type === 'parent' ? '0' : '5,5'}
                      strokeLinecap="round"
                      className={active ? 'animate-pulse' : ''}
                    />
                  );
                })}
              </svg>

              {/* Hierarchical nodes (places and subplaces) */}
              {mapNodes.filter(node => node.type !== 'region').map((node) => {
                const isSelected = selectedNode === node.id;
                const isHovered = hoveredRegion === node.id;
                
                return (
                  <div
                    key={node.id}
                    className="absolute cursor-pointer group"
                    style={{ left: `${node.position.x}%`, top: `${node.position.y}%`, transform: 'translate(-50%, -50%)' }}
                    onClick={() => onNodeClick(node.id, node.type)}
                    onMouseEnter={() => setHoveredRegion(node.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    {/* Different shapes for different node types */}
                    {node.type === 'place' ? (
                      <div className={`w-12 h-12 rounded-full border-2 bg-white/10 border-cyan-400 flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isSelected ? 'scale-125 border-white/60 shadow-cyan-500/50' :
                        isHovered ? 'scale-110 border-white/40' : 'hover:scale-105'
                      }`}>
                        {getPlaceIcon((node.data as Place).type)}
                      </div>
                    ) : (
                      // Diamond shape for subplaces
                      <div className={`w-8 h-8 bg-purple-400/20 border-2 border-purple-400 transform rotate-45 flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isSelected ? 'scale-125 border-white/60 shadow-purple-500/50' :
                        isHovered ? 'scale-110 border-white/40' : 'hover:scale-105'
                      }`}>
                        <div className="transform -rotate-45">
                          <Target className="w-3 h-3 text-purple-300" />
                        </div>
                      </div>
                    )}
                    
                    {/* Improved node label with radial offset positioning */}
                    {(() => {
                      const nodeData = node.data as any;
                      const angle = nodeData?.angle || 0;
                      
                      // Calculate label position with radial offset in percentage units
                      const labelOffsetPercent = node.type === 'place' ? 6 : 4; // Larger offset for better spacing
                      const offsetX = Math.cos(angle) * labelOffsetPercent;
                      const offsetY = Math.sin(angle) * labelOffsetPercent;
                      
                      return (
                        <div 
                          className="absolute pointer-events-none"
                          style={{ 
                            left: `calc(${offsetX}% + 50%)`,
                            top: `calc(${offsetY}% + 50%)`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          <div 
                            className="bg-black/90 backdrop-blur-xl border border-white/30 rounded-md px-2 py-1 text-center shadow-lg"
                            style={{ 
                              maxWidth: '120px',
                              fontSize: '11px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={node.name} // Tooltip for full name on hover
                          >
                            <span className="font-medium text-white leading-tight">
                              {node.name}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Panel */}
          {selectedNodeData && (
            <div className="absolute top-6 right-6 w-80 lg:w-96 bg-black/60 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden">
              {selectedType === 'region' && (
                <>
                  <div className={`p-6 bg-gradient-to-r ${(selectedNodeData.data as Region).color} relative`}>
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative text-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{selectedNodeData.node.name}</h3>
                          <p className="text-sm opacity-90 mt-1">{(selectedNodeData.data as Region).subtitle}</p>
                        </div>
                        <button onClick={() => {
                          setSelectedNode(null);
                          setSelectedType(null);
                        }} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="text-xs text-white/60 mb-1">Population</div>
                        <div className="text-lg font-mono">{(selectedNodeData.data as Region).population}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="text-xs text-white/60 mb-1">Threat</div>
                        <div className="text-lg font-mono">{(selectedNodeData.data as Region).threat}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">System Overview</h4>
                      <p className="text-sm text-white/70 leading-relaxed">{(selectedNodeData.data as Region).description}</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <h4 className="text-sm font-semibold text-white mb-3">Key Locations</h4>
                      <div className="space-y-1">
                        {(selectedNodeData.data as Region).keyLocations.map((k: string, i: number) => (
                          <div key={i} className="text-sm text-white/80 flex items-center">
                            <Target className="w-4 h-4 mr-2 text-cyan-400" /> {k}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedType === 'place' && (
                <>
                  <div className="p-6 bg-gradient-to-r from-cyan-600 to-blue-600 relative">
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative text-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{selectedNodeData.node.name}</h3>
                          <p className="text-sm opacity-90 mt-1">{(selectedNodeData.data as Place).type}</p>
                        </div>
                        <button onClick={() => {
                          setSelectedNode(null);
                          setSelectedType(null);
                        }} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="text-xs text-white/60 mb-1">Size</div>
                        <div className="text-lg font-mono capitalize">{(selectedNodeData.data as Place).size}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="text-xs text-white/60 mb-1">Importance</div>
                        <div className="text-lg font-mono">{(selectedNodeData.data as Place).importance}/10</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Description</h4>
                      <p className="text-sm text-white/70 leading-relaxed">{(selectedNodeData.data as Place).description}</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <h4 className="text-sm font-semibold text-white mb-3">Belongs to</h4>
                      <div className="text-sm text-white/80 flex items-center">
                        <Network className="w-4 h-4 mr-2 text-cyan-400" /> 
                        {selectedNode?.split(':')[1]}
                      </div>
                    </div>

                    {(selectedNodeData.data as Place).connections && (selectedNodeData.data as Place).connections!.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <h4 className="text-sm font-semibold text-white mb-3">Connections</h4>
                        <div className="space-y-1">
                          {(selectedNodeData.data as Place).connections!.map((conn: string, i: number) => (
                            <div key={i} className="text-sm text-white/80 flex items-center">
                              <Target className="w-4 h-4 mr-2 text-purple-400" /> {conn}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {selectedType === 'subplace' && (
                <>
                  <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 relative">
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative text-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{selectedNodeData.node.name}</h3>
                          <p className="text-sm opacity-90 mt-1">Subplace</p>
                        </div>
                        <button onClick={() => {
                          setSelectedNode(null);
                          setSelectedType(null);
                        }} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Description</h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {(selectedNodeData.data as SubPlace).description || 'No description available.'}
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <h4 className="text-sm font-semibold text-white mb-3">Child of</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-white/80 flex items-center">
                          <Target className="w-4 h-4 mr-2 text-cyan-400" /> 
                          {selectedNode?.split(':')[2]} / {selectedNode?.split(':')[1]}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="h-12 bg-zinc-900 border-t border-zinc-700 flex items-center px-6">
        <div className="flex items-center space-x-6 text-xs font-mono text-zinc-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>NODES: {nodes.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span>ZOOM: {Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>MODE: {viewMode.toUpperCase()}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-4 text-xs font-mono text-zinc-400">
          <span>NEURAL NEXUS v2.1.4</span>
          <div className="h-4 w-px bg-zinc-700" />
          <span>UPTIME: 99.7%</span>
        </div>
      </div>

      {/* Node glow + orbit animation */}
  <style>{`
        @keyframes nodePulse {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,.35); }
          70%  { box-shadow: 0 0 0 16px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        @keyframes slowRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .node-glow {
          animation: nodePulse 2.8s ease-out infinite;
          filter: blur(6px);
          background:
            radial-gradient(40% 40% at 50% 50%, rgba(59,130,246,.35), transparent 60%),
            radial-gradient(60% 60% at 60% 40%, rgba(139,92,246,.25), transparent 70%);
        }
        .node-glow::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 24px;
          border: 1px dashed rgba(255,255,255,.18);
          animation: slowRotate 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default InteractiveMap;
