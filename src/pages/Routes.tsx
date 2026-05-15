import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Compass, MapPin, Share2, Activity, Copy, Check, X, 
  Twitter, Send, MessageCircle, Info, Heart, Bike, Triangle, Zap,
  Upload, FileJson, AlertCircle, Loader2, Mail, Download, HardDrive, CloudOff,
  Brain, ShieldAlert, Sparkles
} from 'lucide-react';
import SEO from '@/src/components/SEO';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/src/lib/utils';
import { db, auth } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import RouteWeather from '@/src/components/RouteWeather';
import FavoriteToast from '@/src/components/FavoriteToast';
import TacticalHUD from '@/src/components/TacticalHUD';
import { analyzeRouteIntelligence, RouteAnalysisResult } from '@/src/services/geminiService';

const routes = [
  {
    id: 'carretera-austral',
    name: 'CARRETERA_AUSTRAL',
    country: 'CHILE',
    km: '1.240',
    types: ['bike', 'moto'],
    displayType: 'BIKE / MOTO',
    difficulty: 'MÉDIO_ALTO',
    lat: -45.57,
    lng: -72.07,
    description: 'A rota mais cênica da Patagônia Chilena, cruzando glaciares e florestas temperadas.',
    image: 'https://images.unsplash.com/photo-1518104593124-ac2e82a5eb9d?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'ruta-40',
    name: 'RUTA_40',
    country: 'ARGENTINA',
    km: '5.194',
    types: ['moto', 'overland'],
    displayType: 'MOTO / OVERLAND',
    difficulty: 'EXTREMO',
    lat: -50.34,
    lng: -72.27,
    description: 'De La Quiaca a Ushuaia, a lendária espinha dorsal dos Andes Argentinos.',
    image: 'https://images.unsplash.com/photo-1498677231914-50deb6ba421a?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'transamazonica',
    name: 'TRANSAMAZÔNICA',
    country: 'BRASIL',
    km: '4.260',
    types: ['overland', 'moto'],
    displayType: 'OVERLAND / MOTO',
    difficulty: 'CRÍTICO',
    lat: -3.20,
    lng: -52.21,
    description: 'O maior desafio da América do Sul. Poeira, lama e a imensidão da floresta amazônica.',
    image: 'https://images.unsplash.com/photo-1502484433149-bc9197c3664c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'circuito-huayhuash',
    name: 'HUAYHUASH_CIRCUIT',
    country: 'PERU',
    km: '130',
    types: ['bike'],
    displayType: 'MTB / TREKKING',
    difficulty: 'ALTO_ALTITUDE',
    lat: -10.28,
    lng: -76.92,
    description: 'Considerada uma das rotas de montanha mais bonitas do mundo em altas altitudes.',
    image: 'https://images.unsplash.com/photo-1544198305-e0d02447990c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'transmantiqueira',
    name: 'TRANSMANTIQUEIRA',
    country: 'BRASIL',
    km: '1.200',
    types: ['bike'],
    displayType: 'MTB_EXPEDITION',
    difficulty: 'ALTO',
    lat: -22.39,
    lng: -44.97,
    description: 'Atravessa a Serra da Mantiqueira por trilhas e estradas de terra históricas.',
    image: 'https://images.unsplash.com/photo-1541625602330-2277a4c4b282?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'lagunas-route',
    name: 'LAGUNAS_ROUTE',
    country: 'BOLIVIA',
    km: '450',
    types: ['overland', 'moto', 'bike'],
    displayType: 'OVERLAND / ADVENTURE',
    difficulty: 'EXTREMO',
    lat: -22.0,
    lng: -67.5,
    description: 'Entre o Salar de Uyuni e San Pedro de Atacama. Deserto e lagunas coloridas a 4500m.',
    image: 'https://images.unsplash.com/photo-1463123081488-789f99849c48?auto=format&fit=crop&q=80&w=800'
  }
];

const filterOptions = [
  { id: 'all', name: 'TODOS_OS_DADOS', icon: Activity },
  { id: 'bike', name: 'CICLO_EXPEDIÇÃO', icon: Bike }, 
  { id: 'moto', name: 'MOTO_TRAVESSIA', icon: Zap },
  { id: 'overland', name: 'OVERLAND_OPS', icon: Compass },
];

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: string;
  routeName: string;
}

