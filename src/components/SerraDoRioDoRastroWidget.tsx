import { useState, useEffect } from 'react';
import { 
  Wind, 
  Eye, 
  Thermometer, 
  Navigation, 
  Loader2, 
  AlertTriangle, 
  RefreshCw, 
  MapPin, 
  Activity, 
  ShieldAlert, 
  Compass,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface SerraData {
  statusColor: 'SAFE' | 'ATTENTION' | 'DANGER';
  visibility_km: string;
  alertTitle: string;
  alertMessage: string;
  metrics: {
    temp: number;
    apparentTemp: number;
    wind: number;
    windGusts: number;
    visibility_km: number;
    weatherCode: number;
    weatherDesc: string;
    precipitation: number;
  };
}

export default function SerraDoRioDoRastroWidget() {
  const [data, setData] = useState<SerraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Styles configuration based on statusColor
  const styles = {
    SAFE: {
      color: "text-green-500",
      accent: "#22c55e",
      border: "border-green-500/20",
      bg: "bg-green-950/10",
      lineBg: "bg-green-500/5",
      dot: "bg-green-500",
      heading: "border-green-500/30",
      banner: "from-green-500/5 to-transparent",
      statusLabel: "SEGURO (SAFE)",
      statusDesc: "Condições ideais de vento e visibilidade.",
      iconColor: "text-green-400"
    },
    ATTENTION: {
      color: "text-yellow-500",
      accent: "#eab308",
      border: "border-yellow-500/20",
      bg: "bg-yellow-950/10",
      lineBg: "bg-yellow-500/5",
      dot: "bg-yellow-500",
      heading: "border-yellow-500/30",
      banner: "from-yellow-500/5 to-transparent",
      statusLabel: "ATENÇÃO (ATTENTION)",
      statusDesc: "Neblina na altitude ou vento lateral moderado.",
      iconColor: "text-yellow-400"
    },
    DANGER: {
      color: "text-red-500",
      accent: "#ef4444",
      border: "border-red-500/20",
      bg: "bg-red-950/10",
      lineBg: "bg-red-500/5",
      dot: "bg-red-500",
      heading: "border-red-500/30",
      banner: "from-red-500/5 to-transparent",
      statusLabel: "RISCO CRÍTICO (DANGER)",
      statusDesc: "Ventos violentos ou neblina espessa na serra.",
      iconColor: "text-red-400"
    }
  };

  const loadData = async (silent = false, force = false) => {
    const CACHE_KEY = 'rotalivre_serra_weather';
    const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

    // Tentar ler cache local se não for um recarregamento forçado
    if (!force) {
      try {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          const now = Date.now();
          if (cached && cached.timestamp && (now - cached.timestamp < CACHE_TTL_MS) && cached.data) {
            console.log("[WeatherClient] Cache local ativado para Serra do Rio do Rastro (Restando " + Math.round((CACHE_TTL_MS - (now - cached.timestamp)) / 1000) + "s)");
            setData(cached.data);
            setLoading(false);
            return;
          }
        }
      } catch (cacheErr) {
        console.warn("[WeatherClient] Erro ao descriptografar cache local:", cacheErr);
      }
    }

    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      let fetchedData: SerraData;
      
      try {
        const res = await fetch('/api/weather/serra-rio-do-rastro');
        if (!res.ok) throw new Error('Status de resposta de rede inválido de API backend');
        
        const text = await res.text();
        const trimmed = text.trim();
        
        // Se retornar HTML de uma hospedagem estática que faz fallback para index.html
        if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
          throw new Error('Retornou HTML ao invés de JSON (Provável ambiente estático como Vercel)');
        }
        
        fetchedData = JSON.parse(trimmed);
      } catch (backendError) {
        console.warn("API de backend indisponível ou em host estático (como Vercel). Iniciando recuperação local direta via Open-Meteo:", backendError);
        
        // Recuperação direta e cálculo equivalente em tempo real no Client-side
        const lat = -28.39;
        const lon = -49.55;
        const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,visibility&timezone=auto`;
        
        const omResponse = await fetch(openMeteoUrl);
        if (!omResponse.ok) {
          throw new Error(`Open-Meteo API falhou com status ${omResponse.status}`);
        }
        
        const omData = await omResponse.json();
        if (!omData.current) {
          throw new Error("Dados da Open-Meteo inválidos retornados direto na Serra");
        }
        
        const current = omData.current;
        const wind = current.wind_speed_10m || 0;
        const windGusts = current.wind_gusts_10m || 0;
        const temp = current.temperature_2m || 0;
        const apparentTemp = current.apparent_temperature || temp;
        
        // Determinar precisão de visibilidade em km
        let visibilityRaw = current.visibility;
        let visibility_km = 10;
        if (typeof visibilityRaw === 'number') {
          visibility_km = visibilityRaw / 1000;
        } else {
          const code = current.weather_code || 0;
          if (code === 45 || code === 48) {
            visibility_km = 0.3;
          } else if (code >= 95) {
            visibility_km = 1.2;
          } else if (code >= 61 && code <= 65) {
            visibility_km = 2.5;
          } else if (code <= 3) {
            visibility_km = 10.0;
          } else {
            visibility_km = 6.0;
          }
        }
        
        // Classificar status operacional de segurança baseado estritamente nos limites do projeto
        let statusColor: 'SAFE' | 'ATTENTION' | 'DANGER' = 'SAFE';
        if (visibility_km < 1 || wind > 50) {
          statusColor = 'DANGER';
        } else if ((visibility_km >= 1 && visibility_km <= 5) || (wind >= 30 && wind <= 50)) {
          statusColor = 'ATTENTION';
        } else {
          statusColor = 'SAFE';
        }
        
        const localWmoDesc = (code: number): string => {
          const codes: Record<number, string> = {
            0: 'Céu Limpo', 
            1: 'Predominantemente Limpo', 
            2: 'Parcialmente Nublado', 
            3: 'Nublado',
            45: 'Nevoeiro', 
            48: 'Nevoeiro Escarchante', 
            51: 'Chuvisco Leve',
            53: 'Chuvisco Moderado',
            55: 'Chuvisco Denso',
            61: 'Chuva Leve', 
            63: 'Chuva Moderada', 
            65: 'Chuva Forte',
            71: 'Neve Leve', 
            73: 'Neve Moderada',
            75: 'Neve Forte',
            80: 'Pancadas de Chuva Leves',
            81: 'Pancadas de Chuva Moderadas',
            82: 'Pancadas de Chuva Violentas',
            95: 'Trovoada Leve/Moderada',
            96: 'Trovoada com Granizo Leve',
            99: 'Trovoada com Granizo Forte'
          };
          return codes[code] || 'Condições Variáveis';
        };
        
        const metrics = {
          temp,
          apparentTemp,
          wind,
          windGusts,
          visibility_km,
          weatherCode: current.weather_code || 0,
          weatherDesc: localWmoDesc(current.weather_code || 0),
          precipitation: current.precipitation || 0
        };
        
        const alertTitle = statusColor === 'SAFE' 
          ? "PISTA LIMPA: VALORES DENTRO DO PROGRAMADO" 
          : statusColor === 'ATTENTION' 
            ? "ATENÇÃO: NEBLINA OU VENTOS MODERADOS/LATERAIS" 
            : "ALERTA CRÍTICO: CONDIÇÕES IMPRÓPRIAS";
            
        const alertMessage = statusColor === 'SAFE'
          ? "Visibilidade favorável e ventos sob controle. Subida segura para praticantes de cicloturismo de aventura."
          : statusColor === 'ATTENTION'
            ? "Trechos com neblina na altitude ou rajadas de vento lateral. Mantenha os faróis ativos e velocidade reduzida."
            : "Condições de alto risco com ventos severos ou névoa densa. Rota instável e extremamente desaconselhada.";
            
        fetchedData = {
          statusColor,
          visibility_km: visibility_km.toFixed(1),
          alertTitle,
          alertMessage,
          metrics
        };
      }
      
      // Salvar resultado bem-sucedido no localStorage
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: fetchedData,
          timestamp: Date.now()
        }));
      } catch (saveErr) {
        console.warn("[WeatherClient] Falha ao persistir no cache local:", saveErr);
      }

      setData(fetchedData);
      setError(false);
    } catch (err) {
      console.error("Erro crítico ao carregar dados meteorológicos da Serra do Rio do Rastro:", err);
      setError(true);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false, false);
    const interval = setInterval(() => loadData(true, true), 1000 * 60 * 15); // refresh every 15 minutes (forces live fetch)
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="relative overflow-hidden border border-white/5 bg-white/[0.01] rounded-3xl p-8 flex flex-col items-center justify-center min-h-[320px] transition-all">
        <Loader2 className="text-[#ff641d] animate-spin mb-4" size={32} />
        <span className="text-[10px] font-mono text-[#ff641d] tracking-[0.4em] uppercase animate-pulse">Sincronizando_Analisador_Serra</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="relative overflow-hidden border border-red-500/20 bg-red-500/5 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[320px] text-center">
        <AlertTriangle className="text-red-500 mb-4 animate-bounce" size={36} />
        <h3 className="font-display font-bold text-white text-base uppercase tracking-wider mb-2">ERRO NO PROXIMIDADE OPERACIONAL</h3>
        <p className="text-white/40 text-xs font-mono max-w-md uppercase mb-6">Falha crítica de comunicação com o microsserviço de meteorologia da Serra do Rio do Rastro.</p>
        <button 
          onClick={() => loadData()}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl font-mono text-[10px] font-black uppercase text-red-400 hover:bg-red-500/20 transition-all"
        >
          <RefreshCw size={12} /> RE-CONECTAR_CANAL
        </button>
      </div>
    );
  }

  const currentStyle = styles[data.statusColor] || styles.SAFE;

  return (
    <div className={`relative overflow-hidden border ${currentStyle.border} ${currentStyle.bg} rounded-3xl p-6 md:p-8 transition-all shadow-2xl`}>
      {/* Background visual glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] via-transparent to-transparent pointer-events-none" />
      <div 
        className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] pointer-events-none opacity-20 transition-all" 
        style={{ backgroundColor: currentStyle.accent }}
      />
      
      {/* Header telemetry info */}
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl ${currentStyle.bg} border ${currentStyle.border} flex items-center justify-center ${currentStyle.color} flex-shrink-0 animate-pulse`}>
            {data.statusColor === 'DANGER' ? <ShieldAlert size={24} /> : data.statusColor === 'ATTENTION' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-black">Serra do Rio do Rastro - SC</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
              TERMÔMETRO_TÁTICO_DA_COMUNIDADE
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-end lg:self-center">
          <div className="text-right hidden sm:block">
            <div className="text-[8px] font-mono text-white/30 uppercase tracking-widest">STATUS_ANALISE</div>
            <div className={`text-[10px] font-mono font-black uppercase ${currentStyle.color}`}>
              {currentStyle.statusLabel}
            </div>
          </div>
          <button
            onClick={() => loadData(true, true)}
            disabled={isRefreshing}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[9px] font-mono font-bold text-white/60 hover:text-white uppercase tracking-widest transition-all disabled:opacity-50`}
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'AGENTE_RODANDO...' : 'RE-ANALISAR_V2'}
          </button>
        </div>
      </div>

      {/* Main stats visualizers columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
        {/* Left Side: Dynamic Big Status Banner */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-[#ff641d] uppercase tracking-[0.3em] font-black block">RESULTADO DA INTELIGÊNCIA</span>
            <div>
              <div className={`text-4xl font-display font-black uppercase tracking-tighter mb-2 ${currentStyle.color}`}>
                {data.alertTitle || "SINAL OPERACIONAL ATIVO"}
              </div>
              <p className="text-white/70 text-xs font-mono uppercase tracking-wide leading-relaxed p-4 bg-white/[0.02] border border-white/5 rounded-2xl border-l-[3px] border-l-[#ff641d]">
                "{data.alertMessage || "Condições operacionais de alto-nível. Siga os protocolos de rodagem padrão."}"
              </p>
            </div>
          </div>

          {/* Quick Guidance Alert Callout */}
          <div className={`p-4 rounded-2xl border ${currentStyle.border} ${currentStyle.lineBg} flex items-start gap-4`}>
            <Activity className={`flex-shrink-0 mt-0.5 ${currentStyle.color}`} size={16} />
            <div className="space-y-1">
              <div className="text-[10px] font-display font-black text-white uppercase tracking-wider">RECOMENDAÇÃO TÁTICA</div>
              <div className="text-[9px] font-mono text-white/50 uppercase leading-normal">
                {currentStyle.statusDesc} {data.statusColor === 'DANGER' ? 'Condições impeditivas de rodagem para duas rodas.' : data.statusColor === 'ATTENTION' ? 'Altamente recomendado o uso de luzes infravermelho/halógenas.' : 'Verificar pontos de interdição históricos por precaução.'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Micro Gauges for Wind and Visibility */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: Vento Real (km/h) */}
          <div className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Velocidade_Vento</span>
              <Wind className="text-white/20 group-hover:text-[#ff641d] transition-colors" size={16} />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-black text-white">{data.metrics?.wind ?? 0}</span>
                <span className="text-xs font-mono text-white/40 uppercase">KM/H</span>
              </div>
              <div className="text-[8px] font-mono text-white/40 uppercase mt-2 border-t border-white/5 pt-2 flex justify-between">
                <span>Rajadas:</span>
                <span className="text-white/80 font-bold">{data.metrics?.windGusts ?? 0} km/h</span>
              </div>
            </div>
            {/* Wind gauge indicator */}
            <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-red-500 transition-all duration-1000"
                style={{ width: `${Math.min(100, ((data.metrics?.wind ?? 0) / 60) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Visibilidade Crítica (km/h) */}
          <div className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Visibilidade_Horizontal</span>
              <Eye className="text-white/20 group-hover:text-[#ff641d] transition-colors" size={16} />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-black text-white">{parseFloat(data.visibility_km).toFixed(1)}</span>
                <span className="text-xs font-mono text-white/40 uppercase">KM</span>
              </div>
              <div className="text-[8px] font-mono text-white/40 uppercase mt-2 border-t border-white/5 pt-2 flex justify-between">
                <span>Condição:</span>
                <span className={`font-bold uppercase ${currentStyle.color}`}>{data.metrics?.weatherDesc ?? 'Indefinido'}</span>
              </div>
            </div>
            {/* Visibility gauge indicator */}
            <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-1000"
                style={{ width: `${Math.min(100, ((data.metrics?.visibility_km ?? 0) / 10) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Temperatura & Sensação */}
          <div className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Temperatura_Altitude</span>
              <Thermometer className="text-white/20 group-hover:text-[#ff641d] transition-colors" size={16} />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-black text-white">{data.metrics?.temp ?? 0}°</span>
                <span className="text-xs font-mono text-white/40 uppercase">CELSIUS</span>
              </div>
              <div className="text-[8px] font-mono text-white/40 uppercase mt-2 border-t border-white/5 pt-2 flex justify-between">
                <span>Precipitação:</span>
                <span className="text-white/80 font-bold">{(data.metrics?.precipitation ?? 0).toFixed(1)} mm</span>
              </div>
            </div>
            {/* Temp gauge indicator */}
            <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-sky-400 transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.max(0, ((data.metrics?.temp ?? 0) + 10) / 45 * 100))}%` }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
