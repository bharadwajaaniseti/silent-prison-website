import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Target, Network } from 'lucide-react';

interface Region {
  name: string;
  position: { x: number; y: number };
  color: string;
  population: string;
  threat: string;
  description: string;
  keyLocations: string[];
  connections: string[];
}

interface MapNode {
  id: string;
  name: string;
  type: 'region';
  position: { x: number; y: number };
  data: Region;
}

interface Connection {
  from: string;
  to: string;
  distance: number;
}

interface SelectedNodeData {
  node: MapNode;
  data: Region;
}

interface DynamicInteractiveMapProps {
  nodes: Region[];
  connections: Connection[];
}

const DynamicInteractiveMap: React.FC<DynamicInteractiveMapProps> = ({ nodes, connections }) => {
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'region' | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);

  // Initialize map nodes from regions
  useEffect(() => {
    const regionNodes: MapNode[] = nodes.map(region => ({
      id: `region:${region.name}`,
      name: region.name,
      type: 'region' as const,
      position: region.position,
      data: region
    }));
    
    setMapNodes(regionNodes);
  }, [nodes]);

  const onNodeClick = useCallback((nodeId: string) => {
    const node = mapNodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(nodeId);
      setSelectedType('region');
    }
  }, [mapNodes]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * zoomFactor)));
  };

  // Get selected node data
  const selectedNodeData: SelectedNodeData | null = selectedNode
    ? (() => {
        const node = mapNodes.find(n => n.id === selectedNode);
        return node ? { node, data: node.data } : null;
      })()
    : null;

  const DynamicInteractiveMapComponent = () => {
    const canvasWidth = 800;
    const canvasHeight = 600;

    return (
      <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        {/* Controls */}
        <div className="absolute top-6 left-6 z-50 space-y-3">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 space-y-3">
            <button
              onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
            >
              <ZoomIn className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(0.1, prev * 0.8))}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
            >
              <ZoomOut className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
                setSelectedNode(null);
                setSelectedType(null);
                setMapNodes(nodes.map(r => ({
                  id: `region:${r.name}`,
                  name: r.name,
                  type: 'region' as const,
                  position: r.position,
                  data: r
                })));
              }}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
            >
              <RotateCcw className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="w-full h-full relative">
          <div
            ref={mapRef}
            className="w-full h-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'center center'
            }}
          >
            {/* Region nodes */}
            {mapNodes.map((node) => {
              const isSelected = selectedNode === node.id;
              const isHovered = hoveredRegion === node.id;

              return (
                <div
                  key={node.id}
                  className="absolute cursor-pointer group"
                  style={{ 
                    left: `${node.position.x}%`, 
                    top: `${node.position.y}%`, 
                    transform: 'translate(-50%, -50%)' 
                  }}
                  onClick={() => onNodeClick(node.id)}
                  onMouseEnter={() => setHoveredRegion(node.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                >
                  {/* Region node circle */}
                  <div className={`w-16 h-16 rounded-full border-4 ${node.data.color} flex items-center justify-center shadow-2xl transition-all duration-500 ${
                    isSelected ? 'scale-125 border-white/60 shadow-blue-500/50' :
                    isHovered ? 'scale-110 border-white/40' : 'hover:scale-105'
                  }`}>
                    <Network className="w-8 h-8 text-white" />
                  </div>

                  {/* Region label */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 pointer-events-none">
                    <div className="bg-black/90 backdrop-blur-xl border border-white/30 rounded-lg px-3 py-1 text-center shadow-lg">
                      <span className="font-semibold text-white text-sm leading-tight">
                        {node.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(79, 172, 254, 0.8)" />
                  <stop offset="100%" stopColor="rgba(0, 242, 254, 0.8)" />
                </linearGradient>
              </defs>
              
              {connections.map((connection, index) => {
                const fromNode = mapNodes.find(n => n.name === connection.from);
                const toNode = mapNodes.find(n => n.name === connection.to);
                
                if (!fromNode || !toNode) return null;
                
                const active = selectedNode === fromNode.id || selectedNode === toNode.id;
                
                return (
                  <line
                    key={`${connection.from}-${connection.to}-${index}`}
                    x1={`${fromNode.position.x}%`}
                    y1={`${fromNode.position.y}%`}
                    x2={`${toNode.position.x}%`}
                    y2={`${toNode.position.y}%`}
                    stroke="url(#connectionGradient)"
                    strokeWidth={active ? 3 : 1.5}
                    opacity={active ? 1 : 0.6}
                    strokeDasharray="5,5"
                    className="connection-line"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Info Panel */}
        {selectedNodeData && (
          <div className="absolute top-6 right-6 w-80 lg:w-96 bg-black/60 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden">
            <div className={`p-6 bg-gradient-to-r ${selectedNodeData.data.color} relative`}>
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{selectedNodeData.node.name}</h3>
                    <p className="text-sm opacity-90 mt-1">Region</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedNode(null);
                      setSelectedType(null);
                    }} 
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-xs text-white/60 mb-1">Population</div>
                  <div className="text-lg font-mono">{selectedNodeData.data.population}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-xs text-white/60 mb-1">Threat</div>
                  <div className="text-lg font-mono">{selectedNodeData.data.threat}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">System Overview</h4>
                <p className="text-sm text-white/70 leading-relaxed">{selectedNodeData.data.description}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <h4 className="text-sm font-semibold text-white mb-3">Key Locations</h4>
                <div className="space-y-1">
                  {selectedNodeData.data.keyLocations.map((k: string, i: number) => (
                    <div key={i} className="text-sm text-white/80 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-cyan-400" /> {k}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-zinc-900 border-t border-zinc-700 flex items-center px-6">
          <div className="flex items-center space-x-6 text-xs font-mono text-zinc-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Regions: {nodes.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Connections: {connections.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Selected: {selectedNode ? selectedNode.split(':')[1] : 'None'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span>Zoom: {Math.round(zoom * 100)}%</span>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes nodePulse {
            0%   { box-shadow: 0 0 0 0 rgba(59,130,246,.35); }
            70%  { box-shadow: 0 0 0 16px rgba(59,130,246,0); }
            100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
          }
          
          @keyframes connectionFlow {
            0% { stroke-dashoffset: 20; }
            100% { stroke-dashoffset: 0; }
          }
          
          .connection-line:hover {
            animation: connectionFlow 0.8s ease-in-out infinite;
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .glass-panel {
            background: rgba(0, 0, 0, 0.65);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
          }
        `}</style>
      </div>
    );
  };

  return <DynamicInteractiveMapComponent />;
};

export default DynamicInteractiveMap;
