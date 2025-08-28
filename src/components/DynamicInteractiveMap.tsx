import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Network,
  Zap,
  Globe,
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
}

interface InteractiveMapProps {
  regions?: Region[]; // optional pre-fetched
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ regions }) => {
  // Loading real data (DB -> apiFetchRegions), with safe fallback
  const [loadedRegions, setLoadedRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (regions) {
        setLoadedRegions(regions);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const apiRegions = await apiFetchRegions();
        if (!cancelled) setLoadedRegions(apiRegions ?? []);
      } catch (e) {
        console.error('Failed to load regions', e);
        if (!cancelled) setLoadedRegions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
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

  // UI state
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'global' | 'regional' | 'local'>('global');

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

  const onNodeMouseDown = (e: React.MouseEvent, r: Region) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedRegion(r.id);

    // compute offset so the node doesn't jump under the cursor
    const p = clientToPercent(e.clientX, e.clientY);
    setDragNode({
      id: r.id,
      offX: r.position.x - p.x,
      offY: r.position.y - p.y,
    });
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

  const selected = nodes.find(r => r.id === selectedRegion) || null;

  // Unique connections
  const { totalLinks, pairs } = useMemo(() => {
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
    return { totalLinks: seen.size, pairs: arr };
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
                onClick={() => setSelectedRegion(r.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  selectedRegion === r.id
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
                setSelectedRegion(null);
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
                const active = selectedRegion === a.id || selectedRegion === b.id || hoveredRegion === a.id || hoveredRegion === b.id;
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
                  onMouseDown={(e) => onNodeMouseDown(e, r)}
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
                    selectedRegion === r.id ? 'scale-125 border-white/60 shadow-cyan-500/50' :
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
                  {(selectedRegion === r.id || hoveredRegion === r.id) && (
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

                  {/* Places as circular nodes around the main node, with connecting lines */}
                  {selectedRegion === r.id && r.places?.length > 0 && (
                    <>
                      {/* SVG lines from main node to each place */}
                      <svg className="absolute left-1/2 top-1/2" style={{ pointerEvents: 'none', width: '180px', height: '180px', transform: 'translate(-50%, -50%)' }}>
                        {(r.places ?? []).map((p, i) => {
                          const radius = 80; // px from center
                          const angle = (2 * Math.PI * i) / (r.places ?? []).length;
                          const x = 90 + radius * Math.cos(angle);
                          const y = 90 + radius * Math.sin(angle);
                          return (
                            <line
                              key={p.id}
                              x1={90}
                              y1={90}
                              x2={x}
                              y2={y}
                              stroke="#38bdf8"
                              strokeWidth={2}
                              opacity={0.7}
                            />
                          );
                        })}
                      </svg>
                      {/* Place nodes */}
                      {(r.places ?? []).map((p, i) => {
                        const radius = 80; // px from center
                        const angle = (2 * Math.PI * i) / (r.places ?? []).length;
                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle);
                        return (
                          <div
                            key={p.id}
                            className="absolute"
                            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: 'translate(-50%, -50%)' }}
                            onMouseEnter={() => setHoveredLocation(p.id)}
                            onMouseLeave={() => setHoveredLocation(null)}
                          >
                            <div className="w-10 h-10 rounded-full border-2 bg-white/10 border-cyan-400 flex items-center justify-center shadow-lg">
                              {getPlaceIcon(p.type)}
                            </div>
                            <div className="mt-1 text-xs text-white text-center font-semibold max-w-[80px] truncate">
                              {p.name}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info Panel */}
          {selected && (
            <div className="absolute top-6 right-6 w-80 lg:w-96 bg-black/60 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden">
              <div className={`p-6 bg-gradient-to-r ${selected.color} relative`}>
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{selected.name}</h3>
                      <p className="text-sm opacity-90 mt-1">{selected.subtitle}</p>
                    </div>
                    <button onClick={() => setSelectedRegion(null)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="text-xs text-white/60 mb-1">Population</div>
                    <div className="text-lg font-mono">{selected.population}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="text-xs text-white/60 mb-1">Threat</div>
                    <div className="text-lg font-mono">{selected.threat}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">System Overview</h4>
                  <p className="text-sm text-white/70 leading-relaxed">{selected.description}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">Key Locations</h4>
                  <div className="space-y-1">
                    {selected.keyLocations.map((k, i) => (
                      <div key={i} className="text-sm text-white/80 flex items-center">
                        <Target className="w-4 h-4 mr-2 text-cyan-400" /> {k}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
