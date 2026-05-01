
import { WaterTank } from './types';

// IDs sincronizados con el backend (community_id)
export const MOCK_TANKS: WaterTank[] = [
  {
    id: 'cm_alba',
    name: 'Depósito Monte Alba',
    location: { lat: 42.1748, lng: -8.7422, address: 'Valladares, Vigo' },
    status: 'warning',
    lastReading: {
      turbidity: 4.5,
      ph: 6.8,
      conductivity: 120,
      temperature: 14.2,
      level: 85,
      battery: 3.9,
      timestamp: new Date().toISOString()
    },
    history: []
  },
  {
    id: 'cm_zamans',
    name: 'Traída Zamáns',
    location: { lat: 42.1555, lng: -8.7222, address: 'Zamáns, Vigo' },
    status: 'optimal',
    lastReading: {
      turbidity: 0.8,
      ph: 7.1,
      conductivity: 85,
      temperature: 15.1,
      level: 92,
      battery: 4.1,
      timestamp: new Date().toISOString()
    },
    history: []
  },
  {
    id: 'cm_vincios',
    name: 'Comunidad de Vincios',
    location: { lat: 42.1114, lng: -8.7611, address: 'Gondomar' },
    status: 'critical',
    lastReading: {
      turbidity: 12.8,
      ph: 5.4,
      conductivity: 320,
      temperature: 16.5,
      level: 45,
      battery: 3.5,
      timestamp: new Date().toISOString()
    },
    history: []
  },
  {
    id: 'cm_rua',
    name: 'Comunidad de Baiona',
    location: { lat: 42.0712, lng: -8.5100, address: 'Baiona' },
    status: 'critical',
    lastReading: {
      turbidity: 0,
      ph: 0,
      conductivity: 0,
      temperature: 0,
      level: 0,
      battery: 0,
      timestamp: new Date().toISOString()
    },
    history: []
  },
  {
    id: 'cm_rua4',
    name: 'Comunidad de A Rúa de Valdeorras',
    location: { lat: 42.393714, lng: -7.123255, address: 'A Rúa' },
    status: 'critical',
    lastReading: {
      turbidity: 0,
      ph: 0,
      conductivity: 0,
      temperature: 0,
      level: 0,
      battery: 0,
      timestamp: new Date().toISOString()
    },
    history: []
  }
];

export const MOCK_REPORTS = [];
