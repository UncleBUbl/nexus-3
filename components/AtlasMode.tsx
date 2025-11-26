import React, { useState } from 'react';
import { ArrowLeft, Map, Search, Navigation, ExternalLink, Loader2, MapPin } from 'lucide-react';
import { useAtlas } from '../hooks/useAtlas';

interface Props {
  onBack: () => void;
}

const RichTextRenderer: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="whitespace-pre-wrap leading-relaxed text-gray-200">
      {text.split('\n').map((line, i) => (
        <p key={i} className="mb-2">{line}</p>
      ))}
    </div>
  );
};

const AtlasMode: React.FC<Props> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const { result, loading, error, search } = useAtlas();

  const handleSearch = () => {
    search(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-gold">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center space-x-3">
          <Map className="text-nexus-gold" size={28} />
          <h2 className="text-3xl font-bold tracking-wider text-nexus-gold">THE ATLAS</h2>
        </div>
        <span className="bg-nexus-gold/10 text-nexus-gold text-xs font-mono px-2 py-1 rounded border border-nexus-gold/20">
            GEOSPATIAL ENGINE ONLINE
        </span>
      </div>

      <div className="flex flex-col gap-6 h-full">
        
        {/* Search Input */}
        <div className="bg-nexus-panel border border-white/10 rounded-xl p-6 shadow-lg relative">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter location directive (e.g., 'Best ramen spots in Tokyo', 'Distance from SF to LA')..."
              className="w-full bg-black/50 text-white pl-12 pr-32 py-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-nexus-gold text-lg font-sans placeholder-gray-600"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className={`absolute right-2 top-2 bottom-2 px-6 rounded-md font-bold tracking-wide transition-all flex items-center justify-center space-x-2 ${
                loading 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-nexus-gold text-black hover:bg-yellow-400 hover:shadow-[0_0_15px_#facc15]'
              }`}
            >
               {loading ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
               <span className="hidden md:inline">NAVIGATE</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg flex items-center space-x-2 animate-in fade-in">
            <Navigation size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Results Area */}
        {result && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">
             
             {/* Map Analysis */}
             <div className="lg:col-span-2 bg-nexus-panel border border-nexus-gold/30 rounded-xl p-6 md:p-8 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
                <div className="flex items-center space-x-2 mb-6 border-b border-white/10 pb-4">
                   <div className="w-2 h-2 bg-nexus-gold rounded-full animate-pulse"></div>
                   <h3 className="text-nexus-gold font-bold tracking-widest uppercase text-sm">Strategic Analysis</h3>
                </div>
                <RichTextRenderer text={result.content} />
             </div>

             {/* Acquired Targets (Pins) */}
             <div className="lg:col-span-1 space-y-4">
                <div className="bg-nexus-panel border border-white/10 rounded-xl p-4 h-full">
                   <h3 className="text-gray-500 font-bold tracking-widest uppercase text-xs mb-4 flex items-center space-x-2">
                      <MapPin size={14} />
                      <span>Acquired Targets</span>
                   </h3>
                   
                   <div className="space-y-3">
                      {result.sources.length === 0 ? (
                         <div className="text-gray-600 italic text-sm text-center py-4">No location data found in scan.</div>
                      ) : (
                         result.sources.map((source, idx) => (
                            <a 
                               key={idx} 
                               href={source.uri} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="block group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-nexus-gold/50 rounded-lg p-3 transition-all duration-300 relative overflow-hidden"
                            >
                               <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-nexus-gold">
                                  <ExternalLink size={14} />
                               </div>
                               <div className="text-nexus-gold text-[10px] font-mono mb-1 truncate pr-6">{new URL(source.uri).hostname}</div>
                               <div className="text-white text-sm font-bold line-clamp-2 leading-tight group-hover:text-nexus-gold transition-colors">
                                  {source.title}
                               </div>
                            </a>
                         ))
                      )}
                   </div>
                </div>
             </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default AtlasMode;