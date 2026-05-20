import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  MapContainer, TileLayer, Marker, Popup, useMap, 
  ZoomControl as LeafletZoomControl, Polyline, useMapEvents, Tooltip as MapTooltip 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { 
  Search, Filter, Tent, MapPin, Hammer, Coffee, Droplets, 
  Camera, AlertTriangle, ShieldCheck, Layers, ArrowUpRight, 
  Bike, Triangle, Plus, Minus, Crosshair, Fuel, Shield, 
  LocateFixed, Zap, Navigation, Globe, Navigation2, Compass as CompassIcon,
  Share2, Ruler, Trash2, Radio, UserPlus, Link as LinkIcon, Wind, Thermometer, Send,
  Cloud, Sun, CloudRain, Database, Heart, Cpu, Minimize2, Maximize2,
  Mountain, Clock, Info, ShieldAlert, Wifi, Battery, Eye, Activity, Car, Truck,
  Map as MapIcon, ChevronLeft, ChevronRight, X, Menu, MoreVertical
} from 'lucide-react';
import PointPanelV2 from '@/src/components/PointPanelV2';
import WeatherWidget from '@/src/components/WeatherWidget';
import RiskRadar from '@/src/components/RiskRadar';
import SEO from '@/src/components/SEO';
import GPSTracker from '@/src/components/GPSTracker';
import { cn } from '@/src/lib/utils';
import { LocationPoint } from '@/src/types';
import { db, auth } from '@/src/lib/firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, getDoc, updateDoc, deleteDoc, collection, query, where } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { analyzeRouteIntelligence, RouteAnalysisResult } from '@/src/services/geminiService';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as offlineDb, saveRouteOffline, removeRouteOffline, exportToGPX } from '@/src/services/offlineService';

interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  debug?: {
    source: string;
    hasKey: boolean;
    latitude: number;
    longitude: number;
    env: string;
    statusText?: string;
    errorText?: string;
  };
}

const preDefinedRoutes = [
  {
    id: 'br-156',
    name: 'BR-156: O CORREDOR DA LAMA',
    country: 'Brasil',
    color: '#ff641d',
    points: [
      [0.033, -51.066], // Macapá
      [0.72, -51.09],   // Ferreira Gomes
      [2.04, -50.88],   // Calçoene
      [2.45, -51.35],   // Lote Crítico
      [3.84, -51.83]    // Oiapoque
    ] as [number, number][],
    difficulty: 'CRITICAL',
    vehicleTypes: ['overland', 'moto'],
    status: 'ACTIVE_MUD'
  },
  {
    id: 'n2-guyane',
    name: 'N2: CORREDOR SELVATIQUE',
    country: 'Guiana Francesa',
    color: '#00d4ff',
    points: [
      [3.89, -51.80],   // St Georges
      [4.25, -52.12],   // Regina
      [4.93, -52.33]    // Cayenne
    ] as [number, number][],
    difficulty: 'LOW',
    vehicleTypes: ['bike', 'moto', 'car', 'motorhome'],
    status: 'PAVED'
  },
  {
    id: 'cwb-arg',
    name: 'ROTA 277: CURITIBA > FRONTEIRA ARG',
    country: 'Brasil',
    color: '#ff641d',
    points: [
      [-25.429, -49.267], // Curitiba
      [-25.099, -50.158], // Ponta Grossa
      [-25.390, -51.462], // Guarapuava
      [-24.957, -53.459], // Cascavel
      [-25.547, -54.588]  // Foz do Iguaçu
    ] as [number, number][],
    difficulty: 'MODERATE',
    vehicleTypes: ['car', 'motorhome', 'moto'],
    status: 'ACTIVE_OPS'
  },
  {
    id: 'carretera-austral',
    name: 'CARRETERA_AUSTRAL (R7)',
    country: 'Chile',
    color: '#34d399',
    points: [
      [-41.4689, -72.9411], // Puerto Montt
      [-41.86, -72.67],    // Hornopirén
      [-43.1256, -72.7051], // Chaitén
      [-44.3283, -72.5451], // Puyuhuapi
      [-44.75, -72.70],    // Puerto Cisnes
      [-45.5689, -72.0664], // Coyhaique
      [-46.6439, -72.6711], // Puerto Rio Tranquilo
      [-47.9136, -73.2325], // Cochrane
      [-48.465, -72.560]    // Villa O'Higgins
    ] as [number, number][],
    difficulty: 'MODERATE',
    vehicleTypes: ['bike', 'moto', 'overland'],
    status: 'STABLE'
  },
  {
    id: 'ushuaia-ruta3',
    name: 'Ruta 3: Rumo ao Fim do Mundo',
    country: 'Argentina',
    color: '#3b82f6',
    points: [
      [-34.6037, -58.3816], // Buenos Aires
      [-38.7183, -62.2663], // Bahia Blanca
      [-40.8115, -62.9961], // Viedma
      [-43.2504, -65.3117], // Trelew
      [-45.8647, -67.4808], // Comodoro Rivadavia
      [-51.6226, -69.2181], // Rio Gallegos
      [-53.78, -67.70],    // Rio Grande
      [-54.8019, -68.303],  // Ushuaia
    ] as [number, number][],
    difficulty: 'MODERATE',
    vehicleTypes: ['car', 'motorhome', 'moto', 'bike'],
    status: 'STABLE'
  },
  {
    id: 'maringa-ushuaia',
    name: 'EXPEDIÇÃO: MARINGÁ > USHUAIA',
    country: 'Brasil / Argentina',
    color: '#f59e0b',
    points: [
      [-23.4209, -51.9331], // Maringá, PR
      [-24.9555, -53.4552], // Cascavel, PR
      [-25.5478, -54.5881], // Foz do Iguaçu, PR
      [-27.3671, -55.8961], // Posadas, ARG
      [-31.6333, -60.7000], // Santa Fe, ARG
      [-34.6037, -58.3816], // Buenos Aires, ARG
      [-38.7183, -62.2663], // Bahia Blanca, ARG
      [-42.7692, -65.0385], // Puerto Madryn, ARG
      [-45.8647, -67.4808], // Comodoro Rivadavia, ARG
      [-51.6226, -69.2181], // Rio Gallegos, ARG
      [-54.8019, -68.3030]  // Ushuaia, ARG
    ] as [number, number][],
    difficulty: 'MODERATE',
    vehicleTypes: ['car', 'motorhome', 'moto', 'overland'],
    status: 'ACTIVE_OPS'
  },
  {
    id: 'ruta-40',
    name: 'Ruta 40: A mística',
    country: 'Argentina',
    color: '#ef4444',
    points: [
      [-52.3308, -69.1764], // Cabo Vírgenes
      [-51.6226, -69.2181], // Rio Gallegos
      [-50.3342, -72.2560], // El Calafate
      [-49.331, -72.886],   // El Chaltén
      [-47.441, -70.925],   // Bajo Caracoles
      [-41.1335, -71.3103], // Bariloche
      [-32.89, -68.84],    // Mendoza
      [-24.2184, -66.3181], // San Antonio de los Cobres
      [-22.1064, -65.5975]  // La Quiaca
    ] as [number, number][],
    difficulty: 'CRITICAL',
    vehicleTypes: ['overland', 'moto', 'bike'],
    status: 'ACTIVE_OPS'
  },
  {
    id: 'estrada-real',
    name: 'Estrada Real: Ciclo do Ouro',
    country: 'Brasil',
    color: '#fbbf24',
    points: [
      [-18.23, -43.60],    // Diamantina
      [-19.9219, -43.9378], // Belo Horizonte
      [-20.3856, -43.5033], // Ouro Preto
      [-21.1392, -44.2608], // Tiradentes
      [-22.51, -44.97],    // Passa Quatro
      [-23.07, -44.95],    // Cunha
      [-23.2203, -44.7139], // Paraty
    ] as [number, number][],
    difficulty: 'MODERATE',
    vehicleTypes: ['bike', 'moto', 'overland'],
    status: 'STABLE'
  },
  {
    id: 'atacama-exp',
    name: 'Deserto do Atacama',
    country: 'Chile',
    color: '#f97316',
    points: [
      [-23.5939, -70.3956], // Antofagasta
      [-22.5000, -68.9167], // Calama
      [-22.9087, -68.1997], // San Pedro de Atacama
      [-22.61, -67.81],    // Paso de Jama Boundary
      [-23.23, -67.04],    // Susques (Argentina connection)
    ] as [number, number][],
    difficulty: 'CRITICAL',
    vehicleTypes: ['overland', 'moto', 'bike'],
    status: 'STABLE'
  },
  {
    id: 'transamazonica',
    name: 'BR-230: Transamazônica',
    country: 'Brasil',
    color: '#fbbf24',
    points: [
      [-7.115, -34.863], // Cabedelo
      [-5.37, -49.12],  // Marabá
      [-3.22, -52.21],  // Altamira
      [-4.26, -55.98],  // Itaituba
      [-7.15, -64.83],  // Humaitá
      [-8.13, -67.18]   // Lábrea
    ] as [number, number][],
    difficulty: 'CRITICAL',
    vehicleTypes: ['overland', 'moto'],
    status: 'ACTIVE_MUD'
  }
];

// --- Tactical Utility Components ---

