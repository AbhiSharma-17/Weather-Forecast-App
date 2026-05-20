import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWeather } from '../context/WeatherContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Navigation, Cpu, Terminal, Check, Globe2, Lock, Calendar, ChevronLeft, ChevronRight, X, User, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Leaflet Style Overrides ───────────────────────────────────────────────
const styles = `
  .leaflet-container {
    background: #020617 !important;
    border-radius: 12px;
  }
  .custom-pulsar-marker {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pulsar-core {
    width: 10px;
    height: 10px;
    background-color: #06b6d4;
    border-radius: 50%;
    box-shadow: 0 0 10px #06b6d4, 0 0 20px #06b6d4;
    z-index: 10;
  }
  .pulsar-ring {
    position: absolute;
    width: 30px;
    height: 30px;
    border: 2px solid #06b6d4;
    border-radius: 50%;
    animation: pulsar-ping 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
    opacity: 0;
  }
  @keyframes pulsar-ping {
    0% { transform: scale(0.2); opacity: 0.8; }
    80% { transform: scale(1.2); opacity: 0; }
    100% { transform: scale(1.2); opacity: 0; }
  }
  .custom-station-marker {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .station-dot {
    width: 10px;
    height: 10px;
    background-color: #6366f1;
    border: 2px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 8px #6366f1;
    transition: all 0.3s;
  }
  .custom-station-marker-active .station-dot {
    background-color: #06b6d4;
    box-shadow: 0 0 12px #06b6d4;
    width: 12px;
    height: 12px;
  }
  .custom-station-marker-alert .station-dot {
    background-color: #f43f5e;
    box-shadow: 0 0 12px #f43f5e;
    animation: alert-flash 1s steps(2, start) infinite;
  }
  @keyframes alert-flash {
    to { visibility: hidden; }
  }
  .leaflet-popup-content-wrapper {
    background: rgba(9, 13, 22, 0.95) !important;
    backdrop-filter: blur(8px) !important;
    border: 1px solid rgba(6, 182, 212, 0.25) !important;
    color: #e5e7eb !important;
    font-family: monospace !important;
    border-radius: 12px !important;
    font-size: 11px !important;
  }
  .leaflet-popup-tip {
    background: rgba(9, 13, 22, 0.95) !important;
    border-left: 1px solid rgba(6, 182, 212, 0.25) !important;
    border-bottom: 1px solid rgba(6, 182, 212, 0.25) !important;
  }
  .leaflet-control-zoom {
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
  }
  .leaflet-control-zoom-in, .leaflet-control-zoom-out {
    background-color: rgba(9, 13, 22, 0.9) !important;
    color: #06b6d4 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  }
  .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
    background-color: rgba(6, 182, 212, 0.2) !important;
    color: #ffffff !important;
  }
`;

// ─── Interfaces ────────────────────────────────────────────────────────────
interface NearbyNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
  temperature: number;
  humidity: number;
  aqi: number;
  condition: string;
}

