import { useState, useMemo, useEffect, Fragment } from 'react';
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
  ExternalLink,
  Filter,
  CloudRain,
  Thermometer,
  Cloud,
  CheckCircle2,
  Lock,
  Wifi,
  Smartphone,
  Eye,
  Zap
} from 'lucide-react';
import SEO from '@/src/components/SEO';
import ReportModal from '@/src/components/ReportModal';
import CommunityReports from '@/src/components/CommunityReports';
import AdSense from '@/src/components/AdSense';

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
  causes: string[];
  safetyBrief: string[];
  lastUpdate: string;
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
    country: 'Chile',
    causes: [
      'Anomalia térmica no Oceano Pacífico (El Niño)',
      'Saturação do solo por chuvas persistentes',
      'Geologia instável em trechos de rípio'
    ],
    safetyBrief: [
      'Evite pedalar durante tempestades elétricas',
      'Reduza a pressão dos pneus para maior tração no rípio úmido',
      'Mantenha contato via satélite ativado em zonas de sombra'
    ],
    lastUpdate: '10.05.26 - 18h45'
  },
  {
    id: 'AL-002',
    title: 'Protocolo Sanitário: Fronteira Paso de Agua Negra',
    summary: 'Abertura sazonal confirmada, porém com exigência de seguro viagem com cobertura específica para resgate em altitude elevada.',
    priority: 'MODERATE',
    date: '08.05.26',
    region: 'Andes Centrais',
    category: 'FRONTEIRAS',
    country: 'Argentina/Chile',
    causes: [
      'Início da temporada de degelo',
      'Novas diretivas de segurança binacional'
    ],
    safetyBrief: [
      'Porte certificado internacional de vacinação',
      'Contrate seguro com cláusula de evacuação aérea',
      'Inicie a subida antes das 08:00 AM para evitar ventos de tarde'
    ],
    lastUpdate: '09.05.26 - 09h12'
  },
  {
    id: 'AL-003',
    title: 'Interdição Técnica: Estrada Real (Diamantina)',
    summary: 'Manutenção estrutural em ponte histórica no km 42. Desvio obrigatório por trilha técnica de 12km.',
    priority: 'CRITICAL',
    date: '07.05.26',
    region: 'Minas Gerais',
    category: 'ESTRADAS',
    country: 'Brasil',
    causes: [
      'Desgaste estrutural acelerado por excesso de carga',
      'Obras de restauração do patrimônio histórico'
    ],
    safetyBrief: [
      'Desvio não recomendado para bicicletas de estrada com pneus finos',
      'Abastecimento de água limitado no trecho alternativo',
      'Sinalização precária no desvio; use GPS offline'
    ],
    lastUpdate: '11.05.26 - 07h00'
  },
  {
    id: 'AL-004',
    title: 'Normativa Aérea: Baterias Lítio (LATAM)',
    summary: 'Novas restrições para o transporte de baterias extras para e-bikes. Limite reduzido para 100Wh por unidade em bagagem de mão.',
    priority: 'ATTENTION',
    date: '05.05.26',
    region: 'Global',
    category: 'TRANSPORTE',
    country: 'International',
    causes: [
      'Novos protocolos da IATA para segurança de voo',
      'Histórico de incidentes térmicos com baterias de alta densidade'
    ],
    safetyBrief: [
      'Verifique a etiqueta de Wh na sua bateria antes do check-in',
      'Proteja os terminais com fita isolante',
      'Declare o equipamento no balcão de bagagens especiais'
    ],
    lastUpdate: '06.05.26 - 14h20'
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
  { id: 'CLIMÁTICO', label: 'CLIMÁTICO', icon: Wind },
  { id: 'FRONTEIRAS', label: 'FRONTEIRAS', icon: MapIcon },
  { id: 'ESTRADAS', label: 'ESTRADAS', icon: MapPin },
  { id: 'TRANSPORTE', label: 'TRANSPORTE', icon: Plane },
  { id: 'SEGURANÇA', label: 'SEGURANÇA', icon: ShieldCheck },
  { id: 'MOCHILÃO', label: 'MOCHILÃO', icon: Backpack },
  { id: 'CICLOTURISMO', label: 'CICLOTURISMO', icon: Bike },
  { id: 'OVERLAND', label: 'OVERLAND', icon: Truck },
  { id: 'EQUIPAMENTO', label: 'EQUIPAMENTO', icon: Wrench },
];