const ElevationChart = ({ data }: { data: any[] }) => (
  <div className="h-24 w-full bg-black/40 border-t border-white/5 p-2">
    <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest mb-1">ELEVATION_PROFILE (m)</div>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff641d" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#ff641d" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="alt" stroke="#ff641d" fillOpacity={1} fill="url(#colorElev)" strokeWidth={1} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0b0c0d', border: '1px solid rgba(255,100,29,0.2)', fontSize: '8px', color: '#fff' }}
          itemStyle={{ color: '#ff641d' }}
          labelStyle={{ display: 'none' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const OperationalMetric = ({ label, value, icon: Icon, color = "text-[#ff641d]" }: any) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1.5">
       <Icon size={10} className={color} />
       <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-[11px] font-mono font-black text-white">{value}</div>
  </div>
);

// --- Definitions & Constants ---

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
    name: 'PONTO SEGURO - Aduana Paso Roballos', 
    lat: -47.165, 
    lng: -71.868, 
    category: 'safe_point', 
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
    id: '9',
    name: 'Mirante Glaciar Perito Moreno',
    lat: -50.48,
    lng: -73.05,
    category: 'viewpoint',
    description: 'Ponto de observação privilegiado do glaciar mais famoso do mundo.',
    image: 'https://images.unsplash.com/photo-1518104593124-ac2e82a5eb9d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'gas-1',
    name: 'Posto YPF - Tres Lagos',
    lat: -49.601,
    lng: -71.442,
    category: 'fuel',
    description: 'Parada vital na Ruta 40 entre Calafate e Chaltén. Sempre verifique o estoque.',
  },
  {
    id: 'water-2',
    name: 'Água Potável - Rio Baker',
    lat: -47.821,
    lng: -73.045,
    category: 'water',
    description: 'Ponto de coleta de água de degelo. Filtragem recomendável para máxima segurança.',
  },
  {
    id: 'repair-jalapao',
    name: 'Oficina do Ciclista - Jalapão',
    lat: -10.518,
    lng: -46.417,
    category: 'repair',
    description: 'Ponto de apoio vital para ciclistas no deserto do Jalapão.',
  },
  {
    id: 'water-huaraz',
    name: 'Ponto de Água Mineral - Huaraz',
    lat: -9.530,
    lng: -77.527,
    category: 'water',
    description: 'Fonte natural de água potável monitorada pela comunidade local.',
  },
  {
    id: 'arg-1',
    name: 'Hostel de Montanha - El Chaltén',
    lat: -49.331,
    lng: -72.886,
    category: 'hostel',
    description: 'Base ideal para trekkers. Ambiente rústico e acolhedor.',
  },
  {
    id: 'fuel-remote-1',
    name: 'Posto Remoto - Villa O\'Higgins',
    lat: -48.468,
    lng: -72.558,
    category: 'fuel',
    description: 'Último posto de combustível antes da balsa para o Glaciar O\'Higgins.',
  },
  {
    id: 'water-mineral-chalten',
    name: 'Fonte Água Cristalina - Lago del Desierto',
    lat: -48.966,
    lng: -72.933,
    category: 'water',
    description: 'Ponto de água potável no final da Carretera Austral.',
  },
  {
    id: 'repair-motos-puerto-natales',
    name: 'MECANICA Automotriz Natales',
    lat: -51.722399,
    lng: -72.506024,
    category: 'repair',
    address: 'Agustín Molina 18, Puerto Natales, Natales, Magallanes y la Antártica Chilena, Chile',
    phone: '+56 9 7696 0799',
    rating: '4.8 / 5 (27 reviews)',
    hours: '09:30 - 21:30',
    type: 'Carros e Motos',
    description: 'Especializado em Carros e Motos. "Ele dedicou um tempo para nos explicar tudo e foi super simpático. resolveu o problema na hora." G-Code: 7GJ3+QH.',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'offroad-1',
    name: 'Trecho Terrestre Crítico - Paso Mayer',
    lat: -48.243,
    lng: -72.247,
    category: 'terrestre',
    description: 'Travessia de rio e trilha de terra técnica. Apenas 4x4 ou bicicletas de expedição.',
  },
  {
    id: 'gas-remote-2',
    name: 'Auto Posto Gasolina - Jalapão/Mateiros',
    lat: -10.548,
    lng: -46.421,
    category: 'fuel',
    description: 'Ponto crucial de abastecimento no coração do Jalapão.',
  },
  {
    id: 'fuel-portal-jalapao-dianopolis',
    name: 'Auto Posto Portal do Jalapão',
    lat: -11.6166,
    lng: -46.8143,
    category: 'fuel',
    address: 'TO-040, Km. 431, Dianópolis - TO, 77300-000',
    hours: '24 Horas',
    phone: '063 99221-7873',
    rating: '4.6 (49 reviews)',
    description: 'Posto de Combustível e Restaurante. "Restaurante do Auto posto Jalapão serviu no domingo almoço com salada, arroz, feijão, lasanha, batata frita, linguiça, frango ao molho, bife e macarrão. Serve no quilo, marmita ou PF. Comida gostosa. Suco de laranja muito bom. Funcionários muito atenciosos. Banheiros limpos."',
    image: 'https://i.ibb.co/Z1mhp7Wv/Captura-de-tela-2026-05-16-134624.png',
    images: [
      'https://i.ibb.co/Z1mhp7Wv/Captura-de-tela-2026-05-16-134624.png',
      'https://i.ibb.co/svK1zgry/Captura-de-tela-2026-05-16-134500.png',
      'https://i.ibb.co/9km6pZNd/Captura-de-tela-2026-05-16-134547.png',
      'https://i.ibb.co/tT27tpJT/Captura-de-tela-2026-05-16-134721.png'
    ]
  },
  {
    id: 'fuel-quinta-marques-sao-roque',
    name: 'Auto Posto Quinta do Marquês',
    lat: -23.54141,
    lng: -47.13524,
    category: 'fuel',
    address: 'Rod. Pres. Castello Branco, 57 - São Roque, SP, 18147-000',
    phone: '01147179800',
    website: 'http://www.aquintadomarques.com.br/',
    rating: '4.5 (7,951 reviews)',
    type: 'Posto de Combustível · Ponto de Água · Restaurante',
    description: 'Ponto tradicional na Castello Branco. Excelente infraestrutura, restaurante e ponto de abastecimento de água e combustível. G-Code: HVC6+4M.',
    image: 'https://images.unsplash.com/photo-1545145030-d30b27ece244?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'fuel-graal-japones-miracatu',
    name: 'Graal Japonês',
    lat: -24.050287,
    lng: -47.208427,
    category: 'fuel',
    address: 'Rod. Régis Bittencourt, Km 348 — Serra do Cafezal, Miracatu - SP, 11850-000',
    phone: '+55 11 91068-2293',
    website: 'redegraal.com.br/graal-japones',
    rating: '4.2 / 5 (9,207 avaliações)',
    hours: 'Aberto 24 horas',
    price: 'Médio-alto ($$$)',
    type: 'Posto de Apoio, Restaurante, Banheiros e Banho',
    description: 'Parada temática famosa na Serra do Cafezal. Jardim zen com lago de carpas, banheiros impecáveis e restaurantes variados. \n\n💬 Experiência Real: Possibilidade de pernoite com Motor Home/Kombi no estacionamento lateral (requer autorização da gerência). Use o local com respeito: sem lixo e sem barulho.',
    image: 'https://i.ibb.co/6czx2qQZ/Local-imagem-a-rea.png',
    images: [
      'https://i.ibb.co/6czx2qQZ/Local-imagem-a-rea.png',
      'https://i.ibb.co/1f3xSXL8/imagem-a-rea-01.png',
      'https://i.ibb.co/xt6bPTwT/Possibilidade-de-pernoite-com-Motor-Home.png',
      'https://i.ibb.co/Gf9WS68v/pra-a-de-alimenta-o-e-tomadas-para-carregar-celular.png',
      'https://i.ibb.co/s9WDXVs9/Padaria-Lanches.png',
      'https://i.ibb.co/39v5PkRY/Pra-a-de-alimenta-o.png',
      'https://i.ibb.co/BWDhQSw/RECEP-O-PREMIUM.png',
      'https://i.ibb.co/j95xMxYR/Banheiros-com-Possibilidade-de-banho.png',
      'https://i.ibb.co/SwcnqQWS/estacionamento-com-banheiros.png',
      'https://i.ibb.co/7Nj2K9Fh/Restaurante.png'
    ]
  },
  {
    id: 'safe-graal-japones-miracatu',
    name: 'Graal Japonês',
    lat: -24.050287,
    lng: -47.208427,
    category: 'safe_point',
    address: 'Rod. Régis Bittencourt, Km 348 — Serra do Cafezal, Miracatu - SP, 11850-000',
    phone: '+55 11 91068-2293',
    website: 'redegraal.com.br/graal-japones',
    rating: '4.2 / 5 (9,207 avaliações)',
    hours: 'Aberto 24 horas',
    price: 'Médio-alto ($$$)',
    type: 'Posto de Apoio, Restaurante, Banheiros e Banho',
    description: 'Parada temática famosa na Serra do Cafezal. Ponto Seguro certificado para pernoite e apoio ao viajante. \n\n💬 Experiência Real: Possibilidade de pernoite com Motor Home/Kombi no estacionamento lateral (requer autorização da gerência). Use o local com respeito: sem lixo e sem barulho.',
    image: 'https://i.ibb.co/6czx2qQZ/Local-imagem-a-rea.png',
    images: [
      'https://i.ibb.co/6czx2qQZ/Local-imagem-a-rea.png',
      'https://i.ibb.co/1f3xSXL8/imagem-a-rea-01.png',
      'https://i.ibb.co/xt6bPTwT/Possibilidade-de-pernoite-com-Motor-Home.png',
      'https://i.ibb.co/Gf9WS68v/pra-a-de-alimenta-o-e-tomadas-para-carregar-celular.png',
      'https://i.ibb.co/s9WDXVs9/Padaria-Lanches.png',
      'https://i.ibb.co/39v5PkRY/Pra-a-de-alimenta-o.png',
      'https://i.ibb.co/BWDhQSw/RECEP-O-PREMIUM.png',
      'https://i.ibb.co/j95xMxYR/Banheiros-com-Possibilidade-de-banho.png',
      'https://i.ibb.co/SwcnqQWS/estacionamento-com-banheiros.png',
      'https://i.ibb.co/7Nj2K9Fh/Restaurante.png'
    ]
  },
  {
    id: 'water-br-2',
    name: 'Posto Itabuna',
    lat: -14.7833,
    lng: -39.5667,
    category: 'water',
    description: 'BR-101 km 514, Itabuna/BA. Ponto de água potável.',
  },
  {
    id: 'water-br-3',
    name: 'Anila Fernandes Pinheiro',
    lat: -25.9833,
    lng: -50.9833,
    category: 'water',
    description: 'BR-277 km 233, Fernandes Pinheiro/PR. Ponto de água potável.',
  },
  {
    id: 'water-br-4',
    name: 'Circuito das Águas',
    lat: -22.4764,
    lng: -46.6342,
    category: 'water',
    description: 'Região de Águas de Lindóia/SP. Estância hidromineral.',
  },
  {
    id: 'water-br-5',
    name: 'Cachoeira do Buracão',
    lat: -12.9833,
    lng: -41.5167,
    category: 'water',
    description: 'Chapada Diamantina/BA. Ponto de água natural.',
  },
  {
    id: 'water-br-6',
    name: 'Poço Azul',
    lat: -7.0833,
    lng: -47.1667,
    category: 'water',
    description: 'Chapada das Mesas/MA. Ponto de água natural.',
  },
  {
    id: 'caminho-fe',
    name: 'Caminho da Fé',
    lat: -21.9358,
    lng: -46.7161,
    category: 'terrestre',
    description: '318 km | Pousadas, sinalização e fontes entre Águas da Prata e Aparecida/SP.',
  },
  {
    id: 'borbolight',
    name: 'Trilha Borbolight',
    lat: -20.0833,
    lng: -43.7833,
    category: 'terrestre',
    description: '38 km | Cachoeiras cristalinas e riachos acessíveis em Rio Acima/MG.',
  },
  {
    id: 'rota-aguas',
    name: 'Rota das Águas',
    lat: -22.8547,
    lng: -46.3183,
    category: 'water',
    description: 'Pontos turísticos com bebedouros e ciclopostos em Extrema/MG.',
  },
  {
    id: 'brazil-camping-1',
    name: 'Manauara Redário e Camping',
    lat: -2.5016,
    lng: -54.9477,
    category: 'camping',
    description: 'Alter do Chão, PA. Frente à Praia do Amor. Redes suspensas e barraca, rodeado de floresta amazônica.',
  },
  {
    id: 'brazil-camping-2',
    name: 'Rancho Mariá',
    lat: -14.1701,
    lng: -47.6276,
    category: 'camping',
    description: 'Alto Paraíso de Goiás, GO. Chapada dos Veadeiros. Rio de argila terapêutica, fogueira coletiva.',
  },
  {
    id: 'brazil-camping-3',
    name: 'Camping Rancho do Waldomiro',
    lat: -14.136,
    lng: -47.6622,
    category: 'camping',
    description: 'Alto Paraíso de Goiás, GO. Vista impecável para o Morro da Baleia, horta com temperos.',
  },
  {
    id: 'brazil-camping-4',
    name: 'Camping Mucugê',
    lat: -13.0259,
    lng: -41.4389,
    category: 'camping',
    description: 'Mucugê, BA. Chapada Diamantina. Lavanderia, cozinha coletiva, banho quente.',
  },
  {
    id: 'mercado-pompeia',
    name: 'Supermercado Pompéia',
    lat: -19.9143,
    lng: -43.9077,
    category: 'market',
    address: 'Av. dos Andradas, 3760',
    rating: '4.4 (8,915 reviews)',
    phone: '(31) 3488-4977',
    hours: '8h–19h',
    description: 'Ampla variedade de suprimentos para expedição estrategicamente localizado na Av. dos Andradas.'
  },
  {
    id: 'mercado-cachoeirinha',
    name: 'Supermercado Cachoeirinha',
    lat: -19.8956,
    lng: -43.9487,
    category: 'market',
    address: 'Av. Pres. Antônio Carlos, 1880',
    rating: '4.5 (2,601 reviews)',
    description: 'Ponto de reabastecimento estratégico no corredor da Antônio Carlos.'
  },
  {
    id: 'brazil-camping-5',
    name: 'Chapada.camping',
    lat: -12.4641,
    lng: -41.4616,
    category: 'camping',
    description: 'Palmeiras, BA. Trilha para Águas Claras saindo direto do camping.',
  },
  {
    id: 'brazil-camping-6',
    name: 'Camping Pé na Jaca',
    lat: -21.1375,
    lng: -56.4938,
    category: 'camping',
    description: 'Bonito, MS. Tours e traslados. Tamanduá-bandeira e anta já foram vistos no terreno.',
  },
  {
    id: 'brazil-camping-7',
    name: 'Camping e Balneário Rio Formoso',
    lat: -21.1753,
    lng: -56.4478,
    category: 'camping',
    description: 'Bonito, MS. 2 min do Rio Formoso. churrasqueira e energia elétrica.',
  },
  {
    id: 'brazil-camping-8',
    name: 'Camping Nômadas',
    lat: -21.128,
    lng: -56.4961,
    category: 'camping',
    description: 'Bonito, MS. Cozinha compartilhada. Cabanas e camping.',
  },
  {
    id: 'brazil-camping-9',
    name: 'Cobra de Cabelo Camping',
    lat: -10.547,
    lng: -46.4229,
    category: 'camping',
    description: 'Mateiros, TO. Jalapão. Perto dos fervedouros e dunas.',
  },
  {
    id: 'brazil-camping-10',
    name: 'Cabana Camping Jalapão',
    lat: -10.1612,
    lng: -46.6698,
    category: 'camping',
    description: 'São Félix do Tocantins, TO. Cabanas com ventilador e banheiro individual.',
  },
  {
    id: 'brazil-camping-11',
    name: 'Camping Catumbi',
    lat: -23.3685,
    lng: -44.7828,
    category: 'camping',
    description: 'Camburi, Ubatuba, SP. Pizzaria no local, banheiros limpos. Praia sem sinal de celular.',
  },
  {
    id: 'brazil-camping-12',
    name: 'Camping Ypê',
    lat: -23.3699,
    lng: -44.7839,
    category: 'camping',
    description: 'Camburi, Ubatuba, SP. Grande e arborizado, beira da praia. Clima hippie.',
  },
  {
    id: 'brazil-camping-13',
    name: 'Camping Vida Longa',
    lat: -23.1405,
    lng: -44.3087,
    category: 'camping',
    description: 'Ilha Grande, RJ. Praia da Longa. Acesso só por trilha ou barco. Fogueira noturna.',
  },
  {
    id: 'brazil-camping-14',
    name: 'Camping Sunbeam',
    lat: -23.1426,
    lng: -44.1698,
    category: 'camping',
    description: 'Vila do Abraão, Ilha Grande, RJ. 8 min a pé do porto. Opção de barraca ou chalé.',
  },
  {
    id: 'brazil-camping-15',
    name: 'Camping Village Canastra',
    lat: -20.1444,
    lng: -46.6609,
    category: 'camping',
    description: 'São Roque de Minas, MG. Base para a nascente do Rio São Francisco.',
  },
  {
    id: 'brazil-camping-16',
    name: 'Camping Carcará da Canastra',
    lat: -20.3046,
    lng: -46.4189,
    category: 'camping',
    description: 'São Roque de Minas, MG. Vista panorâmica incrível, wi-fi, cozinha completa.',
  },
  {
    id: 'brazil-camping-17',
    name: 'Sítio Camping Família Catarina',
    lat: -27.9439,
    lng: -49.6167,
    category: 'camping',
    description: 'Urubici, SC. Águas Brancas. Pão fresco todo dia, geleia de amora, pomar.',
  },
  {
    id: 'brazil-camping-18',
    name: 'Camping do Riacho',
    lat: -28.0213,
    lng: -49.5678,
    category: 'camping',
    description: 'Urubici, SC. Cozinha com fogão a lenha, riacho para banhar os pés.',
  },
  {
    id: 'brazil-camping-19',
    name: 'Cantinho do Estradeiro',
    lat: -25.5403,
    lng: -54.5301,
    category: 'camping',
    description: 'Foz do Iguaçu, PR. Tranquilo, cozinha comunitária e banheiros limpos.',
  },
  {
    id: 'brazil-camping-20',
    name: 'Camping Internacional',
    lat: -25.5594,
    lng: -54.576,
    category: 'camping',
    description: 'Foz do Iguaçu, PR. Piscina, wi-fi, a ~10 min das Cataratas.',
  },
  {
    id: 'co-hostel-1',
    name: 'Los Patios Hostel Boutique',
    lat: 6.2131,
    lng: -75.5729,
    category: 'hostel',
    description: 'Medellín, Colômbia. Rooftop com vista, aulas de salsa e yoga. Bairro El Poblado.',
  },
  {
    id: 'co-hostel-2',
    name: 'Rio Elemento (Casa Elemento)',
    lat: 11.1453,
    lng: -74.1149,
    category: 'hostel',
    description: 'Minca, Colômbia. Hostel na selva com piscina e rio para nadar.',
  },
  {
    id: 'ec-hostel-1',
    name: 'Hostel Revolution',
    lat: -0.2163,
    lng: -78.5015,
    category: 'hostel',
    description: 'Quito, Equador. Acolhedor, café da manhã incluso, cozinha completa, terraço panorâmico.',
  },
  {
    id: 'pe-hostel-1',
    name: 'Pariwana Hostel',
    lat: -12.1196,
    lng: -77.0288,
    category: 'hostel',
    description: 'Lima (Miraflores), Peru. Hostel social no bairro mais seguro de Lima, rooftop e atividades.',
  },
  {
    id: 'pe-hostel-2',
    name: 'Wild Rover Hostel - Cusco',
    lat: -13.5143,
    lng: -71.9852,
    category: 'hostel',
    description: 'Cusco, Peru. Famoso hostel social. Bar enorme, eventos diários, base para Machu Picchu.',
  },
  {
    id: 'pe-hostel-3',
    name: 'Loki Hostel',
    lat: -13.5152,
    lng: -71.9844,
    category: 'hostel',
    description: 'Cusco, Peru. Vista para a Plaza de Armas, atmosfera relaxada.',
  },
  {
    id: 'pe-hostel-4',
    name: 'Viajero Hostel',
    lat: -13.5199,
    lng: -71.9788,
    category: 'hostel',
    description: 'Cusco, Peru. Excelente para organizar tours para Machu Picchu.',
  },
  {
    id: 'bo-hostel-1',
    name: 'Wild Rover Hostel - La Paz',
    lat: -16.4976,
    lng: -68.1313,
    category: 'hostel',
    description: 'La Paz, Bolívia. Base ideal para explorar o Salar de Uyuni e Lago Titicaca.',
  },
  {
    id: 'cl-camping-1',
    name: 'Andes Nomads Desert Camp & Lodge',
    lat: -22.9836,
    lng: -68.1827,
    category: 'camping',
    description: 'San Pedro de Atacama, Chile. Duchas de água quente, redes, energia elétrica.',
  },
  {
    id: 'cl-hostel-1',
    name: 'Hostel Forestal',
    lat: -33.4373,
    lng: -70.6373,
    category: 'hostel',
    description: 'Santiago, Chile. Ao lado do Parque Forestal, bairro artístico.',
  },
  {
    id: 'cl-camping-2',
    name: 'Camping Lago Pehoe',
    lat: -51.1081,
    lng: -72.9854,
    category: 'camping',
    description: 'Torres del Paine, Chile. À beira do Lago Pehoé, paisagem patagônica.',
  },
  {
    id: 'arg-camping-maldonado',
    name: 'Camping Balneario Maldonado',
    lat: -38.7491,
    lng: -62.3396,
    category: 'camping',
    description: 'Amplo balneário com piscinas, áreas de lazer e suporte para viajantes.',
    address: 'Ruta Nac. 3 Sur, km 695 y, Charlone, Bahía Blanca, Provincia de Buenos Aires, Argentina',
    phone: '+54 291 455 1614',
    rating: '4.3 / 5 (1.226 avaliações)',
    type: 'Camping · Balneario',
    image: 'https://i.ibb.co/YT4zf28W/FACHADA.png',
    images: [
        'https://i.ibb.co/YT4zf28W/FACHADA.png',
        'https://i.ibb.co/Zz4h2fQ5/AREA-DE-CAMPING.png',
        'https://i.ibb.co/NdT2Q1Vg/ENTRADA.png',
        'https://i.ibb.co/QFcTS9NG/Captura-de-tela-2026-05-16-103144.png',
        'https://i.ibb.co/SDwgpWXC/Captura-de-tela-2026-05-16-103214.png'
    ]
  },
  {
    id: 'arg-hostel-bahia-blanca',
    name: 'Bahia Blanca Hostel',
    lat: -38.722399,
    lng: -62.256024,
    category: 'hostel',
    description: 'Hostel próximo ao centro, bom custo-benefício.',
    address: 'Soler 701, B8000 FJO, Provincia de Buenos Aires, Argentina',
    phone: '+54 291 452 6802',
    website: 'https://www.hostelbahiablanca.com/',
    rating: '3.7 / 5 (727 avaliações)',
    hours: 'Aberto 24 horas',
    type: 'Bed & Breakfast · Hostel',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'pe-hostel-viajero-cusco',
    name: 'Viajero Cusco Hostel',
    lat: -13.519869,
    lng: -71.978824,
    category: 'hostel',
    address: 'San Andrés 260, Cusco 08002, Peru',
    phone: '+51 946 046 366',
    website: 'https://viajerohostels.com/cusco',
    rating: '4.7 / 5 (2.282 avaliações)',
    hours: 'Aberto 24 horas',
    type: 'Hostel · Bar · Restaurante',
    description: 'Atendimento excepcional e facilidade para tours Machu Picchu. Área social com sofás confortáveis. Centro histórico.',
    image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'cl-camping-3',
    name: 'EcoCamp Patagonia',
    lat: -50.9632,
    lng: -72.8636,
    category: 'camping',
    description: 'Torres del Paine, Chile. Domos geodésicos sustentáveis com refeições inclusas.',
  },
  {
    id: 'ar-hostel-1',
    name: 'América del Sur Hostel',
    lat: -50.3342,
    lng: -72.2560,
    category: 'hostel',
    description: 'El Calafate, Argentina. Gateway para a Patagônia e Perito Moreno.',
  },
  {
    id: 'ar-hostel-2',
    name: 'Milhouse Hostel Avenue',
    lat: -34.6090,
    lng: -58.3841,
    category: 'hostel',
    description: 'Buenos Aires, Argentina. DJs, churrasco no rooftop, aulas de tango.',
  },
  {
    id: 'pr-hostel-1',
    name: 'Social Hostel Coffee Bar',
    lat: -25.4464,
    lng: -49.2797,
    category: 'hostel',
    description: 'Curitiba, PR. Bar, food truck, atividades sociais. Um dos mais badalados da cidade.',
  },
  {
    id: 'pr-hostel-2',
    name: 'Curitiba House Hostel',
    lat: -25.4382,
    lng: -49.2454,
    category: 'hostel',
    description: 'Curitiba, PR. Café da manhã incluso, cozinha completa, acolhedor. Perto do Jardim Botânico.',
  },
  {
    id: 'pr-hostel-3',
    name: 'Capivara\'s Hostel',
    lat: -25.4251,
    lng: -49.2881,
    category: 'hostel',
    description: 'Curitiba, PR. Sinuca, Netflix, ambiente descontraído. Bairro Mercês.',
  },
  {
    id: 'pr-hostel-4',
    name: 'Hostel Hug Brasil',
    lat: -25.4208,
    lng: -49.2852,
    category: 'hostel',
    description: 'Curitiba, PR. Coworking excelente, camas com cortinas. Ideal para nômades digitais.',
  },
  {
    id: 'pr-hostel-5',
    name: 'Hostel Kaizen Curitiba',
    lat: -25.4196,
    lng: -49.2734,
    category: 'hostel',
    description: 'Curitiba, PR. Ambiente familiar, bairro seguro e tranquilo. Atendimento 24h.',
  },
  {
    id: 'pr-hostel-6',
    name: 'Bergamota Hostel',
    lat: -25.4224,
    lng: -49.2337,
    category: 'hostel',
    description: 'Curitiba, PR. Refeições compartilhadas e ambiente familiar no Jardim Social.',
  },
  {
    id: 'pr-hostel-7',
    name: 'Gup Hostel',
    lat: -25.4269,
    lng: -49.2540,
    category: 'hostel',
    description: 'Curitiba, PR. 15 min da rodoviária. Localização central na Av. XV de Novembro.',
  },
  {
    id: 'pr-hostel-8',
    name: 'Joshua Tree Hostel',
    lat: -25.4238,
    lng: -49.2850,
    category: 'hostel',
    description: 'Curitiba, PR. Cozinha ampla e equipada. Bairro com ótimas opções gastronômicas.',
  },
  {
    id: 'pr-hostel-9',
    name: 'Hospedaria Solar de Morretes',
    lat: -25.4780,
    lng: -48.8294,
    category: 'hostel',
    description: 'Morretes, PR. Centro histórico, com acesso ao rio. Ambiente super acolhedor.',
  },
  {
    id: 'pr-hostel-10',
    name: 'Cantinho da Nonna',
    lat: -25.4818,
    lng: -48.8345,
    category: 'hostel',
    description: 'Morretes, PR. Inclusivo e confortável, próximo ao centro histórico.',
  },
  {
    id: 'pr-hostel-11',
    name: 'Meraki Hostel',
    lat: -25.5178,
    lng: -48.5118,
    category: 'hostel',
    description: 'Paranaguá, PR. Piscina e cozinha compartilhada. Próximo ao embarque para Ilha do Mel.',
  },
  {
    id: 'pr-hostel-12',
    name: 'Hostel Charmed Ecologic',
    lat: -25.5696,
    lng: -48.3146,
    category: 'hostel',
    description: 'Ilha do Mel, PR. Encantadas. 2 min da praia, café da manhã com frutas frescas.',
  },
  {
    id: 'pr-hostel-13',
    name: 'Malie Chalés',
    lat: -25.5708,
    lng: -48.3148,
    category: 'hostel',
    description: 'Ilha do Mel, PR. Chalés confortáveis e excelente infraestrutura para mochileiros.',
  },
  {
    id: 'pr-hostel-14',
    name: 'Hostel Costa Terral',
    lat: -25.7863,
    lng: -48.5205,
    category: 'hostel',
    description: 'Matinhos, PR. A 40m do mar. Piscina e café da manhã variado.',
  },
  {
    id: 'pr-hostel-15',
    name: 'Hostel Caramujo',
    lat: -25.8061,
    lng: -48.5346,
    category: 'hostel',
    description: 'Matinhos, PR. Acolhedor e econômico no litoral paranaense.',
  },
  {
    id: 'pr-hostel-16',
    name: 'Hostel Dumont',
    lat: -25.0986,
    lng: -50.1571,
    category: 'hostel',
    description: 'Ponta Grossa, PR. Próximo aos Campos Gerais e Vila Velha. Clima familiar.',
  },
  {
    id: 'pr-hostel-17',
    name: 'Hostel Bambu',
    lat: -25.5448,
    lng: -54.5804,
    category: 'hostel',
    description: 'Foz do Iguaçu, PR. Centro. Social e festivo, com piscina e eventos.',
  },
  {
    id: 'pr-hostel-18',
    name: 'Tetris Container',
    lat: -25.5502,
    lng: -54.5732,
    category: 'hostel',
    description: 'Foz do Iguaçu, PR. Design sustentável em containers, ótima localização.',
  },
  {
    id: 'pr-hostel-19',
    name: 'Hostel Ipelandia',
    lat: -25.6013,
    lng: -54.5237,
    category: 'hostel',
    description: 'Foz do Iguaçu, PR. Estilo resort no campo com piscina. Perto das Cataratas.',
  },
  {
    id: 'pr-hostel-20',
    name: 'Hostel Quintal de Casa',
    lat: -25.5009,
    lng: -54.5547,
    category: 'hostel',
    description: 'Foz do Iguaçu, PR. Confortável, com piscina e A/C. Perto da Ponte da Amizade.',
  },
  {
    id: 'oa-border-1',
    name: '🛂 POSTO_FRONTEIRA: Oiapoque/St Georges',
    lat: 3.8820,
    lng: -51.8020,
    category: 'border',
    description: 'Travessia internacional. Ponte sobre o Rio Oiapoque. Verifique horários da aduana (geralmente 08h-18h).',
    isolationLevel: 'LOW',
    operationalStatus: 'STABLE',
    nextSupportDist: '2.5km'
  },
  {
    id: 'oa-mkt-1',
    name: '🛒 MERCADO: Central Oiapoque',
    lat: 3.8415,
    lng: -51.8350,
    category: 'market',
    description: 'Abastecimento de mantimentos para a travessia. Melhor ponto para câmbio informal.',
    isolationLevel: 'LOW',
    operationalStatus: 'STABLE',
    nextSupportDist: '800m'
  },
  {
    id: 'oa-mud-1',
    name: '⚠️ ZONA_CRÍTICA: Lote 1/2 BR-156',
    lat: 2.4500,
    lng: -51.3500,
    category: 'danger',
    description: 'ALERTA: Trecho de lama pesada. 4x4 essencial em período chuvoso. Possibilidade de atoleiros em cascata.',
    isolationLevel: 'CRITICAL',
    operationalStatus: 'WARNING',
    nextSupportDist: '145km'
  },
  {
    id: 'oa-sig-1',
    name: '📶 SINAL_BAIXO: Reserva Indígena Uaçá',
    lat: 3.2000,
    lng: -51.6000,
    category: 'no_signal',
    description: 'Ausência total de sinal celular. Use GPS offline. Área de preservação.',
    isolationLevel: 'HIGH',
    operationalStatus: 'CRITICAL'
  },
  {
    id: 'oa-fuel-1',
    name: '⛽ ABASTECIMENTO: Posto Shell Oiapoque',
    lat: 3.8390,
    lng: -51.8320,
    category: 'fuel',
    description: 'Último combustível de preço BR antes da Guiana Francesa. Diesel S10 disponível.',
    isolationLevel: 'LOW',
    operationalStatus: 'STABLE',
    nextSupportDist: '12km'
  },
  {
    id: 'oa-water-1',
    name: '🚰 ÁGUA: Fonte Comunitária Oiapoque',
    lat: 3.8450,
    lng: -51.8280,
    category: 'water',
    description: 'Ponto de reabastecimento de água mineral. Poço profundo.',
    isolationLevel: 'LOW',
    operationalStatus: 'STABLE'
  },
  {
    id: 'fg-camp-1',
    name: '⛺ CAMPING: Chez Armande (Cayenne)',
    lat: 4.9350,
    lng: -52.3210,
    category: 'camping',
    description: 'Apoio overland em Caiena. Pátio gramado, eletricidade 220v. Próximo ao aeroporto.',
    isolationLevel: 'LOW',
    operationalStatus: 'STABLE',
    nextSupportDist: '4km'
  },
  {
    id: 'fg-host-1',
    name: '🏨 HOSTEL: Central Guyane',
    lat: 4.9400,
    lng: -52.3350,
    category: 'hostel',
    description: 'Centro de Caiena. Base de mochileiros europeus. Preços em Euro (€).',
    isolationLevel: 'LOW',
    operationalStatus: 'STABLE'
  },
  {
    id: 'fg-off-1',
    name: '🔧 OFICINA: Garage de la Navigation',
    lat: 4.9210,
    lng: -52.3050,
    category: 'repair',
    description: 'Mecânica especializada em Toyotas e Land Rovers. Referência overland.',
    isolationLevel: 'LOW',
    operationalStatus: 'STABLE'
  },
  {
    id: 'oa-bio-1',
    name: '🦟 BIO_ALERTA: Dengue/Malária Outbreak',
    lat: 3.5000,
    lng: -51.7200,
    category: 'bio',
    description: 'ALERTA SANITÁRIO: Região com alta incidência de vetores tropicais. Use repelente e telas.',
    isolationLevel: 'MEDIUM',
    operationalStatus: 'WARNING'
  },
  {
    id: 'oa-clim-1',
    name: '🌧️ CLIMA: Temporada de Monções Am',
    lat: 4.1000,
    lng: -52.1000,
    category: 'climate',
    description: 'Risco de chuvas torrenciais. Nível dos rios em monitoramento.',
    isolationLevel: 'MEDIUM',
    operationalStatus: 'WARNING'
  },
  {
    id: 'mkt-bh-1',
    name: '🛒 MERCADO: Pompéia',
    address: 'Av. dos Andradas, 3760',
    lat: -19.9143,
    lng: -43.9077,
    category: 'market',
    rating: '4.4 (8.915 avaliações)',
    phone: '(31) 3488-4977',
    hours: '8h–19h',
    description: 'Mercado Pompéia com ampla variedade e excelente avaliação local.'
  },
  {
    id: 'mkt-bh-2',
    name: '🛒 MERCADO: Cachoeirinha',
    address: 'Av. Pres. Antônio Carlos, 1880',
    lat: -19.8956,
    lng: -43.9487,
    category: 'market',
    rating: '4.5 (2.601 avaliações)',
    hours: '8h as 19h',
    description: 'Ponto de abastecimento na região da Cachoeirinha.'
  },
  {
    id: 'mkt-bh-3',
    name: '🛒 MERCADO: Prado',
    address: 'Av. Silva Lobo, 577',
    lat: -19.9287,
    lng: -43.9715,
    category: 'market',
    rating: '4.4 (4.278 avaliações)',
    phone: '(31) 3117-2600',
    hours: '8h–14h',
    description: 'Mercado Prado localizado na Av. Silva Lobo.'
  },
  {
    id: 'mkt-bh-4',
    name: '🛒 MERCADO: Santa Efigênia',
    address: 'Av. Bernardo Monteiro, 432',
    lat: -19.9222,
    lng: -43.9273,
    category: 'market',
    rating: '4.4 (2.791 avaliações)',
    phone: '(31) 3259-3201',
    hours: '08h–14h',
    description: 'Mercado estratégico no bairro Santa Efigênia.'
  },
  {
    id: 'mkt-bh-5',
    name: '🛒 MERCADO: Centro — Av. Paraná',
    address: 'Av. Paraná, 470',
    lat: -19.9199,
    lng: -43.9432,
    category: 'market',
    rating: '4.1 (7.417 avaliações)',
    phone: '(31) 3272-1725',
    hours: 'FECHADO',
    description: 'Mercado central na Av. Paraná. Verifique status de operação.'
  },
  {
    id: 'mkt-bh-6',
    name: '🛒 MERCADO: Centro — Andradas',
    address: 'Av. dos Andradas, 302',
    lat: -19.9180,
    lng: -43.9351,
    category: 'market',
    rating: '4.1 (8.856 avaliações)',
    hours: 'FECHADO',
    description: 'Unidade central dos Andradas. Verifique status de operação.'
  },
  {
    id: 'mkt-bh-7',
    name: '🛒 MERCADO: Estoril',
    address: 'Av. Barão Homem de Melo, 2424',
    lat: -19.9579,
    lng: -43.9659,
    category: 'market',
    rating: '4.4 (4.419 avaliações)',
    phone: '(31) 3117-2600',
    description: 'Ponto de apoio no bairro Estoril.'
  },
  {
    id: 'mkt-bh-8',
    name: '🛒 MERCADO: Parque Riachuelo',
    address: 'Av. Américo Vespúcio, 1271',
    lat: -19.8958,
    lng: -43.9605,
    rating: '4.2 (24.819 avaliações)',
    category: 'market',
    phone: '(31) 3428-9743',
    hours: '7h30–14h',
    description: 'Mercado na região do Parque Riachuelo.'
  },
  {
    id: 'mkt-bh-9',
    name: '🛒 MERCADO: Nova Suíça',
    address: 'Av. Silva Lobo, 760',
    lat: -19.9297,
    lng: -43.9722,
    category: 'market',
    rating: '4.3 (2.209 avaliações)',
    phone: '(31) 3313-2966',
    hours: '7h30–14h',
    description: 'Unidade Nova Suíça do mercado local.'
  },
  {
    id: 'mkt-bh-10',
    name: '🛒 MERCADO: Atacado — BR-262',
    address: 'Anel Rodov. BR-262, KM 19 — Palmares',
    lat: -19.8689,
    lng: -43.9369,
    category: 'market',
    phone: '(31) 3426-7117',
    description: 'Ponto de atacado no Anel Rodoviário.'
  }
];

