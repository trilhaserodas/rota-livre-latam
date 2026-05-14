import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl as LeafletZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { 
  Search, Filter, Tent, MapPin, Hammer, Coffee, Droplets, 
  Camera, AlertTriangle, ShieldCheck, Layers, ArrowUpRight, 
  Bike, Triangle, Plus, Minus, Crosshair, Fuel, Shield, 
  LocateFixed, Zap, Navigation, Globe, Navigation2, Compass as CompassIcon
} from 'lucide-react';
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
    name: 'Camping El Chorro - Villa O\'Higgins', 
    lat: -48.465, 
    lng: -72.560, 
    category: 'camping', 
    description: 'Camping rústico próximo ao início da travessia para El Chaltén. Água quente solar.',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: '2', 
    name: 'Mecânico Don Luis - Coyhaique', 
    lat: -45.568, 
    lng: -72.067, 
    category: 'repair', 
    description: 'Mecânica 4x4 e motos. Conhecido por salvar motorhomes na Carretera Austral.',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: '3', 
    name: 'Posto Remoto Bajo Caracoles', 
    lat: -47.441, 
    lng: -70.925, 
    category: 'fuel', 
    description: 'Único ponto de abastecimento em centenas de km na Ruta 40. INDISPENSÁVEL.',
    image: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: '4', 
    name: 'Vertente de Água Degelo - Fitz Roy', 
    lat: -49.271, 
    lng: -72.943, 
    category: 'water', 
    description: 'Água pura diretamente do glaciar. Ponto seguro para reabastecimento de garrafas.' 
  },
  { 
    id: '5', 
    name: 'Ponto Seguro - Aduana Paso Roballos', 
    lat: -47.165, 
    lng: -71.868, 
    category: 'policing', 
    description: 'Posto de fronteira remoto. Documentação obrigatória e zona de fiscalização.',
  },
  { 
    id: '6', 
    name: 'ZONA_CRÍTICA: Ventos de 120km/h', 
    lat: -50.230, 
    lng: -70.920, 
    category: 'danger', 
    description: 'Zona de perigo extremo para motos e bicicletas. Rípio solto e rajadas laterais constantes.' 
  },
  {
    id: '7',
    name: 'Refúgio de Montanha - Cochamo',
    lat: -41.405,
    lng: -72.245,
    category: 'safe_point',
    description: 'Shelter comunitário para situações de clima extremo. Gratuito.',
  },
  {
    id: '8',
    name: 'Garagem MotoTravel - Santiago',
    lat: -33.437,
    lng: -70.634,
    category: 'repair',
    description: 'Oficina especializada em BMW e KTM. Peças originais para expedições.',
  },
  {
    id: 'col-1',
    name: 'Los Patios Hostel Boutique - Medellín',
    lat: 6.2131,
    lng: -75.5729,
    category: 'hostel',
    description: '★ 4.6 | Rooftop com vista, aulas de salsa e yoga. Bairro El Poblado.',
    image: 'https://images.unsplash.com/photo-1555854817-2b22464d13af?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'col-2',
    name: 'Rio Elemento - Minca',
    lat: 11.1453,
    lng: -74.1149,
    category: 'hostel',
    description: '★ 4.3 | Hostel na selva com piscina e rio para nadar. Serra Nevada.',
  },
  {
    id: 'equ-1',
    name: 'Hostel Revolution - Quito',
    lat: -0.2163,
    lng: -78.5015,
    category: 'hostel',
    description: '★ 4.6 | Acolhedor, café da manhã incluso, terraço panorâmico.',
  },
  {
    id: 'per-1',
    name: 'Pariwana Hostel - Lima',
    lat: -12.1196,
    lng: -77.0288,
    category: 'hostel',
    description: '★ 4.5 | Hostel social no bairro Miraflores, rooftop e atividades.',
  },
  {
    id: 'per-2',
    name: 'Wild Rover Hostel - Cusco',
    lat: -13.5143,
    lng: -71.9852,
    category: 'hostel',
    description: '★ 4.7 | Bar enorme, eventos diários, base para Machu Picchu.',
  },
  {
    id: 'per-3',
    name: 'Loki Hostel - Cusco',
    lat: -13.5152,
    lng: -71.9844,
    category: 'hostel',
    description: '★ 4.4 | Vista para a Plaza de Armas, atmosfera relaxada.',
  },
  {
    id: 'per-4',
    name: 'Viajero Hostel - Cusco',
    lat: -13.5199,
    lng: -71.9788,
    category: 'hostel',
    description: '★ 4.7 | Excelente para organizar tours para Machu Picchu.',
  },
  {
    id: 'bol-1',
    name: 'Wild Rover Hostel - La Paz',
    lat: -16.4976,
    lng: -68.1313,
    category: 'hostel',
    description: '★ 4.7 | Base ideal para o Salar de Uyuni e Titicaca. Festivo.',
  },
  {
    id: 'chi-1',
    name: 'Andes Nomads Desert Camp - Atacama',
    lat: -22.9836,
    lng: -68.1827,
    category: 'camping',
    description: '★ 4.7 | Duchas de água quente, redes, energia elétrica no Atacama.',
  },
  {
    id: 'chi-2',
    name: 'Hostel Forestal - Santiago',
    lat: -33.4373,
    lng: -70.6373,
    category: 'hostel',
    description: '★ 4.5 | Ao lado do Parque Forestal, bairro artístico.',
  },
  {
    id: 'chi-3',
    name: 'Camping Lago Pehoe - Torres del Paine',
    lat: -51.1081,
    lng: -72.9854,
    category: 'camping',
    description: '★ 4.1 | À beira do Lago Pehoé, no coração do parque nacional.',
  },
  {
    id: 'chi-4',
    name: 'EcoCamp Patagonia - Torres del Paine',
    lat: -50.9632,
    lng: -72.8636,
    category: 'camping',
    description: '★ 4.7 | Domos geodésicos sustentáveis com refeições inclusas.',
  },
  {
    id: 'arg-1',
    name: 'América del Sur Hostel - El Calafate',
    lat: -50.3342,
    lng: -72.2560,
    category: 'hostel',
    description: '★ 4.6 | Gateway para Perito Moreno, camas de alta recuperação.',
  },
  {
    id: 'arg-2',
    name: 'Milhouse Hostel Avenue - Buenos Aires',
    lat: -34.6090,
    lng: -58.3841,
    category: 'hostel',
    description: '★ 4.3 | Rooftop, festas, aulas de tango e noites temáticas.',
  },
  {
    id: 'br-1',
    name: 'Manauara Redário e Camping - Alter do Chão',
    lat: -2.5016,
    lng: -54.9477,
    category: 'camping',
    description: '★ 4.4 | Frente à Praia do Amor. Redes e floresta amazônica.',
  },
  {
    id: 'br-2',
    name: 'Rancho Mariá - Chapada dos Veadeiros',
    lat: -14.1701,
    lng: -47.6276,
    category: 'camping',
    description: '★ 5.0 | Rio de argila terapêutica, fogueira coletiva.',
  },
  {
    id: 'br-3',
    name: 'Rancho do Waldomiro - Chapada dos Veadeiros',
    lat: -14.136,
    lng: -47.6622,
    category: 'camping',
    description: '★ 4.8 | Vista para o Morro da Baleia, horta comunitária.',
  },
  {
    id: 'br-4',
    name: 'Camping Mucugê - Chapada Diamantina',
    lat: -13.0259,
    lng: -41.4389,
    category: 'camping',
    description: '★ 4.9 | Referência nacional. Cozinha impecável.',
  },
  {
    id: 'br-5',
    name: 'Chapada.camping - Palmeiras',
    lat: -12.4641,
    lng: -41.4616,
    category: 'camping',
    description: '★ 4.7 | Trilha para Águas Claras. Histórias locais.',
  },
  {
    id: 'br-6',
    name: 'Camping Pé na Jaca - Bonito',
    lat: -21.1375,
    lng: -56.4938,
    category: 'camping',
    description: '★ 4.8 | Tours e traslados. Fauna local exuberante.',
  },
  {
    id: 'br-7',
    name: 'Balneário Rio Formoso - Bonito',
    lat: -21.1753,
    lng: -56.4478,
    category: 'camping',
    description: '★ 4.7 | Beira do Rio Formoso, águas azuis.',
  },
  {
    id: 'br-8',
    name: 'Camping Nômadas - Bonito',
    lat: -21.128,
    lng: -56.4961,
    category: 'camping',
    description: '★ 4.6 | Cozinha compartilhada e acolhimento familiar.',
  },
  {
    id: 'br-9',
    name: 'Cobra de Cabelo Camping - Jalapão',
    lat: -10.547,
    lng: -46.4229,
    category: 'camping',
    description: '★ 4.8 | Perto dos fervedouros e dunas.',
  },
  {
    id: 'br-10',
    name: 'Cabana Camping Jalapão - São Félix',
    lat: -10.1612,
    lng: -46.6698,
    category: 'camping',
    description: '★ 4.7 | Cabanas com ventilador. Suporte logístico.',
  },
  {
    id: 'br-11',
    name: 'Camping Catumbi - Ubatuba',
    lat: -23.3685,
    lng: -44.7828,
    category: 'camping',
    description: '★ 4.9 | Pizzaria no local, banheiros limpos.',
  },
  {
    id: 'br-12',
    name: 'Camping Ypê - Ubatuba',
    lat: -23.3699,
    lng: -44.7839,
    category: 'camping',
    description: '★ 4.3 | Grande, arborizado e beira-mar.',
  },
  {
    id: 'br-13',
    name: 'Camping Vida Longa - Ilha Grande',
    lat: -23.1405,
    lng: -44.3087,
    category: 'camping',
    description: '★ 4.9 | Acesso por trilha/barco. Pizzas caseiras.',
  },
  {
    id: 'br-14',
    name: 'Camping Sunbeam - Ilha Grande',
    lat: -23.1426,
    lng: -44.1698,
    category: 'camping',
    description: '★ 4.6 | Perto do porto. Chalé ou barraca.',
  },
  {
    id: 'br-15',
    name: 'Camping Village Canastra - São Roque',
    lat: -20.1444,
    lng: -46.6609,
    category: 'camping',
    description: '★ 4.7 | Base para nascente do Rio São Francisco.',
  },
  {
    id: 'br-16',
    name: 'Carcará da Canastra - São Roque',
    lat: -20.3046,
    lng: -46.4189,
    category: 'camping',
    description: '★ 4.7 | Vista panorâmica incrível e dicas.',
  },
  {
    id: 'br-17',
    name: 'Família Catarina - Urubici',
    lat: -27.9439,
    lng: -49.6167,
    category: 'camping',
    description: '★ 5.0 | Pão fresco, geleia de amora, rio.',
  },
  {
    id: 'br-18',
    name: 'Camping do Riacho - Urubici',
    lat: -28.0213,
    lng: -49.5678,
    category: 'camping',
    description: '★ 5.0 | Fogão a lenha, ideal para MTB.',
  },
  {
    id: 'br-19',
    name: 'Cantinho do Estradeiro - Foz do Iguaçu',
    lat: -25.5403,
    lng: -54.5301,
    category: 'camping',
    description: '★ 4.8 | Aconchegante e atencioso.',
  },
  {
    id: 'br-20',
    name: 'Camping Internacional - Foz do Iguaçu',
    lat: -25.5594,
    lng: -54.576,
    category: 'camping',
    description: '★ 4.3 | Piscina e wi-fi. 10 min das Cataratas.',
  },
  {
    id: 'fuel-br-1',
    name: 'Posto Graal 125 Sul - Ribeirão Preto',
    lat: -21.2258,
    lng: -47.7802,
    category: 'fuel',
    description: 'Ponto estratégico na BR-050. Infraestrutura completa de suporte.',
  },
  {
    id: 'fuel-br-2',
    name: 'Posto Chalezão - BR-040 MG',
    lat: -20.0612,
    lng: -43.9354,
    category: 'fuel',
    description: 'Ponto de encontro clássico. Suporte operacional e alimentação.',
  },
  {
    id: 'fuel-br-3',
    name: 'Auto Posto Ipiranga - Bonito MS',
    lat: -21.1215,
    lng: -56.4815,
    category: 'fuel',
    description: 'Abastecimento central para expedições no Pantanal Sul.',
  },
  {
    id: 'fuel-br-4',
    name: 'Posto Atem - Alter do Chão PA',
    lat: -2.5055,
    lng: -54.9388,
    category: 'fuel',
    description: 'Suporte logístico vital na região do Rio Tapajós.',
  },
  {
    id: 'fuel-br-5',
    name: 'Posto Transamazônica - Itaituba',
    lat: -4.2655,
    lng: -55.9822,
    category: 'fuel',
    description: 'Operação crítica na BR-230. Verifique estoque antes de prosseguir.',
  },
  {
    id: 'route-1',
    name: 'Carretera Austral - Início Septentrional',
    lat: -41.4689,
    lng: -72.9411,
    category: 'bike_route',
    description: 'A rota mais cênica da Patagônia Chilena. Início da travessia épica para ciclistas.',
    image: 'https://images.unsplash.com/photo-1541625602330-2277a4c4b282?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'route-2',
    name: 'Estrada Real - Caminho Velho',
    lat: -20.385,
    lng: -43.503,
    category: 'bike_route',
    description: 'Cicloturismo histórico entre Ouro Preto e Paraty. Trechos técnicos de rípio.',
  },
  {
    id: 'route-3',
    name: 'Ruta 40 - Trecho Ventos Patagônicos',
    lat: -49.333,
    lng: -72.883,
    category: 'moto_route',
    description: 'Desafio para motociclistas: asfalto infinito e ventos de 100km/h.',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'route-4',
    name: 'Transamazônica (BR-230) - Leste-Oeste',
    lat: -5.3607,
    lng: -49.1245,
    category: 'overland',
    description: 'Expedição 4x4. Lama, poeira e resistência total na Amazônia.',
  },
  {
    id: 'route-5',
    name: 'Ciclovia Rio Pinheiros - Hub Urbano',
    lat: -23.591,
    lng: -46.723,
    category: 'bike_route',
    description: 'Melhor infraestrutura cicloviária de SP. Conexão entre polos de aventura.',
  },
  // Additional points for Heatmap visualization
  { id: 'h1', name: 'Camping P1', lat: -45.5, lng: -72.0, category: 'camping', description: 'POI' },
  { id: 'h2', name: 'Camping P2', lat: -45.6, lng: -72.1, category: 'camping', description: 'POI' },
  { id: 'h3', name: 'Oficina P3', lat: -45.55, lng: -72.05, category: 'repair', description: 'POI' },
  { id: 'h4', name: 'Ponto Seguro P4', lat: -45.58, lng: -72.08, category: 'safe_point', description: 'POI' },
  { id: 'h5', name: 'Camping P5', lat: -23.5, lng: -46.6, category: 'camping', description: 'POI' },
  { id: 'h6', name: 'Oficina P6', lat: -23.6, lng: -46.7, category: 'repair', description: 'POI' },
  { id: 'h7', name: 'Ponto Seguro P7', lat: -23.55, lng: -46.65, category: 'safe_point', description: 'POI' },
  { id: 'h8', name: 'Camping P8', lat: -13.5, lng: -71.9, category: 'camping', description: 'POI' },
  { id: 'h9', name: 'Oficina P9', lat: -13.6, lng: -72.0, category: 'repair', description: 'POI' },
  { id: 'h10', name: 'Ponto Seguro P10', lat: -13.55, lng: -71.95, category: 'safe_point', description: 'POI' },
  { id: 'h11', name: 'Camping P11', lat: -22.9, lng: -68.2, category: 'camping', description: 'POI' },
  { id: 'h12', name: 'Oficina P12', lat: -23.0, lng: -68.3, category: 'repair', description: 'POI' },
  { id: 'h13', name: 'Ponto Seguro P13', lat: -22.95, lng: -68.25, category: 'safe_point', description: 'POI' },
];

