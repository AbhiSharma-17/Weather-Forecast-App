import React, { useEffect, useRef } from 'react';
import { useWeather } from '../context/WeatherContext';
import { ShieldAlert, AlertOctagon, Waves, Flame, CloudLightning, Activity, Radio, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const Disaster: React.FC = () => {
  const { cities, selectedCity, isLoading, setActivePage } = useWeather();
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas radar sweep simulator
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = 300);
    let angle = 0;

    // Set positions for warning blips based on coordinates
    const blips = [
      { x: width * 0.3, y: height * 0.4, size: 4, label: "Mumbai Hub", color: '#f43f5e', alpha: 1 },
      { x: width * 0.7, y: height * 0.25, size: 3, label: "NY Sector 7", color: '#f59e0b', alpha: 0.8 },
      { x: width * 0.8, y: height * 0.8, size: 5, label: "Sydney Grid", color: '#f43f5e', alpha: 1 },
      { x: width * 0.5, y: height * 0.5, size: 3, label: "HQ (Neo-Tokyo)", color: '#06b6d4', alpha: 0.5 },
      { x: width * 0.2, y: height * 0.7, size: 4, label: "London Aegis", color: '#10b981', alpha: 0.9 },
      { x: width * 0.6, y: height * 0.9, size: 3, label: "Cape Town Beta", color: '#f59e0b', alpha: 0.6 },
      { x: width * 0.85, y: height * 0.3, size: 4, label: "Seoul Prime", color: '#3b82f6', alpha: 0.7 },
      { x: width * 0.4, y: height * 0.15, size: 3, label: "Berlin Omega", color: '#f43f5e', alpha: 0.8 },
      { x: width * 0.15, y: height * 0.2, size: 5, label: "SF Node X", color: '#10b981', alpha: 0.85 },
      { x: width * 0.45, y: height * 0.75, size: 4, label: "Cairo Apex", color: '#f59e0b', alpha: 0.6 }
    ];

    const resize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || 300;
      height = canvas.height = 300;
    };
    window.addEventListener('resize', resize);

    const drawRadar = () => {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.15)'; // trails
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2.2;

      // Draw radar background circles
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Draw rotating sweep line
      const sweepX = centerX + radius * Math.cos(angle);
      const sweepY = centerY + radius * Math.sin(angle);
      
      const sweepGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
      sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // Draw blips
      blips.forEach(b => {
        // Calculate distance and angle relative to radar sweep
        const dx = b.x - centerX;
        const dy = b.y - centerY;
        const bAngle = Math.atan2(dy, dx);
        
        // Match angle with sweep line for pulsing intensity
        let diff = Math.abs(angle - bAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (diff < 0.2) {
          b.alpha = 1.0; // hit by radar sweep!
        } else {
          b.alpha = Math.max(0.15, b.alpha * 0.98); // decay fade
        }

        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
        ctx.font = '8px monospace';
        ctx.fillText(b.label, b.x + 8, b.y + 2);
      });

      angle += 0.012;
      if (angle > Math.PI * 2) angle = 0;

      animId = requestAnimationFrame(drawRadar);
    };

    drawRadar();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  if (isLoading || !selectedCity) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-rose-500 border-r-transparent border-white/10 animate-spin" />
          <span className="font-mono text-rose-500 text-xs tracking-widest animate-pulse">SYNCHRONIZING RADAR DOMAIN...</span>
        </div>
      </div>
    );
  }

  // Compile all alerts across all cities
  const allAlerts = cities.flatMap(c => c.alerts.map(a => ({ ...a, cityName: c.name })));

  const riskData = [
    { name: "FLOOD HAZARD", value: selectedCity.disasterRisk.flood, color: "bg-blue-500", icon: Waves },
    { name: "THERMAL HEATWAVE", value: selectedCity.disasterRisk.heatwave, color: "bg-amber-600", icon: Flame },
    { name: "CYCLONIC PRESSURE", value: selectedCity.disasterRisk.cyclone, color: "bg-indigo-600", icon: CloudLightning },
    { name: "TSUNAMI SEISMICITY", value: selectedCity.disasterRisk.tsunami, color: "bg-cyan-600", icon: Waves }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none relative">
      
      {/* Global Close Button */}
      <button 
        onClick={() => setActivePage('dashboard')}
        className="absolute top-6 right-6 z-50 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-gray-400 transition-all cursor-pointer shadow-lg"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Upper Status indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Emergency Alert Panel */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">EMERGENCY TELEMETRY</span>
                <h3 className="text-base font-display font-medium text-cyan-200">ACTIVE HAZARD FEEDS</h3>
              </div>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {allAlerts.length > 0 ? (
                allAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex gap-3 relative overflow-hidden ${
                      alert.level === 'Critical'
                        ? 'bg-rose-500/5 border-rose-500/30 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                        : 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-1 rounded bg-white/5 border border-white/10 h-fit">
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="flex-1 text-xs font-mono">
                      <div className="flex items-center justify-between font-bold">
                        <span className="uppercase">{alert.type} ({alert.level})</span>
                        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-400 uppercase tracking-widest">{alert.cityName}</span>
                      </div>
                      <p className="text-gray-300 mt-2 font-sans font-light leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 rounded-xl border border-white/5 bg-slate-900/10 text-center font-mono text-xs text-gray-500">
                  NO CRITICAL WEATHER ANOMALIES RECORDED ON GLOBAL CORE SENSORS.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-t border-white/5 pt-4 mt-6 font-mono text-[9px] text-gray-500">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>GLOBAL BROADCAST SHIELD NODES ONLINE</span>
          </div>
        </div>

        {/* Canvas Sweep Radar Panel */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between items-center bg-slate-950/20">
          <div className="w-full flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">GIS SCANNER</span>
              <h3 className="text-sm font-display font-medium text-cyan-200">ACTIVE SWEEP RADAR</h3>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          <div className="w-full flex justify-center border border-white/5 rounded-2xl p-2 bg-slate-950/40 relative">
            <canvas ref={radarCanvasRef} className="w-full h-[220px]" />
          </div>

          <span className="text-[9px] font-mono text-gray-500 mt-3 block uppercase tracking-wider">
            RADAR SWEEP RADIUS // 500KM SECTORS
          </span>
        </div>
      </div>

      {/* Middle Risks gauges panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {riskData.map((risk, index) => {
          const Icon = risk.icon;
          const isDanger = risk.value > 60;
          return (
            <div key={index} className="glass-panel p-5 rounded-2xl flex flex-col justify-between group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-gray-500 tracking-wider uppercase font-bold">{risk.name}</span>
                <Icon className={`w-4.5 h-4.5 ${isDanger ? 'text-rose-400 animate-bounce' : 'text-cyan-400'}`} />
              </div>
              
              <div className="my-3 flex items-baseline gap-1">
                <span className={`text-4xl font-display font-bold ${isDanger ? 'text-rose-400 text-glow-rose' : 'text-cyan-200'}`}>
                  {risk.value}%
                </span>
                <span className="text-[10px] font-mono text-gray-500 uppercase">PROBABILITY</span>
              </div>

              {/* Progress gauge bar */}
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className={`h-full ${isDanger ? 'bg-rose-500' : 'bg-cyan-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${risk.value}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>

              <div className="text-[9px] font-mono text-gray-500 mt-3 uppercase flex items-center justify-between">
                <span>STATION TELEMETRY:</span>
                <span className={isDanger ? 'text-rose-400 font-bold' : 'text-gray-400'}>
                  {isDanger ? 'WARN_EXCEEDED' : 'NOMINAL'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Municipal Defense Guidelines */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-display font-medium text-rose-200">MUNICIPAL SHIELD COORDINATOR</h4>
            <p className="text-xs font-sans text-gray-400 font-light mt-0.5">
              Current safety index stands at {selectedCity.disasterRisk.flood > 70 ? 'Level D (Extreme alert)' : 'Level A (Stable)'}. Deploy smart shield protocol accordingly.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => {
              const manifestData = JSON.stringify({
                city: selectedCity.name,
                coordinates: selectedCity.coordinates,
                riskProfile: selectedCity.disasterRisk,
                shieldStatus: selectedCity.disasterRisk.flood > 70 ? 'ENGAGED' : 'STANDBY',
                timestamp: new Date().toISOString(),
                protocol: 'DEF-7X',
                authKey: 'SCV-901X-ALPHA'
              }, null, 2);
              const blob = new Blob([manifestData], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `SHIELD_MANIFEST_${selectedCity.name.replace(' ', '_').toUpperCase()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-mono text-[10px] text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            DOWNLOAD DEFENSE MANIFEST
          </button>
          <button 
            onClick={(e) => {
              const btn = e.currentTarget;
              btn.innerHTML = 'SHIELDS ENGAGED!';
              btn.classList.add('bg-rose-500', 'text-white');
              btn.classList.remove('bg-rose-500/10', 'text-rose-300');
              setTimeout(() => {
                btn.innerHTML = 'ENGAGE BARRIER SHIELDS';
                btn.classList.remove('bg-rose-500', 'text-white');
                btn.classList.add('bg-rose-500/10', 'text-rose-300');
              }, 3000);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 font-mono text-[10px] text-rose-300 transition-all cursor-pointer"
          >
            ENGAGE BARRIER SHIELDS
          </button>
        </div>
      </div>

    </div>
  );
};
