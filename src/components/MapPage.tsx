import React, { useState, useEffect } from 'react';
import { apiFetchRegions } from '../api/regions';
import DynamicInteractiveMap from './DynamicInteractiveMap';
import { Shield, Skull, Users, MapPin, X } from 'lucide-react';

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
}

// Region Information Panel
const RegionInfoPanel: React.FC<{
  region: Region | null;
  onClose: () => void;
  allRegions: Region[];
}> = ({ region, onClose, allRegions }) => {
  if (!region) return null;

  const connectedRegions = region.connections?.map(id => 
    allRegions.find(r => r.id === id)
  ).filter((r): r is Region => r !== undefined) || [];

  const getThreatColor = (threat: string) => {
    switch (threat.toLowerCase()) {
      case 'low': case 'safe': return 'text-green-400';
      case 'medium': case 'moderate': return 'text-yellow-400';
      case 'high': case 'dangerous': return 'text-orange-400';
      case 'extreme': case 'lethal': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="absolute top-4 right-4 w-96 bg-black/90 border border-cyan-400/50 rounded-xl backdrop-blur-sm z-50 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-cyan-400/30">
        <h2 className="font-orbitron text-xl font-bold text-cyan-300">{region.name}</h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-cyan-400/20 rounded-lg transition-colors"
        >
          <X size={18} className="text-cyan-400" />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Subtitle */}
        <p className="text-cyan-200 font-medium">{region.subtitle}</p>
        
        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{region.description}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Users size={16} className="text-blue-400" />
              <span className="text-xs font-medium text-gray-400">Population</span>
            </div>
            <p className="text-blue-300 font-semibold">{region.population}</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Shield size={16} className={getThreatColor(region.threat)} />
              <span className="text-xs font-medium text-gray-400">Threat Level</span>
            </div>
            <p className={`font-semibold ${getThreatColor(region.threat)}`}>{region.threat}</p>
          </div>
        </div>

        {/* Key Locations */}
        {region.keyLocations && region.keyLocations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
              <MapPin size={14} className="mr-1" />
              Key Locations
            </h3>
            <div className="space-y-1">
              {region.keyLocations.map((location, index) => (
                <div key={index} className="bg-gray-800/30 rounded px-3 py-2">
                  <span className="text-cyan-200 text-sm">{location}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected Regions */}
        {connectedRegions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Connected Regions</h3>
            <div className="space-y-2">
              {connectedRegions.map((connectedRegion) => (
                <div key={connectedRegion.id} className="bg-gray-800/30 rounded px-3 py-2 flex items-center justify-between">
                  <div>
                    <span className="text-cyan-200 text-sm font-medium">{connectedRegion.name}</span>
                    <p className="text-gray-400 text-xs">{connectedRegion.subtitle}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No connections warning */}
        {(!region.connections || region.connections.length === 0) && (
          <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3">
            <p className="text-orange-300 text-sm">
              ⚠️ This region appears isolated with no established connections to other regions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Dynamic Interactive Map Component with Region Selection
const EnhancedDynamicMap: React.FC<{
  regions: Region[];
  onRegionSelect: (region: Region) => void;
}> = ({ regions, onRegionSelect }) => {
  return (
    <div className="relative w-full h-full">
      <DynamicInteractiveMap 
        regions={regions}
        onRegionClick={onRegionSelect}
      />
    </div>
  );
};

// Main Map Page Component
const MapPage: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const fetchedRegions = await apiFetchRegions();
        setRegions(fetchedRegions);
      } catch (err) {
        setError('Failed to load regions');
        console.error('Error loading regions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRegions();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-300 font-orbitron">Loading Regional Network...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Skull className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 font-orbitron">{error}</p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 pl-16">
        <div className="relative h-[80vh] w-full">
          <EnhancedDynamicMap 
            regions={regions}
            onRegionSelect={setSelectedRegion}
          />
          <RegionInfoPanel 
            region={selectedRegion}
            onClose={() => setSelectedRegion(null)}
            allRegions={regions}
          />
        </div>
      </div>
  );
};

export default MapPage;
