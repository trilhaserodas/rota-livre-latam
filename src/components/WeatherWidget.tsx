import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Loader2 } from 'lucide-react';

interface WeatherData {
  temp: number;
  description: string;
  windSpeed: number;
  condition: 'sunny' | 'cloudy' | 'rainy';
}

interface WeatherWidgetProps {
  lat: number;
  lng: number;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ lat, lng }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchWeather = async () => {
      try {
        setError(false);
        setLoading(true);
        
        // Use our server-side proxy for better reliability and OWM fallback
        const response = await fetch(`/api/weather?lat=${lat}&lon=${lng}`, {
          signal: controller.signal
        });
        
        if (!response.ok) throw new Error('API_ERROR');
        
        const data = await response.json();

        // Map icons/codes to local conditions
        const getCondition = (icon: string) => {
          if (icon.includes('01') || icon.includes('02')) return 'sunny';
          if (icon.includes('03') || icon.includes('04') || icon.includes('50')) return 'cloudy';
          return 'rainy';
        };

        setWeather({
          temp: Math.round(data.main.temp),
          windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h if it was m/s
          description: data.weather[0].description,
          condition: getCondition(data.weather[0].icon)
        });
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Weather fetch error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 border-t border-white/5 animate-pulse">
        <Loader2 className="w-3 h-3 text-[#ff641d] animate-spin" />
        <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Consultando Satélite...</span>
      </div>
    );
  }

  if (error || !weather) return null;

  return (
    <div className="py-3 border-t border-white/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-white/50">
          <Cloud className="w-3 h-3" />
          <span className="text-[9px] font-display font-bold uppercase tracking-widest text-[#ff641d]">Clima Local</span>
        </div>
        <div className="flex items-center gap-1 text-white/40 text-[9px] font-mono">
          <Wind className="w-2.5 h-2.5" />
          {weather.windSpeed} km/h
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 bg-white/5 rounded-sm p-2 border border-white/5 hover:bg-white/10 transition-colors duration-300">
        <div className="flex gap-2 items-center">
          <div className="p-1.5 bg-black/40 rounded-sm">
            {weather.condition === 'sunny' && <Sun className="w-3 h-3 text-yellow-500" />}
            {weather.condition === 'cloudy' && <Cloud className="w-3 h-3 text-blue-300" />}
            {weather.condition === 'rainy' && <CloudRain className="w-3 h-3 text-blue-500" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white tracking-tight leading-none mb-1">
              {weather.description}
            </span>
            <span className="text-[8px] text-white/30 uppercase font-mono tracking-tighter">Condição</span>
          </div>
        </div>
        
        <div className="flex gap-2 items-center border-l border-white/5 pl-2">
          <div className="p-1.5 bg-black/40 rounded-sm">
            <Thermometer className="w-3 h-3 text-orange-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white tracking-tight leading-none mb-1">
              {weather.temp}°C
            </span>
            <span className="text-[8px] text-white/30 uppercase font-mono tracking-tighter">Temperatura</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