// ─── 3D Canvas Globe ───────────────────────────────────────────────────────
const CanvasGlobe: React.FC<{ userLat?: number; userLng?: number }> = ({ userLat, userLng }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const draw = () => {
      const w = W();
      const h = H();
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.38;
      const rot = rotationRef.current;

      // Atmospheric glow
      const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.6);
      glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      glowGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.04)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // Globe body gradient
      const bodyGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      bodyGrad.addColorStop(0, '#1e3a5f');
      bodyGrad.addColorStop(0.4, '#0c2340');
      bodyGrad.addColorStop(0.8, '#061225');
      bodyGrad.addColorStop(1, '#020817');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Globe edge glow
      const edgeGrad = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r);
      edgeGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      edgeGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.15)');
      edgeGrad.addColorStop(1, 'rgba(6, 182, 212, 0.4)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = edgeGrad;
      ctx.fill();

      // Save clip for globe
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // Grid lines (latitude)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 0.6;
      for (let lat = -80; lat <= 80; lat += 20) {
        const latRad = (lat * Math.PI) / 180;
        const y = cy - Math.sin(latRad) * r;
        const xRadius = Math.cos(latRad) * r;
        ctx.beginPath();
        ctx.ellipse(cx, y, xRadius, xRadius * 0.08, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Grid lines (longitude) - rotating
      for (let lng = 0; lng < 360; lng += 30) {
        const lngRad = ((lng + rot) * Math.PI) / 180;
        const x = Math.sin(lngRad) * r;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.lineWidth = 0.5;
        // Draw longitude as vertical ellipse
        ctx.ellipse(cx + x * 0.01, cy, Math.abs(Math.cos(lngRad)) * r * 0.98 + 1, r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Continental shapes (simplified polygons)
      const drawContinent = (points: [number, number][], color: string) => {
        ctx.beginPath();
        let first = true;
        for (const [lat, lng] of points) {
          const latRad = (lat * Math.PI) / 180;
          const lngRad = ((lng + rot) * Math.PI) / 180;
          const cosLat = Math.cos(latRad);
          const x3d = cosLat * Math.sin(lngRad);
          const z3d = cosLat * Math.cos(lngRad);
          if (z3d < -0.1) continue; // back face culling
          const px = cx + x3d * r;
          const py = cy - Math.sin(latRad) * r;
          if (first) { ctx.moveTo(px, py); first = false; }
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      };

      // Simplified continent outlines
      // North America
      drawContinent([
        [50, -130], [55, -120], [60, -110], [55, -95], [50, -85],
        [45, -75], [35, -80], [30, -85], [25, -100], [20, -105],
        [30, -120], [40, -130]
      ], 'rgba(16, 185, 129, 0.15)');

      // South America
      drawContinent([
        [10, -75], [5, -80], [0, -80], [-5, -75], [-15, -65],
        [-25, -55], [-35, -60], [-45, -70], [-55, -70], [-50, -65],
        [-30, -50], [-15, -45], [-5, -50], [0, -60], [5, -70]
      ], 'rgba(16, 185, 129, 0.12)');

      // Europe
      drawContinent([
        [60, -10], [65, 15], [60, 30], [55, 35], [50, 30],
        [45, 25], [38, 25], [35, 15], [37, 0], [42, -5],
        [48, -5], [52, 5], [55, 10]
      ], 'rgba(99, 102, 241, 0.18)');

      // Africa
      drawContinent([
        [35, -10], [35, 30], [25, 35], [15, 40], [10, 45],
        [0, 42], [-10, 38], [-25, 30], [-35, 20], [-30, 15],
        [-15, 12], [0, -5], [10, -15], [20, -17], [30, -10]
      ], 'rgba(245, 158, 11, 0.12)');

      // Asia
      drawContinent([
        [55, 35], [60, 50], [65, 70], [70, 90], [65, 110],
        [55, 130], [45, 140], [35, 130], [25, 120], [20, 105],
        [10, 100], [20, 75], [25, 65], [30, 50], [40, 45]
      ], 'rgba(239, 68, 68, 0.1)');

      // Australia
      drawContinent([
        [-15, 130], [-20, 140], [-25, 150], [-35, 150],
        [-35, 140], [-30, 130], [-25, 115], [-20, 115]
      ], 'rgba(168, 85, 247, 0.12)');

      // Draw user location pin if available
      if (userLat !== undefined && userLng !== undefined) {
        const latRad = (userLat * Math.PI) / 180;
        const lngRad = ((userLng + rot) * Math.PI) / 180;
        const cosLat = Math.cos(latRad);
        const z3d = cosLat * Math.cos(lngRad);
        if (z3d > 0) {
          const px = cx + cosLat * Math.sin(lngRad) * r;
          const py = cy - Math.sin(latRad) * r;
          // Glowing dot
          const dotGrad = ctx.createRadialGradient(px, py, 0, px, py, 12);
          dotGrad.addColorStop(0, 'rgba(6, 182, 212, 1)');
          dotGrad.addColorStop(0.4, 'rgba(6, 182, 212, 0.5)');
          dotGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          ctx.fillStyle = dotGrad;
          ctx.fillRect(px - 12, py - 12, 24, 24);
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#06b6d4';
          ctx.fill();
        }
      }

      // Scatter glow dots for cities
      const cityCoords: [number, number, string][] = [
        [40.7, -74, 'New York'], [51.5, -0.1, 'London'], [35.7, 139.7, 'Tokyo'], [-33.9, 151.2, 'Sydney'], [28.6, 77.2, 'Delhi'],
        [55.8, 37.6, 'Moscow'], [-23.6, -46.6, 'Sao Paulo'], [31.2, 121.5, 'Shanghai'], [39.9, 116.4, 'Beijing'], [48.9, 2.3, 'Paris'],
        [19.4, -99.1, 'Mexico City'], [-1.3, 36.8, 'Nairobi'], [37.6, 127, 'Seoul'], [1.3, 103.8, 'Singapore'], [13.8, 100.5, 'Bangkok']
      ];
      
      let hoveredCity: string | null = null;
      let hoverX = 0;
      let hoverY = 0;

      for (const [clat, clng, cname] of cityCoords) {
        const latRad = (clat * Math.PI) / 180;
        const lngRad = ((clng + rot) * Math.PI) / 180;
        const cosLat = Math.cos(latRad);
        const z3d = cosLat * Math.cos(lngRad);
        
        if (z3d > -0.2) {
          const px = cx + cosLat * Math.sin(lngRad) * r;
          const py = cy - Math.sin(latRad) * r;
          
          let isHovered = false;
          if (mousePos && Math.hypot(px - mousePos.x, py - mousePos.y) < 15) {
            isHovered = true;
            hoveredCity = cname;
            hoverX = px;
            hoverY = py;
          }

          ctx.beginPath();
          ctx.arc(px, py, isHovered ? 4 : 2, 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? '#fff' : `rgba(16, 185, 129, ${0.4 + z3d * 0.6})`;
          ctx.fill();
        }
      }

      // Draw hover tooltip
      if (hoveredCity) {
        ctx.fillStyle = 'rgba(2, 8, 23, 0.85)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(hoverX + 10, hoverY - 15, ctx.measureText(hoveredCity).width + 16, 22, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#06b6d4';
        ctx.font = '10px monospace';
        ctx.fillText(hoveredCity, hoverX + 18, hoverY - 1);
      }

      ctx.restore();

      // Specular highlight
      const specGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, 0, cx - r * 0.25, cy - r * 0.3, r * 0.6);
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = specGrad;
      ctx.fill();

      rotationRef.current += 0.15;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [userLat, userLng, mousePos]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full cursor-crosshair"
      onMouseMove={(e) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
      }}
      onMouseLeave={() => setMousePos(null)}
    />
  );
};

// ─── Operator Login Modal ──────────────────────────────────────────────────
const OperatorLoginModal: React.FC<{ isOpen: boolean; onClose: () => void; onLogin: (name: string) => void }> = ({ isOpen, onClose, onLogin }) => {
  const [opName, setOpName] = useState('');
  const [opPass, setOpPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName.trim()) { setError('Operator callsign required'); return; }
    if (opPass.length < 4) { setError('Passkey must be 4+ characters'); return; }
    onLogin(opName.trim());
    setOpName('');
    setOpPass('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel p-6 rounded-2xl w-[400px] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center"
      >
        <div className="flex items-center justify-between w-full mb-6">
          <div className="flex items-center gap-2 text-cyan-400">
            <Lock className="w-5 h-5" />
            <h3 className="font-mono text-xs font-bold tracking-widest uppercase">Operator Login</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div>
            <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Operator Callsign</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                value={opName}
                onChange={(e) => { setOpName(e.target.value); setError(''); }}
                placeholder="e.g. ALPHA-7"
                className="w-full bg-slate-900 border border-white/10 text-cyan-200 text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Passkey</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type={showPass ? 'text' : 'password'}
                value={opPass}
                onChange={(e) => { setOpPass(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-white/10 text-cyan-200 text-xs rounded-lg pl-8 pr-9 py-2 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer">
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {error && <p className="text-[10px] font-mono text-rose-400">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500/80 to-indigo-600/80 hover:from-cyan-500 hover:to-indigo-600 text-white text-xs font-mono font-bold tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.15)] transition-all cursor-pointer"
          >
            AUTHENTICATE OPERATOR
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Globe Component ──────────────────────────────────────────────────
export const Globe: React.FC = () => {
  const { 
    cities, 
    selectedCity, 
    setSelectedCityName, 
    addCustomLocation,
    loadRegionalGrid,
    setActivePage,
    unitSystem 
  } = useWeather();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const sweepCircleRef = useRef<L.Circle | null>(null);

  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [radarLayerType, setRadarLayerType] = useState<'clouds' | 'precipitation' | 'temp' | 'wind' | 'none'>('clouds');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM INITIALIZED] GIS Core loaded.",
    "[ATMOSPHERIC FEED] Standing by for telemetry synchronization..."
  ]);
  const [geolocating, setGeolocating] = useState(false);
  const [nearbyNodes, setNearbyNodes] = useState<NearbyNode[]>([]);
  const [activeTab, setActiveTab] = useState<'stations' | 'nearby' | 'layers'>('stations');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showOperatorLogin, setShowOperatorLogin] = useState(false);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [forecastDate, setForecastDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [forecastMode, setForecastMode] = useState<'live' | 'past' | 'future'>('live');
  const [forecastData, setForecastData] = useState<any>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('India');

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 30));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const defaultCenter: [number, number] = selectedCity
      ? [selectedCity.coordinates[1], selectedCity.coordinates[0]]
      : [20, 0];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 3,
      zoomControl: true,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    addLog(`GIS Grid Map rendered. Global overview active.`);

    return () => {
      map.remove();
      if (document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    cities.forEach(city => {
      const [lon, lat] = city.coordinates;
      const isSelected = city.name === selectedCity?.name;
      const hasAlert = city.alerts.length > 0;

      let markerClass = 'custom-station-marker';
      if (isSelected) markerClass += ' custom-station-marker-active';
      if (hasAlert) markerClass += ' custom-station-marker-alert';

      const customIcon = L.divIcon({
        className: markerClass,
        html: `<div class="station-dot"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const weatherDesc = `
        <div style="min-width: 180px;">
          <h3 style="margin: 0 0 5px 0; color: #06b6d4; font-weight: bold; font-family: 'Space Grotesk', sans-serif;">
            ${city.name.toUpperCase()}
          </h3>
          <div style="border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 5px; padding-bottom: 3px; font-size: 9px; color: #64748b;">
            COORD: ${lat.toFixed(4)}, ${lon.toFixed(4)}
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>TEMP:</span>
            <strong style="color: #ffffff;">${city.temperature}${unitSystem === 'metric' ? '°C' : '°F'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>AQI:</span>
            <strong style="color: ${city.aqi > 100 ? '#f43f5e' : city.aqi > 50 ? '#f59e0b' : '#10b981'};">
              ${city.aqi} (${city.aqi > 100 ? 'Hazardous' : city.aqi > 50 ? 'Moderate' : 'Pristine'})
            </strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>HUMIDITY:</span>
            <strong>${city.humidity}%</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>CONDITION:</span>
            <strong>${city.condition}</strong>
          </div>
          ${city.alerts.length > 0 ? `
            <div style="margin-top: 5px; padding: 4px; background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.3); border-radius: 4px; color: #fda4af; font-size: 8px;">
              ALERT: ${city.alerts[0].type}
            </div>
          ` : ''}
          <button 
            id="popup-btn-${city.name.replace(/\s+/g, '-')}"
            style="width: 100%; margin-top: 8px; background: rgba(6, 182, 212, 0.2); border: 1px solid rgba(6, 182, 212, 0.4); border-radius: 6px; padding: 4px; font-family: monospace; font-size: 9px; color: #22d3ee; cursor: pointer; text-align: center; transition: all 0.2s;"
          >
            SELECT DECK STATION
          </button>
        </div>
      `;

      const marker = L.marker([lat, lon], { icon: customIcon })
        .bindPopup(weatherDesc)
        .addTo(markersGroup);

      marker.on('popupopen', () => {
        const btnId = `popup-btn-${city.name.replace(/\s+/g, '-')}`;
        const btn = document.getElementById(btnId);
        if (btn) {
          btn.onclick = () => {
            setSelectedCityName(city.name);
            addLog(`Active station set to ${city.name}. Dashboard synchronized.`);
            map.closePopup();
          };
        }
      });
    });
  }, [cities, selectedCity, unitSystem]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (radarLayerRef.current) {
      map.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    if (!apiKey || radarLayerType === 'none') {
      if (radarLayerType !== 'none') {
        addLog(`[WARNING] OpenWeatherMap API Key missing. Radar overlays unavailable.`);
      }
      return;
    }

    let layerCode = 'clouds_new';
    if (radarLayerType === 'precipitation') layerCode = 'precipitation_new';
    if (radarLayerType === 'temp') layerCode = 'temp_new';
    if (radarLayerType === 'wind') layerCode = 'wind_new';

    addLog(`Injecting radar tiles. Layer: [${radarLayerType.toUpperCase()}]`);

    const radarLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/${layerCode}/{z}/{x}/{y}.png?appid=${apiKey}`,
      { opacity: 0.65, maxZoom: 18 }
    ).addTo(map);

    radarLayerRef.current = radarLayer;
  }, [radarLayerType]);

  const handleLocate = () => {
    if (!("geolocation" in navigator)) {
      addLog(`[ERROR] Geolocation is not supported by your browser.`);
      return;
    }

    setGeolocating(true);
    addLog(`Initiating planetary coordinates sweep...`);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLatInput(latitude.toFixed(4));
        setLngInput(longitude.toFixed(4));
        setUserCoords({ lat: latitude, lng: longitude });

        addLog(`GPS lock acquired! Accuracy: ${accuracy.toFixed(0)}m | Coords: ${latitude.toFixed(4)}N, ${longitude.toFixed(4)}E`);

        const map = mapInstanceRef.current;
        if (map) {
          map.setView([latitude, longitude], 12, { animate: true, duration: 1.5 });

          if (sweepCircleRef.current) map.removeLayer(sweepCircleRef.current);
          const sweepCircle = L.circle([latitude, longitude], {
            radius: 50000,
            color: '#06b6d4',
            weight: 1,
            fillColor: '#06b6d4',
            fillOpacity: 0.05
          }).addTo(map);
          sweepCircleRef.current = sweepCircle;

          if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
          const userIcon = L.divIcon({
            className: 'custom-pulsar-marker',
            html: `<div class="pulsar-core"></div><div class="pulsar-ring"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          const userMarker = L.marker([latitude, longitude], { icon: userIcon })
            .bindPopup(`<div style="text-align: center; font-family: monospace;"><strong>YOUR LOCATION</strong><br/><span style="color:#06b6d4;">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</span><br/><span style="font-size:9px;color:#64748b;">Accuracy: ${accuracy.toFixed(0)}m</span></div>`)
            .addTo(map)
            .openPopup();
          userMarkerRef.current = userMarker;
        }

        try {
          const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
          if (apiKey) {
            const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData.length > 0) {
                const placeName = geoData[0].name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
                addLog(`Location identified: ${placeName}, ${geoData[0].country || ''}`);
                await addCustomLocation(placeName, latitude, longitude);
                addLog(`Station "${placeName}" synced to global telemetry.`);
              }
            }
          }
        } catch (err) {
          const localGridName = `Grid [${latitude.toFixed(2)}, ${longitude.toFixed(2)}]`;
          try {
            await addCustomLocation(localGridName, latitude, longitude);
          } catch (e) { /* ignore */ }
        }

        await performNearbyScan(latitude, longitude);
        setGeolocating(false);
      },
      (error) => {
        let msg = error.message;
        if (error.code === 1) msg = "Permission denied. Please allow location access in your browser settings.";
        else if (error.code === 2) msg = "Position unavailable. Check your device GPS/network.";
        else if (error.code === 3) msg = "Location request timed out. Try again.";
        addLog(`[ERROR] Geolocation failed: ${msg}`);
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const performNearbyScan = async (lat: number, lng: number) => {
    addLog(`Running bio-telemetry scan in 100KM sector radius...`);

    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    let baseTemp = 20, baseHumidity = 50, baseCond = "Clouds", baseAqi = 45;

    if (apiKey) {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`);
        if (res.ok) {
          const data = await res.json();
          baseTemp = Math.round(data.main.temp);
          baseHumidity = data.main.humidity;
          const conditionsMap: Record<string, string> = {
            Clear: 'Sunny', Clouds: 'Clouds', Rain: 'Rain', Drizzle: 'Rain', Thunderstorm: 'Thunderstorm', Mist: 'Fog', Haze: 'Fog'
          };
          baseCond = conditionsMap[data.weather[0]?.main] || 'Sunny';
          addLog(`Real-time weather telemetry retrieved for scan base.`);
        }
      } catch (e) {
        console.error("Failed to fetch coordinates weather:", e);
      }
    }

    const adjustedBaseTemp = unitSystem === 'imperial' ? Math.round(baseTemp * 1.8 + 32) : baseTemp;

    const nodes: NearbyNode[] = [
      { id: "probe-alfa", name: "Atmospheric Probe ALFA", lat: lat + 0.08 + (Math.random() * 0.05 - 0.025), lng: lng + 0.06 + (Math.random() * 0.05 - 0.025), distance: 12.4, temperature: adjustedBaseTemp + Math.round(Math.random() * 3 - 1.5), humidity: Math.min(100, Math.max(0, baseHumidity + Math.round(Math.random() * 10 - 5))), aqi: Math.min(300, Math.max(10, baseAqi + Math.round(Math.random() * 20 - 10))), condition: baseCond },
      { id: "probe-beta", name: "Soil Biosensor BETA", lat: lat - 0.09 + (Math.random() * 0.05 - 0.025), lng: lng + 0.12 + (Math.random() * 0.05 - 0.025), distance: 24.8, temperature: adjustedBaseTemp + Math.round(Math.random() * 3 - 1.5), humidity: Math.min(100, Math.max(0, baseHumidity + Math.round(Math.random() * 10 - 5))), aqi: Math.min(300, Math.max(10, baseAqi + Math.round(Math.random() * 20 - 10))), condition: baseCond },
      { id: "probe-gamma", name: "Hygro Grid GAMMA", lat: lat + 0.15 + (Math.random() * 0.05 - 0.025), lng: lng - 0.08 + (Math.random() * 0.05 - 0.025), distance: 38.2, temperature: adjustedBaseTemp + Math.round(Math.random() * 3 - 1.5), humidity: Math.min(100, Math.max(0, baseHumidity + Math.round(Math.random() * 10 - 5))), aqi: Math.min(300, Math.max(10, baseAqi + Math.round(Math.random() * 20 - 10))), condition: baseCond },
      { id: "probe-omega", name: "Micro-Climate OMEGA", lat: lat - 0.18 + (Math.random() * 0.05 - 0.025), lng: lng - 0.15 + (Math.random() * 0.05 - 0.025), distance: 48.9, temperature: adjustedBaseTemp + Math.round(Math.random() * 3 - 1.5), humidity: Math.min(100, Math.max(0, baseHumidity + Math.round(Math.random() * 10 - 5))), aqi: Math.min(300, Math.max(10, baseAqi + Math.round(Math.random() * 20 - 10))), condition: baseCond },
      { id: "probe-delta", name: "Wind Vector DELTA", lat: lat + 0.22 + (Math.random() * 0.05 - 0.025), lng: lng + 0.18 + (Math.random() * 0.05 - 0.025), distance: 55.3, temperature: adjustedBaseTemp + Math.round(Math.random() * 4 - 2), humidity: Math.min(100, Math.max(0, baseHumidity + Math.round(Math.random() * 12 - 6))), aqi: Math.min(300, Math.max(10, baseAqi + Math.round(Math.random() * 25 - 12))), condition: baseCond },
      { id: "probe-sigma", name: "Rainfall Gauge SIGMA", lat: lat - 0.25 + (Math.random() * 0.05 - 0.025), lng: lng + 0.22 + (Math.random() * 0.05 - 0.025), distance: 62.1, temperature: adjustedBaseTemp + Math.round(Math.random() * 4 - 2), humidity: Math.min(100, Math.max(0, baseHumidity + Math.round(Math.random() * 15 - 7))), aqi: Math.min(300, Math.max(10, baseAqi + Math.round(Math.random() * 30 - 15))), condition: baseCond },
    ];

    setNearbyNodes(nodes);
    setActiveTab('nearby');

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (map && markersGroup) {
      nodes.forEach(node => {
        const customIcon = L.divIcon({
          className: 'custom-station-marker',
          html: `<div class="station-dot" style="background-color: #10b981; box-shadow: 0 0 8px #10b981;"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5]
        });
        L.marker([node.lat, node.lng], { icon: customIcon })
          .bindPopup(`
            <div style="font-family: monospace; font-size: 10px;">
              <strong style="color: #10b981;">${node.name}</strong><br/>
              RANGE: ${node.distance} KM<br/>
              TEMP: ${node.temperature}${unitSystem === 'metric' ? '°C' : '°F'}<br/>
              AQI: ${node.aqi}<br/>
              STATUS: NOMINAL OPERATION
            </div>
          `)
          .addTo(markersGroup);
      });
    }

    addLog(`Sweep complete. Generated ${nodes.length} Intel Stations in geolocated sector.`);
  };

  const handleCoordsSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      addLog(`[ERROR] Invalid coordinates. Lat must be -90 to 90, Lng -180 to 180.`);
      return;
    }

    addLog(`Shifting scanner to coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}.`);
    setUserCoords({ lat, lng });

    const map = mapInstanceRef.current;
    if (map) {
      map.setView([lat, lng], 8, { animate: true, duration: 1.2 });

      if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
      const searchIcon = L.divIcon({
        className: 'custom-pulsar-marker',
        html: `<div class="pulsar-core" style="background-color:#c084fc; box-shadow:0 0 10px #c084fc;"></div><div class="pulsar-ring" style="border-color:#c084fc;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      const marker = L.marker([lat, lng], { icon: searchIcon })
        .bindPopup(`<div style="text-align: center; font-family: monospace;"><strong>GRID MANUAL POINT</strong><br/><span style="color:#c084fc;">${lat.toFixed(4)}, ${lng.toFixed(4)}</span></div>`)
        .addTo(map);
      userMarkerRef.current = marker;

      if (sweepCircleRef.current) map.removeLayer(sweepCircleRef.current);
      const sweepCircle = L.circle([lat, lng], {
        radius: 100000,
        color: '#c084fc',
        weight: 1,
        fillColor: '#c084fc',
        fillOpacity: 0.04
      }).addTo(map);
      sweepCircleRef.current = sweepCircle;
    }

    const localGridName = `Manual Grid [${lat.toFixed(2)}, ${lng.toFixed(2)}]`;
    try {
      await addCustomLocation(localGridName, lat, lng);
      addLog(`Custom station "${localGridName}" synced.`);
    } catch (err) {
      addLog(`[WARNING] Failed to sync: ${(err as Error).message}`);
    }

    await performNearbyScan(lat, lng);
  };

  const fetchForecastForDate = async (dateStr: string) => {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    if (!apiKey) {
      addLog(`[WARNING] API key missing. Cannot fetch forecast data.`);
      return;
    }

    const targetDate = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) setForecastMode('future');
    else if (diffDays < 0) setForecastMode('past');
    else setForecastMode('live');

    setLoadingForecast(true);
    addLog(`Fetching weather data for ${dateStr}...`);

    const lat = userCoords?.lat || selectedCity?.coordinates[1] || 20;
    const lng = userCoords?.lng || selectedCity?.coordinates[0] || 0;

    try {
      if (diffDays >= 0 && diffDays <= 5) {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=${unitSystem}&appid=${apiKey}`);
        if (res.ok) {
          const data = await res.json();
          const targetStr = dateStr;
          const dayForecasts = data.list.filter((item: any) => item.dt_txt.startsWith(targetStr));
          if (dayForecasts.length > 0) {
            const avg = {
              temp: Math.round(dayForecasts.reduce((s: number, i: any) => s + i.main.temp, 0) / dayForecasts.length),
              humidity: Math.round(dayForecasts.reduce((s: number, i: any) => s + i.main.humidity, 0) / dayForecasts.length),
              wind: Math.round(dayForecasts.reduce((s: number, i: any) => s + i.wind.speed, 0) / dayForecasts.length * 10) / 10,
              condition: dayForecasts[Math.floor(dayForecasts.length / 2)].weather[0].main,
              description: dayForecasts[Math.floor(dayForecasts.length / 2)].weather[0].description,
              pressure: Math.round(dayForecasts.reduce((s: number, i: any) => s + i.main.pressure, 0) / dayForecasts.length),
              entries: dayForecasts.length
            };
            setForecastData(avg);
            addLog(`Forecast retrieved: ${avg.temp}${unitSystem === 'metric' ? '°C' : '°F'}, ${avg.condition}`);
          } else {
            setForecastData({ temp: '--', humidity: '--', wind: '--', condition: 'No data for this date', description: 'Out of forecast range', pressure: '--', entries: 0 });
            addLog(`[WARNING] No forecast entries found for ${dateStr}.`);
          }
        }
      } else if (diffDays < 0 && diffDays >= -5) {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=${unitSystem}&appid=${apiKey}`);
        if (res.ok) {
          const data = await res.json();
          setForecastData({
            temp: Math.round(data.main.temp + diffDays * 0.5),
            humidity: data.main.humidity,
            wind: data.wind.speed,
            condition: data.weather[0].main,
            description: `Historical estimate (${Math.abs(diffDays)}d ago)`,
            pressure: data.main.pressure,
            entries: 1
          });
          addLog(`Historical estimate generated for ${dateStr}.`);
        }
      } else {
        setForecastData({
          temp: '--',
          humidity: '--',
          wind: '--',
          condition: diffDays > 5 ? 'Beyond forecast range' : 'Historical data unavailable',
          description: diffDays > 5 ? 'Max 5-day forecast available' : 'Only 5-day history available',
          pressure: '--',
          entries: 0
        });
        addLog(`[WARNING] Date ${dateStr} is outside available data range.`);
      }
    } catch (err) {
      addLog(`[ERROR] Failed to fetch forecast: ${(err as Error).message}`);
    }

    setLoadingForecast(false);
  };

  const handleNodeFocus = (lat: number, lng: number, name: string) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setView([lat, lng], 11, { animate: true, duration: 0.8 });
      addLog(`Focusing on ${name}.`);
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(forecastDate);
    d.setDate(d.getDate() + days);
    const newDateStr = d.toISOString().split('T')[0];
    setForecastDate(newDateStr);
    fetchForecastForDate(newDateStr);
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto h-[calc(100vh-80px)] overflow-hidden flex flex-col select-none relative">

      {/* Global Close Button */}
      <button 
        onClick={() => setActivePage('dashboard')}
        className="absolute top-4 right-4 z-40 p-2 rounded-xl bg-slate-950/80 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-gray-400 transition-all cursor-pointer shadow-lg"
      >
        <X className="w-5 h-5" />
      </button>

      {/* ─── Top: Globe + Forecast Panel ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[200px] shrink-0">

        {/* 3D Globe Visual */}
        <div className="lg:col-span-3 glass-panel rounded-2xl overflow-hidden relative group">
          <CanvasGlobe userLat={userCoords?.lat} userLng={userCoords?.lng} />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="text-[8px] font-mono text-cyan-400/70 bg-slate-950/80 px-2 py-0.5 rounded-full">REAL-TIME GLOBE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
        </div>

        {/* Forecast Date Picker Panel */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">TEMPORAL FORECAST ENGINE</span>
            </div>
            <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full ${forecastMode === 'past' ? 'bg-amber-500/20 text-amber-400' : forecastMode === 'future' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {forecastMode.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => shiftDate(-1)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <input
              type="date"
              value={forecastDate}
              onChange={(e) => { setForecastDate(e.target.value); fetchForecastForDate(e.target.value); }}
              className="flex-1 bg-slate-900 border border-white/10 text-cyan-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400 font-mono text-center"
            />
            <button onClick={() => shiftDate(1)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>

          {forecastData && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div className="text-center p-1.5 rounded-lg bg-white/5">
                <span className="text-[8px] font-mono text-gray-500 block">TEMP</span>
                <span className="text-sm font-mono text-cyan-300 font-bold">{forecastData.temp}{typeof forecastData.temp === 'number' ? (unitSystem === 'metric' ? '°C' : '°F') : ''}</span>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-white/5">
                <span className="text-[8px] font-mono text-gray-500 block">HUMID</span>
                <span className="text-sm font-mono text-blue-300 font-bold">{forecastData.humidity}{typeof forecastData.humidity === 'number' ? '%' : ''}</span>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-white/5">
                <span className="text-[8px] font-mono text-gray-500 block">WIND</span>
                <span className="text-sm font-mono text-indigo-300 font-bold">{forecastData.wind}{typeof forecastData.wind === 'number' ? (unitSystem === 'metric' ? 'm/s' : 'mph') : ''}</span>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-white/5">
                <span className="text-[8px] font-mono text-gray-500 block">STATUS</span>
                <span className="text-[10px] font-mono text-emerald-300 font-bold">{forecastData.condition}</span>
              </div>
            </div>
          )}
          {loadingForecast && <div className="text-center text-[9px] font-mono text-cyan-400 animate-pulse mt-1">FETCHING TEMPORAL DATA...</div>}
        </div>

        {/* Operator Panel */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">OPERATOR STATUS</span>
            </div>
          </div>

          {operatorName ? (
            <div className="flex-1 flex flex-col justify-center items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 border border-cyan-500/30 flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-300" />
              </div>
              <span className="text-sm font-mono text-cyan-200 font-bold">{operatorName}</span>
              <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">● AUTHENTICATED</span>
              <button
                onClick={() => { setOperatorName(null); addLog('Operator logged out.'); }}
                className="text-[9px] font-mono text-gray-500 hover:text-rose-400 mt-1 cursor-pointer transition-colors"
              >
                DISCONNECT SESSION
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
              <span className="text-[10px] font-mono text-gray-500">NO OPERATOR SESSION</span>
              <button
                onClick={() => setShowOperatorLogin(true)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/80 to-indigo-600/80 hover:from-cyan-500 hover:to-indigo-600 text-[10px] font-mono font-bold tracking-wider text-white shadow-[0_0_12px_rgba(6,182,212,0.15)] cursor-pointer transition-all"
              >
                OPERATOR LOGIN
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-[8px] font-mono text-gray-600 mt-2 pt-2 border-t border-white/5">
            <span>STATIONS: {cities.length}</span>
            <span>PROBES: {nearbyNodes.length}</span>
            <span>LAT: {userCoords ? userCoords.lat.toFixed(2) : '--'}</span>
          </div>
        </div>
      </div>

      {/* ─── Main: Map + Controls ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">

        {/* Left Control Panel */}
        <div className="lg:col-span-3 glass-panel rounded-2xl flex flex-col justify-between p-4 overflow-hidden min-h-[300px]">
          <div className="flex flex-col gap-3 flex-1 min-h-0">

            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">GIS INTERACTIVE PORT</span>
                <h3 className="text-sm font-medium text-cyan-200">TACTICAL SCANNER</h3>
              </div>
            </div>

            {/* Locate Me */}
            <button
              onClick={handleLocate}
              disabled={geolocating}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500/80 to-indigo-600/80 hover:from-cyan-500 hover:to-indigo-600 border border-cyan-400/20 text-[10px] font-mono font-medium tracking-wider text-white shadow-[0_0_12px_rgba(6,182,212,0.15)] disabled:opacity-50 transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 animate-pulse" />
              {geolocating ? "ACQUIRING GPS..." : "LOCATE ME"}
            </button>

            {/* Manual Search */}
            <form onSubmit={handleCoordsSearch} className="space-y-2 p-3 rounded-xl bg-slate-950/40 border border-white/5">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">SEARCH GLOBAL GRID</span>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Lat" value={latInput} onChange={(e) => setLatInput(e.target.value)} className="w-full bg-slate-900 border border-white/10 text-cyan-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 font-mono" />
                <input type="text" placeholder="Lng" value={lngInput} onChange={(e) => setLngInput(e.target.value)} className="w-full bg-slate-900 border border-white/10 text-cyan-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 font-mono" />
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] font-mono font-bold tracking-widest text-cyan-300 transition-all cursor-pointer">
                <Search className="w-3 h-3" />
                SEARCH GRID
              </button>
            </form>

            {/* Regional Search */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-950/40 border border-white/5">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">REGIONAL GRID SYNC</span>
              <div className="flex gap-2">
                <select 
                  value={selectedRegion} 
                  onChange={(e) => setSelectedRegion(e.target.value)} 
                  className="flex-1 bg-slate-900 border border-white/10 text-cyan-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="India">India</option>
                  <option value="USA">United States</option>
                  <option value="Europe">Europe</option>
                </select>
                <button 
                  onClick={() => { loadRegionalGrid(selectedRegion); addLog(`Injecting ${selectedRegion} regional macro-grid...`); }}
                  className="px-3 rounded-lg bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/40 text-[9px] font-mono font-bold tracking-widest text-indigo-300 transition-all cursor-pointer"
                >
                  LOAD
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 pb-1">
              {(['stations', 'nearby', 'layers'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1 text-center font-mono text-[9px] uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === tab ? 'text-cyan-400 border-cyan-400 font-bold' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 text-xs">
              <AnimatePresence mode="wait">
                {activeTab === 'stations' && (
                  <motion.div key="stations" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-1.5">
                    {cities.map(city => (
                      <button key={city.name} onClick={() => handleNodeFocus(city.coordinates[1], city.coordinates[0], city.name)} className={`w-full p-2 rounded-xl border text-left font-mono flex items-center justify-between cursor-pointer transition-all hover:bg-white/5 ${selectedCity?.name === city.name ? 'bg-cyan-500/10 border-cyan-500/30' : city.alerts.length > 0 ? 'bg-rose-500/5 border-rose-500/15' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-bold text-[11px] ${selectedCity?.name === city.name ? 'text-cyan-300' : 'text-gray-300'}`}>{city.name}</span>
                          <span className="text-[8px] text-gray-500">{city.coordinates[1].toFixed(2)}N, {city.coordinates[0].toFixed(2)}E</span>
                        </div>
                        <div className="text-right flex flex-col gap-0.5">
                          <span className="font-bold text-cyan-200 text-[11px]">{city.temperature}{unitSystem === 'metric' ? '°C' : '°F'}</span>
                          <span className={`text-[8px] font-bold ${city.aqi > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>AQI {city.aqi}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
                {activeTab === 'nearby' && (
                  <motion.div key="nearby" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-1.5">
                    {nearbyNodes.length > 0 ? nearbyNodes.map(node => (
                      <button key={node.id} onClick={() => handleNodeFocus(node.lat, node.lng, node.name)} className="w-full p-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 text-left font-mono flex items-center justify-between cursor-pointer hover:bg-emerald-500/10 transition-all">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-emerald-300 flex items-center gap-1 text-[11px]">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                            {node.name.split(' ').slice(2).join(' ')}
                          </span>
                          <span className="text-[8px] text-gray-500">RANGE: {node.distance.toFixed(1)} KM</span>
                        </div>
                        <div className="text-right flex flex-col gap-0.5">
                          <span className="font-bold text-emerald-200 text-[11px]">{node.temperature}{unitSystem === 'metric' ? '°C' : '°F'}</span>
                          <span className="text-[8px] text-emerald-400">HUMID: {node.humidity}%</span>
                        </div>
                      </button>
                    )) : (
                      <div className="p-6 text-center text-gray-500 font-mono text-[10px]">
                        NO INTEL STATIONS LOADED.<br />CLICK "LOCATE ME" TO DEPLOY PROBES.
                      </div>
                    )}
                  </motion.div>
                )}
                {activeTab === 'layers' && (
                  <motion.div key="layers" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-1.5">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">ATMOSPHERIC OVERLAYS</span>
                    {[
                      { id: 'clouds', name: 'Cloud Radar' },
                      { id: 'precipitation', name: 'Storm Vectors' },
                      { id: 'temp', name: 'Thermal Map' },
                      { id: 'wind', name: 'Wind Grids' },
                      { id: 'none', name: 'Standby (Off)' }
                    ].map(layer => (
                      <button key={layer.id} onClick={() => setRadarLayerType(layer.id as any)} className={`w-full p-2 rounded-xl border text-left font-mono flex items-center justify-between cursor-pointer transition-all hover:bg-white/5 ${radarLayerType === layer.id ? 'bg-cyan-500/10 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                        <span className="text-[11px] font-medium">{layer.name}</span>
                        {radarLayerType === layer.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Terminal */}
          <div className="border-t border-white/5 pt-2 mt-3 h-20 flex flex-col">
            <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 mb-1">
              <span className="flex items-center gap-1"><Terminal className="w-3 h-3 text-cyan-400" />TERMINAL</span>
              <span className="text-[7px] bg-white/5 px-1 py-0.5 rounded text-cyan-400 animate-pulse">ONLINE</span>
            </div>
            <div className="flex-1 bg-black/40 rounded-lg p-1.5 font-mono text-[8px] overflow-y-auto space-y-0.5 border border-white/5 select-text">
              {terminalLogs.map((log, index) => (
                <div key={index} className={log.includes('[ERROR]') ? 'text-rose-400' : log.includes('[WARNING]') ? 'text-amber-400' : 'text-cyan-400/80'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Leaflet Map */}
        <div className="lg:col-span-9 glass-panel rounded-2xl p-3 flex flex-col relative overflow-hidden bg-slate-950/20 shadow-2xl">
          <div className="absolute top-5 left-5 flex items-center gap-2 z-10 pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono text-cyan-200 bg-slate-950/80 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
              GLOBAL GIS GRID VIEW
            </span>
          </div>
          <div className="absolute top-5 right-5 text-[9px] font-mono text-gray-400 bg-slate-950/80 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-md z-10 pointer-events-none uppercase">
            LAYER: {radarLayerType.toUpperCase()}
          </div>
          <div ref={mapContainerRef} className="w-full h-full min-h-[350px] lg:min-h-0 border border-white/5 rounded-xl overflow-hidden" />
        </div>
      </div>

      {/* Operator Login Modal */}
      <AnimatePresence>
        {showOperatorLogin && (
          <OperatorLoginModal
            isOpen={showOperatorLogin}
            onClose={() => setShowOperatorLogin(false)}
            onLogin={(name) => {
              setOperatorName(name);
              setShowOperatorLogin(false);
              addLog(`Operator ${name} authenticated successfully.`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
