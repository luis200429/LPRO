
import { WaterTank, UserReport } from './types';

export const MOCK_TANKS: WaterTank[] = [
  {
    id: 'dep-001',
    name: 'Depósito Monte Alba',
    location: { lat: 42.1748, lng: -8.7422, address: 'Monte Alba, Vigo' },
    status: 'warning',
    lastReading: {
      turbidity: 12.5,
      ph: 6.2,
      tds: 150,
      temperature: 14.2,
      level: 85,
      flow: 1.2,
      battery: 3.9,
      timestamp: new Date().toISOString()
    },
    history: Array.from({ length: 24 }, (_, i) => ({
      turbidity: 5 + Math.random() * 10,
      ph: 6.5 + (Math.random() - 0.5),
      tds: 140 + Math.random() * 20,
      temperature: 13 + Math.random() * 3,
      level: 80 + Math.random() * 10,
      flow: 0.5 + Math.random(),
      battery: 3.8 + Math.random() * 0.4,
      timestamp: new Date(Date.now() - (24 - i) * 3600000).toISOString()
    }))
  },
  {
    id: 'dep-002',
    name: 'Traída Vecinal Gondomar',
    location: { lat: 42.1114, lng: -8.7611, address: 'Couso, Gondomar' },
    status: 'optimal',
    lastReading: {
      turbidity: 1.2,
      ph: 7.1,
      tds: 85,
      temperature: 15.1,
      level: 92,
      flow: 0.8,
      battery: 4.1,
      timestamp: new Date().toISOString()
    },
    history: Array.from({ length: 24 }, (_, i) => ({
      turbidity: 1 + Math.random() * 0.5,
      ph: 7.0 + (Math.random() - 0.5) * 0.2,
      tds: 80 + Math.random() * 10,
      temperature: 14 + Math.random() * 2,
      level: 90 + Math.random() * 5,
      flow: 0.7 + Math.random() * 0.3,
      battery: 4.0 + Math.random() * 0.2,
      timestamp: new Date(Date.now() - (24 - i) * 3600000).toISOString()
    }))
  },
  {
    id: 'dep-003',
    name: 'Manantial Chandebrito',
    location: { lat: 42.1555, lng: -8.7222, address: 'Chandebrito, Nigrán' },
    status: 'critical',
    lastReading: {
      turbidity: 45.8,
      ph: 5.4,
      tds: 320,
      temperature: 16.5,
      level: 45,
      flow: 4.5,
      battery: 3.5,
      timestamp: new Date().toISOString()
    },
    history: Array.from({ length: 24 }, (_, i) => ({
      turbidity: 20 + Math.random() * 30,
      ph: 5.2 + (Math.random() - 0.5) * 0.4,
      tds: 280 + Math.random() * 60,
      temperature: 15 + Math.random() * 3,
      level: 50 - i,
      flow: 3 + Math.random() * 2,
      battery: 3.6 - (i * 0.01),
      timestamp: new Date(Date.now() - (24 - i) * 3600000).toISOString()
    }))
  }
];

export const MOCK_REPORTS: UserReport[] = [
  {
    id: 'rep-1',
    tankId: 'dep-001',
    userName: 'Xabier G.',
    description: 'El agua sale con un tono blanquecino esta mañana.',
    type: 'color',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'rep-2',
    tankId: 'dep-003',
    userName: 'María R.',
    description: 'Baja presión repentina en la zona alta de Chandebrito.',
    type: 'leak',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  }
];
