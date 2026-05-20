import React from 'react';
import { useWeather } from '../context/WeatherContext';
import { Globe3D } from '../components/Globe3D';
import { Radio, Database, Cpu, ChevronRight, Activity, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export const Landing: React.FC = () => {
  const { setActivePage, cities } = useWeather();

  const activeAlerts = cities.reduce((acc, c) => acc + c.alerts.length, 0);

  const stats = [
    { label: "Active Orbitals", value: "8 / 8", color: "text-cyan-400", icon: Radio },
    { label: "Data Telemetry Rate", value: "48.2 GB/s", color: "text-cyan-400", icon: Database },
    { label: "Core Processing Nodes", value: "16", color: "text-indigo-400", icon: Cpu },
    { label: "Hazard Alert Zones", value: activeAlerts.toString(), color: activeAlerts > 0 ? "text-rose-400 text-glow-rose animate-pulse" : "text-emerald-400", icon: Activity }
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex flex-col justify-between py-6 px-4 md:px-8 relative overflow-hidden select-none">
      
      {/* Decorative ambient gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Section: Title & Mission Description */}
      <div className="max-w-4xl mx-auto text-center mt-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] uppercase font-mono tracking-widest text-cyan-300">
            Next-Generation Weather Intelligence & Climate Analytics
          </span>
        </motion.div>
        
        <motion.h1 
          className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight mt-4 text-glow-cyan bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 leading-none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          CLIMATEVISION
        </motion.h1>

        <motion.p 
          className="text-sm sm:text-base text-gray-400 font-light mt-4 max-w-2xl mx-auto font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          An advanced diagnostic telemetry environment utilizing orbital sensor clusters, time-series machine learning models, and bio-environmental mapping to forecast weather patterns, monitor disaster alerts, and secure global agricultural grids.
        </motion.p>
      </div>

      {/* Middle Section: 3D Globe + HUD Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-center max-w-7xl mx-auto w-full z-10">
        
        {/* Left Side: System Telemetry HUD */}
        <motion.div 
          className="lg:col-span-3 space-y-4"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500" />
            <div className="flex items-center gap-2 text-cyan-400 mb-2 font-mono text-xs">
              <Terminal className="w-4 h-4" />
              <span>DIAGNOSTICS GRID</span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
              Orbital scanner clusters are online. Synoptic mapping shows active low pressure vectors in coastal zones. Real-time neural network model double smoothing active.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">
              FARMING GRID COGNITION
            </span>
            <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
              Soil moisture probes linked. Direct agricultural advisories generating on current precipitation thresholds. Cyber-Wheat and Hydro-Rice vectors mapped.
            </p>
          </div>
        </motion.div>

        {/* Center: The Globe Container */}
        <motion.div 
          className="lg:col-span-6 glass-panel rounded-3xl border border-white/10 p-4 relative bg-slate-950/20 shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono text-cyan-400 tracking-wider">
              INTERACTIVE PLANETARY MAP
            </span>
          </div>

          <div className="absolute top-4 right-4 text-[9px] font-mono text-gray-500">
            DRAG TO ROTATE GLOBE
          </div>

          {/* Render the 3D globe component */}
          <Globe3D />
        </motion.div>

        {/* Right Side: Environment HUD */}
        <motion.div 
          className="lg:col-span-3 space-y-4"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">
              BIO-METRIC SCANNER
            </span>
            <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
              Air Quality Index (AQI) thresholds audited. Current readings verify nominal atmospheric values across European biospsheres, particulate warning active in Eastern hubs.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">
              DISASTER PROTOCOL STATUS
            </span>
            <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
              Monitoring global storm patterns. High speed wind alert registers 45km/h in southern quadrants. Emergency shields prepared.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section: HUD Stats & Launch Buttons */}
      <div className="max-w-7xl mx-auto w-full z-10">
        
        {/* Statistics Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="glass-card rounded-xl p-3 flex items-center gap-3 border border-white/5 bg-slate-900/10">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-cyan-400">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">{s.label}</div>
                  <div className={`text-xs md:text-sm font-display font-medium ${s.color}`}>{s.value}</div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Buttons Panel */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <motion.button
            onClick={() => setActivePage('dashboard')}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl font-display font-medium text-sm text-cyan-50 tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-300/20 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:scale-[1.02] transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            INITIALIZE ANALYTICS CORE
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={() => setActivePage('ai-assistant')}
            className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-display text-sm text-cyan-200 tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            CONSULT SYSTEM AI AGENT
          </motion.button>
        </div>
      </div>
    </div>
  );
};