function SafetyGuidelines() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-20"
    >
      {/* Intro */}
      <div className="dashboard-card p-8 border-[#ff641d]/10 bg-[#ff641d]/[0.02]">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-[#ff641d]/10 text-[#ff641d]">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">SEGURANÇA NA ESTRADA</h2>
        </div>
        <p className="text-white/60 text-sm font-mono uppercase tracking-widest leading-relaxed">
          Viajar pela América Latina pode ser uma das experiências mais intensas e transformadoras da vida. 
          Mas toda aventura exige atenção, leitura de ambiente e preparação.
        </p>
        <div className="mt-8 pt-8 border-t border-white/5">
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.2em] leading-relaxed italic">
            O objetivo desta área é reunir alertas, boas práticas e informações úteis para ajudar mochileiros, 
            cicloturistas, moto viajantes e viajantes de motorhome a tomarem decisões mais seguras na estrada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Antes de Pegar a Estrada */}
        <div className="dashboard-card p-8 border-white/[0.03]">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                <Clock size={16} />
             </div>
             <h3 className="text-sm font-display font-black text-white uppercase tracking-widest">ANTES DE PEGAR A ESTRADA</h3>
          </div>
          <ul className="space-y-4">
             {[
               'Avise alguém sobre sua rota',
               'Faça backup digital dos documentos',
               'Tenha cópias físicas importantes',
               'Salve mapas offline',
               'Verifique clima e condições locais',
               'Planeje pontos de apoio e abastecimento',
               'Evite viajar sem água e comida reserva'
             ].map((item, i) => (
               <li key={i} className="flex items-center gap-3 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                 <CheckCircle2 size={12} className="text-[#ff641d]" />
                 {item}
               </li>
             ))}
          </ul>
        </div>

        {/* Segurança em Rotas */}
        <div className="dashboard-card p-8 border-white/[0.03]">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                <Globe size={16} />
             </div>
             <h3 className="text-sm font-display font-black text-white uppercase tracking-widest">ROTAS E FRONTEIRAS</h3>
          </div>
          <p className="text-[10px] text-orange-400/80 font-mono uppercase tracking-widest mb-6 bg-orange-400/5 p-3 rounded-lg border border-orange-400/10">
            ⚠️ Pesquise a situação atual da região antes de cruzar fronteiras. Mudanças políticas ou climáticas podem alterar rotas rapidamente.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
             {['BLOQUEIOS', 'ESTRADAS INTERDITADAS', 'REGIÕES ISOLADAS', 'POSTOS FECHADOS', 'DOCUMENTAÇÃO', 'ALERTAS CLIMÁTICOS'].map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-[9px] font-mono text-white/20 uppercase tracking-widest">
                 <div className="w-1 h-1 bg-white/10 rounded-full" />
                 {item}
               </div>
             ))}
          </div>
        </div>

        {/* Dicas Ciclo/Mochila */}
        <div className="dashboard-card p-8 border-white/[0.03]">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                <Backpack size={16} />
             </div>
             <h3 className="text-sm font-display font-black text-white uppercase tracking-widest">CICLO & MOCHILÃO</h3>
          </div>
          <div className="space-y-4">
             <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#ff641d]/5 text-[#ff641d]">
                   <Eye size={14} />
                </div>
                <div>
                   <div className="text-[10px] font-mono text-white/60 uppercase tracking-widest mb-1">MANTENHA VISIBILIDADE</div>
                   <div className="text-[9px] font-mono text-white/30 uppercase leading-relaxed">Evite pedalar longos trechos à noite e não exponha equipamentos caros em áreas movimentadas.</div>
                </div>
             </div>
             <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#ff641d]/5 text-[#ff641d]">
                   <MapPin size={14} />
                </div>
                <div>
                   <div className="text-[10px] font-mono text-white/60 uppercase tracking-widest mb-1">LOCALIZAÇÃO</div>
                   <div className="text-[9px] font-mono text-white/30 uppercase leading-relaxed">Compartilhe sua localização em tempo real com alguém de confiança.</div>
                </div>
             </div>
             <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#ff641d]/5 text-[#ff641d]">
                   <Thermometer size={14} />
                </div>
                <div>
                   <div className="text-[10px] font-mono text-white/60 uppercase tracking-widest mb-1">ESTADO AMBIENTAL</div>
                   <div className="text-[9px] font-mono text-white/30 uppercase leading-relaxed">Sempre acompanhe a previsão do tempo e prefira locais indicados pela comunidade.</div>
                </div>
             </div>
          </div>
        </div>

        {/* Segurança Digital */}
        <div className="dashboard-card p-8 border-white/[0.03]">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                <Smartphone size={16} />
             </div>
             <h3 className="text-sm font-display font-black text-white uppercase tracking-widest">SEGURANÇA DIGITAL</h3>
          </div>
          <div className="space-y-6">
             <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                   <Wifi size={14} className="text-[#ff641d]" />
                   <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Evite redes Wi-Fi públicas sem proteção</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                   <Lock size={14} className="text-[#ff641d]" />
                   <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Use autenticação em dois fatores</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                   <Cloud size={14} className="text-[#ff641d]" />
                   <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Backup de documentos na nuvem</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Community / Sensor Section */}
      <div className="dashboard-card p-10 border-[#ff641d]/20 bg-gradient-to-br from-[#ff641d]/10 via-transparent to-transparent text-center">
         <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-4">COMUNIDADE E ALERTAS</h3>
            <p className="text-white/40 text-xs font-mono uppercase tracking-[0.2em] leading-relaxed mb-8">
               O Rota Livre Hub funciona como uma inteligência coletiva da estrada. 
               Se encontrar riscos, bloqueios, golpes ou estradas perigosas, compartilhe com a comunidade.
            </p>
            
            <div className="flex flex-col items-center gap-6">
               <div className="p-1 rounded-full bg-[#ff641d]/20">
                  <div className="px-8 py-3 rounded-full bg-[#ff641d] text-white font-display font-black text-sm uppercase tracking-tighter shadow-[0_0_30px_rgba(255,100,29,0.4)]">
                     SEJA UM SENSOR
                  </div>
               </div>
               <p className="text-[10px] text-[#ff641d] font-mono font-bold uppercase tracking-[0.4em] animate-pulse">
                  Sua informação pode ajudar outros viajantes em tempo real.
               </p>
            </div>
         </div>
      </div>

      {/* Final Note */}
      <div className="text-center">
         <div className="inline-flex items-center gap-4 text-white/10 mb-6">
            <div className="w-12 h-[1px] bg-white/10" />
            <Zap size={20} />
            <div className="w-12 h-[1px] bg-white/10" />
         </div>
         <h4 className="text-lg font-display font-black text-white/60 uppercase tracking-widest mb-4">A MELHOR FERRAMENTA É O SEU PLANEJAMENTO</h4>
         <p className="text-[10px] text-white/20 font-mono uppercase tracking-[0.5em]">ATENÇÃO • PLANEJAMENTO • COMUNIDADE</p>
         <div className="mt-8 text-[9px] font-mono text-white/30 uppercase tracking-widest italic">Viaje consciente. Viaje preparado. Boa estrada. 🌎</div>
      </div>
    </motion.div>
  );
}

