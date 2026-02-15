
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
  lastReading: SensorData;
  history: SensorData[];
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
