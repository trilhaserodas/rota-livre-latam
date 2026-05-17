import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  X, MapPin, Navigation2, Zap, Globe, Clock, 
  Star, Phone, ChevronLeft, ChevronRight,
  Cloud, Wind, Droplets, Thermometer,
  ShieldAlert, Wifi, MessageSquare, Maximize2, Minimize2,
  Share2, ArrowUpRight, Activity, Trash2, Send
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { LocationPoint, CommunityReport } from '@/src/types';
import { db, auth } from '@/src/lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, limit 
} from 'firebase/firestore';

interface PointPanelV2Props {
  point: LocationPoint | null;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  weatherData?: {
    temp: number;
    feelsLike: number;
    description: string;
    humidity: number;
    windSpeed: number;
    icon: string;
  } | null;
  isLoadingWeather?: boolean;
  onIntegrateRoute?: (point: LocationPoint) => void;
}

const PointPanelV2: React.FC<PointPanelV2Props> = ({ 
  point, 
  onClose, 
  isMinimized, 
  onToggleMinimize,
  weatherData,
  isLoadingWeather,
  onIntegrateRoute
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    text: '',
    category: 'estrada' as CommunityReport['category'],
    type: 'danger' as CommunityReport['type']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
    
    if (!point?.id) return;

    // Fetch Tactical Reports for this point
    const reportsQuery = query(
      collection(db, 'reports'),
      where('pointId', '==', point.id),
      where('status', '==', 'APPROVED'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityReport[];
      setReports(reportsData);
    });

    return () => unsubscribe();
  }, [point?.id]);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!point?.id || !newReport.text || !newReport.name) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        pointId: point.id,
        userName: newReport.name,
        content: newReport.text,
        category: newReport.category,
        reportType: newReport.type,
        status: 'PENDING',
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous'
      });
      setIsReportModalOpen(false);
      setNewReport({ name: '', text: '', category: 'estrada', type: 'danger' });
      // Suggestion: could add a toast here
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          onDragEnd={(_, info) => {
                            if (info.offset.x < -50) nextImage({ stopPropagation: () => {} } as any);
                            if (info.offset.x > 50) prevImage({ stopPropagation: () => {} } as any);
                          }}
                          className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
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
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <MessageSquare size={16} className="text-[#ff641d]" />
                         <h3 className="text-sm font-mono font-black text-white uppercase tracking-[0.2em]">DADOS_SISTEMA</h3>
                       </div>
                       <button 
                         onClick={() => setIsReportModalOpen(true)}
                         className="px-3 py-1 bg-[#ff641d]/10 border border-[#ff641d]/30 text-[#ff641d] text-[8px] font-mono font-bold uppercase tracking-widest rounded-sm hover:bg-[#ff641d] hover:text-white transition-all shadow-[0_0_10px_rgba(255,100,29,0.2)]"
                       >
                         ENVIAR RELATÓRIO
                       </button>
                     </div>
                     
                     <div className="p-6 bg-white/[0.02] border border-white/10 rounded-sm space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff641d]/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        
                        {realExperience ? (
                          <div className="space-y-4 relative z-10">
                             <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-[9px] font-mono text-[#ff641d] font-bold uppercase tracking-widest">RELATO_OPERACIONAL_VERIFICADO</span>
                             </div>
                             <p className="text-[11px] font-mono text-white/60 leading-relaxed uppercase whitespace-pre-wrap italic">
                               {realExperience}
                             </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4 opacity-40 grayscale">
                             <p className="text-[8px] font-mono text-white uppercase tracking-[0.3em] text-center italic">SEM RELATOS DE SISTEMA</p>
                          </div>
                        )}
                     </div>

                     {/* Tactical Community Reports */}
                     <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                           <Activity size={14} className="text-[#ff641d]" />
                           <h3 className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.3em]">Tactical Community Reports</h3>
                        </div>

                        <div className="space-y-3">
                           {reports.length > 0 ? reports.map((report) => (
                             <motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               key={report.id} 
                               className="p-4 bg-white/[0.03] border border-white/10 rounded-sm relative group/report overflow-hidden"
                             >
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#ff641d] opacity-40 group-hover/report:opacity-100 transition-opacity" />
                                <div className="flex justify-between items-start mb-2">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-mono font-black text-white uppercase">{report.userName}</span>
                                      <span className="text-[7px] font-mono text-[#ff641d] uppercase tracking-widest">CATEGORIA_{report.category}</span>
                                   </div>
                                   <span className="text-[7px] font-mono text-white/20">
                                      {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'REAL_TIME'}
                                   </span>
                                </div>
                                <p className="text-[10px] font-mono text-white/70 leading-relaxed uppercase">{report.content}</p>
                             </motion.div>
                           )) : (
                             <div className="py-8 border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center opacity-30">
                                <MessageSquare size={20} className="mb-2" />
                                <span className="text-[8px] font-mono uppercase tracking-widest">AGUARDANDO_INTELIGÊNCIA_DRIVE</span>
                             </div>
                           )}
                        </div>
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
                    
                      <div className="grid grid-cols-2 divide-y md:divide-y-0 md:grid-cols-4 divide-white/5 relative min-h-[100px]">
                        {isLoadingWeather && (
                          <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-[4px] flex items-center justify-center">
                             <div className="flex flex-col items-center gap-2">
                                <Activity size={18} className="text-[#ff641d] animate-spin" />
                                <span className="text-[9px] font-mono text-[#ff641d] font-bold uppercase tracking-[0.2em]">BUSCANDO_DADOS_CLIMÁTICOS...</span>
                             </div>
                          </div>
                        )}
                        
                        {/* Weather Condition */}
                        <div className="p-4 flex flex-col items-center justify-center gap-3 group border-r border-white/5">
                          <div className="relative">
                            {weatherData ? (
                              <img 
                                src={weatherData.icon} 
                                className="w-12 h-12 drop-shadow-[0_0_15px_rgba(255,100,29,0.5)] group-hover:scale-125 transition-transform" 
                                alt="weather"
                              />
                            ) : (
                              <Cloud size={24} className={cn("text-white/10", isLoadingWeather && "animate-pulse")} />
                            )}
                          </div>
                          <div className="text-center">
                            <span className="text-[12px] font-mono text-white font-black uppercase tracking-tight block leading-none truncate max-w-[100px]">
                              {weatherData?.description || (isLoadingWeather ? "SYNC..." : "SINAL CLIMÁTICO INDISPONÍVEL")}
                            </span>
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] leading-none mt-1.5 font-bold group-hover:text-[#ff641d] transition-colors">CONDIÇÕES_ATM</span>
                          </div>
                        </div>

                        {/* Temperature */}
                        <div className="p-4 flex flex-col items-center justify-center gap-1 group border-r border-white/5">
                          <div className="text-3xl font-display font-black text-white flex items-start group-hover:scale-110 transition-transform">
                            {weatherData ? weatherData.temp : "--"}
                            <span className="text-[16px] text-[#ff641d] mt-1 ml-0.5">°C</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] block mb-2 font-bold group-hover:text-[#ff641d] transition-colors">TEMPERATURA</span>
                            <div className="flex items-center justify-center gap-1 px-2 py-0.5 bg-white/5 rounded-full">
                               <Thermometer size={12} className="text-[#ff641d]/80" />
                               <span className="text-[10px] font-mono text-white/90 font-black uppercase whitespace-nowrap">ST: {weatherData ? `${weatherData.feelsLike}°C` : "--"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Wind */}
                        <div className="p-4 flex flex-col items-center justify-center gap-2 group border-r border-white/5">
                          <Wind size={24} className="text-white/30 group-hover:text-[#ff641d] transition-colors group-hover:rotate-12" />
                          <div className="text-center">
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-[18px] font-mono font-black text-white leading-none">
                                {weatherData ? Math.round(weatherData.windSpeed) : "--"}
                              </span>
                              <span className="text-[9px] font-black text-white/30 uppercase tracking-tighter">KM/H</span>
                            </div>
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] block leading-none mt-2 font-bold group-hover:text-[#ff641d] transition-colors">VENTOS_RAJADA</span>
                          </div>
                        </div>

                        {/* Stats (Rain/Humid) */}
                        <div className="p-4 flex flex-col items-center justify-center gap-2 group">
                          <Droplets size={24} className="text-white/30 group-hover:text-blue-400 transition-colors group-hover:-translate-y-1" />
                          <div className="text-center">
                             <div className="flex items-baseline justify-center gap-1">
                              <span className="text-[18px] font-mono font-black text-white leading-none">
                                {weatherData ? weatherData.humidity : "--"}
                              </span>
                              <span className="text-[10px] font-black text-white/30 ml-0.5">%</span>
                            </div>
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] block leading-none mt-2 font-bold group-hover:text-blue-400 transition-colors">HUMIDADE_REL</span>
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

      {/* Tactical Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[#0b0c0d] border border-white/10 rounded-xl overflow-hidden shadow-[0_0_100px_rgba(255,100,29,0.3)]"
            >
               <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div>
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">NOVO_RELATÓRIO_TÁTICO</h3>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">EMISSÃO_STATION: {point?.name}</p>
                  </div>
                  <button 
                    onClick={() => setIsReportModalOpen(false)}
                    className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
               </div>

               <form onSubmit={handleSubmitReport} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono text-[#ff641d] uppercase tracking-[0.2em]">IDENTIFICAÇÃO_EXPLORADOR</label>
                       <input 
                         required
                         value={newReport.name}
                         onChange={e => setNewReport({...newReport, name: e.target.value})}
                         placeholder="NOME / APELIDO"
                         className="w-full h-12 bg-white/5 border border-white/10 rounded-sm px-4 font-mono text-xs text-white placeholder:text-white/20 focus:border-[#ff641d]/50 focus:outline-none focus:ring-0 transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono text-[#ff641d] uppercase tracking-[0.2em]">CATEGORIA_RELATO</label>
                       <select 
                         value={newReport.category}
                         onChange={e => setNewReport({...newReport, category: e.target.value as any})}
                         className="w-full h-12 bg-white/5 border border-white/10 rounded-sm px-4 font-mono text-xs text-white focus:border-[#ff641d]/50 focus:outline-none transition-all appearance-none cursor-pointer"
                       >
                          <option value="segurança">SEGURANÇA</option>
                          <option value="água">ÁGUA_RECAPE</option>
                          <option value="camping">CAMPING_BASE</option>
                          <option value="hostel">HOSTEL_MONITOR</option>
                          <option value="oficina">OFICINA_TÉCNICA</option>
                          <option value="estrada">CONDIÇÃO_VIA</option>
                          <option value="clima">ATU_ATMOSFÉRICA</option>
                          <option value="perigo">PONTO_CRÍTICO</option>
                          <option value="fiscalização">POLICIAMENTO</option>
                          <option value="fronteira">ZONA_ADUANEIRA</option>
                       </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-mono text-[#ff641d] uppercase tracking-[0.2em]">DATA_REPORT (TEXTO_CURTO)</label>
                    <textarea 
                      required
                      value={newReport.text}
                      onChange={e => setNewReport({...newReport, text: e.target.value})}
                      placeholder="DESCREVA A SITUAÇÃO TÁTICA ATUAL COM PRECISÃO..."
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-sm p-4 font-mono text-xs text-white placeholder:text-white/20 focus:border-[#ff641d]/50 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                       <span className="text-[8px] font-mono text-white/20 uppercase">TIPO_OCORRÊNCIA</span>
                       <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'flood', label: 'ENCHENTE', icon: Droplets },
                            { id: 'danger', label: 'PERIGO', icon: ShieldAlert },
                            { id: 'road_blocked', label: 'BLOQUEIO', icon: X },
                            { id: 'storm', label: 'TEMPESTADE', icon: Cloud }
                          ].map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setNewReport({...newReport, type: item.id as any})}
                              className={cn(
                                "p-2 border rounded-sm flex items-center gap-2 transition-all",
                                newReport.type === item.id 
                                  ? "bg-[#ff641d]/20 border-[#ff641d] text-[#ff641d]" 
                                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                              )}
                            >
                               <item.icon size={12} />
                               <span className="text-[8px] font-mono uppercase">{item.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="flex flex-col justify-end">
                       <button 
                         disabled={isSubmitting}
                         type="submit"
                         className="w-full h-16 bg-[#ff641d] text-white text-[12px] font-mono font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white hover:text-[#ff641d] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                       >
                         {isSubmitting ? (
                           <Activity size={20} className="animate-spin" />
                         ) : (
                           <>
                             <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                             ENVIAR_EMISSÃO
                           </>
                         )}
                       </button>
                    </div>
                  </div>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default PointPanelV2;
