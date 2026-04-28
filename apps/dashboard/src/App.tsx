import { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { generateScenarioAndRoute, NETRA_PACING } from './engine';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './index.css';
import { useStore } from './store';

const IconMap: Record<string, any> = {};

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

/* ═══════════════════════════════════════
   SVG ICON COMPONENTS 
   ═══════════════════════════════════════ */

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const WarningTriangle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CloudIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const DashboardIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>;
const MapIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>;
const PeopleIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const AlertsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const AnalyticsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const UsersStatIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const DoorIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M14 9h1"/></svg>;
const ShieldCheckIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>;
const AlertTriangleIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const CheckIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const TrendingIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12,color:'var(--accent-blue)'}}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;

IconMap['ShieldIcon'] = ShieldIcon;
IconMap['WarningTriangle'] = WarningTriangle;
IconMap['CloudIcon'] = CloudIcon;
IconMap['BellIcon'] = BellIcon;
IconMap['ChevronDown'] = ChevronDown;
IconMap['DashboardIcon'] = DashboardIcon;
IconMap['MapIcon'] = MapIcon;
IconMap['PeopleIcon'] = PeopleIcon;
IconMap['AlertsIcon'] = AlertsIcon;
IconMap['AnalyticsIcon'] = AnalyticsIcon;
IconMap['SettingsIcon'] = SettingsIcon;
IconMap['UsersStatIcon'] = UsersStatIcon;
IconMap['DoorIcon'] = DoorIcon;
IconMap['ShieldCheckIcon'] = ShieldCheckIcon;
IconMap['AlertTriangleIcon'] = AlertTriangleIcon;
IconMap['CheckIcon'] = CheckIcon;
IconMap['TrendingIcon'] = TrendingIcon;

/* ═══════════════════════════════════════
   ISOMETRIC MAP COMPONENT
   ═══════════════════════════════════════ */



// Map 0-100 pct coords to a real world bounding box in Pune, India
const mapPctToLatLng = (x: number, y: number, offsetLat = 0, offsetLng = 0): [number, number] => {
  const baseLat = 18.5204;
  const baseLng = 73.8567;
  const scale = 0.002; // Constrained area ~222m
  // y in SVG is down, lat is up, so invert Y
  return [baseLat + offsetLat + (100 - y) / 100 * scale, baseLng + offsetLng + (x / 100) * scale];
};

