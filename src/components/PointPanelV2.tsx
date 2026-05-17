import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, MapPin, Navigation2, Zap, Globe, Clock, 
  Star, Phone, ChevronLeft, ChevronRight,
  Cloud, Wind, Droplets, Thermometer,
  ShieldAlert, Wifi, MessageSquare, Maximize2, Minimize2,
  Share2, ArrowUpRight, Activity
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { LocationPoint } from '@/src/types';

interface PointPanelV2Props {
  point: LocationPoint | null;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  weatherData?: {
    temp: number;
    description: string;
    humidity: number;
    windSpeed: number;
    icon: string;
  } | null;
  onIntegrateRoute?: (point: LocationPoint) => void;
}

const PointPanelV2: React.FC<PointPanelV2Props> = ({ 
  point, 
  onClose, 
  isMinimized, 
  onToggleMinimize,
  weatherData,
  onIntegrateRoute
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [point?.id]);

  // Derived state that only makes sense if point exists
  const images = point ? (point.images && point.images.length > 0 
    ? point.images 
    : (point.image ? [point.image] : [])) : [];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Helper to extract comments from description if they follow the "💬 Experiência Real" pattern
  const extractComments = (desc?: string) => {
    if (!desc) return null;
    if (desc.includes('💬 Experiência Real:')) {
      return desc.split('💬 Experiência Real:')[1].trim();
    }
    return null;
  };

  const realExperience = extractComments(point?.description);

  return (
    <AnimatePresence mode="wait">
      {point && (
        <motion.div
          initial={isMinimized ? { opacity: 0, y: 100, scale: 0.95 } : { opacity: 0, x: 20 }}
          animate={isMinimized ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, x: 0 }}
          exit={isMinimized ? { opacity: 0, y: 100, scale: 0.95 } : { opacity: 0, x: 20 }}
          className={cn(
            "fixed z-[3000] bg-[#0b0c0d] border border-white/10 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden",
            isMinimized 
              ? "bottom-24 right-6 w-64 h-24 rounded-lg" 
              : "bottom-0 left-0 right-0 h-[92vh] md:h-auto md:max-h-[85vh] md:bottom-auto md:top-24 md:right-8 md:left-auto md:w-[450px] rounded-t-3xl md:rounded-xl"
          )}
          style={{ 
            boxShadow: !isMinimized ? "0 0 50px rgba(255, 100, 29, 0.2), 0 0 100px rgba(0,0,0,0.9)" : "none",
            border: !isMinimized ? "1px solid rgba(255, 100, 29, 0.3)" : "1px solid rgba(255,255,255,0.1)"
          }}
        >
          {/* Header Controls (Minimize/Close) */}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button 
              onClick={onToggleMinimize}
              className="w-10 h-10 bg-black/40 backdrop-blur-xl border border-white/20 rounded-md flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-95"
            >
              {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-[#ff641d]/20 backdrop-blur-xl border border-[#ff641d]/40 rounded-md flex items-center justify-center text-[#ff641d] hover:bg-[#ff641d] hover:text-white transition-all active:scale-95 shadow-[0_0_15px_rgba(255,100,29,0.3)]"
            >
              <X size={20} />
            </button>
          </div>

          {isMinimized ? (
            <div 
              className="flex items-center gap-4 h-full px-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={onToggleMinimize}
            >
               <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center overflow-hidden shrink-0">
                  {images.length > 0 ? (
                    <img src={images[0]} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                  ) : <MapPin size={24} className="text-[#ff641d]/40" />}
               </div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-[14px] font-display font-black text-white uppercase tracking-tight truncate leading-tight">{point.name}</span>
                  <span className="text-[10px] font-mono text-[#ff641d] uppercase tracking-[0.2em]">STATION_MINIMIZED</span>
               </div>
            </div>
          ) : (
            <>
              {/* Internal Scrollable Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                
                {/* 1. Tactical Gallery HUD */}
                <div className="relative h-72 bg-black overflow-hidden group/gallery">
                  {images.length > 0 ? (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={currentImageIndex}
                          src={images[currentImageIndex]}
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.5 }}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </AnimatePresence>
                      
                      {images.length > 1 ? (
                        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                          <button 
                            onClick={prevImage}
                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-[#ff641d] transition-all"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button 
                            onClick={nextImage}
                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-[#ff641d] transition-all"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      ) : (
                         <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none opacity-0 group-hover/gallery:opacity-100 transition-opacity">
                            <ChevronLeft size={20} className="text-white/20" />
                            <ChevronRight size={20} className="text-white/20" />
                         </div>
                      )}

                      {/* Image Indicators */}
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                        {images.map((_, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "h-1 rounded-full transition-all duration-300",
                              currentImageIndex === i ? "w-6 bg-[#ff641d] shadow-[0_0_10px_#ff641d]" : "w-1.5 bg-white/30"
                            )} 
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.02] border-b border-white/10">
                      <Zap size={48} className="text-[#ff641d]/10 animate-pulse mb-2" />
                      <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.5em]">NO_VISUAL_FEED</span>
                    </div>
                  )}

                  {/* Operational Overlays */}
                  <div className="absolute top-6 left-6 pointer-events-none">
                    <div className="px-3 py-1 bg-[#ff641d] text-white text-[9px] font-mono font-black uppercase tracking-[0.3em] shadow-xl">
                      FEED_TACTICAL_V2
                    </div>
                  </div>
                  <div className="absolute bottom-6 right-6 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-md px-3 py-1 border border-white/10 rounded-full text-[10px] font-mono text-white/60">
                      {images.length > 0 ? `${currentImageIndex + 1} / ${images.length}` : '0 / 0'}
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* 2. Main Title Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-[1px] w-8 bg-[#ff641d]" />
                      <span className="text-[10px] font-mono font-black text-[#ff641d] uppercase tracking-[0.4em]">STATION_REPORT</span>
                      <div className="h-[1px] flex-1 bg-white/10" />
                    </div>
                    
                    <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-6 leading-[0.9]">
                      {point.name}
                    </h2>

                    <div className="grid grid-cols-1 gap-4">
                      {point.address && (
                        <div className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-sm group hover:border-[#ff641d]/20 transition-all">
                          <MapPin size={18} className="text-[#ff641d] shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                            <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">LOCALIZAÇÃO</span>
                            <span className="text-sm font-mono text-white/80 leading-snug">{point.address}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:border-[#ff641d]/20 transition-all">
                        <Navigation2 size={18} className="text-[#ff641d] shrink-0 mt-0.5" />
                        <div className="flex flex-col flex-1">
                          <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">COORDENADAS_GPS</span>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-mono text-white/80">{point.lat.toFixed(6)}, {point.lng.toFixed(6)}</span>
                            <button className="text-[9px] font-mono text-[#ff641d] hover:underline uppercase font-bold">COPIAR</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Operational Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#ff641d]/10 flex items-center justify-center">
                        <Star size={18} className="text-[#ff641d]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-mono text-white font-black">{point.rating || "N/A"}</span>
                        <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest">AVALIAÇÕES</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#ff641d]/10 flex items-center justify-center">
                        <Clock size={18} className="text-[#ff641d]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-mono text-white font-black">{point.hours || "24H"}</span>
                        <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest">HORÁRIO</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm flex items-center gap-4 group cursor-pointer hover:bg-[#ff641d]/5 transition-all">
                      <div className="w-10 h-10 rounded-full bg-[#ff641d]/10 flex items-center justify-center">
                        <Phone size={18} className="text-[#ff641d]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-mono text-white font-black truncate max-w-[120px]">{point.phone?.split(' ')[0] || "---"}</span>
                        <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest">TELEFONE</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm flex items-center gap-4 group cursor-pointer hover:bg-[#ff641d]/5 transition-all">
                      <div className="w-10 h-10 rounded-full bg-[#ff641d]/10 flex items-center justify-center">
                        <Globe size={18} className="text-[#ff641d]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-[#ff641d] font-black uppercase tracking-tight">VISITAR SITE</span>
                        <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest">WEBSITE</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Comments Section (DADOS DO SISTEMA) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={16} className="text-[#ff641d]" />
                      <h3 className="text-sm font-mono font-black text-white uppercase tracking-[0.2em]">COMENTÁRIOS DA COMUNIDADE</h3>
                    </div>
                    
                    <div className="p-6 bg-white/[0.02] border border-white/10 rounded-sm space-y-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff641d]/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
                       
                       {realExperience ? (
                         <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                               <span className="text-[9px] font-mono text-[#ff641d] font-bold uppercase tracking-widest">RELATO_OPERACIONAL_VERIFICADO</span>
                               <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">ID: {point.id}</span>
                            </div>
                            <p className="text-[11px] font-mono text-white/60 leading-relaxed uppercase whitespace-pre-wrap italic">
                              {realExperience}
                            </p>
                            <div className="pt-2 flex justify-between items-center text-[7px] font-mono text-white/30">
                               <span>FONTE: EXPLORER_NETWORK</span>
                               <span className="flex items-center gap-1">CERTIFICADO <ShieldAlert size={8} className="text-green-500" /></span>
                            </div>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center justify-center py-8 opacity-40 grayscale group hover:opacity-100 transition-opacity">
                            <MessageSquare size={32} className="mb-4 text-white/20 group-hover:text-[#ff641d] transition-colors" />
                            <p className="text-[10px] font-mono text-white uppercase tracking-[0.3em] text-center">NENHUM RELATO CRÍTICO REGISTRADO POR ENQUANTO</p>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* 5. Clima Local Tactical Widget */}
                  <div className="bg-[#0b0c0d] border border-white/10 rounded-lg overflow-hidden">
                    <div className="p-3 bg-white/[0.04] border-b border-white/5 flex items-center justify-between">
                       <span className="text-[8px] font-mono text-white/40 uppercase tracking-[0.4em]">CLIMA_LOCAL_MONITOR</span>
                       <div className="flex items-center gap-1 text-[8px] font-mono text-[#ff641d] animate-pulse">
                          <Activity size={10} />
                          <span>SINAL_GPS_ATIVO</span>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-3 divide-x divide-white/5">
                      {/* Weather Info 1 */}
                      <div className="p-6 flex flex-col items-center justify-center gap-3 group">
                        <div className="relative">
                          {weatherData ? (
                            <img 
                              src={`https://openweathermap.org/img/wn/${weatherData.icon}@4x.png`} 
                              className="w-12 h-12 drop-shadow-[0_0_10px_rgba(255,100,29,0.4)] group-hover:scale-110 transition-transform" 
                              alt="weather"
                            />
                          ) : (
                            <Cloud size={24} className="text-white/20" />
                          )}
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] font-mono text-white/80 uppercase tracking-tighter block mb-1">
                            {weatherData?.description || "CÉU LIMPO"}
                          </span>
                          <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest whitespace-nowrap">CONDIÇÕES_ATM</span>
                        </div>
                      </div>

                      {/* Weather Info 2 */}
                      <div className="p-6 flex flex-col items-center justify-center gap-2 group">
                        <div className="text-3xl font-display font-black text-white flex items-start">
                          {weatherData?.temp || 26}
                          <span className="text-[14px] text-[#ff641d] mt-1 ml-0.5">°C</span>
                        </div>
                        <div className="text-center space-y-1">
                          <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest block">TEMPERATURA</span>
                          <div className="flex h-1 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className="w-[60%] bg-[#ff641d]" />
                          </div>
                        </div>
                      </div>

                      {/* Weather Info 3 */}
                      <div className="p-6 flex flex-col items-center justify-center gap-3 group">
                        <Wind size={24} className="text-white/20 group-hover:text-[#ff641d] transition-colors" />
                        <div className="text-center">
                          <span className="text-[14px] font-mono font-black text-white">
                            {weatherData?.windSpeed || 7} <span className="text-[8px] font-normal text-white/40 uppercase">KM/H</span>
                          </span>
                          <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest block">VENTOS_RAJADA</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. Operational Status HUD */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={12} className="text-green-500" />
                        <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest">SEGURANÇA_ISOLAMENTO</span>
                      </div>
                      <div className={cn(
                        "text-[10px] font-mono font-black",
                        point.isolationLevel === 'LOW' ? "text-green-500" :
                        point.isolationLevel === 'MEDIUM' ? "text-yellow-500" :
                        "text-red-500"
                      )}>
                        {point.isolationLevel || "ESTÁVEL"}
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Wifi size={12} className="text-cyan-400" />
                        <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest">STATUS_OPERACIONAL</span>
                      </div>
                      <div className={cn(
                        "text-[10px] font-mono font-black",
                        point.operationalStatus === 'STABLE' ? "text-cyan-400" :
                        point.operationalStatus === 'WARNING' ? "text-yellow-500" :
                        "text-red-500"
                      )}>
                        {point.operationalStatus || "ATIVO"}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="p-6 bg-black/80 border-t border-white/10 backdrop-blur-2xl relative">
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff641d]/50 to-transparent" />
                
                <button 
                  onClick={() => onIntegrateRoute?.(point)}
                  className="w-full h-20 bg-[#ff641d] text-white text-[12px] font-mono font-black uppercase tracking-[0.4em] hover:bg-white hover:text-[#ff641d] transition-all flex items-center justify-center gap-4 shadow-[0_15px_40px_rgba(255,100,29,0.4)] rounded-sm group/btn relative overflow-hidden active:scale-95"
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                  <Navigation2 size={24} className="group-hover/btn:rotate-45 transition-transform" />
                  <span>INTEGRAR_ROTA_ESTATÍSTICA</span>
                </button>
                
                <div className="flex justify-between items-center mt-4">
                   <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-[#ff641d] rounded-full animate-pulse" />
                      <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">SYSTEM_READY</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <button className="text-white/20 hover:text-white transition-colors"><Share2 size={14} /></button>
                      <button className="text-white/20 hover:text-white transition-colors"><ArrowUpRight size={14} /></button>
                   </div>
                </div>
              </div>
            </>
          )}

          {/* Glitch Overlay Effect */}
          {!isMinimized && (
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PointPanelV2;