const PRIORITY_THEMES = {
  LOW: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.1)]' },
  MODERATE: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', glow: 'shadow-[0_0_15px_rgba(74,222,128,0.1)]' },
  ATTENTION: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', glow: 'shadow-[0_0_20px_rgba(251,146,60,0.15)]' },
  CRITICAL: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'shadow-[0_0_25px_rgba(239,68,68,0.2)]' },
};

export default function AlertHub() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

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
            {activeCategory === 'SEGURANÇA' ? (
              <SafetyGuidelines />
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredAlerts.flatMap((alert, index) => {
                  const isExpanded = expandedAlertId === alert.id;
                  const items = [
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`dashboard-card group p-6 border-white/[0.03] hover:border-white/10 transition-all cursor-pointer overflow-hidden relative ${isExpanded ? 'border-[#ff641d]/30 bg-[#ff641d]/[0.02]' : ''}`}
                      onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
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
                          
                          <h3 className="text-xl font-display font-black text-white uppercase tracking-tight mb-3 group-hover:text-[#ff641d] transition-colors leading-tight">
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
  
                          {/* Expanded Info */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-8 mt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div>
                                    <div className="text-[9px] font-mono text-[#ff641d] uppercase tracking-[0.3em] mb-4 font-bold flex items-center gap-2">
                                      <div className="w-4 h-[1px] bg-[#ff641d]" /> CAUSAS_PROVÁVEIS
                                    </div>
                                    <ul className="space-y-2">
                                      {alert.causes.map((cause, i) => (
                                        <li key={i} className="text-[10px] text-white/60 font-mono uppercase tracking-widest flex items-start gap-2">
                                          <span className="text-[#ff641d]">•</span> {cause}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-mono text-[#ff641d] uppercase tracking-[0.3em] mb-4 font-bold flex items-center gap-2">
                                      <div className="w-4 h-[1px] bg-[#ff641d]" /> RECOMENDAÇÕES_SAFETY
                                    </div>
                                    <ul className="space-y-2 mb-6">
                                      {alert.safetyBrief.map((item, i) => (
                                        <li key={i} className="text-[10px] text-white/60 font-mono uppercase tracking-widest flex items-start gap-2">
                                          <span className="text-[#ff641d]">•</span> {item}
                                        </li>
                                      ))}
                                    </ul>
                                    
                                    <Link 
                                      to="/mapa" 
                                      className="inline-flex items-center gap-2 text-[9px] font-mono text-[#ff641d] hover:text-white transition-colors uppercase tracking-widest font-bold group/map"
                                    >
                                      <ExternalLink size={12} className="group-hover/map:translate-x-0.5 group-hover/map:-translate-y-0.5 transition-transform" />
                                      VER NO MAPA_ESTRATÉGICO
                                    </Link>
                                  </div>
                                  <div className="md:col-span-2 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">
                                      Protocolo: TR-SEC-{alert.id}
                                    </div>
                                    <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest italic">
                                      Última Atualização: <span className="text-[#ff641d]/60">{alert.lastUpdate}</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
    
                        <div className={`mt-4 md:mt-0 flex items-center gap-2 self-end md:self-center text-[10px] font-mono font-bold transition-all uppercase tracking-[0.2em] ${isExpanded ? 'text-white' : 'text-white/20 group-hover:text-white'}`}>
                          {isExpanded ? 'FECHAR' : 'DETALHES'} 
                          <ChevronRight size={14} className={`text-[#ff641d] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </motion.div>
                  ];
  
                  if (index === 1) {
                    items.push(
                      <motion.div 
                        key="alert-list-ad"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <AdSense slot="alert_list_inline_ad" className="min-h-[100px] border-none bg-transparent" />
                      </motion.div>
                    );
                  }
  
                  return items;
                })}
              </AnimatePresence>
            )}

            {activeCategory !== 'SEGURANÇA' && filteredAlerts.length === 0 && (
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
             <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.4em] mb-6">Status_Global</h4>
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

          <AdSense slot="sidebar_ad" />

          {/* Community Reports Feed */}
          <CommunityReports />

          {/* Contribution Prompt */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[#ff641d]/20 to-transparent border border-[#ff641d]/10 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-sm font-display font-black text-white uppercase tracking-tight mb-2">SEJA UM SENSOR</h4>
              <p className="text-[10px] text-white/60 font-mono uppercase tracking-widest leading-relaxed mb-6">
                Encontrou uma interdição ou mudança de regra na estrada? Reporte para a comunidade.
              </p>
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="px-5 py-2.5 bg-white text-black font-display font-black text-[10px] uppercase tracking-tighter hover:bg-[#ff641d] hover:text-white transition-all rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Enviar Reporte Tático
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 text-white/[0.02] rotate-12 transition-transform group-hover:rotate-0">
              <Globe size={120} />
            </div>
          </div>

          <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />

        </div>
      </div>
    </div>
  );
}