const categories = [
  { id: 'all', name: 'Todos', icon: Globe, color: '#ff641d' },
  { id: 'border', name: '🛂 Fronteira', icon: ShieldCheck, color: '#ff641d' },
  { id: 'camping', name: '⛺ Camping', icon: Tent, color: '#ff641d' },
  { id: 'hostel', name: '🏨 Hostel', icon: Coffee, color: '#ff9d00' },
  { id: 'water', name: '🚰 Água', icon: Droplets, color: '#00d4ff' },
  { id: 'fuel', name: '⛽ Abastecimento', icon: Fuel, color: '#fff200' },
  { id: 'repair', name: '🔧 Oficina', icon: Hammer, color: '#f59e0b' },
  { id: 'market', name: '🛒 Mercado', icon: Truck, color: '#a78bfa' },
  { id: 'danger', name: '⚠️ Perigo', icon: AlertTriangle, color: '#ef4444' },
  { id: 'no_signal', name: '📶 Sem Sinal', icon: Wifi, color: '#94a3b8' },
  { id: 'climate', name: '🌧️ Clima', icon: Wind, color: '#38bdf8' },
  { id: 'bio', name: '🦟 Ambiental', icon: ShieldAlert, color: '#22c55e' },
  { id: 'terrestre', name: 'Montanha', icon: Mountain, color: '#f59e0b' },
  { id: 'safe_point', name: 'Ponto Seguro', icon: ShieldCheck, color: '#10b981' },
];

function createCustomIcon(color: string, selected: boolean = false) {
  const outerSize = selected ? 'w-10 h-10' : 'w-7 h-7';
  const innerSize = selected ? 'w-4 h-4' : 'w-2.5 h-2.5';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div style="border-color: ${color}; box-shadow: inset 0 0 12px ${color}" class="absolute ${outerSize} rounded-full border-2 transition-all duration-500 ${selected ? 'opacity-80 scale-125' : 'opacity-20 animate-pulse'}"></div>
        ${selected ? `
          <div style="border-color: ${color}" class="absolute w-14 h-14 rounded-full border border-dashed opacity-40 animate-[spin_8s_linear_infinite]"></div>
          <div style="border-color: ${color}" class="absolute w-12 h-12 rounded-full border border-double opacity-20 animate-[ping_3s_ease-in-out_infinite]"></div>
        ` : ''}
        <div style="background-color: ${color}; box-shadow: 0 0 20px ${color}" class="${innerSize} rounded-full border-2 border-[#0b0c0d] relative z-10 transition-all duration-500 ${selected ? 'scale-110 shadow-[0_0_30px_rgba(255,255,255,0.4)]' : ''}"></div>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });
}