const LiveLeafletMap = ({ mapData, onGenerate }: { mapData: any, onGenerate: () => void }) => {
  const offsetLat = mapData.offset?.lat || 0;
  const offsetLng = mapData.offset?.lng || 0;
  const centerLat = 18.5204 + offsetLat + 0.0025;
  const centerLng = 73.8567 + offsetLng + 0.0025;

  return (
    <div className="map-canvas" style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
      {mapData.simulationStatus === 'standby' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, zIndex: 1000, background: 'rgba(15,23,42,0.8)', color: 'white' }}>
          <div style={{ fontWeight: 800, letterSpacing: 2, fontSize: 20, opacity: 0.95 }}>NETRA</div>
          <div style={{ opacity: 0.75 }}>Intelligent Crisis Awareness System</div>
          <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4, marginBottom: 8 }}>Awaiting incident data...</div>
          <button className="regenerate-btn" onClick={onGenerate}>Generate Scenario</button>
        </div>
      )}
      
      <MapContainer key={mapData.scenarioId || 'initial'} center={[centerLat, centerLng]} zoom={17} style={{ width: '100%', height: '100%', background: 'transparent' }} zoomControl={false} attributionControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-tiles" />
        
        {/* Routes */}
        {!mapData.idle && Array.isArray(mapData.routeOverlays) && mapData.routeOverlays.map((r: any, idx: number) => {
          const color = r.color || (r.style === 'safe' ? '#4ADE80' : r.style === 'congested' ? '#F59E0B' : '#A78BFA');
          const latlngs = r.points.filter((pt: any) => pt).map((pt: any) => mapPctToLatLng(pt.x, pt.y, offsetLat, offsetLng));
          if (latlngs.length < 2) return null;
          return <Polyline key={`route-${idx}`} positions={latlngs} pathOptions={{ color, weight: r.style === 'safe' ? 3 : 2, dashArray: r.style === 'safe' ? '5, 5' : '4, 6', opacity: r.opacity || 0.8, className: 'route-path' }} />;
        })}

        {/* Blocked Routes */}
        {!mapData.idle && mapData.mapBlocked?.map((m: any, idx: number) => {
          return <CircleMarker key={`block-${idx}`} center={mapPctToLatLng(m.x, m.y, offsetLat, offsetLng)} radius={6} pathOptions={{ color: '#EF4444', weight: 3, fillOpacity: 0.8 }}><Tooltip>Blocked Path</Tooltip></CircleMarker>;
        })}

        {/* Exits */}
        {!mapData.idle && Array.isArray(mapData.exits) && mapData.exits.map((e: any, idx: number) => (
          <CircleMarker key={`exit-${idx}`} center={mapPctToLatLng(e.x, e.y, offsetLat, offsetLng)} radius={10} pathOptions={{ color: e.color || '#4ADE80', fillColor: '#1e293b', fillOpacity: 1, weight: 4 }}>
            <Tooltip permanent direction="top" offset={[0, -10]} className="exit-tooltip">{e.label}</Tooltip>
          </CircleMarker>
        ))}

        {/* People */}
        {!mapData.idle && mapData.people?.map((p: any, idx: number) => {
          // Deterministic jitter based on ID so they don't jump when array indices change
          const seedStr = p.id ? String(p.id).replace(/\D/g, '') : String(idx);
          const seed = parseInt(seedStr, 10) || idx;
          const jitterX = Math.sin(seed * 45.2) * 1.5;
          const jitterY = Math.cos(seed * 45.2) * 1.5;
          return <CircleMarker key={`person-${p.id || idx}`} center={mapPctToLatLng(p.x + jitterX, p.y + jitterY, offsetLat, offsetLng)} radius={3} pathOptions={{ fillColor: p.fill || '#3B82F6', color: '#fff', weight: 1, fillOpacity: 0.9 }} />;
        })}

        {/* Incident Zone */}
        {mapData.simulationStatus !== 'standby' && (
          <Circle 
            center={mapPctToLatLng(mapData.stats.dangerX, mapData.stats.dangerY, offsetLat, offsetLng)} 
            radius={mapData.stats.incidentRadiusMeters || 40} 
            pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, className: 'pulse-circle' }} 
          />
        )}
      </MapContainer>
    </div>
  );
};

/* ═══════════════════════════════════════
   MAIN APP COMPONENT
   ═══════════════════════════════════════ */

