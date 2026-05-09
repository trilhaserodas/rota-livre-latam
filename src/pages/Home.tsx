import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Coins, Clock, Map as MapIcon, Calculator, BookOpen, ArrowUpRight, Bike, Compass, Tent, Car, MapPin, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/src/components/SEO';
import { cn } from '@/src/lib/utils';

const tools = [
  { 
    id: 'conversor', 
    name: 'Conversor LATAM', 
    description: 'Câmbio em tempo real entre moedas da América Latina: ARS, BRL, CLP, COP, PEN, PYG.', 
    path: '/conversor', 
    icon: Coins, 
    color: 'bg-orange-500/20 text-orange-500' 
  },
  { 
    id: 'horarios', 
    name: 'Relógio Mundial', 
    description: 'Fusos horários de toda a LATAM com horários de nascer e pôr do sol para aventureiros.', 
    path: '/horarios', 
    icon: Clock, 
    color: 'bg-blue-500/20 text-blue-500' 
  },
  { 
    id: 'mapa', 
    name: 'Mapa da Aventura', 
    description: 'Pontos seguros, campings, oficinas e mirantes colaborativos por toda a América Latina.', 
    path: '/mapa', 
    icon: MapIcon, 
    color: 'bg-green-500/20 text-green-500' 
  },
  { 
    id: 'calculadoras', 
    name: 'Financeiro da Estrada', 
    description: 'Calcule custos de combustível, autonomia, orçamento mochileiro e peso ideal da mochila.', 
    path: '/calculadoras', 
    icon: Calculator, 
    color: 'bg-purple-500/20 text-purple-500' 
  },
  { 
    id: 'rotas', 
    name: 'Rotas Populares', 
    description: 'O guia definitivo de rotas clássicas: Carretera Austral, Transamazônica, Ruta 40 e mais.', 
    path: '/rotas', 
    icon: MapPin, 
    color: 'bg-red-500/20 text-red-500' 
  },
  { 
    id: 'blog', 
    name: 'Diário de Bordo', 
    description: 'Dicas práticas de quem vive a estrada. Guias de equipamentos e relatos de viagem.', 
    path: '/blog', 
    icon: BookOpen, 
    color: 'bg-yellow-500/20 text-yellow-500' 
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-40">
      <SEO />
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute top-1/4 left-1/4 text-[8px] font-mono whitespace-nowrap rotate-90">SYS_COORDS / -34.6037, -58.3816</div>
        <div className="absolute bottom-1/4 right-1/4 text-[8px] font-mono whitespace-nowrap -rotate-90">LATAM_GRID_8829-X</div>
      </div>

      {/* Hero Section */}
      <section className="pt-24 pb-20 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-sm bg-white/[0.02] border border-white/5 text-[9px] font-bold uppercase tracking-[0.4em] text-[#ff641d] mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff641d] animate-pulse"></span>
            Operational_Status: Stable
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-black leading-[0.9] tracking-tighter mb-4 text-[#F8FAFC] max-w-4xl uppercase">
            ROTA LIVRE<span className="text-[#ff641d]">.</span>LATAM
          </h1>
          
          <p className="text-lg font-medium text-[#F8FAFC]/60 tracking-tight mb-8">
            O painel do aventureiro moderno.
          </p>

          <p className="max-w-xl text-sm text-[#F8FAFC]/30 leading-relaxed mx-auto mb-16 font-medium selection:bg-[#ff641d]/20 uppercase tracking-[0.2em]">
            Tudo que um aventureiro precisa — em um único painel.
          </p>

          {/* Search Bar - Dashboard Style */}
          <div className="relative w-full max-w-xl mx-auto group">
            <div className="absolute -inset-1 bg-[#ff641d]/10 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#ff641d] transition-colors" size={20} />
              <input
                type="text"
                placeholder="PROCURAR_SISTEMA_OU_DADOS..."
                className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-xl pl-16 pr-6 text-xs font-mono tracking-widest focus:outline-none focus:bg-white/[0.04] focus:border-white/10 transition-all placeholder:text-white/5"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Tools Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        {filteredTools.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={tool.path} className="block group h-full">
              <div className="dashboard-card p-10 h-full flex flex-col justify-between group-hover:glow-orange border-white/[0.03]">
                <div>
                  <div className="flex justify-between items-start mb-10">
                    <div className={cn("p-4 rounded-sm border border-white/5", tool.color.replace('bg-', 'bg-opacity-5 bg-'))}>
                      <tool.icon size={24} strokeWidth={1.5} />
                    </div>
                    <span className="text-[8px] font-mono text-white/10 group-hover:text-[#ff641d]/40 transition-colors">MOD_{tool.id.toUpperCase()}</span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-4 text-[#F8FAFC] group-hover:text-[#ff641d] transition-colors uppercase">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-[#F8FAFC]/30 leading-relaxed font-medium">
                    {tool.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/[0.02]">
                  <span className="text-[9px] font-mono tracking-[0.2em] text-white/10 group-hover:text-white/40 transition-colors flex items-center gap-2">
                    <ArrowUpRight size={12} /> INITIALIZE_PRTCL
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Instagram Banner */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 relative z-10"
      >
        <a 
          href="https://www.instagram.com/trilhas_erodas/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group block relative overflow-hidden dashboard-card p-0 border-[#ff641d]/20 hover:border-[#ff641d]/40 transition-all duration-500"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ff641d]/50 to-transparent"></div>
          <div className="absolute -inset-1 bg-[#ff641d]/5 blur-2xl group-hover:bg-[#ff641d]/10 transition-all duration-500"></div>
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full border-2 border-[#ff641d] flex items-center justify-center p-1 relative">
                <div className="absolute inset-0 rounded-full bg-[#ff641d]/20 blur-md group-hover:blur-lg transition-all"></div>
                <div className="w-full h-full rounded-full border border-[#ff641d]/30 flex items-center justify-center bg-[#0b0c0d] relative z-10">
                  <Instagram size={28} className="text-[#ff641d]" />
                </div>
              </div>
              
              <div className="flex flex-col">
                <h3 className="text-lg sm:text-xl font-display font-black text-white leading-tight uppercase tracking-tight">
                  Acompanhe aventuras reais <br className="hidden sm:block" /> pela América Latina.
                </h3>
                <span className="text-xs font-mono text-[#ff641d] font-bold mt-1 tracking-widest">@TRILHAS_ERODAS</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:block text-right">
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">Status: Ao vivo</div>
                <div className="text-[8px] font-mono text-white/10 uppercase tracking-[0.2em] mt-1">Sincronizando expedicão...</div>
              </div>
              <div className="px-8 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-[#0b0c0d] font-mono font-black text-[12px] uppercase tracking-widest rounded-full transition-all shadow-[0_0_20px_rgba(29,185,84,0.3)] hover:scale-105 active:scale-95 leading-none">
                Seguir Jornada
              </div>
            </div>
          </div>
        </a>
      </motion.section>

      {/* Stats/Badges Section */}
      <section className="mt-40 border-t border-white/5 pt-20 grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-mono text-[#ff641d] tracking-[0.4em]">REG_01</span>
          <div className="flex items-center gap-3">
             <div className="w-10 h-[1px] bg-white/10"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Cicloturismo</span>
          </div>
          <p className="text-[9px] text-[#F8FAFC]/20 uppercase tracking-widest leading-loose">Autossuficiência &<br />Resistência Mecânica</p>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-mono text-[#ff641d] tracking-[0.4em]">REG_02</span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-[1px] bg-white/10"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Wild Camping</span>
          </div>
          <p className="text-[9px] text-[#F8FAFC]/20 uppercase tracking-widest leading-loose">Geolocalização &<br />Segurança Noturna</p>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-mono text-[#ff641d] tracking-[0.4em]">REG_03</span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-[1px] bg-white/10"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Overlanding</span>
          </div>
          <p className="text-[9px] text-[#F8FAFC]/20 uppercase tracking-widest leading-loose">Logística de Câmbio &<br />Combustível</p>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-mono text-[#ff641d] tracking-[0.4em]">REG_04</span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-[1px] bg-white/10"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Gratuidade</span>
          </div>
          <p className="text-[9px] text-[#F8FAFC]/20 uppercase tracking-widest leading-loose">Código Aberto &<br />Apoio Coletivo</p>
        </div>
      </section>
    </div>
  );
}
