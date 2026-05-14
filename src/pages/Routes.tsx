import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Compass, MapPin, Share2, Activity, Copy, Check, X, 
  Twitter, Send, MessageCircle, Info, Heart, Bike, Triangle 
} from 'lucide-react';
import SEO from '@/src/components/SEO';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import RouteWeather from '@/src/components/RouteWeather';

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
  { id: 'moto', name: 'MOTO_TRAVESSIA', icon: Triangle },
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
  const shareUrl = `rotalivrehub.com/rotas/${routeId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialShares = [
    { name: 'WhatsApp', icon: MessageCircle, url: `https://wa.me/?text=Confira esta rota no Rota Livre Hub: ${routeName} em ${shareUrl}` },
    { name: 'Telegram', icon: Send, url: `https://t.me/share/url?url=${shareUrl}&text=Confira esta rota: ${routeName}` },
    { name: 'Twitter', icon: Twitter, url: `https://twitter.com/intent/tweet?text=Explorando a rota ${routeName} no @RotaLivreHub!&url=${shareUrl}` },
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
                <div className="grid grid-cols-3 gap-3">
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

export default function Routes() {
  const [activeShare, setActiveShare] = useState<{ id: string; name: string } | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorite_routes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorite_routes', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
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

      <section className="pt-12 mb-12 text-left">
        <div className="text-[10px] font-mono tracking-[0.4em] text-[#ff641d] mb-4 uppercase">NAVIGATION_MODULE // CONTINENTAL_TRAILS</div>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-4 text-[#F8FAFC]">
          ROTAS<span className="text-[#ff641d]">.</span>ETERNAS
        </h1>
        <p className="text-[#F8FAFC]/40 text-sm font-medium max-w-xl uppercase tracking-widest leading-loose">
          Mapas táticos para as travessias que moldam o espírito. Onde o asfalto termina e a liberdade começa.
        </p>
      </section>

      {/* Tactic Filter HUD */}
      <div className="flex flex-wrap gap-3 mb-20">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelectedFilter(opt.id)}
            className={`px-6 py-3 border rounded-sm flex items-center gap-3 transition-all ${
              selectedFilter === opt.id
                ? 'bg-[#ff641d] border-[#ff641d] text-white shadow-[0_0_20px_rgba(255,100,29,0.3)]'
                : 'bg-white/[0.02] border-white/5 text-white/40 hover:border-white/20'
            }`}
          >
            <opt.icon size={14} className={selectedFilter === opt.id ? 'animate-pulse' : ''} />
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{opt.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {routes
          .filter(r => selectedFilter === 'all' || r.types.includes(selectedFilter))
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
                   <div className="text-[10px] font-mono text-[#ff641d] font-bold pb-2 uppercase tracking-widest">
                     LVL: {route.difficulty}
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

                <div className="flex gap-6 items-center mt-6">
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
          <button className="px-14 py-5 bg-[#ff641d] text-white font-mono font-bold text-[10px] uppercase tracking-[0.4em] hover:bg-[#ff641d]/80 transition-all shadow-[0_0_30px_rgba(255,100,29,0.2)]">
            UPLOAD_TRAIL_LOG
          </button>
        </div>
      </section>
    </div>
  );
}
