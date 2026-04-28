import { create } from 'zustand';

// Using simple SVG strings or just returning null for the store initial state, 
// and letting App.tsx inject the right icons, but keeping JSX is easier if we just import the icons.
// Wait, we can't easily import the icons without exporting them from App.tsx.
// Let's just store the name of the icon and map it in App.tsx.

export interface AppState {
  scenario: any;
  people: any[];
  exits: any[];
  allExits: any[];
  routes: any[];
  routeOverlays: any[];
  alerts: any[];
  stats: {
    totalPeople: number;
    evacuated: number;
    blockedRoutes: number;
    blockedExits: number;
    dangerX: number;
    dangerY: number;
    exitStats: any[];
    recommendedSafeExit: string;
    mapBlocked: any[];
    offset: { lat: number; lng: number };
    incidentRadiusMeters: number;
  };
  activity: any[];
  simulationStatus: 'standby' | 'generating' | 'active' | 'completed';
  emergencyType: string;
  isDarkMode: boolean;
  weather: { temp: number; location: string; condition: string };
  setSimulationStatus: (status: 'standby' | 'generating' | 'active' | 'completed') => void;
  updateStats: (stats: Partial<AppState['stats']>) => void;
  setScenarioData: (data: Partial<AppState>) => void;
  setWeather: (weather: any) => void;
}

export const useStore = create<AppState>((set) => ({
  scenario: null,
  people: [],
  exits: [],
  allExits: [],
  routes: [],
  routeOverlays: [],
  alerts: [
    { id: 1, type: 'danger', iconName: 'AlertTriangleIcon', title: 'System initialized', desc: 'Awaiting scenario data', time: 'Now' },
    { id: 2, type: 'info', iconName: 'ShieldCheckIcon', title: 'AI Engine Online', desc: 'All subsystems ready', time: 'Now' },
    { id: 3, type: 'info', iconName: 'CheckIcon', title: 'Sensors Active', desc: 'CCTV + Drone feeds connected', time: 'Now' }
  ],
  stats: {
    totalPeople: 50,
    evacuated: 0,
    blockedRoutes: 0,
    blockedExits: 0,
    dangerX: 50,
    dangerY: 50,
    exitStats: [],
    recommendedSafeExit: 'Exit',
    mapBlocked: [],
    offset: { lat: 0, lng: 0 },
    incidentRadiusMeters: 40
  },
  activity: [
    { id: 1, user: 'System', iconColor: '', textHTML: 'NETRA Control Center <strong>online</strong>', time: 'Now' },
    { id: 2, user: 'System', iconColor: 'var(--accent-green)', textHTML: 'All subsystems <strong>ready</strong>', time: 'Now' },
  ],
  simulationStatus: 'standby',
  emergencyType: 'Blast',
  isDarkMode: true,
  weather: { temp: 24, location: 'Pune, India', condition: 'Clear' },
  
  setSimulationStatus: (status) => set({ simulationStatus: status }),
  updateStats: (newStats) => set((state) => ({ stats: { ...state.stats, ...newStats } })),
  setScenarioData: (data) => set((state) => ({ ...state, ...data })),
  setWeather: (weather) => set({ weather })
}));
