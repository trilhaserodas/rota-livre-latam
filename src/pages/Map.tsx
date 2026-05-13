import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Filter, Tent, MapPin, Hammer, Coffee, Droplets, Camera, AlertTriangle, ShieldCheck, Layers, ArrowUpRight, Bike, Triangle, Plus, Minus } from 'lucide-react';
import SEO from '@/src/components/SEO';
import { cn } from '@/src/lib/utils';
import { LocationPoint } from '@/src/types';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const initialPoints: LocationPoint[] = [
  { 
    id: '1', 
    name: 'Camping Lago General Carrera', 
    lat: -46.545, 
    lng: -72.040, 
    category: 'camping', 
    description: 'Beira de lago com vista para as Capillas de Mármol. Grátis e seguro.',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: '2', 
    name: 'Oficina do Jorge - Bike', 
    lat: -34.603, 
    lng: -58.381, 
    category: 'repair', 
    description: 'Especialista em cicloturismo. Tem todas as ferramentas e peças raras.',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: '3', 
    name: 'Mirante Fitz Roy', 
    lat: -49.271, 
    lng: -73.043, 
    category: 'viewpoint', 
    description: 'O melhor ponto para fotos ao amanhecer.' 
  },
  { 
    id: '4', 
    name: 'Ponto de Água Potável - Atacama', 
    lat: -22.908, 
    lng: -68.199, 
    category: 'water', 
    description: 'Torneira pública de água filtrada. Vital para quem cruza o deserto.' 
  },
  { 
    id: '5', 
    name: 'Hostel Los Mochileros', 
    lat: -15.840, 
    lng: -70.021, 
    category: 'hostel', 
    description: 'Preço justo e garagem para motos/bikes.',
    image: 'https://images.unsplash.com/photo-1555854817-2b22464d13af?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: '6', 
    name: 'Trecho Perigoso - Ruta 40', 
    lat: -48.231, 
    lng: -70.449, 
    category: 'dangerous', 
    description: 'Trecho com rípio muito solto e ventos laterais de 100km/h.' 
  },
  {
    id: '7',
    name: 'Ciclovia dos Glaciares',
    lat: -50.338,
    lng: -72.261,
    category: 'bike_route',
    description: 'Trajeto exclusivo para bicicletas margeando o Lago Argentino.',
    image: 'https://images.unsplash.com/photo-1541625602330-2277a4c4b282?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '8',
    name: 'Passo de Jama - Moto Route',
    lat: -23.235,
    lng: -67.065,
    category: 'moto_route',
    description: 'Travessia mítica entre Argentina e Chile. Altitude de 4800m.',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=400'
  }
];

const categories = [
  { id: 'all', name: 'Todos', icon: Filter },
  { id: 'camping', name: 'Camping', icon: Tent, color: '#10b981' },
  { id: 'repair', name: 'Oficinas', icon: Hammer, color: '#ef4444' },
  { id: 'hostel', name: 'Hostels', icon: Coffee, color: '#8b5cf6' },
  { id: 'water', name: 'Água', icon: Droplets, color: '#0ea5e9' },
  { id: 'viewpoint', name: 'Mirantes', icon: MapPin, color: '#ec4899' },
  { id: 'dangerous', name: 'Perigo', icon: AlertTriangle, color: '#64748b' },
  { id: 'bike_route', name: 'Rota Bike', icon: Bike, color: '#ff641d' },
  { id: 'moto_route', name: 'Rota Moto', icon: Triangle, color: '#ff641d' },
];

