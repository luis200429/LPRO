
export interface SensorData {
  turbidity: number;
  ph: number;
  tds: number;
  temperature: number;
  level: number;
  flow: number;
  battery: number;
  timestamp: string;
}

export interface WaterTank {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  
  status: 'optimal' | 'warning' | 'critical';
  lastReading: {
    turbidity: number;
    ph: number;
    conductivity: number;
    level: number;
    temperature: number;
    timestamp: number | string;
    battery: number;
    ica?: number; 
  };
  history?: Array<{
    turbidity: number;
    ph: number;
    conductivity: number;
    water_level: number;l
    temperature: number;
    timestamp: number;
    ice?: number; 
    ica?: number;
  }>;
}

export interface UserReport {
  id: string;
  tankId: string;
  userName: string;
  description: string;
  type: 'color' | 'smell' | 'taste' | 'leak';
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