export default function App() {
  const store = useStore();
  const { simulationStatus, setSimulationStatus, setScenarioData, setWeather } = store;
  
  const isRegenerating = simulationStatus === 'generating';
  const isSimulating = simulationStatus === 'active';
  const isIdle = simulationStatus === 'standby';

  const [progress, setProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const emergencyStartRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  const weather = store.weather;
  const [dynamicStats, setDynamicStats] = useState({
    responseAccuracy: 94.2,
    avgResponseTime: 2.4,
    networkLoad: 12.5
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setDynamicStats(prev => ({
        responseAccuracy: Math.min(100, Math.max(90, prev.responseAccuracy + (Math.random() - 0.5) * 0.2)),
        avgResponseTime: Math.min(5, Math.max(1, prev.avgResponseTime + (Math.random() - 0.5) * 0.1)),
        networkLoad: Math.min(100, Math.max(5, prev.networkLoad + (Math.random() - 0.5) * 0.5))
      }));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Pune&units=metric&appid=8fb8d9463469b5d0f9f92565cda7d497`);
        const data = await res.json();
        if (data && data.main) {
          setWeather({ 
            temp: Math.round(data.main.temp), 
            location: `${data.name}, ${data.sys.country}`,
            condition: data.weather[0]?.main || 'Clear' 
          });
        }
      } catch (e) {
        console.error('Weather fetch error:', e);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // 10 mins
    return () => clearInterval(interval);
  }, []);

  // Simulation refs
  type Agent = { 
    userId: string; 
    exitId: string; 
    path: { x: number; y: number }[]; 
    path_costs?: number[]; 
    step: number; 
    baseDelay: number; 
    startDelay: number;
    isStarted: boolean;
    revealPct: number;
    acc: number; 
    style: string 
  };
  const simTimerRef = useRef<any>(null);
  const lastTickRef = useRef(0);
  const agentsRef = useRef<Agent[]>([]);
  const completedRef = useRef<Agent[]>([]);
  const metaRef = useRef<any>(null);

  const data = store;

  // Live elapsed timer
  const formatElapsed = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  useEffect(() => {
    // Start in IDLE state; do not auto-generate
  }, []);

  const updateScenario = (mapData: any) => {
    const sr = generateScenarioAndRoute(mapData);
    const { building, exits, incident, routes, computeMs, spawnBatches, ui, mapName, blocked_edges } = sr;

    const exitColor: Record<string, string> = { A: '#4ADE80', B: '#60A5FA', C: '#FBBF24', D: '#C084FC', E: '#22D3EE', F: '#FB923C' };
    const layoutLabel = (mapName || 'Facility').toUpperCase();
    const blockedExitLabels = exits.filter(e => e.blocked).map(e => e.label).join(', ');

    const newAlerts = [
      { id: Math.random(), type: 'danger', iconName: 'AlertTriangleIcon', title: `Incident at ${layoutLabel}`, desc: `Severity: ${incident.severity.toUpperCase()}`, time: 'Just now' },
      ...(blockedExitLabels ? [{ id: Math.random(), type: 'warning', iconName: 'WarningTriangle', title: `${blockedExitLabels} Blocked`, desc: 'Debris / structural damage', time: 'Just now' }] : []),
      { id: Math.random(), type: 'info', iconName: 'ShieldCheckIcon', title: `Routing Complete`, desc: `${computeMs}ms • ${routes.length} routes`, time: 'Now' }
    ];

    const newActivity = [
      { id: Math.random(), user: 'System', iconColor: '', textHTML: `Routes assigned to <strong>${ui.totalPeople}</strong> people`, time: 'Now' },
      { id: Math.random(), user: 'AI Engine', iconColor: 'var(--accent-blue)', textHTML: `<strong>${exits.filter(e=>!e.blocked).length}</strong> active exits identified`, time: 'Now' },
    ];

    // Start elapsed timer
    emergencyStartRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - emergencyStartRef.current);
    }, 1000);

    const newOffset = { lat: (Math.random() - 0.5) * 0.004, lng: (Math.random() - 0.5) * 0.004 };

    setScenarioData({
      simulationStatus: 'active',
      scenario: { building, exits, incident, scenarioId: Math.random().toString() },
      people: [],
      exits: exits.filter(e => !e.blocked).map(e => {
        const node = building.nodes.find(n => n.id === e.node);
        return { label: e.label, x: node?.pct.x || 0, y: node?.pct.y || 0, color: exitColor[e.id] || '#60A5FA' };
      }),
      allExits: exits.map(e => {
        const node = building.nodes.find(n => n.id === e.node);
        return { ...e, x: node?.pct.x || 0, y: node?.pct.y || 0, color: e.blocked ? '#EF4444' : (exitColor[e.id] || '#60A5FA') };
      }),
      routeOverlays: ui.routeOverlays,
      alerts: newAlerts,
      activity: newActivity,
      stats: {
        totalPeople: ui.totalPeople,
        evacuated: 0,
        blockedRoutes: ui.blockedRouteCount,
        blockedExits: ui.blockedExitCount,
        dangerX: ui.dangerPct.x,
        dangerY: ui.dangerPct.y,
        incidentRadiusMeters: ui.incidentRadiusMeters,
        exitStats: Object.keys(ui.exitLoads).map(exitId => ({
          id: exitId,
          label: exits.find(e => e.id === exitId)?.label || exitId,
          count: ui.exitLoads[exitId],
          pct: ui.exitPcts[exitId],
          color: exitColor[exitId] || '#60A5FA',
          blocked: exits.find(e => e.id === exitId)?.blocked || false
        })),
        recommendedSafeExit: exits.find(e => !e.blocked)?.label || 'an exit',
        mapBlocked: blocked_edges.map(be => building.nodes.find(n => n.id === be.a)?.pct).filter(Boolean),
        offset: newOffset
      }
    });

    // Batch-spawn people clusters
    const revealBatches = async () => {
      for (const batch of spawnBatches) {
        await new Promise(res => setTimeout(res, NETRA_PACING.spawn_delay_min + Math.floor(Math.random() * (NETRA_PACING.spawn_delay_max - NETRA_PACING.spawn_delay_min + 1))));
        useStore.setState(prev => {
          const current = new Set(prev.people.map((p: any) => p.id));
          const additions = ui.peopleDots.filter(pd => batch.includes(pd.id) && !current.has(pd.id));
          return { ...prev, people: [...prev.people, ...additions.map(a => ({ id: a.id, x: a.x, y: a.y, color: '', fill: a.color, shadow: `0 0 6px ${a.color}` }))] } as any;
        });
      }
    };
    void revealBatches();

    // Initialize simulation agents — path_pcts is already person→exit
    // Initialize simulation agents with random variations and batch starting delays
    agentsRef.current = routes.map((r, idx) => ({
      userId: r.person_id,
      exitId: r.exit_id,
      path: r.path_pcts,
      path_costs: r.path_costs,
      step: 0,
      // Randomize base speed per agent for realistic variety
      baseDelay: (NETRA_PACING.agent_step_ms_min + Math.floor(Math.random() * (NETRA_PACING.agent_step_ms_max - NETRA_PACING.agent_step_ms_min + 1))) * (0.85 + Math.random() * 0.3),
      acc: 0,
      // Stagger starts in batches to avoid instant congestion
      startDelay: Math.floor(idx / 8) * 600 + Math.random() * 300,
      style: 'safe',
      isStarted: false,
      revealPct: 0 // For gradual route drawing
    }));
    
    completedRef.current = [];
    metaRef.current = { routes, exits, nodes: building.nodes };
    setTimeout(() => startSimulation(), NETRA_PACING.think_delay_ms);
  };

  // Simulation controller
  const startSimulation = () => {
    setSimulationStatus('active');
    if (simTimerRef.current) return;
    lastTickRef.current = performance.now();
    
    simTimerRef.current = window.setInterval(() => {
      const now = performance.now();
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;

      if (!agentsRef.current.length) {
        pauseSimulation();
        setSimulationStatus('completed');
        const meta = metaRef.current;
        if (meta) {
          const avgDist = (() => {
            const rs = meta.routes as any[];
            if (!rs?.length) return 0;
            const sum = rs.reduce((a:number,r:any)=> a + (r.path_nodes?.length || 0), 0);
            return Math.round((sum / rs.length) * 10) / 10;
          })();
          const exitsUsed = (() => {
            const count: Record<string, number> = {};
            for (const r of meta.routes as any[]) count[r.exit_id] = (count[r.exit_id]||0)+1;
            return Object.entries(count).map(([k,v])=>`Exit ${k}: ${v}`).join('  ');
          })();
          useStore.setState(prev => ({
            ...prev,
            activity: [
              { id: Math.random(), user: 'System', iconColor: '', textHTML: `Simulation complete — <strong>${prev.stats.evacuated}</strong> evacuated`, time: 'Now' },
              { id: Math.random(), user: 'System', iconColor: '', textHTML: `Avg. route steps: <strong>${avgDist}</strong>`, time: 'Now' },
              { id: Math.random(), user: 'System', iconColor: '', textHTML: `${exitsUsed}`, time: 'Now' },
              ...prev.activity
            ].slice(0, 12)
          } as any));
        }
        return;
      }

      let evacuatedInc = 0;
      const exitDelta: Record<string, number> = {};
      const moved: { id: string; x: number; y: number }[] = [];
      const overlays: any[] = [];
      const remainingAgents: any[] = [];

      for (const a of agentsRef.current) {
        // Handle Batch Starting
        if (!a.isStarted) {
          a.acc += dt;
          // Animate route reveal before person moves
          a.revealPct = Math.min(100, (a.acc / a.startDelay) * 100);
          
          if (a.acc >= a.startDelay) {
            a.isStarted = true;
            a.acc = 0;
            a.revealPct = 100;
          }
          
          // Add route overlay even if not started (revealing)
          const visiblePathCount = Math.max(1, Math.ceil((a.path.length) * (a.revealPct / 100)));
          overlays.push({ 
            userId: a.userId, 
            exitId: a.exitId, 
            points: a.path.slice(0, visiblePathCount), 
            style: a.style,
            opacity: 0.3 + (a.revealPct / 100) * 0.5 
          });
          
          remainingAgents.push(a);
          continue;
        }

        // Active Movement Simulation
        let step = a.step;
        let acc = a.acc + dt;
        let currentDelay = a.baseDelay;
        
        while (step < a.path.length - 1) {
          const localCost = (a.path_costs && a.path_costs[step]) ? a.path_costs[step] : 1;
          currentDelay = a.baseDelay * Math.max(1, localCost * 0.4);

          if (acc >= currentDelay) {
            acc -= currentDelay;
            step += 1;
          } else {
            break;
          }
        }

        if (step >= a.path.length - 1) {
          completedRef.current.push({ ...a, step: a.path.length - 1, acc: 0 });
          evacuatedInc += 1;
          exitDelta[a.exitId] = (exitDelta[a.exitId] || 0) + 1;
          continue;
        }

        const localCost = (a.path_costs && a.path_costs[step]) ? a.path_costs[step] : 1;
        currentDelay = a.baseDelay * Math.max(1, localCost * 0.4);
        
        const cur = a.path[step];
        const next = a.path[step + 1];
        const fraction = Math.min(1, Math.max(0, acc / currentDelay));
        const interpX = cur.x + (next.x - cur.x) * fraction;
        const interpY = cur.y + (next.y - cur.y) * fraction;

        moved.push({ id: a.userId, x: interpX, y: interpY });
        
        // Dynamic route drawing: only show remaining path from current interpolated position
        overlays.push({ 
          userId: a.userId, 
          exitId: a.exitId, 
          points: [{ x: interpX, y: interpY }, ...a.path.slice(step + 1)], 
          style: a.style,
          opacity: 0.8
        });
        
        remainingAgents.push({ ...a, step, acc });
      }

      agentsRef.current = remainingAgents;

      // Batch React state updates for performance
      useStore.setState(prev => {
        const idToPos = new Map(moved.map(m => [m.id, m] as const));
        const completedIds = new Set<string>(completedRef.current.map((c: any) => c.userId));
        const people = prev.people
          .filter((p: any) => !completedIds.has(p.id))
          .map((p: any) => {
            const m = idToPos.get(p.id);
            return m ? { ...p, x: m.x, y: m.y } : p;
          });

        const evacuated = prev.stats.evacuated + evacuatedInc;
        const exitStats = prev.stats.exitStats.map((es: any) => {
          if (exitDelta[es.id]) {
            const newCount = Math.max(0, es.count - exitDelta[es.id]);
            const newPct = prev.stats.totalPeople > 0 ? Math.round((newCount / prev.stats.totalPeople) * 100) : 0;
            return { ...es, count: newCount, pct: newPct };
          }
          return es;
        });

        let activity = prev.activity as any[];
        if (evacuatedInc > 0) {
          Object.entries(exitDelta).forEach(([k, count]) => {
            if (!count) return;
            activity = [
              { id: Math.random(), user: 'System', iconColor: 'var(--accent-green)', textHTML: `${count} evacuated via <strong>Exit ${k}</strong>`, time: 'Now' },
              ...activity
            ].slice(0, 10);
          });
        }

        return {
          ...prev,
          people,
          routeOverlays: overlays,
          activity,
          stats: {
            ...prev.stats,
            evacuated,
            exitStats
          }
        } as any;
      });
    }, 120); // Optimized update frequency (120ms) for smooth animation vs performance
  };

  const pauseSimulation = () => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
  };

  const resetSimulation = () => {
    pauseSimulation();
    agentsRef.current = [];
    completedRef.current = [];
  };

  useEffect(() => {
    return () => {
      // Cleanup if component unmounts
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setSimulationStatus('generating');
    setProgress(0);
    setElapsedMs(0);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    resetSimulation();

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + Math.floor(Math.random() * 15) + 10;
      });
    }, 50);

    try {
      const emergencyTypes = ['Blast', 'Fire', 'Gas Leak', 'Stampede', 'Building Collapse'];
      const randomType = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
      
      const mapFiles = ['airport_layout.json', 'hospital_layout.json', 'hotel_layout.json', 'mall_layout.json', 'office_layout.json'];
      const randomMap = mapFiles[Math.floor(Math.random() * mapFiles.length)];
      const response = await fetch(`/maps/${randomMap}`);
      const mapData = await response.json();
      
      setScenarioData({ emergencyType: randomType });
      updateScenario(mapData);
    } catch (err) {
      console.error('Failed to load map:', err);
    } finally {
      if (useStore.getState().simulationStatus === 'generating') {
        setSimulationStatus('standby');
      }
    }
  };

  const evacPct = store.stats.totalPeople > 0 ? Math.round((store.stats.evacuated / store.stats.totalPeople) * 100) : 0;

  return (
    <div className="layout">
      
      {/* ═══ TOP NAVIGATION BAR ═══ */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="logo-icon"><ShieldIcon /></div>
          <div className="logo-text">
            <div className="logo-title">NETRA CONTROL CENTER</div>
            <div className="logo-subtitle">AI EMERGENCY RESPONSE</div>
          </div>
        </div>

        <div className="topbar-center">
          <div className="alert-pill">
            <div className="alert-pill-icon"><WarningTriangle /></div>
            <div className="alert-text">
              <span className="alert-active">{isIdle ? 'STANDBY' : 'EMERGENCY ACTIVE'}</span>
              <span className="alert-desc-text">{isIdle ? 'Awaiting scenario generation' : 'Incident detected • Evacuation in progress'}</span>
            </div>
            <div className="alert-timer">{isIdle ? '--:--:--' : formatElapsed(elapsedMs)}</div>
          </div>
        </div>

        <div className="topbar-right">
          <button 
            className={`regenerate-btn ${isRegenerating ? 'loading' : ''}`}
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            <RefreshIcon />
            {isRegenerating ? 'REGENERATING...' : 'REGENERATE SCENARIO'}
          </button>
          <div className="weather-chip">
            <CloudIcon />
            <div className="weather-details">
              <span className="weather-temp">{weather.temp}&deg;C</span>
              <span className="weather-location">{weather.location}</span>
            </div>
          </div>

          <div className="icon-btn"><BellIcon /></div>
          <div className="admin-chip">
            <div className="admin-avatar">AD</div>
            <div className="admin-details">
              <span className="admin-name">Admin</span>
              <span className="admin-role">Control Center</span>
            </div>
            <ChevronDown />
          </div>
        </div>
      </header>

      {/* ═══ MAIN BODY ═══ */}
      <div className="main-layout">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="glass-panel nav-menu">
            <div className="nav-label">MAIN</div>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <DashboardIcon /> Dashboard
            </NavLink>
            <NavLink to="/live-map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <MapIcon /> Live Map
            </NavLink>
            <NavLink to="/alerts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <AlertsIcon /> Alerts
            </NavLink>

            <div className="nav-label" style={{ marginTop: '20px' }}>SYSTEM</div>
            <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <AnalyticsIcon /> Analytics
            </NavLink>
          </div>

          <div className="glass-panel crisis-panel">
            <div className="crisis-header">CRISIS CONTROL</div>
            <div className="crisis-field">
              <label>Emergency Type</label>
              <div className="crisis-value">{store.emergencyType}</div>
            </div>
            <div className="crisis-field">
              <label>Location</label>
              <div className="crisis-value">City Mall, Pune</div>
            </div>
            <div className="crisis-field">
              <label>People Detected</label>
              <div className="crisis-value">{store.stats.totalPeople} <TrendingIcon /></div>
            </div>
            <button className="end-emergency-btn">END EMERGENCY</button>
          </div>
        </aside>

        {/* ── CONTENT (Map + Analytics + Bottom) ── */}
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <>
                <div className="content-top">

                  {/* ── LIVE MAP PANEL ── */}
                  <div className="glass-panel map-panel">
                    <div className="panel-title">LIVE MAP &ndash; REAL TIME OVERVIEW</div>
                    <div className="map-container">
                      <LiveLeafletMap mapData={data} onGenerate={handleRegenerate} />
                    </div>
                  </div>

                  {/* ── RIGHT ANALYTICS PANEL ── */}
                  <div className="glass-panel analytics-panel">
                    {/* Overview Stats */}
                    <div className="analytics-section">
                      <div className="panel-title" style={{marginBottom:0}}>OVERVIEW</div>
                      <div className="stats-grid">
                        <div className="stat-box">
                          <div className="stat-icon blue"><UsersStatIcon /></div>
                          <div className="stat-content">
                            <span className="stat-val">{store.stats.totalPeople}</span>
                            <span className="stat-label">Total People</span>
                          </div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-icon green"><DoorIcon /></div>
                          <div className="stat-content">
                            <span className="stat-val">{store.stats.exitStats?.length || 0}</span>
                            <span className="stat-label">Exits Available</span>
                          </div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-icon green"><ShieldCheckIcon /></div>
                          <div className="stat-content">
                            <span className="stat-val">{store.stats.evacuated}</span>
                            <span className="stat-label">Evacuated</span>
                          </div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-icon yellow"><AlertTriangleIcon /></div>
                          <div className="stat-content">
                            <span className="stat-val">{store.stats.blockedExits || store.stats.blockedRoutes}</span>
                            <span className="stat-label">Blocked Exits</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Exit Distribution */}
                    <div className="analytics-section">
                      <div className="panel-title">EXIT DISTRIBUTION</div>
                      <div className="bar-container">
                        {store.stats.exitStats?.map((es: any) => (
                          <div className="bar-row" key={es.id}>
                            <div className="bar-exit-label">{es.label}</div>
                            <div className="bar-track">
                              <div className="bar-fill" style={{width:`${es.pct}%`,background: es.blocked ? '#EF4444' : es.color}}></div>
                            </div>
                            <div className="bar-stats"><span>{es.count} People</span><span>{es.pct}%</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ BOTTOM PANELS ═══ */}
                <div className="content-bottom">

                  {/* Live Alerts */}
                  <div className="glass-panel bottom-card">
                    <div className="panel-title">LIVE ALERTS</div>
                    <div className="alerts-list">
                      {store.alerts.map((alert, idx) => {
                        const IconComp = IconMap[alert.iconName];
                        return (
                          <div key={alert.id || idx} className={`alert-row ${alert.type}`}>
                            <div className="alert-icon-box">{IconComp ? <IconComp /> : null}</div>
                            <div className="alert-content">
                              <div className="alert-row-title">{alert.title}</div>
                              <div className="alert-row-desc">{alert.desc}</div>
                            </div>
                            <div className="alert-row-time">{alert.time}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Routing */}
                  <div className="glass-panel bottom-card">
                    <div className="panel-title">AI ROUTING IN PROGRESS</div>
                    <div className="routing-desc">
                      {isRegenerating ? "Analyzing new scenario..." : (isSimulating ? "Simulating evacuation..." : "Calculating safest routes for all people...")}
                    </div>
                    <div className="routing-metrics">
                      <div className="r-metric">
                        <span className="r-val" style={{color:'var(--accent-green)'}}>{store.stats.exitStats?.length || 0}</span>
                        <span className="r-lbl">Safe Exits</span>
                      </div>
                      <div className="r-metric">
                        <span className="r-val">{isRegenerating ? '--' : (2.0 + Math.random() * 0.5).toFixed(1) + 's'}</span>
                        <span className="r-lbl">Avg. Response Time</span>
                      </div>
                      <div className="r-metric">
                        <span className="r-val">{isRegenerating ? '--' : (94 + Math.floor(Math.random() * 5)) + '%'}</span>
                        <span className="r-lbl">Accuracy</span>
                      </div>
                    </div>
                    <div className="r-progress">
                      <div className="rp-header">
                        <span>{isRegenerating ? "Analyzing routes..." : (isSimulating ? "Simulating..." : "Processing live data...")}</span>
                        <span className="rp-pct">{isRegenerating ? `${progress}%` : (isSimulating ? `${Math.max(5, Math.round((store.stats.evacuated / store.stats.totalPeople) * 100))}%` : "72%")}</span>
                      </div>
                      <div className="rp-track">
                        <div 
                          className="rp-fill" 
                          style={{
                            width: isRegenerating ? `${progress}%` : (isSimulating ? `${Math.max(5, Math.round((store.stats.evacuated / store.stats.totalPeople) * 100))}%` : '72%'), 
                            transition: 'width 0.2s ease'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* User Notification Preview */}
                  <div className="glass-panel bottom-card">
                    <div className="panel-title">USER NOTIFICATION PREVIEW</div>
                    <div className="preview-split">
                      <div className="preview-col">
                        <div className="preview-label"><strong>SMARTPHONE</strong> (WhatsApp)</div>
                        <div className="msg-bubble whatsapp">
                          <div className="wa-title">⚠️ Emergency Alert!</div>
                          <div>Please evacuate via <strong>{store.stats.recommendedSafeExit}</strong>.<br/>Tap to view your safe route.</div>
                          <a href="#" className="wa-link">View Route</a>
                          <div className="wa-url">maps.crisis.app/route/23</div>
                          <div className="wa-time">4:39 PM ✓✓</div>
                        </div>
                      </div>
                      <div className="preview-col">
                        <div className="preview-label"><strong>FEATURE PHONE</strong> (SMS)</div>
                        <div className="msg-bubble sms">
                          <div><strong>ALERT:</strong> Evacuate now.<br/>Use {store.stats.recommendedSafeExit}. Walk straight 20m, turn left.<br/>Stay calm. – Police</div>
                          <div className="sms-time">4:39 PM</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="glass-panel bottom-card" style={{ flex: '1.2' }}>
                    <div className="panel-title">SYSTEM ACTIVITY LOG</div>
                    <div className="activity-list">
                      {store.activity.map((act, idx) => (
                        <div key={act.id || idx} className="activity-row">
                          <div className="activity-dot" style={act.iconColor ? {background: act.iconColor} : {}}></div>
                          <div className="activity-info">
                            <span className="activity-user">{act.user}</span>
                            <span className="activity-action" dangerouslySetInnerHTML={{ __html: act.textHTML }}></span>
                          </div>
                          <span className="activity-time">{act.time}</span>
                        </div>
                      ))}
                    </div>
                    <button className="view-all-btn">View All Activity</button>
                  </div>

                </div>
              </>
            } />

            <Route path="/live-map" element={
              <div className="content-top" style={{ height: '100%', flex: 1 }}>
                <div className="glass-panel map-panel" style={{ flex: 1 }}>
                  <div className="panel-title">LIVE MAP &ndash; FULL OVERVIEW</div>
                  <div className="map-container">
                    <LiveLeafletMap mapData={data} onGenerate={handleRegenerate} />
                  </div>
                </div>
              </div>
            } />

            <Route path="/alerts" element={
              <div className="content-bottom" style={{ height: '100%', flex: 1, display: 'flex' }}>
                <div className="glass-panel bottom-card" style={{ flex: 1, height: '100%', overflowY: 'auto' }}>
                  <div className="panel-title">ALL SYSTEM ALERTS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {store.alerts.length > 0 ? store.alerts.map((alert, idx) => {
                      const IconComp = IconMap[alert.iconName];
                      return (
                        <div key={alert.id || idx} className={`alert-row ${alert.type}`} style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                          <div className="alert-icon-box" style={{ width: 36, height: 36 }}>{IconComp ? <IconComp /> : null}</div>
                          <div className="alert-content">
                            <div className="alert-row-title" style={{ fontSize: '13px' }}>{alert.title}</div>
                            <div className="alert-row-desc" style={{ fontSize: '11px' }}>{alert.desc}</div>
                          </div>
                          <div className="alert-row-time">{alert.time}</div>
                        </div>
                      );
                    }) : <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40 }}>No active alerts</div>}
                  </div>
                </div>
              </div>
            } />

            <Route path="/analytics" element={
              <div className="content-top" style={{ flex: 1, gap: '12px', padding: '10px' }}>
                <div className="glass-panel analytics-panel" style={{ flex: 1, height: 'fit-content' }}>
                   <div className="panel-title">SYSTEM ANALYTICS & PERFORMANCE</div>
                   <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                     <div className="stat-box">
                        <div className="stat-icon blue"><AnalyticsIcon /></div>
                        <div className="stat-content">
                          <span className="stat-val">{dynamicStats.responseAccuracy.toFixed(1)}%</span>
                          <span className="stat-label">AI Accuracy</span>
                        </div>
                     </div>
                     <div className="stat-box">
                        <div className="stat-icon green"><DoorIcon /></div>
                        <div className="stat-content">
                          <span className="stat-val">{evacPct}%</span>
                          <span className="stat-label">Evacuation Progress</span>
                        </div>
                     </div>
                     <div className="stat-box">
                        <div className="stat-icon yellow"><WarningTriangle /></div>
                        <div className="stat-content">
                          <span className="stat-val">{dynamicStats.avgResponseTime.toFixed(1)}s</span>
                          <span className="stat-label">Avg. Response</span>
                        </div>
                     </div>
                   </div>
                   
                   <div className="analytics-section" style={{ marginTop: 30 }}>
                     <div className="panel-title" style={{ marginBottom: 15 }}>LIVE NETWORK LOAD</div>
                     <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                       <div style={{ 
                         width: `${dynamicStats.networkLoad}%`, 
                         height: '100%', 
                         background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                         boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                         transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                       }}></div>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 8, opacity: 0.7 }}>
                       <span>Nodes: 128 Active</span>
                       <span>Current Load: {dynamicStats.networkLoad.toFixed(1)}%</span>
                     </div>
                   </div>

                   <div className="analytics-section" style={{ marginTop: 30 }}>
                     <div className="panel-title">SYSTEM UPTIME</div>
                     <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-green)' }}>99.998%</div>
                     <div style={{ fontSize: 10, opacity: 0.6 }}>Operational for 14,282 consecutive hours</div>
                   </div>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}

