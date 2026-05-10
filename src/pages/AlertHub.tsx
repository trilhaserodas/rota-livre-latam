import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Globe, 
  Map as MapIcon, 
  Plane, 
  ShieldCheck, 
  Backpack, 
  Bike, 
  Truck, 
  Wrench, 
  Search, 
  Clock, 
  MapPin, 
  ChevronRight,
  Info,
  Wind,
  Filter,
  CloudRain,
  Thermometer,
  Cloud
} from 'lucide-react';
import SEO from '@/src/components/SEO';

// Componente de Clima em Tempo Real
function WeatherMonitor() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

  useEffect(() => {
    if (!apiKey) return;

    // Busca clima padrão (ex: Ushuaia ou uma região crítica)
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Ushuaia&units=metric&appid=${apiKey}&lang=pt_br`
        );
        const data = await response.json();
        if (data.cod === 200) setWeather(data);
      } catch (error) {
        console.error("Erro ao buscar clima:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // 10 min
    return () => clearInterval(interval);
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="dashboard-card p-6 border-white/[0.03] bg-white/[0.01]">
        <div className="flex items-center gap-3 text-white/20">
          <Cloud size={18} />
          <span className="text-[10px] font-mono uppercase tracking-widest">Weather_Engine_Offline</span>
        </div>
        <p className="text-[9px] text-white/10 font-mono mt-2 italic uppercase">Configure VITE_WEATHER_API_KEY nas Settings</p>
      </div>
    );
  }

  if (loading || !weather) return <div className="h-24 animate-pulse bg-white/5 rounded-3xl" />;

  return (
    <div className="dashboard-card p-6 border-white/[0.05] bg-gradient-to-br from-white/[0.02] to-transparent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CloudRain className="text-[#ff641d]" size={16} />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Real_Time_Meteo</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-display font-black text-white">{Math.round(weather.main.temp)}°C</div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">{weather.name} / {weather.weather[0].description}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-white/60 mb-1">UMIDADE</div>
          <div className="text-xs font-mono text-white">{weather.main.humidity}%</div>
        </div>
      </div>
    </div>
  );
}

type Priority = 'LOW' | 'MODERATE' | 'ATTENTION' | 'CRITICAL';

interface Alert {
  id: string;
  title: string;
  summary: string;
  priority: Priority;
  date: string;
  region: string;
  category: string;
  country: string;
}

interface Insight {
  id: string;
  title: string;
  content: string;
  category: string;
}

const ALERTS: Alert[] = [
  {
    id: 'AL-001',
    title: 'Monitoramento: El Niño na Rodovia Austral',
    summary: 'Previsão de chuvas acima da média histórica para o mês de Junho. Risco aumentado de pequenos deslizamentos em trechos não pavimentados.',
    priority: 'ATTENTION',
    date: '09.05.26',
    region: 'Patagônia Chilena',
    category: 'CLIMÁTICO',
    country: 'Chile'
  },
  {
    id: 'AL-002',
    title: 'Protocolo Sanitário: Fronteira Paso de Agua Negra',
    summary: 'Abertura sazonal confirmada, porém com exigência de seguro viagem com cobertura específica para resgate em altitude elevada.',
    priority: 'MODERATE',
    date: '08.05.26',
    region: 'Andes Centrais',
    category: 'FRONTEIRAS',
    country: 'Argentina/Chile'
  },
  {
    id: 'AL-003',
    title: 'Interdição Técnica: Estrada Real (Diamantina)',
    summary: 'Manutenção estrutural em ponte histórica no km 42. Desvio obrigatório por trilha técnica de 12km.',
    priority: 'CRITICAL',
    date: '07.05.26',
    region: 'Minas Gerais',
    category: 'ESTRADAS',
    country: 'Brasil'
  },
  {
    id: 'AL-004',
    title: 'Normativa Aérea: Baterias Lítio (LATAM)',
    summary: 'Novas restrições para o transporte de baterias extras para e-bikes. Limite reduzido para 100Wh por unidade em bagagem de mão.',
    priority: 'ATTENTION',
    date: '05.05.26',
    region: 'Global',
    category: 'TRANSPORTE',
    country: 'International'
  }
];

const INSIGHTS: Insight[] = [
  {
    id: 'IN-01',
    title: 'Checklist de Inverno',
    content: 'Lubrificantes de cera não performam bem abaixo de 0°C. Migre para óleo sintético úmido.',
    category: 'GEAR'
  },
  {
    id: 'IN-02',
    title: 'Visto Digital Nômade',
    content: 'Uruguai simplificou processo para estrangeiros que ingressam por via terrestre.',
    category: 'OPERAÇÕES'
  },
  {
    id: 'IN-03',
    title: 'Segurança Solo',
    content: 'Uso de rastreadores satelitais (Garmin InReach) agora isento de taxas de rádio no Peru.',
    category: 'SEGURANÇA'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'TODOS', icon: Globe },
  { id: 'CLIMÁTICO', label: 'CLIMA', icon: Wind },
  { id: 'FRONTEIRAS', label: 'FRONTEIRAS', icon: MapIcon },
  { id: 'ESTRADAS', label: 'ESTRADAS', icon: MapPin },
  { id: 'TRANSPORTE', label: 'TRANSPORTE', icon: Plane },
  { id: 'SEGURANÇA', label: 'SEGURANÇA', icon: ShieldCheck },
  { id: 'MOCHILÃO', label: 'MOCHILÃO', icon: Backpack },
  { id: 'CICLOTURISMO', label: 'CICLO', icon: Bike },
  { id: 'OVERLAND', label: 'OVERLAND', icon: Truck },
  { id: 'EQUIPAMENTO', label: 'GEAR', icon: Wrench },
];

const PRIORITY_THEMES = {
  LOW: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.1)]' },
  MODERATE: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', glow: 'shadow-[0_0_15px_rgba(74,222,128,0.1)]' },
  ATTENTION: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', glow: 'shadow-[0_0_20px_rgba(251,146,60,0.15)]' },
  CRITICAL: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'shadow-[0_0_25px_rgba(239,68,68,0.2)]' },
};

export default function AlertHub() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredAlerts = useMemo(() => {
    return ALERTS.filter(alert => {
      const matchesSearch = 
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || alert.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 relative z-10 antialiased">
      <SEO 
        title="HUB ALERTA - Inteligência Estratégica de Viagem | Rota Livre"
        description="Painel de monitoramento tático para aventureiros: alertas climáticos, fronteiras, estradas e segurança de viagem em tempo real."
      />

      {/* Header Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#ff641d] animate-pulse shadow-[0_0_10px_#ff641d]" />
          <span className="text-[10px] font-mono text-[#ff641d] uppercase tracking-[0.4em] font-bold">In_Live_Monitoring</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tighter mb-4">
          HUB <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">ALERTA</span>
        </h1>
        <p className="max-w-2xl text-white/40 text-sm font-mono uppercase tracking-widest leading-relaxed">
          Central de inteligência tática para exploração moderna. 
          Monitoramento persistente de variáveis críticas de viagem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Search & Filters */}
          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff641d] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="BUSCAR POR PAÍS, REGIÃO OU ROTA..."
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs font-mono tracking-widest text-white uppercase focus:border-[#ff641d]/30 focus:bg-white/[0.04] transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest transition-all border ${
                      activeCategory === cat.id 
                        ? 'bg-[#ff641d] text-white border-[#ff641d] shadow-[0_0_15px_rgba(255,100,29,0.3)]' 
                        : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={12} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="dashboard-card group p-6 border-white/[0.03] hover:border-white/10 transition-all cursor-pointer overflow-hidden relative"
                >
                  {/* Priority Indicator Line */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${PRIORITY_THEMES[alert.priority].bg.replace('bg-', 'bg-opacity-100 bg-')}`} />
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${PRIORITY_THEMES[alert.priority].bg} ${PRIORITY_THEMES[alert.priority].color} uppercase tracking-widest`}>
                          {alert.priority}
                        </span>
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={10} /> {alert.date}
                        </span>
                        <span className="text-[9px] font-mono text-[#ff641d]/60 uppercase tracking-widest">
                           {alert.category}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-display font-black text-white uppercase tracking-tight mb-3 group-hover:text-[#ff641d] transition-colors">
                        {alert.title}
                      </h3>
                      
                      <p className="text-white/40 text-xs leading-relaxed font-sans mb-4 max-w-xl">
                        {alert.summary}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] font-mono text-white/60 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-[#ff641d]" /> {alert.region}</span>
                        <span className="text-white/10">|</span>
                        <span className="text-white/30">{alert.country}</span>
                      </div>
                    </div>

                    <button className="flex items-center gap-2 self-end md:self-center text-[10px] font-mono font-bold text-white/20 group-hover:text-white transition-all uppercase tracking-[0.2em]">
                      Ver Detalhes <ChevronRight size={14} className="text-[#ff641d]" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredAlerts.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
                <div className="text-white/10 font-mono text-xs uppercase tracking-[0.4em]">
                  Nenhum dado encontrado para os parâmetros atuais
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Space */}
        <div className="lg:col-span-4 space-y-8">
          
          <WeatherMonitor />

          {/* Hub Insights Area */}
          <div className="dashboard-card bg-[#ff641d]/[0.02] border-[#ff641d]/10 p-8 pt-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-[#ff641d]/10 text-[#ff641d]">
                <Info size={18} />
              </div>
              <div>
                <h4 className="text-sm font-display font-black text-white uppercase tracking-tight">HUB INSIGHTS</h4>
                <div className="text-[9px] font-mono text-[#ff641d]/60 uppercase tracking-widest">Smart Adventure Intel</div>
              </div>
            </div>

            <div className="space-y-6">
              {INSIGHTS.map((insight) => (
                <div key={insight.id} className="pb-6 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="text-[8px] font-mono text-[#ff641d] uppercase tracking-[0.2em] mb-2">
                    // {insight.category}
                  </div>
                  <Link 
                    to={`/blog?id=${insight.id === 'IN-01' ? '5' : insight.id === 'IN-02' ? '1' : ''}`}
                    className="block group/insight"
                  >
                    <h5 className="text-xs font-display font-bold text-white uppercase tracking-wide mb-2 group-hover/insight:text-[#ff641d] transition-colors">
                      {insight.title}
                    </h5>
                    <p className="text-[10px] text-white/40 leading-relaxed font-sans italic">
                      "{insight.content}"
                    </p>
                  </Link>
                </div>
              ))}
            </div>

            <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[9px] font-mono font-bold uppercase tracking-[0.3em] transition-all border border-white/5 rounded-xl">
              Acessar Biblioteca de Inteligência
            </button>
          </div>

          {/* Quick Stats / Global Status */}
          <div className="dashboard-card p-8 border-white/[0.03]">
             <h4 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mb-6">Status_Global</h4>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-[9px] font-mono text-white/40">ALERTAS_ATIVOS</span>
                   <span className="text-xs font-mono text-white font-bold">14</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[9px] font-mono text-white/40">RISCO_MÉDIO</span>
                   <span className="text-xs font-mono text-orange-400 font-bold uppercase tracking-widest">Atenção</span>
                </div>
                <div className="mt-6 pt-6 border-t border-white/5">
                   <div className="flex gap-1 h-1.5 mb-2">
                      <div className="flex-1 bg-green-500/20 rounded-full" />
                      <div className="flex-[2] bg-orange-500/40 rounded-full" />
                      <div className="flex-[0.5] bg-red-500/60 rounded-full" />
                   </div>
                   <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest text-center">
                      Distribuição de Severidade
                   </p>
                </div>
             </div>
          </div>

          {/* Contribution Prompt */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[#ff641d]/20 to-transparent border border-[#ff641d]/10 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-sm font-display font-black text-white uppercase tracking-tight mb-2">SEJA UM SENSOR</h4>
              <p className="text-[10px] text-white/60 font-mono uppercase tracking-widest leading-relaxed mb-6">
                Encontrou uma interdição ou mudança de regra na estrada? Reporte para a comunidade.
              </p>
              <button className="px-5 py-2.5 bg-white text-black font-display font-black text-[10px] uppercase tracking-tighter hover:bg-[#ff641d] hover:text-white transition-all rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Enviar Reporte Tático
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 text-white/[0.02] rotate-12 transition-transform group-hover:rotate-0">
              <Globe size={120} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