const categories = [
  { id: 'all', name: 'Todos', icon: Globe, color: '#ff641d' },
  { id: 'bike_route', name: 'Bike', icon: Bike, color: '#10b981' },
  { id: 'moto_route', name: 'Moto', icon: Triangle, color: '#ff641d' },
  { id: 'overland', name: 'Overland', icon: CompassIcon, color: '#f59e0b' },
  { id: 'camping', name: 'Camping', icon: Tent, color: '#ff641d' },
  { id: 'hostel', name: 'Hostels', icon: Coffee, color: '#ff9d00' },
  { id: 'water', name: 'Água', icon: Droplets, color: '#00d4ff' },
  { id: 'repair', name: 'Oficina', icon: Hammer, color: '#f59e0b' },
  { id: 'danger', name: 'Perigo', icon: AlertTriangle, color: '#ff0000' },
  { id: 'safe_point', name: 'Seguro', icon: ShieldCheck, color: '#10b981' },
  { id: 'fuel', name: 'Combustível', icon: Fuel, color: '#fff200' },
  { id: 'policing', name: 'Fiscalização', icon: Shield, color: '#6366f1' },
];

function createCustomIcon(color: string, glow: boolean = true) {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        ${glow ? `<div style="border-color: ${color}; box-shadow: inset 0 0 8px ${color}" class="absolute w-7 h-7 rounded-full border opacity-30 animate-pulse"></div>` : ''}
        ${glow ? `<div style="background-color: ${color}" class="absolute w-5 h-5 opacity-20 rounded-full animate-ping"></div>` : ''}
        <div style="background-color: ${color}; box-shadow: 0 0 15px ${color}" class="w-3 h-3 rounded-full border-2 border-[#0b0c0d] relative z-10 transition-transform hover:scale-125"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function userLocationIcon() {
  return L.divIcon({
    className: 'user-location-icon',
    html: `
      <div class="relative">
        <div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)] relative z-10"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 opacity-20 rounded-full animate-pulse"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Controller for map actions (fly to, bounds, etc)
function MapController({ center, zoom, userLocation }: { center?: [number, number], zoom?: number, userLocation?: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
}

function HeatmapLayer({ points, active }: { points: LocationPoint[], active: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (!active) return;

    const heatPoints: [number, number, number][] = points.map(p => [p.lat, p.lng, 1]);
    
    // @ts-ignore
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 35,
      blur: 20,
      maxZoom: 10,
      gradient: { 0.4: '#ff641d33', 0.6: '#ff641d66', 0.8: '#ff641d99', 1.0: '#ff641d' }
    });
    
    heatLayer.addTo(map);
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, active]);

  return null;
}

export default function AdventureMap() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-34.603, -58.381]);
  const [mapZoom, setMapZoom] = useState(4);
  const [isSearching, setIsSearching] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Auto-location
  const handleLocateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setMapZoom(12);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  // Search logic (Nominatim)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setMapZoom(12);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredPoints = useMemo(() => {
    return initialPoints.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24 relative z-10 overflow-hidden">
      <SEO 
        title="Tactical Atlas — Mapa Operacional da Estrada" 
        description="Mapeamento tático de infraestrutura, pontos de apoio e zonas de perigo na América Latina. Experiência GPS premium por Leaflet."
      />

      {/* GPS Header HUD */}
      <section className="pt-8 mb-8 border-l-2 border-[#ff641d] pl-6 relative">
        <div className="absolute top-0 -left-[5px] w-[9px] h-[9px] bg-[#ff641d] rotate-45" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[9px] font-mono tracking-[0.5em] text-[#ff641d] mb-3 uppercase flex items-center gap-2">
              <CompassIcon size={12} className="animate-spin-slow" /> SYSTEM_STATUS: ONLINE_GEO_LINKED
            </div>
            <h1 className="text-4xl sm:text-6xl font-display font-black uppercase tracking-tighter text-[#F8FAFC]">
              TACTICAL<span className="text-[#ff641d]">.</span>ATLAS
            </h1>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest text-right">
              LAT: {mapCenter[0].toFixed(4)}° / LNG: {mapCenter[1].toFixed(4)}°
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#ff641d]/60 uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-[#ff641d] animate-pulse" /> SAT_ACTIVE_LINK_PRIMARY
            </div>
          </div>
        </div>
      </section>

      {/* Main Map Interface */}
      <div className="relative h-[calc(100vh-320px)] min-h-[600px] border border-white/5 rounded-sm overflow-hidden bg-[#0b0c0d]">
        {/* HUD: Top Search Bar */}
        <div className="absolute top-6 left-6 right-6 z-[1000] pointer-events-none">
          <div className="max-w-xl mx-auto flex gap-2 pointer-events-auto">
            <form onSubmit={handleSearch} className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff641d] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="BUSCAR_COORD_OU_LOCAL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/80 backdrop-blur-md border border-white/10 rounded-sm h-12 pl-12 pr-4 text-[10px] font-mono tracking-widest focus:outline-none focus:border-[#ff641d]/40 transition-all text-[#F8FAFC] shadow-2xl"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#ff641d]/20 border-t-[#ff641d] rounded-full animate-spin" />
                </div>
              )}
            </form>
            <button 
              onClick={handleLocateUser}
              className="w-12 h-12 bg-black/80 backdrop-blur-md border border-white/10 rounded-sm flex items-center justify-center text-[#ff641d] hover:bg-[#ff641d] hover:text-white transition-all shadow-2xl group"
            >
              <LocateFixed size={20} className="group-active:scale-95 transition-transform" />
            </button>
          </div>
        </div>

        {/* HUD: Left Sidebar Categories (Mobile Toggleable) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-[1000] hidden lg:flex flex-col gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "p-3 h-12 w-12 rounded-sm border backdrop-blur-md transition-all flex items-center justify-center group relative",
                selectedCategory === cat.id 
                  ? "bg-[#ff641d] border-[#ff641d] text-white" 
                  : "bg-black/60 border-white/10 text-white/40 hover:border-[#ff641d]/40"
              )}
              title={cat.name}
            >
              <cat.icon size={18} />
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#0b0c0d] text-white text-[8px] font-mono uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 border border-white/5 whitespace-nowrap">
                {cat.name}
              </div>
            </button>
          ))}
          
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={cn(
              "p-3 h-12 w-12 rounded-sm border backdrop-blur-md transition-all flex items-center justify-center group relative",
              showHeatmap 
                ? "bg-[#ff641d] border-[#ff641d] text-white" 
                : "bg-black/60 border-white/10 text-white/40 hover:border-[#ff641d]/40"
            )}
            title="Mapa de Calor"
          >
            <Zap size={18} className={showHeatmap ? "animate-pulse" : ""} />
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#0b0c0d] text-white text-[8px] font-mono uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 border border-white/5 whitespace-nowrap">
              HEATMAP_OPS
            </div>
          </button>
        </div>

        {/* HUD: Right Metrics Dashboard */}
        <div className="absolute right-6 top-6 z-[900] hidden lg:block">
           <div className="p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm w-48 space-y-4">
              <div>
                <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em] mb-1">ZOOM_INDEX</div>
                <div className="text-sm font-mono text-white flex items-baseline gap-1">
                   {mapZoom.toFixed(1)} <span className="text-[9px] text-[#ff641d]">MAG</span>
                </div>
              </div>
              <div>
                <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em] mb-1">POINTS_LOADED</div>
                <div className="text-sm font-mono text-white">{filteredPoints.length} / {initialPoints.length}</div>
              </div>
              <div className="pt-4 border-t border-white/5">
                 <div className="flex items-center justify-between text-[8px] font-mono text-white/40 uppercase tracking-widest">
                    <span>SIG_STRENGTH</span>
                    <span className="text-green-500">98%</span>
                 </div>
                 <div className="h-1 bg-white/[0.05] mt-2 overflow-hidden rounded-full">
                    <div className="h-full bg-green-500 w-[98%]" />
                 </div>
              </div>
           </div>
        </div>

        {/* HUD: Bottom Info Bar */}
        <div className="absolute bottom-6 left-6 z-[1000] flex items-center gap-4">
           <div className="px-4 py-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="text-[9px] font-mono text-white uppercase tracking-widest">
                 AUTO_SYNCING_DATA_CORES
              </div>
           </div>
        </div>

        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ width: '100%', height: '100%', background: '#0b0c0d' }}
          zoomControl={false}
          className="z-0"
        >
          <LeafletZoomControl position="bottomright" />
          <MapController center={mapCenter} zoom={mapZoom} />
          <HeatmapLayer points={initialPoints} active={showHeatmap} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon()}>
              <Popup>
                <div className="p-2 text-center">
                  <div className="text-[10px] font-mono text-[#ff641d] uppercase font-bold mb-1">SUA_POSIÇÃO</div>
                  <div className="text-[8px] font-mono text-white/40">MARCADOR_TEMPO_REAL</div>
                </div>
              </Popup>
            </Marker>
          )}

          {filteredPoints.map(p => {
            const cat = categories.find(c => c.id === p.category) || categories[0];
            return (
              <Marker 
                key={p.id} 
                position={[p.lat, p.lng]} 
                icon={createCustomIcon(cat.color, p.category === 'danger' || p.category === 'hostel' || p.category === 'camping' || p.category === 'fuel' || p.category === 'bike_route' || p.category === 'moto_route' || p.category === 'overland')}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[240px] bg-[#0b0c0d] text-[#F8FAFC]">
                    {p.image ? (
                      <div className="mb-4 -mx-1 -mt-1 h-36 overflow-hidden rounded-t-sm">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="h-2 bg-[#ff641d]/20 -mx-1 -mt-1 mb-4" />
                    )}
                    
                    <div className="px-3 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-sm bg-white/5 text-[#ff641d]">
                          <cat.icon size={12} />
                        </div>
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">{p.category}</span>
                      </div>
                      
                      <h4 className="font-display font-black uppercase text-sm mb-2 tracking-tighter leading-tight text-[#F8FAFC]">{p.name}</h4>
                      <p className="text-[9px] text-white/40 mb-4 leading-relaxed font-mono uppercase">{p.description}</p>
                      
                      <div className="pt-3 border-t border-white/5 flex flex-col gap-3">
                        <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest flex items-center justify-between">
                          <span>COORDENADAS</span>
                          <span>{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</span>
                        </div>
                        <button className="w-full h-8 bg-[#ff641d] text-white text-[9px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-[#ff641d] transition-all flex items-center justify-center gap-2">
                          <Navigation size={10} /> LOCK_LOCATION
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Footer Tactical HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
         <div className="dashboard-card p-6 border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <div className="flex items-center gap-3 mb-4">
               <Globe size={16} className="text-[#ff641d]" />
               <h3 className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-[#ff641d]">DATA_CORE // OSM</h3>
            </div>
            <p className="text-[9px] text-white/30 font-mono uppercase tracking-widest leading-relaxed">
               Processamento vetorial de alta precisão via OpenStreetMap Data Layers.
            </p>
         </div>
         <div className="dashboard-card p-6 border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <div className="flex items-center gap-3 mb-4">
               <Shield size={16} className="text-[#ff641d]" />
               <h3 className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-[#ff641d]">SECURITY_LAYER</h3>
            </div>
            <p className="text-[9px] text-white/30 font-mono uppercase tracking-widest leading-relaxed">
               Identificação autônoma de zonas de perigo e pontos de apoio validados.
            </p>
         </div>
         <div className="dashboard-card p-6 border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <div className="flex items-center gap-3 mb-4">
               <Zap size={16} className="text-[#ff641d]" />
               <h3 className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-[#ff641d]">OPERATIONAL_SYNC</h3>
            </div>
            <p className="text-[9px] text-white/30 font-mono uppercase tracking-widest leading-relaxed">
               Log de atividade em tempo real para aventureiros independentes.
            </p>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container {
          background: #0b0c0d !important;
        }
        .leaflet-popup-content-wrapper {
          background: #0b0c0d !important;
          color: #F8FAFC !important;
          border-radius: 2px !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: 250px !important;
        }
        .leaflet-popup-tip {
          background: #0b0c0d !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}