function userLocationIcon() {
  return L.divIcon({
    className: 'user-location-icon',
    html: `
      <div class="relative">
        <div class="w-5 h-5 bg-[#ff641d] rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,100,29,0.8)] relative z-10"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#ff641d] opacity-20 rounded-full animate-pulse"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function otherUserIcon(color: string = '#00d4ff', name: string = 'Explorador') {
  return L.divIcon({
    className: 'other-user-icon',
    html: `
      <div class="relative group">
        <div style="background-color: ${color}" class="w-4 h-4 rounded-full border-2 border-white shadow-[0_0_10px_${color}] relative z-10"></div>
        <div style="background-color: ${color}" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 opacity-20 rounded-full animate-ping"></div>
        <div class="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[3000]">
           <div class="bg-black/90 border border-white/10 px-2 py-1 rounded-sm whitespace-nowrap">
              <span class="text-[8px] font-mono text-white font-black uppercase tracking-widest">${name}</span>
           </div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// --- Map Controllers ---

function MapController({ center, zoom, bounds }: { center?: [number, number], zoom?: number, bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    // Force map to recalculate its container size - critical for mobile/responsive fixes
    map.invalidateSize();
    
    try {
      if (bounds) {
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
      } else if (center && !isNaN(center[0]) && !isNaN(center[1])) {
        map.flyTo(center, zoom || map.getZoom(), { duration: 1.5 });
      }
    } catch (err) {
      console.error("Map perspective shift failed", err);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

function MapEventsHandler({ onMapClick, active }: { onMapClick: (latlng: L.LatLng) => void, active: boolean }) {
  useMapEvents({
    click: (e) => {
      if (active) onMapClick(e.latlng);
    }
  });
  return null;
}

function HeatmapLayer({ points }: { points: LocationPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Use a slightly different intensity based on category density if needed, 
    // but a standard 0.5-0.8 works well for visualization.
    const heatPoints = points.map(p => [p.lat, p.lng, 0.6] as [number, number, number]);
    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 35,
      blur: 20,
      maxZoom: 17,
      minOpacity: 0.4,
      gradient: { 
        0.4: '#00d4ff', 
        0.6: '#ff9d00', 
        1.0: '#ff641d' 
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

// --- Main Component ---

export default function AdventureMap() {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-34.603, -58.381]);
  const [mapZoom, setMapZoom] = useState(4);
  const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExpeditionMode, setIsExpeditionMode] = useState(false);
  const [selectedPreDefinedRoute, setSelectedPreDefinedRoute] = useState<typeof preDefinedRoutes[0] | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [aiIntelligence, setAiIntelligence] = useState<RouteAnalysisResult | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isBottomPanelMinimized, setIsBottomPanelMinimized] = useState(false);
  const [isPointDetailsMinimized, setIsPointDetailsMinimized] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const sidebarRef = useRef<HTMLElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (selectedPoint) {
      setIsPointDetailsMinimized(false);
    }
  }, [selectedPoint]);
  
  // Offline functionality
  const offlineRoutes = useLiveQuery(() => offlineDb.routes.toArray()) || [];
  const [downloadingRoutes, setDownloadingRoutes] = useState<Set<string>>(new Set());
  const [performanceMetrics, setPerformanceMetrics] = useState({
    watts: 184,
    traction: 'OPT_AUTO',
    windLat: 12.5,
    autonomy: 'H_CAPACITY',
    pace: '12:30 min/km'
  });
  const [satelliteStatus, setSatelliteStatus] = useState<'STRONG' | 'DEGRADED' | 'STABLE' | 'LOST'>('STABLE');
  const [securityAlerts, setSecurityAlerts] = useState<string[]>([]);

  const isSignedIn = useMemo(() => !!auth.currentUser, [auth.currentUser]);
  
  // Custom Filters state
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Favorites state
  const [savedRouteIds, setSavedRouteIds] = useState<string[]>([]);
  
  // Routing State
  const [isTracing, setIsTracing] = useState(false);
  const [isRoutingExpanded, setIsRoutingExpanded] = useState(false);
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [transportMode, setTransportMode] = useState<'bike' | 'walk' | 'moto' | 'car' | 'motorhome'>('bike');

  const [autoDiscoveredPoints, setAutoDiscoveredPoints] = useState<LocationPoint[]>([]);
  const [isDiscoveringPOIs, setIsDiscoveringPOIs] = useState(false);
  const [showRoutesMenu, setShowRoutesMenu] = useState(false);

  // GPS Sharing State
  const [isSharing, setIsSharing] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [otherSessions, setOtherSessions] = useState<any[]>([]);

  const getShareUrl = useCallback(() => {
    if (selectedPreDefinedRoute) {
      return `${window.location.origin}/mapa?route=${selectedPreDefinedRoute.id}`;
    } else if (routePoints.length > 0) {
      return `${window.location.origin}/mapa?pts=${encodeURIComponent(JSON.stringify(routePoints))}`;
    } else {
      return `${window.location.origin}/mapa?lat=${mapCenter[0].toFixed(5)}&lng=${mapCenter[1].toFixed(5)}&zoom=${mapZoom}`;
    }
  }, [selectedPreDefinedRoute, routePoints, mapCenter, mapZoom]);
  
  // Stats
  const totalDistance = useMemo(() => {
    if (routePoints.length < 2) return 0;
    try {
      let dist = 0;
      const toRad = (n: number) => (n * Math.PI) / 180;
      for (let i = 0; i < routePoints.length - 1; i++) {
          const p1 = routePoints[i];
          const p2 = routePoints[i+1];
          if (!p1 || !p2) continue;
          
          const lat1 = p1[0];
          const lon1 = p1[1];
          const lat2 = p2[0];
          const lon2 = p2[1];
          
          if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) continue;

          // Faster Haversine calculation (no object allocations)
          const R = 6371e3; // meters
          const φ1 = toRad(lat1);
          const φ2 = toRad(lat2);
          const Δφ = toRad(lat2 - lat1);
          const Δλ = toRad(lon2 - lon1);

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          dist += R * c;
      }
      return dist / 1000; // km
    } catch (e) {
      console.error("Distance calc failed", e);
      return 0;
    }
  }, [routePoints]);

  const estimatedTime = useMemo(() => {
    const speeds = { bike: 15, walk: 5, moto: 50, car: 60, motorhome: 40 }; // km/h
    const hours = totalDistance / speeds[transportMode];
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }, [totalDistance, transportMode]);

  const elevationData = useMemo(() => {
    if (routePoints.length === 0) return [];
    // Decimate for performance and stability with Recharts
    const maxPoints = 100;
    const step = Math.max(1, Math.floor(routePoints.length / maxPoints));
    const processed = [];
    for (let i = 0; i < routePoints.length; i += step) {
      processed.push({
        name: i,
        alt: 400 + Math.sin(i * 0.5) * 200 + Math.random() * 50
      });
    }
    return processed;
  }, [routePoints]);

  // Geolocation Logic
  const handleLocateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setMapZoom(16);
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    if (isExpeditionMode) {
      handleLocateUser();
      setIsSharing(true);
    }
  }, [isExpeditionMode, handleLocateUser]);

  // Real-time tracking logic
  useEffect(() => {
    let watchId: number | null = null;
    
    const updateLocalLocation = (latitude: number, longitude: number) => {
      setUserLocation([latitude, longitude]);
    };

    const updateFirestoreTracking = async (latitude: number, longitude: number) => {
      if (!auth.currentUser || !isSharing) return;
      
      const id = auth.currentUser.uid;
      try {
        await setDoc(doc(db, 'trackingSessions', id), {
          userId: id,
          userName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Explorer',
          lat: latitude,
          lng: longitude,
          updatedAt: serverTimestamp(),
          active: true
        }, { merge: true });
        setTrackingId(id);
      } catch (err) {
        console.error("Tracking update failed:", err);
      }
    };

    // Always watch position to show user on map
    watchId = navigator.geolocation.watchPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      updateLocalLocation(latitude, longitude);
      if (isSharing) {
        updateFirestoreTracking(latitude, longitude);
      }
    }, (err) => {
      console.error("Geolocation error:", err);
    }, { 
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 5000
    });

    // Handle deactivation in Firestore
    if (!isSharing && trackingId) {
      updateDoc(doc(db, 'trackingSessions', trackingId), {
        active: false,
        updatedAt: serverTimestamp()
      }).catch(err => console.error("Disable tracking error:", err));
    }

    return () => { 
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isSharing, trackingId, auth.currentUser]);

  // Listen to other active explorers
  useEffect(() => {
    if (!isSignedIn) return;

    const q = query(collection(db, 'trackingSessions'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((s: any) => s.userId !== auth.currentUser?.uid && s.lat && s.lng);
      setOtherSessions(sessions);
    });

    return () => unsubscribe();
  }, [auth.currentUser, isSignedIn]);

  // Sync Saved Routes from Firestore
  useEffect(() => {
    if (!isSignedIn || !auth.currentUser) {
      setSavedRouteIds([]);
      return;
    }

    const q = query(collection(db, 'savedRoutes'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.data().routeId);
      setSavedRouteIds(ids);
    });

    return () => unsubscribe();
  }, [isSignedIn]);

  const handleClearRoute = useCallback(() => {
    setRoutePoints([]);
    setAutoDiscoveredPoints([]);
    setSelectedPreDefinedRoute(null);
    setShowAIPanel(false);
    setAiIntelligence(null);
    setIsExpeditionMode(false);
    setIsTracing(false);
    setOriginQuery('');
    setDestinationQuery('');
    // Ensure weather is reset to prevent "stale" route weather
    setWeatherData(null);
    setActiveTab('explore');
    setSearchQuery('');
    setShowSuggestions(false);
    setShowRoutesMenu(false);
    setSelectedPoint(null);
  }, []);

  const toggleFavoriteRoute = async (route: typeof preDefinedRoutes[0]) => {
    if (!isSignedIn || !auth.currentUser) return;
    
    const isSaved = savedRouteIds.includes(route.id);
    const userId = auth.currentUser.uid;
    const docId = `${userId}_${route.id}`;
    
    try {
      if (isSaved) {
        await deleteDoc(doc(db, 'savedRoutes', docId));
      } else {
        await setDoc(doc(db, 'savedRoutes', docId), {
          userId,
          routeId: route.id,
          routeName: route.name,
          savedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  };

  // AI Intelligence Logic
  const handleAIAnalysis = async () => {
    setIsAnalyzingAI(true);
    setShowAIPanel(true);
    
    // Determine context for AI
    const regionText = selectedPoint?.name || originQuery || destinationQuery || "Global Exploration";
    const weatherText = weatherData ? `${weatherData.temp}°C, ${weatherData.description}` : "Condições atuais locais";
    
    const result = await analyzeRouteIntelligence({
      region: regionText,
      vehicle: transportMode,
      weather: weatherText,
      expeditionType: isExpeditionMode ? "CRITICAL_ADVENTURE" : "STANDARD_TRAVEL"
    });
    
    setAiIntelligence(result);
    setIsAnalyzingAI(false);
  };

  useEffect(() => {
    if (!isExpeditionMode) return;
    const interval = setInterval(() => {
      setPerformanceMetrics(prev => ({
        ...prev,
        watts: Math.max(120, Math.min(450, prev.watts + Math.floor((Math.random() - 0.5) * 10))),
        windLat: parseFloat((prev.windLat + (Math.random() - 0.5) * 2).toFixed(1)),
        traction: Math.random() > 0.8 ? 'ADAPT_SYNC' : 'OPT_AUTO'
      }));
      
      if (Math.random() > 0.9) {
        const statuses: ('STRONG' | 'DEGRADED' | 'STABLE')[] = ['STRONG', 'DEGRADED', 'STABLE'];
        setSatelliteStatus(statuses[Math.floor(Math.random() * statuses.length)]);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isExpeditionMode]);

  useEffect(() => {
    if (isExpeditionMode && weatherData) {
      const alerts = [];
      if (weatherData.temp > 35) alerts.push("⚠️ CALOR EXTREMO: RISCO DE DESIDRATAÇÃO");
      if (weatherData.windSpeed > 15) alerts.push("⚠️ VENTOS FORTES: AFETA ESTABILIDADE");
      if (weatherData.humidity > 85) alerts.push("⚠️ HUMIDADE ALTA: IMPACTO TÉRMICO");
      setSecurityAlerts(alerts);
    } else {
      setSecurityAlerts([]);
    }
  }, [isExpeditionMode, weatherData]);

  // Weather Cache & Fetching
  const weatherCache = useRef<Record<string, { data: any, timestamp: number }>>({});

  const fetchWeather = useCallback(async (lat: number, lng: number, signal?: AbortSignal) => {
    if (lat === undefined || lng === undefined || lat === null || lng === null) return;
    
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const now = Date.now();
    
    // 1. Check Cache
    if (weatherCache.current[cacheKey] && (now - weatherCache.current[cacheKey].timestamp < 300000)) {
      setWeatherData(weatherCache.current[cacheKey].data);
      setIsLoadingWeather(false); // Ensure loading is stopped if using cache
      return;
    }

    console.log(`[Clima] INICIANDO FETCH - LAT: ${lat}, LON: ${lng}`);
    setIsLoadingWeather(true);
    setWeatherData(null); // Clear previous data while fetching new one for a new location

    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lng}`, { signal });
      
      if (!response.ok) {
        const errText = await response.text();
        let errorMessage = `Erro ${response.status}`;
        try {
          const errJson = JSON.parse(errText);
          errorMessage = errJson.error || errorMessage;
        } catch(e) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`[Clima] RESPOSTA RECEBIDA - LAT: ${lat}, LON: ${lng}`);
      
      if (!data || !data.main || !data.weather || !data.weather[0]) {
        throw new Error('DADOS_CLIMA_ESTRUTURA_INVÁLIDA');
      }
      
      const mappedData: WeatherData = {
        temp: Math.round(data.main.temp ?? 0),
        feelsLike: Math.round(data.main.feels_like ?? data.main.temp ?? 0),
        description: (data.weather[0].description || "CONDIÇÃO_N/A").toUpperCase(),
        humidity: data.main.humidity ?? 0,
        windSpeed: data.wind ? Math.round((data.wind.speed ?? 0) * 3.6) : 0, 
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`,
        debug: {
          source: data.debug?.source || 'unknown',
          hasKey: !!data.debug?.hasKey,
          latitude: data.debug?.latitude ?? lat,
          longitude: data.debug?.longitude ?? lng,
          env: data.debug?.env || 'production',
          statusText: 'API CONNECTED',
          errorText: ''
        }
      };

      if (!signal?.aborted) {
        setWeatherData(mappedData);
        weatherCache.current[cacheKey] = { data: mappedData, timestamp: now };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`[Clima] Abortado: ${lat}, ${lng}`);
        return;
      }
      console.error("[Clima] Falha:", err.message);
      if (!signal?.aborted) {
        const fallbackErrorData: WeatherData = {
          temp: 0,
          feelsLike: 0,
          description: 'FALHA NO SINAL',
          humidity: 0,
          windSpeed: 0,
          icon: '',
          debug: {
            source: 'error',
            hasKey: false,
            latitude: lat,
            longitude: lng,
            env: 'production',
            statusText: 'FETCH FAILED',
            errorText: err.message || 'Erro de conexão/CORS ou Endpoint indisponível'
          }
        };
        setWeatherData(fallbackErrorData);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoadingWeather(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    
    if (selectedPoint) {
      console.log(`[Clima HUD Log] useEffect disparado por ponto selecionado: "${selectedPoint.name}" (${selectedPoint.lat}, ${selectedPoint.lng})`);
      fetchWeather(selectedPoint.lat, selectedPoint.lng, controller.signal);
    } else {
      console.log(`[Clima HUD Log] selectedPoint é null, limpando dados do clima.`);
      setWeatherData(null);
    }

    return () => {
      console.log(`[Clima HUD Log] Abortando requisição de clima anterior para "${selectedPoint?.name || 'Nenhum'}"`);
      controller.abort();
    };
  }, [selectedPoint, fetchWeather]);

  const handleRoutingSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originQuery || !destinationQuery) return;
    setIsCalculatingRoute(true);
    setMapBounds(null); // Clear previous bounds
    
    try {
      // Geocode point A
      const resA = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(originQuery)}&limit=1`);
      const dataA = await resA.json();
      
      // Geocode point B
      const resB = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destinationQuery)}&limit=1`);
      const dataB = await resB.json();

      if (dataA?.[0] && dataB?.[0]) {
        const start = [parseFloat(dataA[0].lat), parseFloat(dataA[0].lon)] as [number, number];
        const end = [parseFloat(dataB[0].lat), parseFloat(dataB[0].lon)] as [number, number];
        
        if (isNaN(start[0]) || isNaN(start[1]) || isNaN(end[0]) || isNaN(end[1])) {
           throw new Error("Invalid coordinates returned from geocoding");
        }

        // Try to get actual road route from OSRM
        try {
          const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
          const osrmData = await osrmRes.json();
          
          if (osrmData.routes?.[0]?.geometry?.coordinates) {
            let coords = osrmData.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
            
            // Simplify route if it has too many points to prevent UI lag
            if (coords.length > 2000) {
              const factor = Math.ceil(coords.length / 2000);
              coords = coords.filter((_: any, i: number) => i % factor === 0 || i === coords.length - 1);
            }

            setRoutePoints(coords);
            try {
              const bounds = L.latLngBounds(coords);
              setMapBounds(bounds);
            } catch (boundsErr) {
              setMapCenter(start);
              setMapZoom(12);
            }
          } else {
            // Fallback to straight line
            setRoutePoints([start, end]);
            setMapBounds(L.latLngBounds([start, end]));
          }
        } catch (err) {
          console.error("OSRM failed", err);
          setRoutePoints([start, end]);
          setMapBounds(L.latLngBounds([start, end]));
        }
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsCalculatingRoute(false);
      setIsRoutingExpanded(false);
    }
  };

  const discoverPOIsAlongRoute = async (points: [number, number][]) => {
    setIsDiscoveringPOIs(true);
    try {
      // Limit waypoints for discovery to avoid hitting URL length limits on long routes
      const samplePoints = points.length > 20 
        ? points.filter((_, i) => i % Math.floor(points.length / 20) === 0).slice(0, 20)
        : points;

      const subQueries = samplePoints.map(p => `
        node["amenity"~"drinking_water|fuel|car_repair"](around:5000,${p[0]},${p[1]});
        node["tourism"~"camp_site|hostel|hotel"](around:5000,${p[0]},${p[1]});
        node["shop"~"bicycle|motorcycle|supermarket|convenience"](around:5000,${p[0]},${p[1]});
      `).join('');

      const queryStr = `
        [out:json][timeout:25];
        (
          ${subQueries}
        );
        out body 150;
      `;
      
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(queryStr)}`);
      if (!response.ok) throw new Error('OSM Overpass failed');
      const data = await response.json();
      
      // Limit number of points to prevent rendering slowdown
      const elements = data.elements.slice(0, 120);

      const newPoints: LocationPoint[] = elements.map((el: any) => {
        let category = 'safe_point';
        if (el.tags.amenity === 'drinking_water' || el.tags.natural === 'spring') category = 'water';
        else if (el.tags.tourism === 'camp_site') category = 'camping';
        else if (el.tags.tourism === 'hostel' || el.tags.tourism === 'hotel') category = 'hostel';
        else if (el.tags.amenity === 'fuel') category = 'fuel';
        else if (el.tags.amenity === 'car_repair' || el.tags.shop === 'bicycle' || el.tags.shop === 'motorcycle') category = 'repair';
        else if (el.tags.shop === 'supermarket' || el.tags.shop === 'convenience') category = 'market';

        return {
          id: `osm-${el.id}`,
          name: el.tags.name || el.tags.operator || 'Ponto de Interesse',
          lat: el.lat,
          lng: el.lon,
          category,
          description: `Recurso descoberto via OpenStreetMap ao longo da rota. ${el.tags.description || ''}`,
        };
      });

      setAutoDiscoveredPoints(newPoints);
    } catch (err) {
      console.error("OSM Discovery failed:", err);
    } finally {
      setIsDiscoveringPOIs(false);
    }
  };

  const fetchRoadRoute = async (waypoints: [number, number][]) => {
    if (waypoints.length < 2) return waypoints;
    
    // OSRM limited to ~100 waypoints for the 'route' service
    // For very long routes, we might need to chunk, but for these pre-defined, 
    // a handful of curated waypoints is usually enough to guide the routing engine.
    const coordString = waypoints.map(p => `${p[1]},${p[0]}`).join(';');
    try {
      const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`);
      if (!osrmRes.ok) throw new Error("OSRM server error");
      const osrmData = await osrmRes.json();
      
      if (osrmData.routes?.[0]?.geometry?.coordinates) {
        let coords = osrmData.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
        
        // Simplify route if it has too many points
        if (coords.length > 2500) {
          const factor = Math.ceil(coords.length / 2500);
          coords = coords.filter((_: any, i: number) => i % factor === 0 || i === coords.length - 1);
        }
        
        return coords;
      }
    } catch (err) {
      console.error("OSRM fetch failed, using waypoints as fallback:", err);
    }
    return waypoints;
  };

  const selectRoute = async (route: typeof preDefinedRoutes[0]) => {
    setRoutePoints([]); // Clear immediately for visual feedback
    setSelectedPreDefinedRoute(route);
    setSearchQuery(route.name);
    setShowSuggestions(false);
    setShowRoutesMenu(false);
    setIsCalculatingRoute(true);
    setIsExpeditionMode(true);
    
    // Fetch weather for the start point
    fetchWeather(route.points[0][0], route.points[0][1]);

    try {
      // Zoom to rough area first
      const bounds = L.latLngBounds(route.points);
      setMapBounds(bounds);

      // Fetch realistic road route
      const roadPoints = await fetchRoadRoute(route.points);
      setRoutePoints(roadPoints);
      
      // Discover resources along the high-def route
      await discoverPOIsAlongRoute(roadPoints);
    } catch (err) {
      console.error("Route selection workflow failed:", err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'explore' | 'saved' | 'expedition' | 'routing'>('explore');

  useEffect(() => {
    if (selectedPreDefinedRoute) {
      setActiveTab('expedition');
    }
  }, [selectedPreDefinedRoute]);

  // Load route/points/coords from URL if shared
  useEffect(() => {
    const routeId = searchParams.get('route');
    const ptsParam = searchParams.get('pts');
    const queryLat = searchParams.get('lat');
    const queryLng = searchParams.get('lng');
    const queryZoom = searchParams.get('zoom');
    
    // 1. Predefined route parsing
    if (routeId) {
      const found = preDefinedRoutes.find(r => r.id === routeId);
      if (found) {
        console.log(`[URL Share] Carregando rota compartilhada: ${found.name}`);
        selectRoute(found);
      }
    } 
    // 2. Custom points parsing
    else if (ptsParam) {
      try {
        const decodedPts = JSON.parse(decodeURIComponent(ptsParam));
        if (Array.isArray(decodedPts) && decodedPts.length > 0) {
          console.log(`[URL Share] Carregando pontos de rota personalizados:`, decodedPts);
          setRoutePoints(decodedPts);
          if (decodedPts[0]) {
            setMapCenter(decodedPts[0]);
            fetchWeather(decodedPts[0][0], decodedPts[0][1]);
          }
        }
      } catch (err) {
        console.error("[URL Share] Erro ao decodificar pontos da rota compartilhada:", err);
      }
    }
    // 3. Viewport/Marker center parsing
    else if (queryLat && queryLng) {
      const latVal = parseFloat(queryLat);
      const lngVal = parseFloat(queryLng);
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        console.log(`[URL Share] Centralizando mapa nas coordenadas compartilhadas: ${latVal}, ${lngVal}`);
        setMapCenter([latVal, lngVal]);
        if (queryZoom) {
          const zVal = parseInt(queryZoom, 10);
          if (!isNaN(zVal)) setMapZoom(zVal);
        }
        fetchWeather(latVal, lngVal);
      }
    }
  }, [searchParams]);

  const handleDownloadRoute = async (e: React.MouseEvent, route: any) => {
    e.stopPropagation();
    setDownloadingRoutes(prev => new Set(prev).add(route.id));
    try {
      await saveRouteOffline(route);
    } catch (err) {
      console.error("Offline save failed:", err);
    } finally {
      setTimeout(() => {
        setDownloadingRoutes(prev => {
          const next = new Set(prev);
          next.delete(route.id);
          return next;
        });
      }, 1000);
    }
  };

  const handleRemoveOfflineRoute = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await removeRouteOffline(id);
  };

  const routeSuggestions = useMemo(() => {
    const q = searchQuery.toLowerCase();
    
    return preDefinedRoutes.filter(r => {
      const matchSearch = !searchQuery || 
        r.name.toLowerCase().includes(q) || 
        r.country.toLowerCase().includes(q);
        
      const matchDifficulty = difficultyFilter === 'all' || r.difficulty === difficultyFilter;
      const matchVehicle = vehicleFilter === 'all' || (r.vehicleTypes as string[]).includes(vehicleFilter);
      const matchCountry = countryFilter === 'all' || 
        r.country.toLowerCase().includes(countryFilter.toLowerCase()) ||
        countryFilter.toLowerCase().includes(r.country.toLowerCase());
      
      return matchSearch && matchDifficulty && matchVehicle && matchCountry;
    });
  }, [searchQuery, difficultyFilter, vehicleFilter, countryFilter]);

  const countries = useMemo(() => {
    const set = new Set(preDefinedRoutes.map(r => r.country.trim()));
    return Array.from(set).sort();
  }, []);

  const savedRoutes = useMemo(() => {
    return preDefinedRoutes.filter(r => savedRouteIds.includes(r.id));
  }, [savedRouteIds]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    setShowSuggestions(false);
    setMapBounds(null);
    
    const query = searchQuery.toLowerCase().trim();

    // 1. Check for route match (Pre-defined Routes)
    const routeMatch = preDefinedRoutes.find(r => 
      r.name.toLowerCase() === query || 
      r.name.toLowerCase().includes(query) ||
      (r.country && r.country.toLowerCase().includes(query))
    );
    
    if (routeMatch) {
      selectRoute(routeMatch);
      setIsSearching(false);
      return;
    }

    // 2. Check internal points (POIs) - use all available points
    const allPoints = [...initialPoints, ...autoDiscoveredPoints];
    const internalMatch = allPoints.find(p => 
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase() === query
    );

    if (internalMatch) {
      setMapCenter([internalMatch.lat, internalMatch.lng]);
      setMapZoom(18);
      setSelectedPoint(internalMatch);
      setIsSearching(false);
      return;
    }

    // 3. Geocoding Fallback
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await res.json();
      if (data?.[0]) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setMapZoom(16);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const filteredPoints = useMemo(() => {
    const all = [...initialPoints, ...autoDiscoveredPoints];
    return all.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery, autoDiscoveredPoints]);

  return (
    <div className="h-auto lg:h-[calc(100vh-96px)] bg-[#0b0c0d] flex flex-col lg:flex-row overflow-hidden isolate relative no-scrollbar">
      <SEO title="Tactical GPS Explorer — Atlas do Aventureiro" description="Sistema de navegação tática para expedições independentes." />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showSidebarMobile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSidebarMobile(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[4500]"
          />
        )}
      </AnimatePresence>

      {/* --- TACTICAL SIDEBAR (CONSOLIDATED) --- */}
      <aside ref={sidebarRef} className={cn(
         "w-full lg:w-[420px] lg:h-full flex-shrink-0 flex flex-col bg-[#0b0c0d]/98 backdrop-blur-3xl lg:backdrop-blur-none z-[5000] border-t lg:border-t-0 lg:border-r border-white/10 overflow-hidden transition-all duration-300 shadow-[0_-15px_50px_rgba(0,0,0,0.9)] lg:shadow-[20px_0_60px_rgba(0,0,0,0.8)]",
         "fixed inset-x-0 bottom-0 h-[75vh] rounded-t-2xl lg:rounded-none lg:static lg:h-full lg:order-first",
         !showSidebarMobile && "hidden lg:flex",
         showSidebarMobile && "flex animate-in slide-in-from-bottom duration-300"
      )}>
         {/* Drag Handle Mobile */}
         <div className="lg:hidden w-12 h-1 bg-white/20 rounded-full mx-auto my-3 shrink-0" />
         {/* Close Button Mobile */}
         <button 
           onClick={() => setShowSidebarMobile(false)}
           className="lg:hidden absolute top-6 right-6 z-[60] p-2 bg-white/5 border border-white/10 text-white/40 hover:text-white rounded-sm"
         >
            <X size={20} />
         </button>

         {/* Brand Section */}
         <div className="p-6 border-b border-white/5 flex flex-col gap-1 bg-gradient-to-br from-black to-[#ff641d]/10">
            <div className="text-[8px] font-mono text-[#ff641d] uppercase tracking-[0.4em] font-black">SYSTEM_OS // v2.6.9</div>
            <h1 className="text-xl font-display font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
               <Navigation2 size={24} className={isExpeditionMode ? "animate-pulse text-[#ff641d]" : "text-white/40"} />
               GPS_TACTICAL<span className="text-[#ff641d]">.</span>SYSTEM
            </h1>
            <div className="flex gap-2 mt-2">
               <button 
                 onClick={() => setIsExpeditionMode(!isExpeditionMode)}
                 className={cn(
                   "w-full h-10 border rounded-xs transition-all flex items-center justify-center gap-2 font-mono font-black text-[9px] uppercase tracking-[0.2em]",
                   isExpeditionMode 
                     ? "bg-[#ff641d] border-[#ff641d] text-white shadow-[0_0_15px_rgba(255,100,29,0.4)]" 
                     : "bg-black/40 border-white/10 text-white/20 hover:border-[#ff641d]/40"
                 )}
               >
                 <Zap size={12} className={isExpeditionMode ? "animate-pulse" : ""} /> 
                 <span>{isExpeditionMode ? "MODO_EXP_ATIVO" : "INICIAR_EXP_MODO"}</span>
               </button>
            </div>
         </div>

         {/* Sidebar Tabs */}
         <div className="flex border-b border-white/5 bg-black/40">
            {[
              { id: 'explore', label: 'EXPLORADOR', icon: Search },
              { id: 'saved', label: 'CÉLULA_SAVED', icon: Heart },
              { id: 'expedition', label: 'OPERACIONAL', icon: Zap },
              { id: 'routing', label: 'TRAJETO', icon: Navigation }
            ].map(tab => (
              <button 
                key={tab.id}
                disabled={tab.id === 'expedition' && !selectedPreDefinedRoute}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 h-16 flex flex-col items-center justify-center gap-1.5 transition-all relative border-b-2",
                  activeTab === tab.id 
                    ? "bg-[#ff641d]/10 border-[#ff641d] text-[#ff641d]" 
                    : "bg-transparent border-transparent text-white/20 hover:bg-white/5 hover:text-white/40 disabled:opacity-20 disabled:cursor-not-allowed"
                )}
              >
                <tab.icon size={16} />
                <span className="text-[7px] font-mono font-black uppercase tracking-widest">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="active-tab-glow" className="absolute inset-0 bg-[#ff641d]/5 blur-xl" />
                )}
              </button>
            ))}
         </div>

         <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
            <AnimatePresence mode="wait">
               {activeTab === 'explore' && (
                 <motion.div 
                   key="explore"
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 10 }}
                   className="flex-1 flex flex-col overflow-hidden"
                 >
                    <div className="p-5 lg:p-8 space-y-8 overflow-y-auto no-scrollbar">
                       {/* Integrated Search */}
                       <div className="space-y-4">
                          <label className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em]">LOCALIZAR_VETOR_DE_COORDENADAS</label>
                          <form onSubmit={handleSearch} className="relative group">
                             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#ff641d] transition-colors" size={20} />
                             <input 
                               type="text" 
                               placeholder="DESTINO, PAÍS, PONTO..."
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                               className="w-full bg-white/[0.02] border border-white/5 rounded-sm h-14 pl-14 pr-6 text-[11px] font-mono tracking-[0.3em] focus:outline-none focus:border-[#ff641d]/50 transition-all text-white placeholder:text-white/5 uppercase font-bold"
                             />
                          </form>
                       </div>

                       <div className="space-y-4">
                          <div className="flex items-center justify-between">
                             <span className="text-[9px] font-mono font-black text-white/20 tracking-[0.3em] uppercase">REFINAMENTO_TÁTICO</span>
                           </div>

                           <div className="hidden lg:flex items-center justify-between">
                             <span className="text-[9px] font-mono font-black text-white/20 tracking-[0.3em] uppercase">REFINAMENTO_TÁTICO</span>
                             <div className="flex items-center gap-2">
                               { (difficultyFilter !== 'all' || vehicleFilter !== 'all' || countryFilter !== 'all') && (
                                   <button 
                                     onClick={() => { setDifficultyFilter('all'); setVehicleFilter('all'); setCountryFilter('all'); }}
                                     className="text-[7px] font-mono text-[#ff641d] hover:underline"
                                   >
                                     LIMPAR
                                   </button>
                               )}
                               <Filter size={12} className="text-white/20" />
                             </div>
                          </div>

                          <div className="grid grid-cols-1 gap-6 bg-white/[0.02] p-4 border border-white/5 rounded-sm">
                             {/* Difficulty */}
                             <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                   <label className="text-[7px] font-mono text-white/40 uppercase tracking-widest text-left block">NÍVEL_DIFICULDADE</label>
                                   <span className="text-[7px] font-mono text-[#ff641d]/60 uppercase">{difficultyFilter === 'all' ? 'EXPEDIÇÃO_TOTAL' : difficultyFilter}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                   {[
                                     { id: 'all', label: 'TUDO', icon: Filter, color: 'text-white' },
                                     { id: 'LOW', label: 'FÁCIL', icon: MapIcon, color: 'text-green-500' },
                                     { id: 'MODERATE', label: 'MÉDIO', icon: Mountain, color: 'text-blue-500' },
                                     { id: 'CRITICAL', label: 'CRÍTICO', icon: ShieldAlert, color: 'text-red-500' }
                                   ].map(dif => (
                                      <button 
                                        key={dif.id}
                                        onClick={() => setDifficultyFilter(dif.id)}
                                        className={cn(
                                          "flex flex-col items-center justify-center gap-1.5 py-2.5 border rounded-xs transition-all group",
                                          difficultyFilter === dif.id 
                                            ? "border-[#ff641d] bg-[#ff641d]/10" 
                                            : "border-white/5 bg-white/[0.02] hover:border-white/20"
                                        )}
                                      >
                                        <dif.icon size={12} className={cn(
                                          "transition-colors",
                                          difficultyFilter === dif.id ? dif.color : "text-white/20 group-hover:text-white/40"
                                        )} />
                                        <span className={cn(
                                          "text-[6px] font-mono tracking-tighter uppercase",
                                          difficultyFilter === dif.id ? "text-white" : "text-white/20"
                                        )}>{dif.label}</span>
                                      </button>
                                   ))}
                                </div>
                             </div>

                             {/* Vehicle */}
                             <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                   <label className="text-[7px] font-mono text-white/40 uppercase tracking-widest text-left block">EQUIPAMENTO_FROTA</label>
                                   <span className="text-[7px] font-mono text-[#ff641d]/60 uppercase">{vehicleFilter === 'all' ? 'POLIVALENTE' : vehicleFilter}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                   {[
                                     { id: 'all', label: 'MIX', icon: Activity },
                                     { id: 'bike', label: 'BIKE', icon: Bike },
                                     { id: 'moto', label: 'MOTO', icon: Navigation2 },
                                     { id: 'overland', label: '4X4', icon: Truck }
                                   ].map(v => (
                                      <button 
                                        key={v.id}
                                        onClick={() => setVehicleFilter(v.id)}
                                        className={cn(
                                          "flex flex-col items-center justify-center gap-1.5 py-2.5 border rounded-xs transition-all group",
                                          vehicleFilter === v.id 
                                            ? "border-[#ff641d] bg-[#ff641d]/10" 
                                            : "border-white/5 bg-white/[0.02] hover:border-white/20"
                                        )}
                                      >
                                        <v.icon size={12} className={cn(
                                          "transition-colors",
                                          vehicleFilter === v.id ? "text-[#ff641d]" : "text-white/20 group-hover:text-white/40"
                                        )} />
                                        <span className={cn(
                                          "text-[6px] font-mono tracking-tighter uppercase",
                                          vehicleFilter === v.id ? "text-white" : "text-white/20"
                                        )}>{v.label}</span>
                                      </button>
                                   ))}
                                </div>
                             </div>

                             {/* Country */}
                             <div className="space-y-2">
                                <label className="text-[7px] font-mono text-white/40 uppercase tracking-widest text-left block">LATITUDE_NACIONAL</label>
                                 <div className="relative group">
                                   <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 border-r border-white/10 pr-2">
                                      <Globe size={10} className={countryFilter !== 'all' ? "text-[#ff641d]" : "text-white/20"} />
                                   </div>
                                   <select 
                                     value={countryFilter}
                                     onChange={(e) => setCountryFilter(e.target.value)}
                                     className="w-full bg-[#0b0c0d] border border-white/5 hover:border-white/20 rounded-xs py-2.5 pl-10 pr-4 text-[9px] font-mono text-white outline-none focus:border-[#ff641d]/50 transition-all uppercase appearance-none"
                                   >
                                      <option value="all">FROTAS_GLOBAIS (TODOS)</option>
                                      {countries.map(c => (
                                         <option key={c} value={c}>{c}</option>
                                      ))}
                                   </select>
                                   <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                      <Triangle size={6} className="rotate-180" />
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Active Route Metrics in Sidebar */}
                          {routePoints.length > 0 && (
                            <div className="mt-4 p-4 bg-[#ff641d]/10 border border-[#ff641d]/20 rounded-sm space-y-4">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <Activity size={10} className="text-[#ff641d]" />
                                     <span className="text-[8px] font-mono font-black text-[#ff641d] tracking-[0.3em] uppercase">MÉTRICAS_DA_ROTA</span>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleClearRoute(); }}
                                    className="text-white/20 hover:text-red-500 transition-colors"
                                  >
                                     <Trash2 size={12} />
                                  </button>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-1">
                                     <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">TOTAL_KM</span>
                                     <span className="text-sm font-mono font-black text-white">{totalDistance.toFixed(2)} KM</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                     <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">ESTIMADO</span>
                                     <span className="text-sm font-mono font-black text-[#ff641d]">{estimatedTime}</span>
                                  </div>
                               </div>
                               <div className="h-[1px] bg-white/5" />
                               <div className="flex gap-2">
                                 <button
                                   onClick={() => {
                                     setActiveTab('expedition');
                                     setIsExpeditionMode(true);
                                   }}
                                   className="flex-1 h-9 bg-[#ff641d] text-white text-[9px] font-mono font-black uppercase tracking-widest hover:bg-white hover:text-[#ff641d] transition-all"
                                 >
                                   INICIAR_NAV
                                 </button>
                                 <button
                                   onClick={() => setIsBottomPanelMinimized(!isBottomPanelMinimized)}
                                   className="px-3 h-9 bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all text-[9px] font-mono flex items-center justify-center"
                                   title={isBottomPanelMinimized ? "MOSTRAR_HUD_DETALHADO" : "MINIMIZAR_HUD"}
                                 >
                                   {isBottomPanelMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                                 </button>
                               </div>
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-black/40 border-t border-white/5 overflow-hidden">
                       <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#ff641d]/5">
                          <span className="text-[9px] font-mono font-black text-[#ff641d] tracking-[0.3em] uppercase">EXPEDIÇÕES_COMPATÍVEIS</span>
                          <span className="text-[10px] font-mono font-black text-white">{routeSuggestions.length}</span>
                       </div>
                       <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                          {routeSuggestions.map(route => (
                             <button
                               key={route.id}
                               onClick={() => selectRoute(route)}
                               className={cn(
                                 "w-full p-6 flex flex-col items-start gap-1 hover:bg-white/[0.02] transition-all text-left group border-b border-white/[0.02]",
                                 selectedPreDefinedRoute?.id === route.id && "bg-[#ff641d]/5 border-l-2 border-l-[#ff641d]"
                               )}
                             >
                                <div className="flex justify-between items-start w-full gap-4">
                                   <span className={cn(
                                     "text-[11px] font-mono font-black uppercase tracking-widest leading-tight",
                                     selectedPreDefinedRoute?.id === route.id ? "text-[#ff641d]" : "text-white/80 group-hover:text-white"
                                   )}>{route.name}</span>
                                   <div className={cn(
                                     "px-2 py-0.5 text-[8px] font-mono border rounded-xs uppercase shrink-0 transition-colors",
                                     route.difficulty === 'CRITICAL' ? "border-red-500/30 text-red-400 group-hover:border-red-500" : "border-blue-500/30 text-blue-400 group-hover:border-blue-500"
                                   )}>
                                     {route.difficulty === 'CRITICAL' ? 'CRÍTICO' : route.difficulty === 'MODERATE' ? 'MÉDIO' : 'FÁCIL'}
                                   </div>
                                </div>
                                <div className="flex items-center gap-4 mt-3">
                                   <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] rounded-xs">
                                      <Globe size={10} className="text-[#ff641d]" />
                                      <span className="text-[8px] font-mono text-white/50 uppercase">{route.country}</span>
                                   </div>
                                   <button 
                                      onClick={(e) => { e.stopPropagation(); toggleFavoriteRoute(route); }}
                                      className={cn(
                                        "ml-auto p-1.5 transition-colors",
                                        savedRouteIds.includes(route.id) ? "text-red-500" : "text-white/10 hover:text-red-500"
                                      )}
                                   >
                                      <Heart size={14} fill={savedRouteIds.includes(route.id) ? "currentColor" : "none"} />
                                   </button>
                                </div>
                             </button>
                          ))}
                          {routeSuggestions.length === 0 && (
                            <div className="py-20 px-10 text-center flex flex-col items-center justify-center gap-4 text-white/10">
                               <MapPin size={40} className="opacity-20" />
                               <span className="text-[9px] font-mono uppercase tracking-[0.3em] leading-relaxed">NENHUMA_EXPEDIÇÃO_ENCONTRADA_COM_ESTES_PARAMETROS_TÁTICOS</span>
                            </div>
                          )}
                       </div>
                    </div>
                 </motion.div>
               )}

               {activeTab === 'saved' && (
                  <motion.div 
                    key="saved"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="p-5 border-b border-white/5 bg-[#ff641d]/5 flex items-center justify-between">
                       <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono font-black text-[#ff641d] tracking-[0.3em] uppercase">CÉLULA_SAVED_DATA</span>
                          <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">SINC_SENTINELA_ATIVO</span>
                       </div>
                       <Heart size={16} className="text-[#ff641d] animate-pulse" />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                      {/* Favoritos (Remote) */}
                      <div className="p-4 bg-white/[0.02] border-b border-white/5">
                        <span className="text-[7px] font-mono text-white/20 uppercase tracking-[0.4em] mb-4 block">NUVEM_SYNC</span>
                        <div className="space-y-4">
                           {preDefinedRoutes.filter(r => savedRouteIds.includes(r.id)).map(route => (
                              <button
                                key={`saved-${route.id}`}
                                onClick={() => selectRoute(route)}
                                className="w-full bg-white/[0.03] border border-white/5 p-4 rounded-sm flex flex-col gap-2 hover:border-[#ff641d]/40 transition-all text-left"
                              >
                                 <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono font-black text-white uppercase">{route.name}</span>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); toggleFavoriteRoute(route); }}
                                      className="text-red-500"
                                    >
                                       <Heart size={12} fill="currentColor" />
                                    </button>
                                 </div>
                                 <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">{route.country}</span>
                              </button>
                           ))}
                           {savedRouteIds.length === 0 && (
                             <div className="py-10 text-center opacity-20">
                                <span className="text-[8px] font-mono uppercase tracking-widest">NENHUMA_ROTA_SALVA_NA_NUVEM</span>
                             </div>
                           )}
                        </div>
                      </div>

                      {/* Offline (Local) */}
                      <div className="p-4">
                        <span className="text-[7px] font-mono text-green-500 uppercase tracking-[0.4em] mb-4 block">MEMÓRIA_LÓGICA_LOCAL</span>
                        <div className="space-y-4">
                           {offlineRoutes.map(route => (
                              <button
                                key={`offline-tab-${route.id}`}
                                onClick={() => selectRoute(route as any)}
                                className="w-full bg-green-500/5 border border-green-500/20 p-4 rounded-sm flex flex-col gap-2 hover:border-green-500 transition-all text-left"
                              >
                                 <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                       <Wifi size={10} className="text-green-500" />
                                       <span className="text-[10px] font-mono font-black text-white uppercase">{route.name}</span>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleRemoveOfflineRoute(e, route.id); }}
                                      className="text-white/20 hover:text-red-500 transition-colors"
                                    >
                                       <Trash2 size={12} />
                                    </button>
                                 </div>
                                 <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">{route.country}</span>
                               </button>
                            ))}
                            {offlineRoutes.length === 0 && (
                              <div className="py-10 text-center opacity-20">
                                 <span className="text-[8px] font-mono uppercase tracking-widest">ARMAZENAMENTO_VAZIO</span>
                              </div>
                            )}
                         </div>
                       </div>
                    </div>
                  </motion.div>
                )}

               {activeTab === 'expedition' && selectedPreDefinedRoute && (
                  <motion.div 
                    key="expedition"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                     <div className="p-6 border-b border-white/10 bg-[#ff641d]/10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-[#ff641d] rounded-full animate-pulse shadow-[0_0_10px_#ff641d]" />
                              <span className="text-[10px] font-mono font-black text-[#ff641d] tracking-[0.4em] uppercase">EXPEDIÇÃO_ATIVA</span>
                           </div>
                           <button 
                             onClick={handleClearRoute}
                             className="p-2 text-white/20 hover:text-red-500 hover:bg-white/5 rounded-sm transition-all"
                             title="PARAR_EXPEDIÇÃO"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                        <h2 className="text-2xl font-mono font-black text-white leading-tight uppercase mb-4 tracking-tight">
                          {selectedPreDefinedRoute.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4">
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-xs">
                              <Globe size={12} className="text-[#ff641d]" />
                              <span className="text-[10px] font-mono text-white/80 tracking-wider uppercase">{selectedPreDefinedRoute.country}</span>
                           </div>
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-xs">
                              <Triangle size={12} className="text-[#ff641d]" />
                              <span className="text-[10px] font-mono text-white/80 tracking-wider uppercase font-black">{selectedPreDefinedRoute.difficulty}</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white/[0.03] border border-white/5 p-4 rounded-sm">
                              <span className="text-[8px] font-mono text-white/20 tracking-[0.4em] block mb-2 uppercase">DISTÂNCIA</span>
                              <span className="text-xl font-mono font-black text-white tracking-tighter">{totalDistance.toFixed(0)} <span className="text-[10px] text-white/20">KM</span></span>
                           </div>
                           <div className="bg-white/[0.03] border border-white/5 p-4 rounded-sm">
                              <span className="text-[8px] font-mono text-white/20 tracking-[0.4em] block mb-2 uppercase">RECURSOS</span>
                              <span className="text-xl font-mono font-black text-[#ff641d] tracking-tighter">{autoDiscoveredPoints.length} <span className="text-[10px] text-[#ff641d]/40">NODES</span></span>
                           </div>
                        </div>

                        {/* Active Explorers Awareness */}
                        <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-sm">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                 <Radio size={12} className="text-blue-400 animate-pulse" />
                                 <span className="text-[9px] font-mono font-black text-blue-400 tracking-[0.3em] uppercase">REDE_DE_EXPLORADORES</span>
                              </div>
                              <button 
                                onClick={() => setIsSharing(!isSharing)}
                                className={cn(
                                  "px-3 py-1 text-[8px] font-mono border rounded-xs transition-all uppercase font-black",
                                  isSharing ? "bg-blue-500 border-blue-400 text-white" : "bg-white/5 border-white/10 text-white/40"
                                )}
                              >
                                {isSharing ? "COMPARTILHANDO" : "INVISÍVEL"}
                              </button>
                           </div>
                           
                           <div className="space-y-3">
                              {otherSessions.length > 0 ? (
                                otherSessions.slice(0, 3).map(session => (
                                   <div key={session.id} className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-xs">
                                      <div className="flex items-center gap-3">
                                         <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                                         <span className="text-[10px] font-mono text-white uppercase font-black">{session.userName}</span>
                                      </div>
                                      <button 
                                        onClick={() => {
                                           setMapCenter([session.lat, session.lng]);
                                           setMapZoom(14);
                                        }}
                                        className="text-[7px] font-mono text-blue-400/60 hover:text-blue-400 underline uppercase"
                                      >
                                        LOCALIZAR
                                      </button>
                                   </div>
                                ))
                              ) : (
                                <div className="text-center py-2">
                                   <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">NENHUM_EXPLORADOR_PROXIMO</span>
                                </div>
                              )}
                              {otherSessions.length > 3 && (
                                <div className="text-[7px] font-mono text-white/10 uppercase text-center">+ {otherSessions.length - 3} OUTROS_EM_CAMPO</div>
                              )}
                           </div>
                        </div>

                        {/* Weather HUD */}
                        <AnimatePresence>
                          {weatherData && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-cyan-500/5 border border-cyan-500/20 p-5 rounded-sm"
                            >
                               <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2 px-2 py-1 bg-cyan-500/10 rounded-xs border border-cyan-500/20">
                                     <CloudRain size={12} className="text-cyan-400" />
                                     <span className="text-[9px] font-mono font-black text-cyan-400 tracking-[0.2em] uppercase">METEO_HUB</span>
                                  </div>
                                  <div className="text-3xl font-mono font-black text-white leading-none">{weatherData.temp}°C</div>
                               </div>
                               <div className="grid grid-cols-2 gap-6">
                                  <div className="flex flex-col gap-1.5">
                                     <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">DESCRIÇÃO</span>
                                     <span className="text-xs font-mono text-white/80 uppercase font-black">{weatherData.description}</span>
                                  </div>
                                  <div className="flex flex-col gap-1.5 text-right">
                                     <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest text-right">VENTO // HUMID</span>
                                     <span className="text-xs font-mono text-white/80 uppercase font-black">{weatherData.windSpeed}M/S // {weatherData.humidity}%</span>
                                  </div>
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Discovery Log */}
                        <div className="space-y-4 pb-10">
                           <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-[9px] font-mono font-black text-white/40 tracking-[0.3em] uppercase">RECURSOS_AUTO_DESCOBERTOS</span>
                              <div className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 bg-[#ff641d] rounded-full animate-pulse" />
                                 <span className="text-[8px] font-mono text-[#ff641d] uppercase font-black">SCANNING</span>
                              </div>
                           </div>

                           <div className="space-y-3">
                             {isDiscoveringPOIs && autoDiscoveredPoints.length === 0 && (
                               <div className="py-20 flex flex-col items-center gap-4">
                                  <div className="w-10 h-10 border-2 border-[#ff641d]/10 border-t-[#ff641d] rounded-full animate-spin" />
                                  <span className="text-[9px] font-mono text-white/20 tracking-widest uppercase animate-pulse text-center">Interrogando_OpenStreetMap_API...</span>
                               </div>
                             )}
                             {autoDiscoveredPoints.map(poi => (
                               <button
                                 key={poi.id}
                                 onClick={() => {
                                   setMapCenter([poi.lat, poi.lng]);
                                   setMapZoom(16);
                                   setSelectedPoint(poi);
                                 }}
                                 className={cn(
                                   "w-full text-left p-4 bg-white/[0.02] border border-white/5 hover:border-[#ff641d]/50 hover:bg-[#ff641d]/5 transition-all group rounded-sm flex items-center gap-4",
                                   selectedPoint?.id === poi.id && "bg-[#ff641d]/10 border-[#ff641d]/40"
                                 )}
                               >
                                  <div className={cn(
                                    "w-10 h-10 flex items-center justify-center rounded-sm shrink-0",
                                    poi.category === 'fuel' ? "bg-red-500/20 text-red-500 border border-red-500/20" :
                                    poi.category === 'water' ? "bg-blue-500/20 text-blue-500 border border-blue-500/20" :
                                    poi.category === 'camping' ? "bg-green-500/20 text-green-500 border border-green-500/20" : "bg-white/5 text-white/40 border border-white/10"
                                  )}>
                                     {poi.category === 'fuel' ? <Fuel size={16} /> : poi.category === 'water' ? <Droplets size={16} /> : <MapPin size={16} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <span className="text-[11px] font-mono font-black text-white group-hover:text-[#ff641d] truncate block uppercase tracking-wider transition-colors">{poi.name}</span>
                                     <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest mt-1 block">{poi.category}</span>
                                  </div>
                                  <ArrowUpRight size={14} className="text-white/5 group-hover:text-[#ff641d]" />
                               </button>
                             ))}
                           </div>
                        </div>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'routing' && (
                  <motion.div 
                    key="routing"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col p-6 space-y-6"
                  >
                     <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
                        <Navigation className="text-[#ff641d]" size={18} />
                        <h2 className="text-xl font-display font-black text-white uppercase tracking-tighter">TACTICAL_ROUTING</h2>
                     </div>
                     
                     <form onSubmit={handleRoutingSearch} className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em] block">ORIGEM_ALFA</label>
                           <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-[#ff641d] shadow-[0_0_10px_#ff641d]" />
                              <input 
                                type="text" 
                                placeholder="PONTO_DE_PARTIDA..."
                                value={originQuery}
                                onChange={(e) => setOriginQuery(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-sm h-14 pl-12 pr-4 text-[10px] font-mono focus:outline-none focus:border-[#ff641d] text-white uppercase"
                              />
                           </div>
                        </div>
                        
                        <div className="flex justify-center -my-3 relative z-10">
                           <div className="w-px h-6 bg-gradient-to-b from-[#ff641d] to-transparent opacity-40"></div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em] block">DESTINO_OMEGA</label>
                           <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff641d]" size={18} />
                              <input 
                                type="text" 
                                placeholder="COORDENADAS_OU_NOME..."
                                value={destinationQuery}
                                onChange={(e) => setDestinationQuery(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-sm h-14 pl-12 pr-4 text-[10px] font-mono focus:outline-none focus:border-[#ff641d] text-white uppercase"
                              />
                           </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={isCalculatingRoute || !originQuery || !destinationQuery}
                          className="w-full h-14 bg-[#ff641d] hover:bg-white text-white hover:text-[#ff641d] transition-all text-[11px] font-mono font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed mt-4 shadow-xl"
                        >
                           {isCalculatingRoute ? (
                             <>
                               <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                               CALCULANDO_ROTA...
                             </>
                           ) : (
                             <>
                               <ArrowUpRight size={18} /> GERAR_TRAJETÓRIA
                             </>
                           )}
                        </button>
                     </form>
                  </motion.div>
               )}
            </AnimatePresence>

            {/* Tactical Sidebar Ops Gadget - Only visible when there's an active route, expedition or selected point */}
            {(routePoints.length > 0 || !!selectedPreDefinedRoute || !!selectedPoint || isExpeditionMode) && (
              <div className="bg-black/40 border-t border-white/5 p-6 space-y-6 mt-auto">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Activity size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">OPERATIONAL_STATUS</span>
                </div>

                {/* Integrated Weather Widget */}
                <WeatherWidget lat={mapCenter[0]} lng={mapCenter[1]} />

                {/* New Risk Radar Gadget */}
                <RiskRadar 
                  lat={mapCenter[0]} 
                  lng={mapCenter[1]} 
                  selectedPointName={selectedPoint?.name}
                  hasActiveRoute={!!selectedPreDefinedRoute || routePoints.length > 0}
                />

                <div className="grid grid-cols-2 gap-4">
                    <OperationalMetric label="SISTEMA" value="ATIVO" icon={ShieldCheck} color="text-green-500" />
                    <OperationalMetric label="LATÊNCIA" value="12ms" icon={Zap} color="text-cyan-400" />
                    <OperationalMetric label="NODES" value={filteredPoints.length} icon={Database} color="text-white/40" />
                    <OperationalMetric label="CLIMA" value={weatherData ? weatherData.description : 'SINC...'} icon={Cloud} color="text-blue-400" />
                </div>

                <div className="p-3 bg-[#ff641d]/5 border border-[#ff641d]/10 rounded-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert size={10} className="text-[#ff641d]" />
                      <span className="text-[8px] font-mono text-[#ff641d] uppercase font-black">ÁREA_DE_VIGILÂNCIA</span>
                    </div>
                    <p className="text-[9px] font-mono text-white/40 leading-relaxed uppercase">
                      MONITORAMENTO_SATELITAL_RESTRITO. TODOS_OS_PONTOS_VERIFICADOS_PELA_COMUNIDADE.
                    </p>
                </div>
              </div>
            )}
         </div>

         {/* Sidebar Navigation Footer (PC ONLY) */}
         <div className="hidden lg:flex p-6 border-t border-white/5 bg-black/60 items-center justify-between">
            <div className="flex gap-4">
              <button onClick={() => window.history.back()} className="text-white/20 hover:text-[#ff641d] transition-colors"><ArrowUpRight size={18} className="rotate-[225deg]" /></button>
            </div>
            <div className="text-[8px] font-mono text-white/10 uppercase tracking-widest">EXPLORER_TAC_V2</div>
         </div>
      </aside>

      {/* --- MAP MAIN VIEWPORT --- */}
      <div className="w-full h-[75vh] lg:h-full relative flex flex-col lg:flex-1 bg-[#0b0c0d] border-l lg:border-l border-white/5 isolate order-first lg:order-last overflow-hidden lg:overflow-visible">
          {/* Real-Time GPS Tracking Widget */}
          <GPSTracker 
            className="absolute bottom-6 right-6 z-[3500] hidden lg:block"
            isSharing={isSharing}
            onToggleSharing={setIsSharing}
            isSignedIn={isSignedIn}
            onCenterMe={(lat, lng) => {
              setMapCenter([lat, lng]);
              setMapZoom(12);
              setUserLocation([lat, lng]);
            }}
          />
          <GPSTracker 
            className="absolute bottom-28 left-4 z-[3700] lg:hidden"
            isSharing={isSharing}
            onToggleSharing={setIsSharing}
            isSignedIn={isSignedIn}
            onCenterMe={(lat, lng) => {
              setMapCenter([lat, lng]);
              setMapZoom(12);
              setUserLocation([lat, lng]);
            }}
          />

          {/* --- MAP CORE (Layer 0) --- */}
          <div className="relative flex-1 min-h-0 lg:absolute lg:inset-0 z-0 w-full">
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              style={{ width: '100%', height: '100%', background: '#0b0c0d' }}
              zoomControl={false}
              className="z-0"
            >

              <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds || undefined} />
              <MapEventsHandler active={isTracing} onMapClick={(latlng) => {
                setRoutePoints(prev => [...prev, [latlng.lat, latlng.lng]]);
              }} />
              {showHeatmap && <HeatmapLayer points={filteredPoints} />}
              
              <TileLayer
                attribution='&copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {/* Active Route Display: Optimized to only show start/end and line */}
              {routePoints.length > 0 && (
                <>
                  {/* Start Marker */}
                  <Marker 
                    position={routePoints[0]} 
                    icon={L.divIcon({
                      className: 'route-marker',
                      html: `<div class="w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(34,197,94,0.6)] flex items-center justify-center font-mono text-[8px] text-white">A</div>`,
                      iconSize: [16, 16], iconAnchor: [8, 8],
                    })}
                  />
                  
                  {/* End Marker (only if different from start) */}
                  {routePoints.length > 1 && (
                    <Marker 
                      position={routePoints[routePoints.length - 1]} 
                      icon={L.divIcon({
                        className: 'route-marker',
                        html: `<div class="w-4 h-4 bg-[#ff641d] border-2 border-white rounded-full shadow-[0_0_15px_#ff641d] flex items-center justify-center font-mono text-[8px] text-white">B</div>`,
                        iconSize: [16, 16], iconAnchor: [8, 8],
                      })}
                    />
                  )}

                  {/* Waypoints for manual tracing (only if not too many) */}
                  {isTracing && routePoints.length < 50 && routePoints.slice(1, -1).map((p, i) => (
                    <Marker 
                      key={`trace-${i}`} 
                      position={p} 
                      icon={L.divIcon({
                        className: 'route-marker',
                        html: `<div class="w-2 h-2 bg-white border border-[#ff641d] rounded-full"></div>`,
                        iconSize: [8, 8], iconAnchor: [4, 4],
                      })}
                    />
                  ))}

                  {/* Tactical Glow Effect */}
                  {routePoints.length > 1 && (
                    <>
                      <Polyline 
                        positions={routePoints} 
                        color={selectedPreDefinedRoute?.color || "#ff641d"} 
                        weight={12} 
                        opacity={0.1} 
                        lineJoin="round" 
                      />
                      <Polyline 
                        positions={routePoints} 
                        color={selectedPreDefinedRoute?.color || "#ff641d"} 
                        weight={3} 
                        dashArray="5, 8" 
                        opacity={0.8} 
                        lineJoin="round" 
                      />
                    </>
                  )}
                </>
              )}

              {userLocation && (
                <Marker position={userLocation} icon={userLocationIcon()}>
                </Marker>
              )}

              {otherSessions.map(session => (
                <Marker 
                  key={session.id} 
                  position={[session.lat, session.lng]} 
                  icon={otherUserIcon('#00d4ff', session.userName)}
                >
                  <Popup className="tactical-popup">
                    <div className="p-3 bg-[#0b0c0d] border border-white/5 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest">EXPLORADOR_ATIVO</span>
                      </div>
                      <div className="text-sm font-mono font-black text-white uppercase mb-1">{session.userName}</div>
                      <div className="text-[8px] font-mono text-white/40 uppercase tracking-tighter mb-3">SINAL_RECUPERADO: {session.updatedAt?.toDate ? session.updatedAt.toDate().toLocaleTimeString() : 'RECENTE'}</div>
                      <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2">
                         <div>
                            <div className="text-[6px] font-mono text-white/20 uppercase">LAT_COORD</div>
                            <div className="text-[9px] font-mono text-white/60">{session.lat.toFixed(4)}</div>
                         </div>
                         <div>
                            <div className="text-[6px] font-mono text-white/20 uppercase">LNG_COORD</div>
                            <div className="text-[9px] font-mono text-white/60">{session.lng.toFixed(4)}</div>
                         </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {filteredPoints.map(p => {
                const cat = categories.find(c => c.id === p.category) || categories[0];
                const isSelected = selectedPoint?.id === p.id;
                
                return (
                  <Marker 
                    key={p.id} 
                    position={[p.lat, p.lng]} 
                    icon={isSelected ? createCustomIcon(cat.color, true) : createCustomIcon(cat.color)}
                    eventHandlers={{
                      click: () => {
                        setSelectedPoint(p);
                        setMapCenter([p.lat, p.lng]);
                      }
                    }}
                    zIndexOffset={isSelected ? 1000 : 0}
                  >
                    <MapTooltip direction="top" offset={[0, -10]} opacity={1} className="custom-tooltip">
                      <div className="bg-[#0b0c0d] border border-white/10 px-2 py-1 rounded-sm shadow-2xl">
                        <div className="text-[10px] font-display font-black text-white uppercase tracking-tighter">{p.name}</div>
                        <div className="text-[7px] font-mono text-[#ff641d] uppercase tracking-[0.2em]">{cat.name}</div>
                      </div>
                    </MapTooltip>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          <div 
            className="lg:hidden w-full bg-[#0b0c0d]/95 backdrop-blur-md border-t border-white/10 px-4 py-2 flex flex-col gap-2 shrink-0 z-[3600] shadow-[0_-10px_35px_rgba(0,0,0,0.8)]"
          >
             {/* Categories / Pin Filters Row */}
             <div className="flex flex-col gap-1">
                <span className="text-[7px] font-mono text-[#ff641d] uppercase font-black tracking-widest px-0.5">FILTRO_PINS</span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                   {categories.map(cat => (
                     <button
                       key={cat.id}
                       onClick={() => setSelectedCategory(cat.id)}
                       className={cn(
                         "px-3 py-1.5 rounded-xs border backdrop-blur-md transition-all flex items-center gap-1.5 shrink-0 text-[9px] font-mono uppercase font-black tracking-widest leading-none h-8",
                         selectedCategory === cat.id 
                           ? "bg-[#ff641d] border-[#ff641d] text-white shadow-[0_0_12px_rgba(255,100,29,0.4)]" 
                           : "bg-white/[0.02] border-white/5 text-white/40 hover:border-[#ff641d]/20 hover:bg-white/[0.05]"
                       )}
                     >
                       <cat.icon size={10} className={cn(selectedCategory === cat.id ? "text-white animate-pulse" : "text-white/30")} />
                       <span>{cat.name.toUpperCase()}</span>
                     </button>
                   ))}
                </div>
             </div>

             {/* Actions Scroll Row */}
             <div className="flex flex-col gap-1 border-t border-white/5 pt-1.5">
                <span className="text-[7px] font-mono text-[#ff641d] uppercase font-black tracking-widest px-0.5">ACOES_SISTEMA</span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                   {/* TACTICAL MENU ACTION */}
                   <button 
                     onClick={() => {
                       setShowSidebarMobile(true);
                       setTimeout(() => {
                         sidebarRef.current?.scrollIntoView({ behavior: 'smooth' });
                       }, 100);
                     }}
                     className={cn(
                       "h-8 px-3 bg-white/[0.02] border rounded-xs transition-all flex items-center gap-1.5 shrink-0 text-[8px] font-mono font-black uppercase tracking-widest",
                       showSidebarMobile ? "border-[#ff641d] text-[#ff641d] bg-[#ff641d]/10 animate-pulse" : "border-[#ff641d]/30 text-[#ff641d]"
                     )}
                   >
                     <Menu size={11} />
                     <span>PAINEL_TÁTICO</span>
                   </button>

                   {/* LOCATE VETOR */}
                   <button 
                     onClick={handleLocateUser} 
                     className="h-8 px-3 bg-white/[0.02] border border-white/5 text-white/40 hover:text-[#ff641d]/80 rounded-xs transition-all flex items-center gap-1.5 shrink-0 text-[8px] font-mono font-black uppercase tracking-widest"
                   >
                     <LocateFixed size={11} className="text-[#ff641d]" />
                     <span>MEU_VETOR</span>
                   </button>

                   {/* TRACING DETECT */}
                   <button 
                     onClick={() => setIsTracing(!isTracing)}
                     className={cn(
                       "h-8 px-3 border rounded-xs transition-all flex items-center gap-1.5 shrink-0 text-[8px] font-mono font-black uppercase tracking-widest",
                       isTracing ? "bg-[#ff641d] border-[#ff641d] text-white shadow-[0_0_12px_rgba(255,100,29,0.4)]" : "bg-white/[0.02] border-white/5 text-white/40 hover:border-white/20"
                     )}
                   >
                     <Ruler size={11} className={isTracing ? "text-white" : "text-white/30"} />
                     <span>TRAÇAR_ROTA</span>
                   </button>

                   {/* COMPARTILHAMENTO */}
                   <button 
                     onClick={() => {
                       setShowShareMenu(!showShareMenu);
                     }} 
                     className={cn(
                       "h-8 px-3 border rounded-xs transition-all flex items-center gap-1.5 shrink-0 text-[8px] font-mono font-black uppercase tracking-widest", 
                       showShareMenu 
                         ? "bg-[#ff641d] border-[#ff641d] text-white shadow-[0_0_12px_rgba(255,100,29,0.4)]" 
                         : (routePoints.length > 0 || !!selectedPreDefinedRoute)
                           ? "bg-black/80 border-[#ff641d]/50 text-[#ff641d] animate-pulse"
                           : "bg-white/[0.02] border-white/5 text-white/40 hover:border-white/25"
                     )}
                   >
                     <Share2 size={11} className="text-[#ff641d]" />
                     <span>COMPARTILHAR</span>
                   </button>

                   {/* TRACKING LIVE / MONITORAMENTO */}
                   <button 
                     onClick={() => setIsSharing(!isSharing)} 
                     className={cn(
                       "h-8 px-3 border rounded-xs transition-all flex items-center gap-1.5 shrink-0 text-[8px] font-mono font-black uppercase tracking-widest", 
                       isSharing ? "bg-blue-500 border-blue-400 animate-pulse text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]" : "bg-white/[0.02] border-white/5 text-white/20 hover:border-blue-500/25"
                     )}
                   >
                     <Radio size={11} className={isSharing ? "text-white" : "text-white/30"} />
                     <span>TRACKING_LIVE</span>
                   </button>

                   {/* MODO TÉRMICO / HEATMAP */}
                   <button 
                     onClick={() => setShowHeatmap(!showHeatmap)}
                     className={cn(
                       "h-8 px-3 border rounded-xs transition-all flex items-center gap-1.5 shrink-0 text-[8px] font-mono font-black uppercase tracking-widest",
                       showHeatmap ? "bg-[#ff641d] border-[#ff641d] text-white shadow-[0_0_12px_rgba(255,100,29,0.4)]" : "bg-white/[0.02] border-white/5 text-white/40 hover:border-white/25"
                     )}
                   >
                     <Activity size={10} className={showHeatmap ? "text-white" : "text-white/30"} />
                     <span>MODO_TÉRMICO</span>
                   </button>

                   {/* CORES ZOOM IN */}
                   <button 
                     onClick={() => setMapZoom(z => Math.min(z + 1, 18))}
                     className="h-8 w-8 bg-white/[0.02] border border-white/5 text-white/40 hover:text-white rounded-xs transition-all flex items-center justify-center shrink-0"
                   >
                     <Plus size={11} />
                   </button>

                   {/* CORES ZOOM OUT */}
                   <button 
                     onClick={() => setMapZoom(z => Math.max(z - 1, 3))}
                     className="h-8 w-8 bg-white/[0.02] border border-white/5 text-white/40 hover:text-white rounded-xs transition-all flex items-center justify-center shrink-0"
                   >
                     <Minus size={11} />
                   </button>
                </div>
             </div>
          </div>

         {/* HUD SCAN EFFECT */}
         <div className="absolute inset-x-0 top-0 h-[300px] pointer-events-none z-[1500] bg-gradient-to-b from-[#ff641d]/10 to-transparent opacity-20"></div>


         {/* SCAN EFFECT HUD */}
         <AnimatePresence>
            {isSearching && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[1500] pointer-events-none bg-black/20"
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ff641d] shadow-[0_0_15px_#ff641d] animate-[scan_2s_ease-in-out_infinite]" />
              </motion.div>
            )}
         </AnimatePresence>



      <PointPanelV2 
        point={selectedPoint}
        onClose={() => {
          setSelectedPoint(null);
          setIsPointDetailsMinimized(false);
        }}
        isMinimized={isPointDetailsMinimized}
        onToggleMinimize={() => setIsPointDetailsMinimized(!isPointDetailsMinimized)}
        weatherData={weatherData}
        isLoadingWeather={isLoadingWeather}
        onIntegrateRoute={(point) => {
          setRoutePoints(p => [...p, [point.lat, point.lng]]);
          setSelectedPoint(null);
          setIsPointDetailsMinimized(false);
        }}
      />

      {/* --- RIGHT TACTICAL STACK (Desktop Only) - Removed TACTICAL_FEED --- */}

      {/* HUD OVERLAYS */}

      {/* Left Sidebar HUD (Categories - Universal) */}
      <div className="hidden lg:flex absolute left-4 lg:left-6 top-[20%] lg:top-1/2 -translate-y-1/2 z-[2000] flex-col gap-1.5 pointer-events-auto">
         <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-xs mb-2 shadow-2xl">
            <Filter size={14} className="text-[#ff641d] mx-auto animate-pulse" />
         </div>
         <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto no-scrollbar py-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "w-10 h-10 lg:w-12 lg:h-12 rounded-xs border backdrop-blur-md transition-all flex items-center justify-center group relative shrink-0",
                  selectedCategory === cat.id 
                    ? "bg-[#ff641d] border-[#ff641d] text-white shadow-[0_0_20px_rgba(255,100,29,0.5)] z-10" 
                    : "bg-black/80 border-white/10 text-white/20 hover:border-[#ff641d]/40"
                )}
                title={cat.name}
              >
                <cat.icon size={16} />
                <div className="absolute left-full ml-3 px-2 py-1 bg-black/90 border border-white/10 text-white text-[8px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 z-50">
                    {cat.name.toUpperCase()}
                </div>
                {selectedCategory === cat.id && (
                   <motion.div 
                     layoutId="cat-indicator"
                     className="absolute -left-1 top-2 bottom-2 w-1 bg-white rounded-full"
                   />
                )}
              </button>
            ))}
         </div>
      </div>

      {/* TACTICAL SUPERIOR NAVIGATION BAR (Unified & Responsive) */}
      <div className="absolute top-0 left-0 right-0 z-[2000] p-4 md:p-6 pointer-events-none flex flex-col items-center gap-4">
        <div className="w-full max-w-7xl bg-[#0a0a0a]/45 backdrop-blur-md border border-[#ff7828]/18 rounded-sm p-1.5 flex flex-col lg:flex-row items-stretch lg:items-center gap-2 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_20px_rgba(255,100,29,0.05)] transition-all ring-1 ring-white/5 ring-inset">
          
          {/* Section 1: Filters & Vehicles (Left on Desktop) */}
          <div className="hidden lg:flex items-center gap-2 bg-white/[0.02] rounded-xs p-1 border border-[#ff7828]/10 order-2 lg:order-1 self-stretch lg:self-auto overflow-x-auto no-scrollbar">
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={cn(
                 "h-10 px-3 rounded-xs flex items-center justify-center gap-2 transition-all border shrink-0",
                 showFilters 
                  ? "bg-[#ff641d] border-[#ff641d] text-white shadow-[0_0_15px_rgba(255,100,29,0.5)]" 
                  : "bg-white/[0.03] border-[#ff7828]/10 text-white/40 hover:border-[#ff641d]/40 hover:text-white hover:bg-white/[0.08]"
               )}
               title="FILTROS_DE_DIFICULDADE"
             >
               <Filter size={16} />
               <span className="text-[8px] font-mono font-black uppercase tracking-widest hidden sm:inline">FILTROS</span>
             </button>
             
             <div className="w-[1px] h-4 bg-white/10 mx-1 shrink-0" />
             
             <div className="flex gap-1">
                {[
                  { id: 'bike', icon: Bike, label: 'BIKE' },
                  { id: 'moto', icon: Zap, label: 'MOTO' },
                  { id: 'car', icon: Car, label: 'CARRO' },
                  { id: 'motorhome', icon: Truck, label: 'RV' }
                ].map((v) => (
                  <button 
                    key={v.id}
                    onClick={() => setTransportMode(v.id as any)}
                    className={cn(
                      "w-10 h-10 rounded-xs flex items-center justify-center transition-all group relative shrink-0 border border-transparent",
                      transportMode === v.id 
                        ? "bg-[#ff641d] text-white shadow-[0_0_15px_rgba(255,100,29,0.3)] border-[#ff641d]/50" 
                        : "text-white/20 hover:bg-white/[0.05] hover:text-white hover:border-[#ff641d]/20"
                    )}
                    title={v.label}
                  >
                    <v.icon size={14} className={transportMode === v.id ? "drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : ""} />
                    {transportMode === v.id && (
                       <motion.div layoutId="v-glow" className="absolute inset-0 bg-[#ff641d]/20 blur-md rounded-full -z-10" />
                    )}
                  </button>
                ))}
             </div>
          </div>

          {/* Section 2: Search Area (Center on Desktop - ~65%) */}
          <div className="flex-[4] lg:flex-[6] min-w-0 order-1 lg:order-2 flex gap-2">
             <div className="relative flex-1 group">
                <AnimatePresence>
                  {(isDiscoveringPOIs || isCalculatingRoute) && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute -top-12 left-0 z-50 bg-black/90 backdrop-blur-xl border border-cyan-500/20 px-3 py-1 rounded-full flex items-center gap-2 shadow-2xl"
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full animate-ping",
                        isCalculatingRoute ? "bg-[#ff641d]" : "bg-cyan-400"
                      )} />
                      <span className={cn(
                        "text-[7px] font-mono uppercase tracking-[0.2em] whitespace-nowrap",
                        isCalculatingRoute ? "text-[#ff641d]" : "text-cyan-400"
                      )}>
                         {isCalculatingRoute ? "SINC_ESTRADAS..." : "OSM_SYNC..."}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSearch} className="relative h-12">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff641d] transition-colors" size={16} />
                   <input 
                     type="text" 
                     placeholder="PESQUISAR_ROTA_PAIS_OU_PONTO..."
                     value={searchQuery}
                     onChange={(e) => {
                       setSearchQuery(e.target.value);
                       setShowSuggestions(true);
                     }}
                     onFocus={() => setShowSuggestions(true)}
                     className="w-full h-full bg-white/[0.02] border border-[#ff7828]/10 rounded-xs pl-11 pr-10 text-[10px] font-mono tracking-[0.15em] focus:outline-none focus:border-[#ff641d]/50 focus:bg-white/[0.04] transition-all text-white placeholder:text-white/10 uppercase"
                   />
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {isSearching && <div className="w-3 h-3 border border-[#ff641d]/20 border-t-[#ff641d] rounded-full animate-spin" />}
                      <button 
                        type="button" 
                        onClick={() => setIsRoutingExpanded(!isRoutingExpanded)}
                        className={cn(
                          "p-1.5 rounded-xs transition-all",
                          isRoutingExpanded ? "text-[#ff641d]" : "text-white/20 hover:text-white"
                        )}
                        title="MODO_TRAJETÓRIA"
                      >
                         <Navigation size={14} />
                      </button>
                   </div>
                </form>

                {/* Search Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && (searchQuery.length >= 2 || (routeSuggestions.length > 0 && searchQuery.length >= 0)) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#0b0c0d]/95 backdrop-blur-3xl border border-[#ff641d]/20 rounded-sm overflow-hidden z-[5000] shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                    >
                      <div className="max-h-80 overflow-y-auto no-scrollbar">
                        {/* Section 1: Pre-defined Routes */}
                        {routeSuggestions.length > 0 && (
                          <>
                            <div className="p-2 border-b border-white/5 bg-white/[0.02] flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
                              <span className="text-[7px] font-mono text-white/20 uppercase tracking-[0.3em]">ROTAS_TACTICAS_ENCONTRADAS</span>
                              <span className="text-[7px] font-mono text-[#ff641d]/60 uppercase tracking-widest">{routeSuggestions.length} NODES</span>
                            </div>
                            {routeSuggestions.map(route => (
                              <div key={route.id} className="flex items-center justify-between p-3 hover:bg-[#ff641d]/10 transition-colors border-b border-white/5 last:border-0 group/item">
                                <button
                                  onClick={() => {
                                    selectRoute(route);
                                    setShowSuggestions(false);
                                  }}
                                  className="flex-1 flex items-center justify-between text-left"
                                >
                                  <div className="flex flex-col items-start gap-1">
                                    <span className="text-[9px] font-mono font-black text-white group-hover/item:text-[#ff641d] uppercase tracking-widest transition-colors">{route.name}</span>
                                    <div className="flex items-center gap-2">
                                       <Globe size={8} className="text-[#ff641d]/60" />
                                       <span className="text-[7px] font-mono text-white/40 uppercase tracking-widest">{route.country}</span>
                                    </div>
                                  </div>
                                  <div className={`text-[6px] font-mono px-1.5 py-0.5 rounded-xs border mr-4 ${
                                    route.difficulty === 'CRITICAL' ? 'border-red-500/50 text-red-500' : 'border-blue-500/50 text-blue-500'
                                  }`}>
                                    {route.difficulty}
                                  </div>
                                </button>
                                
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavoriteRoute(route);
                                  }}
                                  className={cn(
                                     "p-1.5 rounded-full transition-all shrink-0",
                                     savedRouteIds.includes(route.id) ? "text-red-500 bg-red-500/10" : "text-white/20 hover:text-red-500 hover:bg-white/5"
                                  )}
                                >
                                   <Heart size={14} fill={savedRouteIds.includes(route.id) ? "currentColor" : "none"} />
                                </button>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Section 2: Points of Interest (POIs) - Only show if enough query */}
                        {filteredPoints.length > 0 && searchQuery.length >= 2 && (
                          <>
                            <div className="p-2 border-b border-white/5 bg-[#ff641d]/5 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
                              <span className="text-[7px] font-mono text-[#ff641d] uppercase tracking-[0.3em]">PONTOS_DE_INTERESSE_ENCONTRADOS</span>
                              <span className="text-[7px] font-mono text-white/40 uppercase tracking-widest">{filteredPoints.length} MARCADORES</span>
                            </div>
                            {filteredPoints.map(poi => (
                              <button
                                key={`poi-${poi.id}`}
                                onClick={() => {
                                  setMapCenter([poi.lat, poi.lng]);
                                  setMapZoom(17);
                                  setSelectedPoint(poi);
                                  setShowSuggestions(false);
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.05] transition-colors border-b border-white/5 last:border-0 group/poi"
                              >
                                <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xs group-hover/poi:bg-[#ff641d]/20 transition-colors">
                                  <MapPin size={12} className="text-white/20 group-hover/poi:text-[#ff641d]" />
                                </div>
                                <div className="flex-1 flex flex-col items-start min-w-0">
                                   <span className="text-[9px] font-mono font-black text-white group-hover/poi:text-[#ff641d] transition-colors uppercase truncate w-full flex items-center gap-2 text-left shadow-none m-0 p-0 border-none bg-transparent">
                                     {poi.name}
                                     <span className="text-[6px] font-mono px-1 border border-white/10 text-white/20 rounded-2xs">{poi.category.toUpperCase()}</span>
                                   </span>
                                   <span className="text-[7px] font-mono text-white/20 uppercase tracking-tighter truncate w-full text-left">{poi.description || 'LOCAL_RECONHECIDO_SISTEMA'}</span>
                                </div>
                                <ArrowUpRight size={12} className="text-white/5 group-hover/poi:text-[#ff641d] transition-all" />
                              </button>
                            ))}
                          </>
                        )}

                        {routeSuggestions.length === 0 && (filteredPoints.length === 0 || searchQuery.length < 2) && (
                          <div className="p-8 text-center flex flex-col items-center gap-2">
                             <Activity size={16} className="text-white/5" />
                             <span className="text-[7px] font-mono text-white/20 uppercase tracking-[0.2em]">NENHUM_RESULTADO</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* Mobile 3-Dots Sidebar Trigger */}
             <button
               onClick={() => setShowSidebarMobile(!showSidebarMobile)}
               className={cn(
                 "lg:hidden h-12 w-12 rounded-xs border flex items-center justify-center transition-all bg-[#0a0a0b]/80 border-[#ff7828]/15 text-[#ff641d] active:scale-95 shrink-0 shadow-lg",
                 showSidebarMobile && "bg-[#ff641d]/10 border-[#ff641d] text-[#ff641d] animate-pulse"
               )}
               title="SISTEMA OPERACIONAL (TÁTICO)"
             >
               <MoreVertical size={16} />
             </button>

             {/* Rotas Inteligentes / Saved Routes Button */}
             <div className="relative hidden sm:block shrink-0">
                <button 
                  onClick={() => setShowRoutesMenu(!showRoutesMenu)}
                  className={cn(
                    "h-12 px-4 rounded-xs border flex items-center justify-center gap-2 transition-all font-mono font-black text-[9px] tracking-[0.2em] uppercase whitespace-nowrap",
                    showRoutesMenu || selectedPreDefinedRoute 
                      ? "bg-[#ff641d]/10 border-[#ff641d] text-[#ff641d] shadow-[0_0_15px_rgba(255,100,29,0.2)]" 
                      : "bg-white/[0.03] border-[#ff7828]/10 text-white/20 hover:border-[#ff641d]/40 hover:text-white hover:bg-white/[0.08]"
                  )}
                >
                  <MapPin size={16} className={showRoutesMenu ? "animate-bounce" : ""} />
                  <span className="hidden xl:inline">{selectedPreDefinedRoute ? selectedPreDefinedRoute.name : 'ROTAS_INTELIGENTES'}</span>
                </button>

                <AnimatePresence>
                  {showRoutesMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-80 bg-[#0b0c0d]/98 backdrop-blur-3xl border border-[#ff641d]/30 rounded-sm overflow-hidden z-[5000] shadow-2xl"
                    >
                      <div className="p-3 border-b border-white/5 bg-[#ff641d]/5 flex justify-between items-center">
                         <span className="text-[8px] font-mono text-[#ff641d] uppercase tracking-[0.3em] font-black">EXPEDIÇÕES_AMÉRICA_LATINA</span>
                         {selectedPreDefinedRoute && (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleClearRoute();
                               setShowRoutesMenu(false);
                             }}
                             className="text-white/20 hover:text-red-500 transition-colors"
                           >
                             <Trash2 size={12} />
                           </button>
                         )}
                      </div>

                      <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
                         {offlineRoutes.map(route => (
                           <button
                             key={`offline-${route.id}`}
                             onClick={() => { selectRoute(route as any); setShowRoutesMenu(false); }}
                             className={cn(
                               "w-full p-4 flex flex-col items-start gap-1 hover:bg-green-500/5 transition-colors border-b border-white/5 group text-left",
                               selectedPreDefinedRoute?.id === route.id && "bg-green-500/5 border-l-2 border-l-green-500"
                             )}
                           >
                             <div className="flex items-center gap-2">
                               <Wifi size={8} className="text-green-500" />
                               <span className={cn(
                                 "text-[9px] font-mono font-black uppercase tracking-widest",
                                 selectedPreDefinedRoute?.id === route.id ? "text-green-500" : "text-white/80 group-hover:text-green-500"
                               )}>{route.name}</span>
                             </div>
                             <div className="flex items-center gap-4 w-full justify-between mt-1">
                                <span className="text-[7px] font-mono text-white/30 uppercase">{route.country}</span>
                                <div className="flex gap-2">
                                   <Database size={10} className="text-green-500/40" />
                                </div>
                             </div>
                           </button>
                         ))}

                         {routeSuggestions.map(route => (
                           <button
                             key={route.id}
                             onClick={() => { selectRoute(route); setShowRoutesMenu(false); }}
                             className={cn(
                               "w-full p-4 flex flex-col items-start gap-1 hover:bg-[#ff641d]/10 transition-colors border-b border-white/5 group text-left",
                               selectedPreDefinedRoute?.id === route.id && "bg-[#ff641d]/5 border-l-2 border-l-[#ff641d]"
                             )}
                           >
                             <span className={cn(
                               "text-[9px] font-mono font-black uppercase tracking-widest",
                               selectedPreDefinedRoute?.id === route.id ? "text-[#ff641d]" : "text-white group-hover:text-[#ff641d]"
                             )}>{route.name}</span>
                             <div className="flex items-center gap-4 w-full justify-between mt-1">
                                <div className="flex items-center gap-1">
                                   <Globe size={10} className="text-white/20" />
                                   <span className="text-[7px] font-mono text-white/40 uppercase">{route.country}</span>
                                </div>
                                <span className={cn(
                                   "text-[6px] font-mono px-1.5 py-0.5 rounded-xs border uppercase",
                                   route.difficulty === 'CRITICAL' ? "border-red-500/50 text-red-500" : "border-blue-500/50 text-blue-500"
                                 )}>{route.difficulty}</span>
                              </div>
                            </button>
                          ))}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </div>

          {/* Section 3: Status & Visual (Right on Desktop) */}
          <div className="hidden lg:flex items-center gap-2 order-3 lg:order-3 self-stretch lg:self-auto ml-auto lg:ml-0">
             {/* Integrated Heatmap Button */}
             <button 
               onClick={() => setShowHeatmap(!showHeatmap)}
               className={cn(
                 "h-10 px-4 rounded-xs border flex items-center justify-center gap-2 transition-all shrink-0",
                 showHeatmap 
                  ? "bg-[#ff641d] border-[#ff641d] text-white shadow-[0_0_15px_rgba(255,100,29,0.5)]" 
                  : "bg-white/[0.03] border-[#ff7828]/10 text-white/40 hover:border-[#ff641d]/30 hover:text-white hover:bg-white/[0.08]"
               )}
               title="MAPA_DE_CALOR"
             >
               <Activity size={16} />
               <span className="text-[8px] font-mono font-black uppercase tracking-tighter hidden xl:inline">TÉRMICO</span>
             </button>

             <div className="w-[1px] h-4 bg-white/10 mx-1 hidden lg:block" />

             {/* LIVE_NAV Status Compact */}
             <button 
               onClick={() => setIsExpeditionMode(!isExpeditionMode)}
               className={cn(
                 "h-10 px-4 rounded-xs border flex items-center gap-3 transition-all font-mono font-black text-[9px] tracking-[0.2em] uppercase shrink-0 min-w-[120px]",
                 isExpeditionMode 
                  ? "bg-[#ff641d]/10 border-[#ff641d] text-[#ff641d] hover:bg-[#ff641d]/20 shadow-[0_0_15px_rgba(255,100,29,0.1)]" 
                  : "bg-white/[0.03] border-[#ff7828]/10 text-white/20 hover:border-[#ff641d]/30 hover:bg-white/[0.08]"
               )}
             >
               <div className={cn(
                 "w-2 h-2 rounded-full",
                 isExpeditionMode ? "bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" : "bg-white/10"
               )} />
               <span className="truncate">LIVE_NAV {isExpeditionMode ? 'ACTIVE' : 'OFF'}</span>
             </button>

             <div className="w-[1px] h-4 bg-white/10 mx-1" />

             {/* 3-dots button to open GPS_TACTICAL_SYSTEM sidebar */}
             <button
               onClick={() => setShowSidebarMobile(!showSidebarMobile)}
               className={cn(
                 "h-10 w-10 rounded-xs border flex items-center justify-center transition-all bg-white/[0.03] border-[#ff7828]/10 text-white/40 hover:text-white hover:border-[#ff641d]/30 shrink-0",
                 showSidebarMobile && "bg-[#ff641d]/10 border-[#ff641d] text-[#ff641d]"
               )}
               title="SISTEMA OPERACIONAL (TÁTICO)"
             >
               <MoreVertical size={16} />
             </button>
          </div>
        </div>

        {/* Global Advance Tactic Filter Panel (Dropdown below the bar) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="w-full max-w-7xl bg-[#0a0a0a]/60 backdrop-blur-md border border-[#ff7828]/18 overflow-hidden rounded-sm pointer-events-auto shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative z-[1900]"
            >
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Difficulty Filter */}
                  <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Activity size={12} className="text-[#ff641d]" />
                        <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-black">NÍVEL_DIFICULDADE</label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {['all', 'LOW', 'MODERATE', 'CRITICAL'].map(dif => (
                            <button 
                              key={dif}
                              onClick={() => setDifficultyFilter(dif)}
                              className={cn(
                                "h-10 text-[8px] font-mono font-bold uppercase tracking-widest border rounded-xs transition-all",
                                difficultyFilter === dif ? "bg-[#ff641d] border-[#ff641d] text-white" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                              )}
                            >
                              {dif === 'all' ? 'TODOS_OS_NÍVEIS' : dif === 'LOW' ? 'INICIANTE' : dif === 'MODERATE' ? 'MÉDIO' : 'CRÍTICO'}
                            </button>
                        ))}
                      </div>
                  </div>

                  {/* Vehicle Filter */}
                  <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Zap size={12} className="text-cyan-400" />
                        <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-black">SISTEMA_TRAÇÃO</label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {['all', 'bike', 'moto', 'overland'].map(v => (
                            <button 
                              key={v}
                              onClick={() => setVehicleFilter(v)}
                              className={cn(
                                "h-10 text-[8px] font-mono font-bold uppercase tracking-widest border rounded-xs transition-all",
                                vehicleFilter === v ? "bg-cyan-500/20 border-cyan-500 text-cyan-400" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                              )}
                            >
                              {v === 'all' ? 'PADRÃO_NAV' : v.toUpperCase()}
                            </button>
                        ))}
                      </div>
                  </div>

                  {/* Country Filter */}
                  <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Globe size={12} className="text-blue-400" />
                        <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-black">REGIÃO_DE_OPERAÇÃO</label>
                      </div>
                      <select 
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xs px-4 text-[10px] font-mono text-white outline-none focus:border-[#ff641d]/50 appearance-none cursor-pointer"
                          >
                            <option value="all">TODOS_PAÍSES</option>
                            {countries.map(c => (
                                <option key={c} value={c}>{c.toUpperCase()}</option>
                            ))}
                          </select>
                      </div>
                    </div>
                </motion.div>
              )}
           </AnimatePresence>
                                  {/* Expedition Metrics (Adaptive) */}
           {isExpeditionMode && (
             <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="hidden lg:flex flex-col gap-3 pointer-events-auto max-w-full"
             >
                <div className="flex flex-wrap justify-center gap-4 md:gap-6 bg-[#0a0a0a]/45 backdrop-blur-md border border-[#ff7828]/15 p-3 md:p-4 rounded-sm shadow-2xl relative overflow-hidden ring-1 ring-white/5 ring-inset">
                   {/* Scanline pattern for tech vibe */}
                   <div className="absolute inset-x-0 top-0 h-[1px] bg-white/5" />
                   
                   {/* Satellite Status */}
                   <div className="flex flex-col gap-1 pr-4 border-r border-white/5">
                      <div className="flex items-center gap-1.5">
                         <Wifi size={10} className={cn(
                           satelliteStatus === 'STRONG' ? "text-green-500" :
                           satelliteStatus === 'DEGRADED' ? "text-yellow-500" : "text-blue-500"
                         )} />
                         <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">SAT_CONN</span>
                      </div>
                      <div className="text-[9px] font-mono font-black text-white flex items-center gap-1.5">
                         {satelliteStatus}
                         <div className="flex gap-0.5">
                            {[1,2,3].map(i => (
                              <div key={i} className={cn(
                                "w-[2px] h-[6px] rounded-full",
                                (satelliteStatus === 'STRONG' || (satelliteStatus === 'STABLE' && i <= 2) || (satelliteStatus === 'DEGRADED' && i <= 1)) ? "bg-cyan-500" : "bg-white/10"
                              )} />
                            ))}
                         </div>
                      </div>
                   </div>

                   {transportMode === 'bike' && <OperationalMetric label="ESFORÇO" value={`${performanceMetrics.watts}W`} icon={Zap} color="text-yellow-400" />}
                   {transportMode === 'moto' && <OperationalMetric label="VENTO_LAT" value={`${performanceMetrics.windLat} KM/H`} icon={Wind} color="text-blue-400" />}
                   {transportMode === 'car' && <OperationalMetric label="TRAÇÃO" value={performanceMetrics.traction} icon={Layers} color="text-red-500" />}
                   {transportMode === 'motorhome' && <OperationalMetric label="AUTONOMIA" value={performanceMetrics.autonomy} icon={Battery} color="text-green-500" />}
                   {transportMode === 'walk' && <OperationalMetric label="RITMO" value={performanceMetrics.pace} icon={Clock} color="text-green-400" />}
                   
                   <div className="hidden md:block w-[1px] bg-white/10" />
                   
                   <button 
                     onClick={() => setShowHeatmap(!showHeatmap)}
                     className={cn("transition-all hover:opacity-80 active:scale-95", showHeatmap && "ring-1 ring-[#ff641d] rounded-sm p-1 -m-1")}
                   >
                     <OperationalMetric label="TEMP" value={weatherData ? `${weatherData.temp}°C` : "12.5°C"} icon={Thermometer} />
                   </button>
                   
                   <div className="hidden md:block w-[1px] bg-white/10" />
                   <OperationalMetric label="ALT" value="2.450M" icon={Mountain} />
                   
                   <div className="hidden md:block w-[1px] bg-white/10" />
                   <div className="flex gap-4">
                     <OperationalMetric label="LAT" value={userLocation ? userLocation[0].toFixed(4) : "---"} icon={MapPin} />
                     <OperationalMetric label="LNG" value={userLocation ? userLocation[1].toFixed(4) : "---"} icon={MapPin} />
                   </div>
                </div>

                {/* Tactical Alerts Bar */}
                <AnimatePresence>
                  {securityAlerts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-red-500 border border-red-400/50 p-2 rounded-sm flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    >
                       <ShieldAlert size={14} className="text-white animate-pulse" />
                       <div className="flex-1 overflow-hidden">
                          <motion.div 
                            animate={{ x: [0, -100] }}
                            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                            className="text-[9px] font-mono font-black text-white uppercase tracking-widest whitespace-nowrap"
                          >
                             {securityAlerts.join(' // ')} // {securityAlerts.join(' // ')}
                          </motion.div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </motion.div>
           )}
        </div>
      </div>

      {/* Responsive Categories Bar - REMOVED */}

      {/* Right Action Stack (Vertical controls) - Positioned as floating OVERLAY over the map on both Mobile (top) and Desktop (centered) */}
      <div className="flex absolute right-4 top-[110px] lg:top-1/2 lg:-translate-y-1/2 lg:bottom-auto z-[4000] flex-col gap-1.5 pointer-events-auto">
         {/* Tactical Mobile Menu Trigger */}
         <button 
           onClick={() => {
             setShowSidebarMobile(true);
             setTimeout(() => {
               sidebarRef.current?.scrollIntoView({ behavior: 'smooth' });
             }, 100);
           }}
           className="lg:hidden w-9 h-9 bg-black/80 border border-[#ff641d]/50 text-[#ff641d] rounded-sm transition-all shadow-xl flex items-center justify-center animate-pulse"
           title="MENU TÁTICO"
         >
            <Menu size={16} />
         </button>



         <button 
           onClick={handleLocateUser} 
           title="MINHA LOCALIZAÇÃO"
           className="w-9 h-9 lg:w-12 lg:h-12 bg-black/80 border border-white/10 rounded-sm text-[#ff641d] hover:bg-[#ff641d] hover:text-white transition-all shadow-xl flex items-center justify-center group relative"
         >
            <LocateFixed size={16} />
            <div className="absolute right-full mr-3 px-2 py-1 bg-black text-[8px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 border border-white/10 pointer-events-none uppercase">Minha_Posição</div>
         </button>
         
         <button 
           onClick={() => setIsTracing(!isTracing)}
           className={cn(
             "w-9 h-9 lg:w-12 lg:h-12 rounded-sm border backdrop-blur-md transition-all flex items-center justify-center group relative",
             isTracing ? "bg-[#ff641d] border-[#ff641d] text-white" : "bg-black/60 border-white/10 text-white/20 hover:border-[#ff641d]/40"
           )}
           title="TRAÇAR ROTA"
         >
           <Ruler size={14} />
           <div className="absolute right-full mr-3 px-2 py-1 bg-black text-[8px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 border border-white/10 pointer-events-none uppercase">Traçar_Rota</div>
         </button>

         <button 
           onClick={() => setShowHeatmap(!showHeatmap)}
           className={cn(
             "w-9 h-9 lg:w-12 lg:h-12 rounded-sm border backdrop-blur-md transition-all flex items-center justify-center group relative",
             showHeatmap ? "bg-[#ff641d] border-[#ff641d] text-white" : "bg-black/60 border-white/10 text-white/20 hover:border-[#ff641d]/40"
           )}
           title="MODO TÉRMICO (CALOR)"
         >
           <Activity size={14} />
           <div className="absolute right-full mr-3 px-2 py-1 bg-black text-[8px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 border border-white/10 pointer-events-none uppercase">Modo_Térmico</div>
         </button>

          <button 
            onClick={() => setIsSharing(!isSharing)} 
            title="TRACKING GPS LIVE"
            className={cn(
              "w-9 h-9 lg:w-12 lg:h-12 border rounded-sm transition-all shadow-xl flex items-center justify-center group relative", 
              isSharing ? "bg-blue-500 border-blue-500 animate-pulse text-white" : "bg-black/80 border-white/10 text-white/20 hover:border-blue-500/40"
            )}
          >
             <Radio size={16} />
             <div className="absolute right-full mr-3 px-2 py-1 bg-black text-[8px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 border border-white/10 pointer-events-none uppercase">Live_Tracking</div>
          </button>

          {/* COMPARTILHAMENTO MINIMALISTA */}
          <div className="relative group/share">
            <button 
              onClick={() => {
                setShowShareMenu(!showShareMenu);
                // Auto-close after 8 seconds of idle time
                setTimeout(() => setShowShareMenu(false), 8000);
              }} 
              title="COMPARTILHAR ROTA OU LOCAL"
              className={cn(
                "w-9 h-9 lg:w-12 lg:h-12 border rounded-sm transition-all shadow-xl flex items-center justify-center relative", 
                showShareMenu 
                  ? "bg-[#ff641d] border-[#ff641d] text-white" 
                  : (routePoints.length > 0 || !!selectedPreDefinedRoute)
                    ? "bg-black/80 border-[#ff641d]/50 text-[#ff641d] hover:bg-[#ff641d] hover:text-white"
                    : "bg-black/80 border-white/10 text-[#ff641d]/80 hover:text-white hover:border-white/30"
              )}
            >
               <Share2 size={14} className={cn((routePoints.length > 0 || !!selectedPreDefinedRoute) && "animate-pulse")} />
               <div className="absolute right-full mr-3 px-2 py-1 bg-black text-[8px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 border border-white/10 pointer-events-none uppercase">Compartilhar_Rota</div>
            </button>

            {/* Balão/Dropdown de Compartilhamento Minimalista */}
            <AnimatePresence>
              {showShareMenu && (
                <motion.div 
                  initial={{ opacity: 0, x: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.95 }}
                  className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-60 bg-[#0b0c0d]/95 backdrop-blur-xl border border-[#ff641d]/30 rounded-sm overflow-hidden z-[5000] shadow-[0_10px_30px_rgba(0,0,0,0.9)] p-3 space-y-2 pointer-events-auto"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="text-[8px] font-mono text-[#ff641d] font-black tracking-widest uppercase">
                      {selectedPreDefinedRoute ? "ROTA TÁTICA ATIVA" : routePoints.length > 0 ? "TRAJETO CUSTOMIZADO" : "COMPARTILHAR LOCAL"}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowShareMenu(false);
                      }}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>

                  <div className="text-[7px] font-mono text-white/50 uppercase leading-none truncate max-w-full">
                    {selectedPreDefinedRoute ? `NOME: ${selectedPreDefinedRoute.name}` : routePoints.length > 0 ? `${routePoints.length} COORD_NODES` : `LAT: ${mapCenter[0].toFixed(4)} LON: ${mapCenter[1].toFixed(4)}`}
                  </div>

                  {/* Copy Link Section */}
                  <div className="space-y-1">
                    <button 
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(getShareUrl());
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (err) {
                          console.error("Clipboard copy failed", err);
                        }
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xs border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] hover:border-[#ff641d]/50 transition-all font-mono text-[9px] font-black text-white text-left uppercase text-xs"
                    >
                      <span className="text-[9px]">{copied ? "COPIADO_SUCESSO!" : "COPIAR_LINK_ROTA"}</span>
                      {copied ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                      ) : (
                        <LinkIcon size={10} className="text-[#ff641d]" />
                      )}
                    </button>
                  </div>

                  {/* Social Share Buttons Grid */}
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <a 
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Confira este trajeto no Rota Livre Hub GPS: ' + getShareUrl())}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center p-2 rounded-xs border border-white/5 bg-[#25D366]/5 hover:bg-[#25D366]/20 hover:border-[#25D366]/50 transition-all font-mono text-[7px] font-black text-white/80 hover:text-white uppercase gap-1"
                    >
                      <Share2 size={12} className="text-[#25D366]" />
                      <span>WHATSAPP</span>
                    </a>
                    
                    <a 
                      href={`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent('Confira este trajeto no Rota Livre Hub GPS:')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center p-2 rounded-xs border border-white/5 bg-[#0088cc]/5 hover:bg-[#0088cc]/20 hover:border-[#0088cc]/50 transition-all font-mono text-[7px] font-black text-white/80 hover:text-white uppercase gap-1"
                    >
                      <Send size={11} className="text-[#0088cc]" />
                      <span>TELEGRAM</span>
                    </a>

                    <a 
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent('Confira este trajeto no Rota Livre Hub GPS!')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center p-2 rounded-xs border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all font-mono text-[7px] font-black text-white/80 hover:text-white uppercase gap-1"
                    >
                      <span className="text-[10px] font-black text-[#ff641d]">X</span>
                      <span>TWITTER</span>
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-[1px] bg-white/5 my-1" />

         <div className="flex flex-col bg-black/40 border border-white/10 rounded-sm overflow-hidden text-[8px] font-mono text-white/20">
            <div className="p-1 lg:p-2 border-b border-white/5 text-center hidden lg:block uppercase tracking-tighter">ZOOM</div>
            <button onClick={() => setMapZoom(z => Math.min(z + 1, 18))} className="p-2 lg:p-3 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 lg:border-0"><Plus size={14} /></button>
            <button onClick={() => setMapZoom(z => Math.max(z - 1, 3))} className="p-2 lg:p-3 hover:bg-white/5 hover:text-white transition-colors"><Minus size={14} /></button>
         </div>
      </div>

      {/* Bottom Route / Elevation HUD */}
      <AnimatePresence>
        {(routePoints.length > 0) && (
          <motion.div 
            initial={{ y: 200 }} 
            animate={{ y: isBottomPanelMinimized ? 150 : 0 }} 
            exit={{ y: 200 }}
            className="relative lg:absolute bottom-auto lg:bottom-6 left-auto lg:left-1/2 right-auto lg:-translate-x-1/2 w-full lg:max-w-2xl z-[2100] pointer-events-auto px-0 lg:px-4"
          >
             <div className="w-full bg-black/90 backdrop-blur-2xl border-t lg:border border-white/10 lg:rounded-md shadow-[0_-20px_50px_rgba(0,0,0,0.8)] lg:shadow-[0_15px_50px_rgba(0,0,0,0.9)] overflow-hidden">
                {/* Minimal Header for Minimized state */}
                {isBottomPanelMinimized && (
                   <div className="h-10 px-6 flex items-center justify-between border-b border-white/5 bg-[#ff641d]/5 cursor-pointer" onClick={() => setIsBottomPanelMinimized(false)}>
                      <div className="flex items-center gap-10">
                         <div className="flex items-center gap-2">
                            <Activity size={10} className="text-[#ff641d]" />
                            <span className="text-[8px] font-mono font-black text-white uppercase tracking-widest">{totalDistance.toFixed(2)} KM</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <Clock size={10} className="text-[#ff641d]" />
                            <span className="text-[8px] font-mono text-white/60 uppercase">{estimatedTime}</span>
                         </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsBottomPanelMinimized(false); }}
                        className="text-white/20 hover:text-white transition-colors"
                      >
                         <Maximize2 size={12} />
                      </button>
                   </div>
                )}

                <div className={cn(
                  "p-6 flex items-center justify-between border-b border-white/5",
                  isBottomPanelMinimized && "opacity-0 h-0 p-0 pointer-events-none"
                )}>
                   <div className="flex gap-10">
                      <div className="flex flex-col gap-1">
                         <div className="text-[7px] font-mono text-white/20 uppercase tracking-[0.3em]">TOTAL_KM</div>
                         <div className="text-xl font-display font-black text-white">{totalDistance.toFixed(2)} KM</div>
                      </div>
                      <div className="flex flex-col gap-1">
                         <div className="text-[7px] font-mono text-white/20 uppercase tracking-[0.3em]">ESTIMATED_TIME</div>
                         <div className="text-xl font-display font-black text-[#ff641d]">{estimatedTime}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                         <div className="text-[7px] font-mono text-white/20 uppercase tracking-[0.3em]">WAYPOINTS</div>
                         <div className="text-xl font-display font-black text-white/40">{routePoints.length}</div>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setIsBottomPanelMinimized(true)}
                        className="p-3 text-white/20 hover:text-white transition-colors border border-white/5 hover:border-white/20"
                        title="MINIMIZAR"
                      >
                         <Minimize2 size={14} />
                      </button>
                      <button onClick={handleClearRoute} className="h-10 px-4 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/30 text-[8px] font-mono uppercase font-black tracking-widest transition-all">LIMPAR</button>
                      <button className="h-10 px-6 bg-[#ff641d] text-white text-[8px] font-mono uppercase font-black tracking-widest hover:bg-white hover:text-[#ff641d] transition-all">INICIAR_EXP</button>
                   </div>
                </div>
                {!isBottomPanelMinimized && <ElevationChart data={elevationData} />}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(0vh); }
          50% { transform: translateY(100vh); }
          100% { transform: translateY(0vh); }
        }
        .leaflet-container { background: #0b0c0d !important; }
        .leaflet-popup-content-wrapper { background: #0b0c0d !important; padding: 0 !important; border: 1px solid rgba(255,255,255,0.05); }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip { background: #0b0c0d !important; border: 1px solid rgba(255,255,255,0.05); }
        .leaflet-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .leaflet-tooltip-top:before { border-top-color: rgba(255,255,255,0.1) !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      {/* --- AI TACTICAL INTELLIGENCE PANEL (OVERLAY) --- */}
      <AnimatePresence>
        {showAIPanel && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed left-4 lg:left-[440px] top-24 bottom-24 w-[calc(100%-32px)] max-w-[380px] bg-[#0b0c0d]/98 backdrop-blur-3xl border border-cyan-500/30 z-[10000] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8),0_0_40px_rgba(34,211,238,0.2)] pointer-events-auto overflow-hidden rounded-sm"
          >
             <div className="p-4 border-b border-white/5 flex items-center justify-between bg-cyan-500/[0.03]">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]" />
                   <span className="text-[10px] font-mono font-black text-cyan-400 tracking-[0.3em]">AI_OPERATIONAL_HUB</span>
                </div>
                <button 
                  onClick={() => setShowAIPanel(false)}
                  className="text-white/20 hover:text-white transition-colors p-2"
                >
                   <Plus size={18} className="rotate-45" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                {!aiIntelligence && isAnalyzingAI ? (
                   <div className="h-full flex flex-col items-center justify-center gap-6">
                      <div className="relative">
                         <div className="w-16 h-16 border-2 border-cyan-500/20 rounded-full border-t-cyan-500 animate-spin" />
                         <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-500 animate-pulse" size={24} />
                      </div>
                      <div className="text-center space-y-2">
                         <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-[0.3em] animate-pulse">SINCRO_DADOS_SATÉLITE...</div>
                         <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest">PROCESSANDO_MODELO_GEMINI_PRO</div>
                      </div>
                   </div>
                ) : aiIntelligence && (
                   <div className="space-y-8">
                      {/* Summary Header */}
                      <section>
                         <div className="text-[8px] font-mono text-cyan-500/60 uppercase tracking-[0.2em] mb-2">STATUS_OPERACIONAL</div>
                         <h2 className="text-xl font-display font-black text-white uppercase tracking-tighter leading-none mb-3">
                            {aiIntelligence.difficulty}_RISK_PROTOCOL
                         </h2>
                         <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xs text-[10px] text-white/60 font-mono uppercase leading-relaxed italic">
                            "{aiIntelligence.summary}"
                         </div>
                      </section>

                      {/* Intelligence Radar */}
                      <section className="h-48 -mx-4">
                         <div className="text-[7px] font-mono text-white/20 uppercase tracking-[0.3em] mb-4 text-center">RADAR_DE_DIFICULDADE</div>
                         <ResponsiveContainer width="100%" height="100%">
                           <RadarChart data={[
                             { subject: 'TERRAIN', A: aiIntelligence.radarStats.terrain },
                             { subject: 'ISOLATION', A: aiIntelligence.radarStats.isolation },
                             { subject: 'WEATHER', A: aiIntelligence.radarStats.weather },
                             { subject: 'TECH', A: aiIntelligence.radarStats.tech },
                           ]}>
                             <PolarGrid stroke="rgba(255,255,255,0.05)" />
                             <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: 900 }} />
                             <Radar
                               name="Intel"
                               dataKey="A"
                               stroke="#22d3ee"
                               fill="#22d3ee"
                               fillOpacity={0.3}
                             />
                           </RadarChart>
                         </ResponsiveContainer>
                      </section>

                      {/* Risk Level Meter */}
                      <section className="space-y-2">
                         <div className="flex justify-between items-end">
                            <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">NÍVEL_DE_RISCO</span>
                            <span className={cn(
                              "text-[12px] font-mono font-black",
                              aiIntelligence.riskLevel > 70 ? "text-red-500" : "text-cyan-400"
                            )}>{aiIntelligence.riskLevel}%</span>
                         </div>
                         <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${aiIntelligence.riskLevel}%` }}
                              className={cn(
                                "h-full transition-all duration-1000",
                                aiIntelligence.riskLevel > 70 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                              )}
                            />
                         </div>
                      </section>

                      {/* Intelligent Alerts */}
                      <section className="space-y-4">
                         <div className="flex items-center gap-2">
                            <ShieldAlert size={10} className="text-[#ff641d]" />
                            <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">ALERTAS_INTELIGENTES</span>
                         </div>
                         <div className="space-y-2">
                            {aiIntelligence.alerts.map((alert, i) => (
                              <div key={i} className="flex gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xs">
                                 <div className="w-1 h-auto bg-red-500" />
                                 <span className="text-[9px] font-mono text-white/80 leading-tight uppercase">{alert}</span>
                              </div>
                            ))}
                         </div>
                      </section>

                      {/* Operational Conditions */}
                      <section className="space-y-2">
                         <div className="flex items-center gap-2">
                            <Database size={10} className="text-cyan-400" />
                            <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">CONDIÇÕES_OPERACIONAIS</span>
                         </div>
                         <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xs text-[10px] text-white/60 font-mono uppercase leading-relaxed text-left">
                            {aiIntelligence.operationalConditions}
                         </div>
                      </section>
                   </div>
                )}
             </div>

              {/* Footer Operational Status */}
              <div className="p-4 bg-cyan-500/[0.02] border-t border-cyan-500/10 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">AI_LOGIC_ACTIVE</span>
                </div>
                <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest">SYNC_TIME: {new Date().toLocaleTimeString()}</div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
