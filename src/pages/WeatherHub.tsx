import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Droplets, 
  AlertTriangle, 
  ArrowLeft, 
  Zap, 
  Activity, 
  ShieldAlert,
  Loader2,
  Navigation,
  Thermometer,
  CloudLightning,
  Bike,
  Search,
  MapPin,
  ChevronRight,
  Navigation2,
  Compass,
  ArrowUpRight,
  CloudSun
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const REGIONS = [
  { id: 'curitiba', name: 'Curitiba', country: 'Brasil', lat: -25.43, lng: -49.27, sub: 'Capital_Paranaense' },
  { id: 'sp', name: 'São Paulo', country: 'Brasil', lat: -23.55, lng: -46.63, sub: 'Metrópole_Sudeste' },
  { id: 'floripa', name: 'Florianópolis', country: 'Brasil', lat: -27.59, lng: -48.54, sub: 'Litoral_Sul' },
  { id: 'serra-sc', name: 'Serra Catarinense', country: 'Brasil', lat: -28.01, lng: -49.59, sub: 'Urubici_Altos' },
  { id: 'chapada', name: 'Chapada Diamantina', country: 'Brasil', lat: -12.56, lng: -41.38, sub: 'Lençóis_Sertão' },
  { id: 'patagonia', name: 'Patagonia', country: 'Argentina', lat: -49.33, lng: -72.88, sub: 'El_Chaltén_Andes' },
  { id: 'atacama', name: 'Atacama', country: 'Chile', lat: -22.91, lng: -68.20, sub: 'San_Pedro_Deserto' },
  { id: 'cusco', name: 'Cusco', country: 'Peru', lat: -13.53, lng: -71.97, sub: 'Valle_Sagrado' },
  { id: 'mendoza', name: 'Mendoza', country: 'Argentina', lat: -32.89, lng: -68.85, sub: 'Cordillera_Vino' },
  { id: 'ushuaia', name: 'Ushuaia', country: 'Argentina', lat: -54.80, lng: -68.30, sub: 'Fin_del_Mundo' },
  { id: 'austral', name: 'Carretera Austral', country: 'Chile', lat: -45.57, lng: -72.07, sub: 'Coyhaique_Patagonia' },
];

interface WeatherData {
  id: string;
  temp: number;
  feelsLike: number;
  wind: number;
  windGusts: number;
  windDirection: number;
  humidity: number;
  code: number;
  precip: number;
  precipSum: number;
  description: string;
  status: 'SAFE' | 'ATTENTION' | 'ALERT';
  bikeCondition: {
    label: string;
    description: string;
    color: string;
    icon: any;
  };
}

interface ForecastDay {
  date: string;
  dayName: string;
  tempMin: number;
  tempMax: number;
  feelsLike: number;
  wind: number;
  gusts: number;
  humidity: number;
  rainChance: number;
  code: number;
}

