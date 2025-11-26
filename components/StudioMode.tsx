import React, { useState } from 'react';
import { ArrowLeft, Palette, Sparkles, ShoppingBag, Download, Loader2, Tag, DollarSign, Image as ImageIcon, FileText, Package, Edit3, Save } from 'lucide-react';
import { useStudio } from '../hooks/useStudio';

interface Props {
  onBack: () => void;
  initialPrompt?: string;
}

const StudioMode: React.FC<Props> = ({ onBack, initialPrompt }) => {
  const [idea, setIdea] = useState(initialPrompt || '');
  const [shopName, setShopName] = useState('NEXUS STUDIOS');
  const [isEditing, setIsEditing] = useState(false);
  
  const { loading, step, listing, error, createProduct, updateListing, downloadProductPack, reset } = useStudio();

  // If initial prompt is passed and we haven't started, auto-create
  React.useEffect(() => {
    if (initialPrompt && !listing && !loading) {
       createProduct(initialPrompt);
    }
  }, []);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-pink">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center space-x-3">
          <Palette className="text-nexus-pink" size={28} />
          <h2 className="text-3xl font-bold tracking-wider text-nexus-pink">THE STUDIO</h2>
        </div>
        <span className="bg-nexus-pink/10 text-nexus-pink text-xs font-mono px-2 py-1 rounded border border-nexus-pink/20 hidden md:inline">
            DIGITAL PRODUCT WORKSTATION
        </span>
      </div>

      <div className="flex flex-col gap-6 h-full">
        
        {/* Input Area - Hide if results shown to focus on refinement */}
        {!listing && (
            <div className="bg-nexus-panel border border-white/10 rounded-xl p-6 shadow-lg">
               <div className="flex flex-col md:flex-row gap-4">
                  <input
                     type="text"
                     value={idea}
                     onChange={(e) => setIdea(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && createProduct(idea)}
                     placeholder="Describe your digital product idea (e.g., 'Boho minimal wall art', 'Wedding planner checklist')..."
                     className="flex-1 bg-black/50 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-nexus-pink text-sm md:text-base font-sans"
                     disabled={loading}
                  />
                  <button
                     onClick={() => createProduct(idea)}
                     disabled={loading || !idea.trim()}
                     className={`px-6 py-3 rounded-lg font-bold tracking-wide transition-all flex items-center justify-center space-x-2 ${
                        loading
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-nexus-pink text-black hover:bg-pink-400 hover:shadow-[0_0_15px_#ec4899]'
                     }`}
                  >
                     {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                     <span className="hidden md:inline">CREATE</span>
                  </button>
               </div>
               
               {/* Progress Steps */}
               {loading && (
                 <div className="mt-8 flex items-center justify-center space-x-8 text-xs font-mono">
                   <div className={`flex items-center space-x-2 ${step === 'metadata' ? 'text-nexus-pink animate-pulse' : 'text-gray-600'}`}>
                     <ShoppingBag size={14} />
                     <span>STRATEGIZING LISTING...</span>
                   </div>
                   <div className="h-px w-8 bg-gray-800"></div>
                   <div className={`flex items-center space-x-2 ${step === 'image' ? 'text-nexus-pink animate-pulse' : 'text-gray-600'}`}>
                     <ImageIcon size={14} />
                     <span>GENERATING ASSET...</span>
                   </div>
                 </div>
               )}
            </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg flex items-center space-x-2 animate-in fade-in">
            <Sparkles size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* WORKSTATION VIEW */}
        {listing && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-700">
              
              {/* LEFT: VISUAL ASSET */}
              <div className="flex flex-col space-y-4">
                 <div className="flex justify-between items-center">
                    <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Generated Asset</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600 text-xs font-mono">BRAND:</span>
                        <input 
                            type="text" 
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            className="bg-transparent border-b border-gray-700 text-nexus-pink text-xs font-bold w-32 focus:outline-none focus:border-nexus-pink uppercase"
                        />
                    </div>
                 </div>
                 
                 <div className="bg-black border-2 border-white/10 rounded-xl aspect-square relative flex items-center justify-center overflow-hidden shadow-2xl group">
                    {listing.imageBase64 ? (
                       <img 
                          src={`data:image/jpeg;base64,${listing.imageBase64}`} 
                          alt="Generated Product" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                       />
                    ) : (
                       <div className="flex flex-col items-center space-y-2 text-nexus-pink animate-pulse">
                          <ImageIcon size={48} />
                          <span className="font-mono text-xs">RENDERING PIXELS...</span>
                       </div>
                    )}
                 </div>
                 
                 {listing.imageBase64 && (
                    <button 
                       onClick={() => downloadProductPack(shopName)}
                       className="bg-white/5 hover:bg-nexus-pink hover:text-black hover:shadow-neon-pink border border-white/10 text-white py-4 rounded-lg font-bold text-center transition-all flex items-center justify-center space-x-3 group"
                    >
                       <Package size={20} className="group-hover:scale-110 transition-transform" />
                       <div className="flex flex-col items-start leading-none">
                          <span className="tracking-wide text-sm">DOWNLOAD COMPLETE PDF BUNDLE</span>
                          <span className="text-[10px] opacity-70 mt-1 font-normal font-mono">INCLUDES: LISTING, ASSET, & LICENSE</span>
                       </div>
                    </button>
                 )}
                 
                 <button 
                    onClick={() => { reset(); setIdea(''); }}
                    className="text-gray-500 hover:text-white text-xs underline text-center pt-2"
                 >
                    Start New Project
                 </button>
              </div>

              {/* RIGHT: METADATA EDITOR */}
              <div className="bg-nexus-panel border border-nexus-pink/30 rounded-xl p-6 space-y-6 shadow-[0_0_30px_rgba(236,72,153,0.1)] flex flex-col h-full">
                 
                 <div className="flex justify-between items-start border-b border-white/10 pb-4">
                    <div>
                        <h3 className="text-nexus-pink font-bold uppercase tracking-widest text-xs mb-1">Listing Metadata</h3>
                        <p className="text-gray-500 text-[10px] font-mono">OPTIMIZED FOR ETSY SEO</p>
                    </div>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-nexus-pink text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        title={isEditing ? "Save Changes" : "Edit Metadata"}
                    >
                        {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
                    </button>
                 </div>

                 <div className="space-y-4 flex-1 overflow-y-auto scrollbar-thin pr-2">
                    {/* Title */}
                    <div>
                        <label className="text-gray-500 text-[10px] uppercase font-bold block mb-1">Product Title</label>
                        {isEditing ? (
                            <textarea
                                value={listing.title}
                                onChange={(e) => updateListing({ title: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm text-white focus:border-nexus-pink focus:outline-none resize-none h-20"
                            />
                        ) : (
                            <h1 className="text-lg font-bold text-white leading-tight">{listing.title}</h1>
                        )}
                    </div>

                    {/* Price */}
                    <div>
                        <label className="text-gray-500 text-[10px] uppercase font-bold block mb-1">Strategy Pricing</label>
                        {isEditing ? (
                            <input 
                                type="text"
                                value={listing.price}
                                onChange={(e) => updateListing({ price: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm text-green-400 font-mono focus:border-nexus-pink focus:outline-none"
                            />
                        ) : (
                            <div className="flex items-center space-x-4">
                                <div className="bg-green-900/20 border border-green-500/30 px-3 py-1 rounded text-green-400 font-mono text-sm flex items-center space-x-1">
                                <DollarSign size={14} />
                                <span>{listing.price}</span>
                                </div>
                                <div className="text-gray-500 text-xs font-mono">INSTANT DOWNLOAD</div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-gray-500 text-[10px] uppercase font-bold block mb-1">Description</label>
                        {isEditing ? (
                            <textarea
                                value={listing.description}
                                onChange={(e) => updateListing({ description: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-gray-300 leading-relaxed focus:border-nexus-pink focus:outline-none resize-none h-40"
                            />
                        ) : (
                            <div className="bg-white/5 p-4 rounded-lg text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {listing.description}
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="text-gray-500 text-[10px] uppercase font-bold block mb-2 flex items-center gap-2">
                            <Tag size={12} />
                            <span>Search Tags ({listing.tags.length})</span>
                        </label>
                        {isEditing ? (
                            <textarea
                                value={listing.tags.join(', ')}
                                onChange={(e) => updateListing({ tags: e.target.value.split(',').map(t => t.trim()) })}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-gray-400 font-mono focus:border-nexus-pink focus:outline-none h-24"
                                placeholder="Separate tags with commas..."
                            />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {listing.tags.map((tag, i) => (
                                <span key={i} className="bg-black border border-white/20 px-2 py-1 rounded text-[10px] text-gray-400 font-mono">
                                    #{tag}
                                </span>
                                ))}
                            </div>
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

export default StudioMode;