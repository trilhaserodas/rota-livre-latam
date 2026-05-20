export interface ToolCard {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: any;
  category: 'finance' | 'travel' | 'info' | 'utility';
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export interface LocationPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: 'camping' | 'water' | 'repair' | 'danger' | 'safe_point' | 'fuel' | 'policing' | 'hostel' | 'viewpoint' | 'bike_route' | 'moto_route' | 'overland' | 'terrestre' | 'border' | 'market' | 'no_signal' | 'climate' | 'bio';
  description: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: string;
  hours?: string;
  type?: string;
  price?: string;
  image?: string;
  images?: string[];
  isolationLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  operationalStatus?: 'STABLE' | 'WARNING' | 'CRITICAL' | 'CLOSED';
  nextSupportDist?: string;
  plusCode?: string;
}

export interface CommunityReport {
  id: string;
  pointId: string;
  authorName: string;
  category: 'segurança' | 'água' | 'camping' | 'hostel' | 'oficina' | 'estrada' | 'clima' | 'perigo' | 'fiscalização' | 'fronteira';
  text: string;
  type: 'flood' | 'road_blocked' | 'danger' | 'abandoned_gas' | 'water' | 'wifi' | 'safe_camping' | 'storm' | 'strong_wind' | 'animal';
  timestamp: any;
}