export default function WeatherHub() {
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [currentLocationWeather, setCurrentLocationWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getBikeInterpretation = (temp: number, wind: number, gusts: number, precip: number, code: number) => {
    if (wind > 45 || gusts > 60 || code >= 95 || code === 82) {
      return { 
        label: '🔴 ALERTA DE TEMPESTADE', 
        description: 'Condições perigosas. Evite qualquer deslocamento.', 
        color: 'text-red-500 border-red-500/20 bg-red-500/5',
        icon: AlertTriangle
      };
    }
    if (temp < 5 || (code >= 71 && code <= 77)) {
      return { 
        label: '🔵 FRIO INTENSO AO AMANHECER', 
        description: 'Risco de hipotermia e gelo na pista. Use camadas térmicas.', 
        color: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
        icon: CloudSnow
      };
    }
    if (wind > 25 || gusts > 40) {
      return { 
        label: '🟡 VENTO MODERADO PARA ALFORJES', 
        description: 'Vento lateral pode desestabilizar a bike carregada.', 
        color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5',
        icon: Wind
      };
    }
    if (precip > 2 || code >= 51) {
      return { 
        label: '🟡 ATENÇÃO: PISO MOLHADO', 
        description: 'Frenagem reduzida. Use paralamas e iluminação.', 
        color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5',
        icon: CloudRain
      };
    }
    return { 
      label: '🟢 CONDIÇÕES FAVORÁVEIS PARA PEDAL', 
      description: 'Tempo estável. Ideal para longas distâncias.', 
      color: 'text-green-500 border-green-500/20 bg-green-500/5',
      icon: Bike
    };
  };

  const getWindDirection = (degree: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    return directions[Math.round(degree / 45) % 8];
  };

  const fetchForecast = async (lat: number, lng: number) => {
    setLoadingForecast(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,wind_speed_10m_max,wind_gusts_10m_max,relative_humidity_2m_max,precipitation_probability_max&timezone=auto`);
      const data = await res.json();
      
      const days: ForecastDay[] = data.daily.time.map((time: string, i: number) => {
        const date = new Date(time);
        return {
          date: time,
          dayName: date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          feelsLike: Math.round(data.daily.apparent_temperature_max[i]),
          wind: Math.round(data.daily.wind_speed_10m_max[i]),
          gusts: Math.round(data.daily.wind_gusts_10m_max[i]),
          humidity: data.daily.relative_humidity_2m_max[i],
          rainChance: data.daily.precipitation_probability_max[i],
          code: data.daily.weather_code[i]
        };
      });
      setForecast(days);
    } catch (err) {
      console.error("Forecast fetch failed:", err);
    } finally {
      setLoadingForecast(false);
    }
  };

  const fetchLocationWeather = async (lat: number, lng: number, name: string) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation`);
      const data = await res.json();
      
      if (data.current) {
        const code = data.current.weather_code;
        const wind = Math.round(data.current.wind_speed_10m);
        const gusts = Math.round(data.current.wind_gusts_10m);
        const temp = Math.round(data.current.temperature_2m);
        const precip = data.current.precipitation;
        
        let status: 'SAFE' | 'ATTENTION' | 'ALERT' = 'SAFE';
        if (wind > 40 || code >= 95) status = 'ALERT';
        else if (wind > 20 || code >= 51 || precip > 2) status = 'ATTENTION';

        const weather: WeatherData = {
          id: 'custom',
          temp,
          feelsLike: Math.round(data.current.apparent_temperature),
          wind,
          windGusts: gusts,
          windDirection: data.current.wind_direction_10m,
          humidity: data.current.relative_humidity_2m,
          precip: 0, // Prob is hourly, using daily sum/prob in forecast
          precipSum: precip,
          code,
          description: getWeatherDesc(code),
          status,
          bikeCondition: getBikeInterpretation(temp, wind, gusts, precip, code)
        };
        
        setCurrentLocationWeather(weather);
        fetchForecast(lat, lng);
      }
    } catch (err) {
      console.error("Location weather fetch failed:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=pt&format=json`);
      const data = await res.json();
      if (data.results && data.results[0]) {
        const result = data.results[0];
        setSearchResult(result);
        fetchLocationWeather(result.latitude, result.longitude, result.name);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada no seu navegador.");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSearchResult({ name: 'Sua Localização', country: '' });
        fetchLocationWeather(latitude, longitude, 'Local Atual');
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Não foi possível detectar sua localização. Verifique as permissões.");
      }
    );
  };

  useEffect(() => {
    async function fetchAllWeather() {
      const results: Record<string, WeatherData> = {};
      
      try {
        await Promise.all(REGIONS.map(async (region) => {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation&hourly=precipitation_probability&forecast_days=1`
          );
          const data = await res.json();
          
          if (data.current) {
            const code = data.current.weather_code;
            const wind = Math.round(data.current.wind_speed_10m);
            const gusts = Math.round(data.current.wind_gusts_10m);
            const precip = data.current.precipitation;
            const temp = Math.round(data.current.temperature_2m);
            const prob = data.hourly?.precipitation_probability?.[0] || 0;

            let status: 'SAFE' | 'ATTENTION' | 'ALERT' = 'SAFE';
            if (wind > 40 || code >= 95 || (code >= 71 && code <= 77)) status = 'ALERT';
            else if (wind > 20 || code >= 51 || precip > 2) status = 'ATTENTION';

            results[region.id] = {
              id: region.id,
              temp,
              feelsLike: Math.round(data.current.apparent_temperature),
              wind,
              windGusts: gusts,
              windDirection: data.current.wind_direction_10m,
              humidity: data.current.relative_humidity_2m,
              code,
              precip: prob,
              precipSum: precip,
              description: getWeatherDesc(code),
              status,
              bikeCondition: getBikeInterpretation(temp, wind, gusts, precip, code)
            };
          }
        }));
        setWeatherData(results);
      } catch (err) {
        console.error("Failed to fetch fleet weather:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllWeather();
    const interval = setInterval(fetchAllWeather, 1000 * 60 * 15); // 15 min
    return () => clearInterval(interval);
  }, []);

  const getWeatherDesc = (code: number) => {
    if (code === 0) return "Céu Limpo";
    if (code <= 3) return "Nublado";
    if (code >= 51 && code <= 67) return "Chuva / Garoa";
    if (code >= 71 && code <= 77) return "Neve";
    if (code >= 80 && code <= 82) return "Pancadas";
    if (code >= 95) return "Tempestade";
    return "Instável";
  };

  const getWeatherIcon = (code: number, size = 24, className = "text-[#ff641d]") => {
    if (code === 0) return <Sun size={size} className="text-yellow-500" />;
    if (code <= 3) return <CloudSun size={size} className="text-white/60" />;
    if (code >= 51 && code <= 67) return <CloudRain size={size} className={className} />;
    if (code >= 71 && code <= 77) return <CloudSnow size={size} className="text-blue-300" />;
    if (code >= 80 && code <= 82) return <CloudRain size={size} className="text-blue-500" />;
    if (code >= 95) return <CloudLightning size={size} className="text-[#ff641d] animate-pulse" />;
    return <Cloud size={size} className="text-white/40" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'SAFE') return 'text-green-500';
    if (status === 'ATTENTION') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBg = (status: string) => {
    if (status === 'SAFE') return 'bg-green-500/10 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]';
    if (status === 'ATTENTION') return 'bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]';
    return 'bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
  };

  return (
    <div className="min-h-screen bg-[#0b0c0d] pt-24 pb-32 px-6 md:px-12 relative overflow-hidden">
      {/* Background Map elements */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-white rounded-full animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] border border-white rotate-45" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-[#ff641d]/10 border border-[#ff641d]/20 rounded-full">
                  <Activity className="text-[#ff641d] animate-pulse" size={14} />
                  <span className="text-[10px] font-mono text-[#ff641d] uppercase tracking-[0.4em] font-black">Live_Ops_Signal</span>
                </div>
              </div>
              <h1 className="text-5xl md:text-8xl font-display font-black text-white uppercase tracking-tighter leading-none">
                HUB<span className="text-[#ff641d]">.</span>CLIMA
                <span className="block text-2xl md:text-3xl text-white/20 mt-2">OPERACIONAL // LATAM_GRID</span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                to="/alert-hub" 
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-mono font-bold text-white/40 hover:text-white uppercase tracking-widest transition-all"
              >
                <ArrowLeft size={16} /> Voltar
              </Link>
              <button
                onClick={handleUseLocation}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-[#ff641d]/10 hover:bg-[#ff641d]/20 border border-[#ff641d]/20 rounded-xl text-[10px] font-mono font-bold text-[#ff641d] uppercase tracking-widest transition-all"
              >
                <MapPin size={16} /> Me localizar
              </button>
            </div>
          </header>

          {/* Search Bar - Tactical Style */}
          <div className="mb-12 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff641d] to-transparent opacity-10 blur group-focus-within:opacity-30 transition-opacity" />
            <div className="relative flex items-center gap-4 bg-white/[0.02] border border-white/10 rounded-2xl p-2 focus-within:border-[#ff641d]/40 transition-all shadow-2xl">
              <div className="pl-4 text-white/20">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="BUSCAR LOCAL OU REGIÃO... (Ex: Ushuaia, Atacama, Cusco)"
                className="flex-1 bg-transparent border-none text-white font-mono text-sm focus:ring-0 placeholder:text-white/10 uppercase tracking-widest py-4"
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-[#ff641d] hover:bg-[#ff844d] text-black px-8 py-4 rounded-xl font-mono font-black text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50"
              >
                {isSearching ? 'Buscando...' : 'Executar_Busca'}
              </button>
            </div>
          </div>

          {/* Forecast Slider - Horizontal HUD */}
          <AnimatePresence>
            {currentLocationWeather && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#ff641d]/10 border border-[#ff641d]/20 flex items-center justify-center text-[#ff641d]">
                      <Navigation2 size={24} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">
                        {searchResult?.name || 'Localização Atual'}<span className="text-[#ff641d]">.</span>
                      </h2>
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">
                        {searchResult?.country ? `${searchResult.country} // ` : ''}ANÁLISE_MULTIDIMENSIONAL
                      </p>
                    </div>
                  </div>
                  
                  {/* Cicloturismo Interpretation Header */}
                  <div className={`hidden md:flex flex-col items-end px-6 py-3 rounded-2xl border transition-all ${currentLocationWeather.bikeCondition.color}`}>
                    <div className="flex items-center gap-3 font-mono font-black text-[11px] uppercase tracking-widest">
                      <currentLocationWeather.bikeCondition.icon size={18} />
                      {currentLocationWeather.bikeCondition.label}
                    </div>
                    <div className="text-[9px] font-mono opacity-60 uppercase mt-1">
                      {currentLocationWeather.bikeCondition.description}
                    </div>
                  </div>
                </div>

                {/* Mobile Bike Condition Badge */}
                <div className={`md:hidden flex flex-col items-center mb-6 px-6 py-4 rounded-2xl border ${currentLocationWeather.bikeCondition.color}`}>
                    <div className="flex items-center gap-3 font-mono font-black text-[10px] uppercase tracking-widest text-center">
                      <currentLocationWeather.bikeCondition.icon size={18} />
                      {currentLocationWeather.bikeCondition.label}
                    </div>
                    <div className="text-[8px] font-mono opacity-60 uppercase mt-2 text-center">
                      {currentLocationWeather.bikeCondition.description}
                    </div>
                </div>

                {/* Horizontal Forecast Scroll */}
                <div 
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {/* Current Day Detailed Card */}
                  <div className="flex-shrink-0 w-80 snap-start">
                    <div className="dashboard-card p-6 border-[#ff641d]/30 bg-[#ff641d]/5 relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        {getWeatherIcon(currentLocationWeather.code, 80)}
                      </div>
                      <div className="text-[10px] font-mono text-[#ff641d] uppercase tracking-[0.5em] mb-4 font-black">AGORA</div>
                      <div className="flex items-end gap-2 mb-8">
                        <span className="text-6xl font-display font-black text-white leading-none">{currentLocationWeather.temp}°</span>
                        <div className="flex flex-col pb-1">
                          <span className="text-xs font-mono text-white/40 uppercase tracking-widest">Sensação</span>
                          <span className="text-lg font-display font-black text-[#ff641d]">{currentLocationWeather.feelsLike}°</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-y-4">
                        <div className="space-y-1">
                          <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Vento</div>
                          <div className="flex items-center gap-2 text-white font-black font-display text-sm">
                            <Navigation size={12} className="text-[#ff641d]" style={{ transform: `rotate(${currentLocationWeather.windDirection}deg)` }}/>
                            {currentLocationWeather.wind} KM/H
                          </div>
                          <div className="text-[8px] font-mono text-white/40 uppercase uppercase">RAJADAS: {currentLocationWeather.windGusts}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Umidade</div>
                          <div className="flex items-center gap-2 text-white font-black font-display text-sm">
                            <Droplets size={12} className="text-[#ff641d]"/>
                            {currentLocationWeather.humidity}%
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Chuva (24h)</div>
                          <div className="flex items-center gap-2 text-white font-black font-display text-sm">
                            <CloudRain size={12} className="text-[#ff641d]"/>
                            {currentLocationWeather.precipSum} MM
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Direção</div>
                          <div className="flex items-center gap-2 text-white font-black font-display text-sm uppercase">
                            <Compass size={12} className="text-[#ff641d]"/>
                            {getWindDirection(currentLocationWeather.windDirection)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Future Days */}
                  {forecast.slice(1).map((day, i) => (
                    <div key={day.date} className="flex-shrink-0 w-48 snap-start">
                      <div className="dashboard-card p-5 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group/card h-full flex flex-col justify-between">
                        <div className="text-center mb-4">
                          <div className="text-[10px] font-mono text-[#ff301d] uppercase tracking-widest font-black mb-1">{day.dayName}</div>
                          <div className="text-[8px] font-mono text-white/20 uppercase">{day.date.split('-').reverse().slice(0,2).join('/')}</div>
                        </div>
                        
                        <div className="flex justify-center mb-4 group-hover/card:scale-110 transition-transform">
                          {getWeatherIcon(day.code, 40)}
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-display font-black text-white">{day.tempMax}°</span>
                            <span className="text-[10px] font-mono text-white/30 uppercase">Max / {day.tempMin}° Min</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                            <div className="flex flex-col items-center gap-1">
                              <Wind size={10} className="text-[#ff641d]/50" />
                              <span className="text-[8px] font-mono text-white font-bold">{day.wind}K/H</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <Droplets size={10} className="text-[#ff641d]/50" />
                              <span className="text-[8px] font-mono text-white font-bold">{day.rainChance}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {loadingForecast && (
                    <div className="flex-shrink-0 w-48 flex items-center justify-center">
                      <Loader2 className="text-[#ff641d] animate-spin" size={24} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-display font-black text-white/40 uppercase tracking-widest flex items-center gap-3">
              <Activity size={18} className="text-[#ff641d]" /> Monitoramento_Global_Rotas
            </h2>
          </div>

          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-6">
              <Loader2 className="text-[#ff641d] animate-spin" size={48} />
              <div className="text-[10px] font-mono text-[#ff641d] uppercase tracking-[0.5em] animate-pulse">Sincronizando_Terminal_Meteorológico</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {REGIONS.map((region, idx) => {
                  const weather = weatherData[region.id];
                  if (!weather) return null;

                  return (
                    <motion.div
                      key={region.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative"
                    >
                      {/* Tactical HUD Frame */}
                      <div className={`dashboard-card h-full p-6 border transition-all duration-500 overflow-hidden relative group/inner ${getStatusBg(weather.status)} hover:border-[#ff641d]/40`}>
                        {/* Glow corners */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#ff641d]/40 opacity-0 group-hover/inner:opacity-100 transition-opacity" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#ff641d]/40 opacity-0 group-hover/inner:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#ff641d]/40 opacity-0 group-hover/inner:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#ff641d]/40 opacity-0 group-hover/inner:opacity-100 transition-opacity" />
                        {/* Status Light */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full animate-pulse ${
                             weather.status === 'SAFE' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 
                             weather.status === 'ATTENTION' ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 
                             'bg-red-500 shadow-[0_0_10px_#ef4444]'
                           }`} />
                           <span className={`text-[8px] font-mono font-black uppercase tracking-widest ${getStatusColor(weather.status)}`}>
                             {weather.status}
                           </span>
                        </div>

                        <div className="mb-8">
                          <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em] mb-1">{region.sub}</div>
                          <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight group-hover:text-[#ff641d] transition-colors">
                            {region.name}
                          </h3>
                          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">{region.country}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-white/20 uppercase text-[8px] font-mono font-bold tracking-widest">
                               <Thermometer size={10} /> Temp
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-display font-black text-white leading-none">{weather.temp}°</span>
                              <span className="text-xs font-mono text-white/40">{weather.feelsLike}°</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-white/20 uppercase text-[8px] font-mono font-bold tracking-widest">
                               <Navigation size={10} /> Vento
                            </div>
                            <div className="text-2xl font-display font-black text-white/80 leading-none">
                              {weather.wind}<span className="text-[10px] opacity-40 ml-1">K/H</span>
                            </div>
                            <div className="text-[8px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-1">
                              <ArrowUpRight size={8} /> {weather.windGusts} GUSTS
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-end border-t border-white/5 pt-6 mb-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-mono text-white/60">
                              <Droplets size={12} className="text-[#ff641d]" /> {weather.humidity}% <span className="opacity-30">UR</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-white/60">
                              <CloudRain size={12} className="text-[#ff641d]" /> {weather.precip}% <span className="opacity-30">CHANC_CHUVA</span>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">CONDIÇÃO_LOCAL</div>
                             <div className="text-[10px] font-mono font-black text-[#ff641d] uppercase tracking-widest">{weather.description}</div>
                          </div>
                        </div>

                        {/* Bike Touring Condition Badge */}
                        <div className="mt-auto">
                          <div className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${weather.bikeCondition.color}`}>
                            <div className="flex items-center gap-3 font-mono font-bold text-[9px] uppercase tracking-widest">
                              <weather.bikeCondition.icon size={16} />
                              {weather.bikeCondition.label}
                            </div>
                            <div className="text-[8px] font-mono opacity-60 uppercase leading-relaxed">
                              {weather.bikeCondition.description}
                            </div>
                          </div>
                        </div>

                        {/* Tactical HUD lines */}
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ff641d]/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          <footer className="mt-20 pt-10 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#ff641d]">
                  <ShieldAlert size={20} />
                </div>
                <div>
                   <h4 className="text-[10px] font-sans font-bold text-white uppercase tracking-widest">Protocolo de Segurança Estrada</h4>
                   <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mt-1">Sempre verifique o sinal local. Tripulação offline deve manter cautela extrema.</p>
                </div>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.5em]">Central_Monitoramento_v.4.0.1</span>
             </div>
          </footer>
        </div>
      </div>
  );
}