function createCustomIcon(color: string) {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-5 h-5 bg-[#ff641d] rounded-full border-4 border-[#0b0c0d] shadow-[0_0_15px_rgba(255,100,29,0.6)]"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const customIcon = createCustomIcon('#ff641d');

function ZoomControl() {
  const map = useMap();
  
  return (
    <div className="absolute top-1/2 -translate-y-1/2 right-6 z-[1000] flex flex-col gap-2">
      <button 
        onClick={() => map.zoomIn()}
        title="Zoom In"
        className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm flex items-center justify-center text-[#ff641d] hover:bg-[#ff641d] hover:text-white transition-all shadow-xl group"
      >
        <Plus size={20} className="group-hover:scale-110 transition-transform" />
      </button>
      <button 
        onClick={() => map.zoomOut()}
        title="Zoom Out"
        className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm flex items-center justify-center text-[#ff641d] hover:bg-[#ff641d] hover:text-white transition-all shadow-xl group"
      >
        <Minus size={20} className="group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}

export default function AdventureMap() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPoints = useMemo(() => {
    return initialPoints.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
      <SEO 
        title="Mapa Colaborativo Hub - Pontos de Apoio e Rotas" 
        description="Explore o mapa interativo com pontos de apoio, mecânicas, campings e rotas recomendadas por quem vive a estrada usando Leaflet."
      />

      <section className="pt-12 mb-12">
        <div className="text-[10px] font-mono tracking-[0.4em] text-[#ff641d] mb-4 uppercase">CORE_MODULE // GEOSPATIAL_INTEL</div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-black uppercase tracking-tighter mb-4 text-[#F8FAFC]">
          LIVE_MAPS<span className="text-[#ff641d]">.</span>HUB
        </h1>
        <p className="text-[#F8FAFC]/40 text-sm font-medium max-w-xl">
          Visualização tática de dados colaborativos. Mapeamento continental de infraestrutura para logística de travessia via OpenStreetMap.
        </p>
      </section>

      {/* Map Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-20 min-h-[700px]">
        <div className="lg:col-span-1 space-y-4">
           <div className="dashboard-card p-8 border-white/[0.03]">
             <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#ff641d] mb-8">BUSCAR_PONTO</h3>
             <div className="relative mb-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  type="text" 
                  placeholder="ID_OU_LOCAL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-sm h-12 pl-12 pr-4 text-[10px] font-mono tracking-widest focus:outline-none focus:border-[#ff641d]/30 transition-all text-[#F8FAFC]"
                />
             </div>

             <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#ff641d] mb-8">FILTROS_OPERAÇÃO</h3>
             <div className="flex flex-col gap-3">
               {categories.map(cat => (
                 <button
                   key={cat.id}
                   onClick={() => setSelectedCategory(cat.id)}
                   className={cn(
                     "flex items-center justify-between px-4 py-3 rounded-sm border text-[9px] font-mono font-bold uppercase tracking-widest transition-all",
                     selectedCategory === cat.id 
                       ? "bg-[#ff641d] text-white border-[#ff641d]" 
                       : "bg-white/[0.02] border-white/5 text-[#F8FAFC]/30 hover:border-white/10"
                   )}
                 >
                   <div className="flex items-center gap-3">
                      <cat.icon size={14} />
                      {cat.name}
                   </div>
                   {selectedCategory === cat.id && <ArrowUpRight size={12} />}
                 </button>
               ))}
             </div>
           </div>
        </div>

        <div className="lg:col-span-3">
          <div className="dashboard-card h-[700px] border-white/[0.03] overflow-hidden relative">
            <MapContainer 
              center={[-34.603, -58.381] as [number, number]} 
              zoom={4} 
              style={{ width: '100%', height: '100%', background: '#0b0c0d' }}
            >
              <ZoomControl />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {filteredPoints.map(p => (
                <Marker 
                  key={p.id} 
                  position={[p.lat, p.lng]} 
                  icon={customIcon}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 min-w-[200px] bg-[#0b0c0d] text-[#F8FAFC]">
                      {p.image && (
                        <div className="mb-4 -mx-1 -mt-1 h-32 overflow-hidden rounded-t-sm">
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <h4 className="font-display font-black uppercase text-xs mb-2 tracking-tighter leading-tight">{p.name}</h4>
                      <p className="text-[10px] text-white/40 mb-4 leading-relaxed">{p.description}</p>
                      
                      <div className="flex flex-col gap-2">
                        <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">
                          LOC: {p.lat.toFixed(3)}, {p.lng.toFixed(3)}
                        </div>
                        <button className="w-full mt-2 py-2 bg-[#ff641d] text-white text-[9px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-[#ff641d]/80 transition-all">
                          VER_ROTA_INTEL
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Custom UI Elements on Map */}
            <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
               <div className="p-3 bg-black/60 backdrop-blur-md border border-white/5 rounded-sm">
                  <Layers size={16} className="text-[#ff641d]" />
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card p-10 border-white/[0.03]">
        <div className="flex items-center gap-4 mb-8">
          <Layers size={20} className="text-[#ff641d]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-[#ff641d]">OPS_INTEL: PROTOCOLO_DADOS</h3>
        </div>
        <p className="text-xs text-[#F8FAFC]/30 leading-relaxed font-medium">
          O mapa é mantido pela própria comunidade e utiliza a infraestrutura aberta do OpenStreetMap com camadas Dark Matter da CartoDB para máxima legibilidade tática.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container {
          background: #0b0c0d !important;
        }
        .leaflet-popup-content-wrapper {
          background: #0b0c0d !important;
          color: #F8FAFC !important;
          border-radius: 4px !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: 220px !important;
        }
        .leaflet-popup-tip {
          background: #0b0c0d !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
      `}} />
    </div>
  );
}