function ShareModal({ isOpen, onClose, routeId, routeName }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/rotas/${routeId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialShares = [
    { name: 'WhatsApp', icon: MessageCircle, url: `https://wa.me/?text=Confira esta rota no Rota Livre Hub: ${routeName} em ${shareUrl}` },
    { name: 'Telegram', icon: Send, url: `https://t.me/share/url?url=${shareUrl}&text=Confira esta rota: ${routeName}` },
    { name: 'Twitter', icon: Twitter, url: `https://twitter.com/intent/tweet?text=Explorando a rota ${routeName} no @RotaLivreHub!&url=${shareUrl}` },
    { name: 'Email', icon: Mail, url: `mailto:?subject=Rota: ${routeName}&body=Confira esta rota no Rota Livre Hub: ${shareUrl}` },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0b0c0d]/90 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md dashboard-card p-8 border-white/10 bg-[#121417] overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#ff641d]"></div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-[10px] font-mono tracking-[0.4em] text-[#ff641d] mb-4 uppercase">OPS_INTEL // SHARE_PROTOCOL</div>
            <h3 className="text-2xl font-display font-black uppercase tracking-tighter text-[#F8FAFC] mb-2 leading-none">
              COMPARTILHAR<span className="text-[#ff641d]">.</span>DADOS
            </h3>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-8">Disseminando inteligência logística continental.</p>

            <div className="space-y-6">
              <div>
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-3">LINK_ACESSO:</div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-sm h-12 flex items-center px-4 overflow-hidden">
                    <span className="text-[10px] font-mono text-white/40 truncate tracking-widest">{shareUrl}</span>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="w-12 h-12 bg-[#ff641d] text-white flex items-center justify-center rounded-sm hover:bg-[#ff641d]/80 transition-all flex-shrink-0"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-4">REDE_EXTERNA:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {socialShares.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:border-[#ff641d]/30 transition-all group"
                    >
                      <social.icon size={20} className="text-white/20 group-hover:text-[#ff641d] transition-colors" />
                      <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest group-hover:text-white/40">{social.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/5 flex justify-center">
               <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full">
                  <Info size={10} className="text-[#ff641d]" />
                  <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20">Acelerando a liberdade na estrada.</span>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ContributionModal({ isOpen, onClose }: ContributionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Necessário autenticação.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Explorer',
        content: description,
        category: 'TRAIL_LOG',
        location: 'PENDING_ANALYSIS',
        status: 'PENDING',
        createdAt: serverTimestamp(),
        fileName: file?.name || 'manual_entry'
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFile(null);
        setDescription('');
      }, 3000);
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0b0c0d]/95 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg dashboard-card p-8 border-white/10 bg-[#121417] overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#ff641d]"></div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {submitted ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="text-green-500" size={32} />
                </div>
                <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-2">DADOS_CARREGADOS</h3>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Sua contribuição está sendo processada por analistas de rota.</p>
              </div>
            ) : (
              <>
                <div className="text-[10px] font-mono tracking-[0.4em] text-[#ff641d] mb-4 uppercase">OPS_INTEL // SUBMISSION_PHASE</div>
                <h3 className="text-2xl font-display font-black uppercase tracking-tighter text-[#F8FAFC] mb-4 leading-none">
                  REGISTRO<span className="text-[#ff641d]">.</span>DE<span className="text-[#ff641d]">.</span>RASTREAMENTO
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-white/5 bg-white/[0.02] rounded-sm p-10 text-center cursor-pointer hover:border-[#ff641d]/40 transition-all"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".gpx,.kml,.json"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center gap-4">
                      {file ? (
                        <div className="text-[#ff641d] flex flex-col items-center gap-2">
                          <FileJson size={32} />
                          <span className="text-[10px] font-mono uppercase tracking-widest">{file.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="text-white/10 group-hover:text-[#ff641d] transition-colors" size={32} />
                          <div>
                            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">ARRASTE OU CLIQUE PARA CARREGAR GPX</div>
                            <div className="text-[8px] font-mono text-white/10 uppercase tracking-widest">FORMATOS ACEITOS: GPX, KML, JSON</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">OBSERVAÇÕES_DE_CAMPO:</div>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="DETALHE CONDIÇÕES DA PISTA, PONTOS DE ÁGUA OU ALERTAS..."
                      className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-[10px] font-mono text-white focus:outline-none focus:border-[#ff641d]/50 h-32 resize-none placeholder:text-white/10"
                      required
                    />
                  </div>

                  {!auth.currentUser && (
                    <div className="flex items-center gap-3 p-4 bg-red-900/10 border border-red-900/20 rounded-sm">
                      <AlertCircle className="text-red-500" size={16} />
                      <span className="text-[8px] font-mono text-red-500 uppercase tracking-widest">LOGIN_REQUERIDO_PARA_ENVIO_DE_INTELIGÊNCIA</span>
                    </div>
                  )}

                  <button 
                    disabled={isSubmitting || !description || !auth.currentUser}
                    type="submit"
                    className="w-full h-14 bg-[#ff641d] text-white font-mono font-bold text-[11px] uppercase tracking-[0.4em] hover:bg-[#ff641d]/80 disabled:bg-white/5 disabled:text-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'CONFIRMAR_CARREGAMENTO'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function Routes() {
  const [activeShare, setActiveShare] = useState<{ id: string; name: string } | null>(null);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // AI Insights State
  const [routeAIs, setRouteAIs] = useState<Record<string, RouteAnalysisResult>>({});
  const [analyzingRouteId, setAnalyzingRouteId] = useState<string | null>(null);

  const handleAIScan = async (routeId: string, routeName: string, country: string, vehicleType: string) => {
    setAnalyzingRouteId(routeId);
    try {
      const result = await analyzeRouteIntelligence({
        region: `${routeName}, ${country}`,
        vehicle: vehicleType,
        weather: "Sazonal local",
        expeditionType: "EXPLORATION_MODE"
      });
      setRouteAIs(prev => ({ ...prev, [routeId]: result }));
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzingRouteId(null);
    }
  };
  const [offlineRoutes, setOfflineRoutes] = useState<string[]>(() => {
    const saved = localStorage.getItem('offline_routes_data');
    if (!saved) return [];
    try {
      const data = JSON.parse(saved);
      return Object.keys(data);
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorite_routes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleOffline = (id: string) => {
    const route = routes.find(r => r.id === id);
    if (!route) return;

    const savedData = localStorage.getItem('offline_routes_data');
    let data = savedData ? JSON.parse(savedData) : {};

    if (offlineRoutes.includes(id)) {
      delete data[id];
      setOfflineRoutes(prev => prev.filter(r => r !== id));
      setToast({ isVisible: true, isFavorite: false, routeName: `${route.name} REMOVIDA_DO_OFFLINE` });
    } else {
      data[id] = route;
      setOfflineRoutes(prev => [...prev, id]);
      setToast({ isVisible: true, isFavorite: true, routeName: `${route.name} SALVA_OFFLINE` });
    }

    localStorage.setItem('offline_routes_data', JSON.stringify(data));

    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };
  const [toast, setToast] = useState<{ isVisible: boolean; isFavorite: boolean; routeName: string }>({
    isVisible: false,
    isFavorite: false,
    routeName: ''
  });

  useEffect(() => {
    localStorage.setItem('favorite_routes', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    const route = routes.find(r => r.id === id);
    const isNowFavorite = !favorites.includes(id);
    
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );

    if (route) {
      setToast({ isVisible: true, isFavorite: isNowFavorite, routeName: route.name });
      // Reset after animation
      setTimeout(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
      }, 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
      <SEO 
        title="Rotas Eternas Hub - Atlas do Aventureiro" 
        description="Guias detalhados das travessias mais icônicas da América Latina. Logística, mapas e pontos críticos."
      />

      <ShareModal 
        isOpen={!!activeShare}
        onClose={() => setActiveShare(null)}
        routeId={activeShare?.id || ''}
        routeName={activeShare?.name || ''}
      />

      <ContributionModal 
        isOpen={isContributionOpen}
        onClose={() => setIsContributionOpen(false)}
      />

      <FavoriteToast 
        isVisible={toast.isVisible}
        isFavorite={toast.isFavorite}
        routeName={toast.routeName}
      />

      <section className="pt-12 mb-12 text-left">
        <div className="text-[10px] font-mono tracking-[0.4em] text-[#ff641d] mb-4 uppercase">NAVIGATION_MODULE // CONTINENTAL_TRAILS</div>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-4 text-[#F8FAFC]">
          ROTAS<span className="text-[#ff641d]">.</span>ETERNAS
        </h1>
        {!isOnline && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-red-900/10 border border-red-900/30 rounded-sm flex items-center gap-4"
          >
            <CloudOff className="text-red-500 shrink-0" size={20} />
            <div>
              <div className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">STATUS: OFFLINE</div>
              <p className="text-[9px] text-red-500/60 uppercase tracking-widest leading-loose">
                Mostrando apenas rotas baixadas para acesso local. Algumas funcionalidades foram desativadas.
              </p>
            </div>
          </motion.div>
        )}
        <p className="text-[#F8FAFC]/40 text-sm font-medium max-w-xl uppercase tracking-widest leading-loose">
          Mapas táticos para as travessias que moldam o espírito. Onde o asfalto termina e a liberdade começa.
        </p>
      </section>

      {/* Featured Tactical Analysis Section */}
      <section className="mb-20">
        <div className="flex items-center gap-4 mb-4">
           <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
              <Sparkles size={10} className="text-cyan-400 animate-pulse" />
              <span className="text-[7px] font-mono font-black text-cyan-400 uppercase tracking-[0.3em]">AI_GLOBAL_NEWS_TICKER</span>
           </div>
           <div className="flex-1 h-[1px] bg-white/5 overflow-hidden">
              <motion.div 
                animate={{ x: [-1000, 1000] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="whitespace-nowrap inline-block"
              >
                {[
                  "ALERTA: VENTOS FORTES NA RUTA 40 (SETOR SUL)",
                  "CONDIÇÕES CRÍTICAS NA BR-156: LAMA PESADA EM AMAPÁ",
                  "NEVASCA PREVISTA EM PASO ROBALLOS NAS PRÓXIMAS 48H",
                  "REABERTURA DE PONTO DE APOIO EM VILLA O'HIGGINS",
                  "REGISTRO DE ALTA INCIDÊNCIA DE INSETOS NO JALAPÃO"
                ].map((news, i) => (
                  <span key={i} className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em] mx-20">{news}</span>
                ))}
              </motion.div>
           </div>
        </div>
        <TacticalHUD />
      </section>

      {/* Tactic Filter HUD - Separate Dynamic Section */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-[1px] flex-1 bg-white/5"></div>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#ff641d]/10 border border-[#ff641d]/20 rounded-sm">
            <Activity size={10} className="text-[#ff641d]" />
            <span className="text-[8px] font-mono font-black uppercase tracking-[0.3em] text-[#ff641d]">OPS_FILTER_DASHBOARD</span>
          </div>
          <div className="h-[1px] flex-1 bg-white/5"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filterOptions.map((opt) => {
            const count = opt.id === 'all' 
              ? routes.length 
              : routes.filter(r => r.types.includes(opt.id)).length;
            
            const isActive = selectedFilter === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => setSelectedFilter(opt.id)}
                className={cn(
                  "relative group overflow-hidden transition-all h-20 border rounded-sm flex flex-col items-center justify-center gap-1",
                  isActive 
                    ? "bg-[#ff641d] border-[#ff641d] shadow-[0_0_30px_rgba(255,100,29,0.2)]" 
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
              >
                {/* Background HUD decorations */}
                <div className={cn(
                  "absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none",
                  isActive ? "bg-white" : "bg-white"
                )}>
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,_transparent,_transparent_10px,_rgba(255,255,255,0.1)_10px,_rgba(255,255,255,0.1)_20px)]" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-1">
                  <opt.icon size={16} className={cn(
                    "transition-all",
                    isActive ? "text-white animate-pulse" : "text-white/20 group-hover:text-white/40"
                  )} />
                  <span className={cn(
                    "text-[9px] font-mono font-bold uppercase tracking-widest",
                    isActive ? "text-white" : "text-white/40"
                  )}>
                    {opt.name}
                  </span>
                </div>

                <div className={cn(
                  "absolute top-2 right-3 text-[8px] font-mono",
                  isActive ? "text-white/60" : "text-white/10"
                )}>
                  #{String(count).padStart(2, '0')}
                </div>

                {isActive && (
                  <motion.div 
                    layoutId="filter-indicator"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-white/40"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-between items-center px-2">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[7px] font-mono text-white/20 uppercase tracking-[0.2em]">DADOS_SINCRO_ATIVOS</span>
           </div>
           <span className="text-[7px] font-mono text-white/10 uppercase tracking-[0.2em]">SESSÃO: {new Date().getHours()}:{new Date().getMinutes()} // GMT-3</span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {routes
          .filter(r => (selectedFilter === 'all' || r.types.includes(selectedFilter)) && (isOnline || offlineRoutes.includes(r.id)))
          .map((route, index) => (
          <motion.div
            key={route.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <div className="dashboard-card p-0 border-white/[0.03] overflow-hidden flex flex-col h-full bg-none bg-transparent">
              <Link to={`/rotas/${route.id}`} className="relative aspect-[16/10] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 block">
                <img 
                  src={route.image} 
                  alt={route.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0d] via-[#0b0c0d]/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                   <div>
                      <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-[#ff641d] text-white text-[8px] font-mono font-bold uppercase tracking-widest mb-3">
                        {route.displayType}
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tighter text-[#F8FAFC]">
                        {route.name}
                      </h3>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                     {offlineRoutes.includes(route.id) && (
                       <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 border border-green-500/40 text-green-500 text-[7px] font-mono font-bold uppercase tracking-[0.2em] rounded-full">
                         <HardDrive size={8} /> OFFLINE_SYNCED
                       </div>
                     )}
                     <div className="text-[10px] font-mono text-[#ff641d] font-bold pb-2 uppercase tracking-widest">
                       LVL: {route.difficulty}
                     </div>
                   </div>
                </div>
              </Link>

              <div className="p-8 flex flex-col flex-grow bg-[#0b0c0d]">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase tracking-[0.3em] font-bold">
                      <MapPin size={12} className="text-[#ff641d]" />
                      {route.country}
                    </div>
                    <div className="text-[10px] text-white/20 font-mono tracking-widest uppercase flex items-center gap-2">
                       <Activity size={10} /> {route.km} DIST_UNITS
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleFavorite(route.id)}
                      className={`w-14 h-14 bg-white/[0.02] border rounded-full flex items-center justify-center transition-all ${
                        favorites.includes(route.id) 
                          ? 'text-red-500 border-red-500/30 bg-red-500/5' 
                          : 'text-white/20 border-white/5 hover:text-red-500 hover:border-red-500/30'
                      }`}
                      title={favorites.includes(route.id) ? "Remover dos favoritos" : "Salvar rota"}
                    >
                      <Heart size={20} fill={favorites.includes(route.id) ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => toggleOffline(route.id)}
                      className={`w-14 h-14 bg-white/[0.02] border rounded-full flex items-center justify-center transition-all ${
                        offlineRoutes.includes(route.id) 
                          ? 'text-green-500 border-green-500/30 bg-green-500/5' 
                          : 'text-white/20 border-white/5 hover:text-green-500 hover:border-green-500/30'
                      }`}
                      title={offlineRoutes.includes(route.id) ? "Remover do modo offline" : "Baixar para modo offline"}
                    >
                      <Download size={20} className={offlineRoutes.includes(route.id) ? "" : "group-hover:translate-y-0.5 transition-transform"} />
                    </button>
                    <button
                      onClick={() => setActiveShare({ id: route.id, name: route.name })}
                      className="w-14 h-14 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center text-white/20 hover:text-[#ff641d] hover:border-[#ff641d]/30 transition-all"
                    >
                      <Share2 size={20} />
                    </button>
                    <Link
                      to={`/rotas/${route.id}`}
                      className="w-14 h-14 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center text-white/20 hover:text-[#ff641d] hover:border-[#ff641d]/30 transition-all group-hover:scale-110"
                    >
                      <ArrowRight size={24} />
                    </Link>
                  </div>
                </div>

                <p className="text-[10px] text-white/30 leading-relaxed font-medium mb-4 flex-grow uppercase tracking-widest">
                  "{route.description}"
                </p>

                <RouteWeather lat={route.lat} lng={route.lng} />

                {/* AI Insight Block */}
                <div className="mt-8 pt-8 border-t border-white/5">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <Brain size={12} className="text-cyan-400" />
                         <span className="text-[9px] font-mono font-black text-white/40 uppercase tracking-[0.2em]">INTELIGÊNCIA_TACTICA</span>
                      </div>
                      <button 
                        onClick={() => handleAIScan(route.id, route.name, route.country, route.types[0])}
                        disabled={analyzingRouteId === route.id}
                        className={cn(
                          "px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[7px] font-mono font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all rounded-xs",
                          analyzingRouteId === route.id && "animate-pulse"
                        )}
                      >
                         {analyzingRouteId === route.id ? "ANALYZING..." : routeAIs[route.id] ? "RE-SCAN" : "GERAR_INSIGHTS"}
                      </button>
                   </div>
                   
                   {routeAIs[route.id] ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                      >
                         <div className="p-3 bg-cyan-500/[0.03] border border-cyan-500/10 rounded-xs">
                            <p className="text-[9px] text-cyan-400/80 font-mono leading-relaxed uppercase">
                               "{routeAIs[route.id].summary}"
                            </p>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest mb-1">RISCO_MODELADO</div>
                               <div className="text-[12px] font-mono font-black text-white">{routeAIs[route.id].riskLevel}%</div>
                            </div>
                            <div>
                               <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest mb-1">DIFICULDADE</div>
                               <div className="text-[12px] font-mono font-black text-white">{routeAIs[route.id].difficulty}</div>
                            </div>
                         </div>
                         <div className="space-y-1">
                            <div className="text-[7px] font-mono text-[#ff641d] uppercase tracking-widest mb-2 flex items-center gap-1">
                               <ShieldAlert size={8} /> ALERTA_OP_RELEVANTE
                            </div>
                            {routeAIs[route.id].alerts.slice(0, 2).map((alert, i) => (
                               <div key={i} className="text-[8px] font-mono text-white/60 leading-tight uppercase">• {alert}</div>
                            ))}
                         </div>
                      </motion.div>
                   ) : (
                      <div className="p-10 border border-dashed border-white/5 rounded-xs flex flex-col items-center justify-center gap-3 bg-white/[0.01]">
                         <Activity size={16} className="text-white/5" />
                         <span className="text-[8px] font-mono text-white/10 uppercase tracking-widest">SISTEMA_AGUARDANDO_COMANDO_INTEL</span>
                      </div>
                   )}
                </div>

                <div className="flex gap-6 items-center mt-8 pt-8 border-t border-white/5">
                  <span className="text-[8px] font-mono font-black uppercase tracking-[0.3em] text-[#ff641d]/40">GPX_AV_LINK</span>
                  <span className="text-[8px] font-mono font-black uppercase tracking-[0.3em] text-[#ff641d]/40">FIELD_NOTES</span>
                  <span className="text-[8px] font-mono font-black uppercase tracking-[0.3em] text-[#ff641d]/40">OPS_MAP</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Contribution Block */}
      <section className="mt-40 dashboard-card p-12 md:p-24 border-white/[0.03] text-center relative overflow-hidden bg-[#ff641d]/[0.02]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#ff641d]/[0.03] blur-[150px] pointer-events-none rounded-full"></div>
        <div className="relative z-10 flex flex-col items-center">
          <Compass size={48} className="text-[#ff641d]/20 mb-10" />
          <h2 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter mb-10 max-w-3xl leading-none text-[#F8FAFC]">
            EXPANDA O MAPA.<br />CONTRIBUA COM A <span className="text-[#ff641d]">REDE.</span>
          </h2>
          <p className="text-[11px] text-white/30 uppercase tracking-[0.3em] mb-12 max-w-xl mx-auto leading-relaxed">
            As rotas evoluem. Novos desvios, condições climáticas e pontos de apoio surgem. 
            Envie seu relatório de campo e ajude a manter a Rota Livre atualizada.
          </p>
          <button 
            onClick={() => setIsContributionOpen(true)}
            className="px-14 py-5 bg-[#ff641d] text-white font-mono font-bold text-[10px] uppercase tracking-[0.4em] hover:bg-[#ff641d]/80 transition-all shadow-[0_0_30px_rgba(255,100,29,0.2)]"
          >
            REGISTRO DE RASTREAMENTO DE CARREGAMENTO
          </button>
        </div>
      </section>
    </div>
  );
}
