import React from 'react';
import { useWeather } from '../context/WeatherContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Thermometer, 
  Wind, 
  Droplets, 
  Compass, 
  Sun, 
  Activity, 
  Cpu, 
  AlertTriangle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { WindFlowField } from '../components/WindFlowField';

export const Dashboard: React.FC = () => {
  const { selectedCity, isLoading, unitSystem } = useWeather();

  if (isLoading || !selectedCity) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-cyan-400 border-r-transparent border-white/10 animate-spin" />
          <span className="font-mono text-cyan-400 text-xs tracking-widest animate-pulse">CONNECTING TO WEATHER MATRIX...</span>
        </div>
      </div>
    );
  }

  // Generate hourly data for charts dynamically based on city metrics
  const hourlyData = Array.from({ length: 8 }, (_, i) => {
    const hour = (new Date().getHours() + i * 3) % 24;
    const tempOffset = Math.sin(i * 0.8) * 2;
    const rainOffset = Math.max(0, Math.min(100, selectedCity.precipitationProbability + Math.cos(i * 0.9) * 15));
    return {
      time: `${hour.toString().padStart(2, '0')}:00`,
      temp: parseFloat((selectedCity.temperature + tempOffset).toFixed(1)),
      rain: Math.round(rainOffset)
    };
  });

  // Dynamic AI Weather Insights Generator
  const generateInsights = () => {
    const temp = selectedCity.temperature;
    const cond = selectedCity.condition;
    const aqi = selectedCity.aqi;
    const wind = selectedCity.windSpeed;

    const insights = [];

    if (temp > (unitSystem === 'metric' ? 35 : 95)) {
      insights.push({
        title: "CRITICAL THERMAL SPIKE",
        desc: `High temperature anomaly of ${temp}${unitSystem === 'metric' ? '°C' : '°F'} detected. Activating regional heat shields and advising municipal cooling grid deployment.`,
        type: "danger"
      });
    } else if (temp < (unitSystem === 'metric' ? 10 : 50)) {
      insights.push({
        title: "CRYOSPHERE EXPANSION",
        desc: `Low temperature thresholds registered at ${temp}${unitSystem === 'metric' ? '°C' : '°F'}. Hydro-heating lines scheduled to defrost agricultural irrigation grids in sub-sectors.`,
        type: "warning"
      });
    }

    if (cond === 'Thunderstorm' || cond === 'Rain') {
      insights.push({
        title: "PRECIPITATION VECTOR LOCK",
        desc: `Precipitation probability at ${selectedCity.precipitationProbability}%. High atmospheric moisture vectors mapped. Drainage networks are operating at 68% load. Storm shields active.`,
        type: "warning"
      });
    }

    if (aqi > 100) {
      insights.push({
        title: "PARTICULATE DENSITY EXCEEDED",
        desc: `Air quality indexes register a hazardous ${aqi} (Unhealthy). Secondary biospshere filtration cells activated. Recommend personal respiration filter deployment in industrial zones.`,
        type: "danger"
      });
    } else {
      insights.push({
        title: "BIOSPHERE PURITY: HIGH",
        desc: `AQI index is at ${aqi} (Pristine). Atmospheric carbon metrics verified at nominal levels. Main filtration cells are in energy-saving standby mode.`,
        type: "success"
      });
    }

    if (wind > (unitSystem === 'metric' ? 30 : 18)) {
      insights.push({
        title: "KINETIC WIND SPEED EXCURSION",
        desc: `Wind velocities reading ${wind} ${unitSystem === 'metric' ? 'km/h' : 'mph'} from ${selectedCity.windDirection}. Dynamic stabilizer vanes deployed on tall structures to counteract aerodynamic shear forces.`,
        type: "warning"
      });
    }

    // Default general insight
    insights.push({
      title: "PREDICTIVE ANOMALY AUDIT",
      desc: `Holt-Winters double exponential ML models anticipate temperature adjustments to hover around ${selectedCity.tempPrediction}${unitSystem === 'metric' ? '°C' : '°F'} within the next 6 hours. Current storm probabilities are locked.`,
      type: "info"
    });

    return insights;
  };

  const insightsList = generateInsights();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      
      {/* Alert Header Banner */}
      {selectedCity.alerts.length > 0 && (
        <motion.div 
          className="glass-panel border-rose-500/20 bg-rose-950/20 p-4 rounded-2xl flex items-start gap-4 box-glow-rose"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 flex-shrink-0 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-rose-400 tracking-wider">
              CRITICAL GRID SYSTEM EXCURSION
            </div>
            <div className="text-sm font-sans text-gray-300 font-light mt-1">
              {selectedCity.alerts[0].message}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Grid: Info Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Temperature Card */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-[10px] font-mono tracking-widest">THERMAL TELEMETRY</span>
            <Thermometer className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-4xl font-display font-bold text-glow-cyan text-cyan-100">
            {selectedCity.temperature}{unitSystem === 'metric' ? '°C' : '°F'}
          </div>
          <div className="text-[10px] font-mono text-gray-500 mt-2 flex items-center justify-between border-t border-white/5 pt-2">
            <span>PROJECTED TREND:</span>
            <span className="text-cyan-400 font-bold">{selectedCity.tempPrediction}{unitSystem === 'metric' ? '°C' : '°F'}</span>
          </div>
        </div>

        {/* Wind Vector Card */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] font-mono tracking-widest">KINETIC WIND GRID</span>
              <Wind className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-4xl font-display font-bold text-glow-indigo text-indigo-100">
              {selectedCity.windSpeed} <span className="text-sm text-gray-500 font-sans">{unitSystem === 'metric' ? 'km/h' : 'mph'}</span>
            </div>
          </div>
          
          <div className="my-2">
            <WindFlowField 
              windSpeed={selectedCity.windSpeed} 
              windDirection={selectedCity.windDirection} 
            />
          </div>

          <div className="text-[10px] font-mono text-gray-500 flex items-center justify-between border-t border-white/5 pt-2">
            <span>VECTOR COMPASS:</span>
            <span className="text-indigo-400 font-bold flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              {selectedCity.windDirection}
            </span>
          </div>
        </div>

        {/* Humidity & Moisture Card */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-[10px] font-mono tracking-widest">HYGRO-ATMOSPHERE</span>
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-4xl font-display font-bold text-blue-100">
            {selectedCity.humidity}%
          </div>
          <div className="text-[10px] font-mono text-gray-500 mt-2 flex items-center justify-between border-t border-white/5 pt-2">
            <span>PRECIPITATION COMPLIANCE:</span>
            <span className="text-blue-400 font-bold">{selectedCity.precipitationProbability}%</span>
          </div>
        </div>

        {/* UV Index & Barometer Card */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-[10px] font-mono tracking-widest">RADIATION INDEX</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-4xl font-display font-bold text-glow-amber text-amber-100">
            {selectedCity.uvIndex} <span className="text-sm text-gray-500">UV</span>
          </div>
          <div className="text-[10px] font-mono text-gray-500 mt-2 flex items-center justify-between border-t border-white/5 pt-2">
            <span>ATM PRESSURE:</span>
            <span className="text-amber-400 font-bold">{selectedCity.pressure} hPa</span>
          </div>
        </div>
      </div>

      {/* Mid Section: Charts Previews & Dynamic AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line / Area Chart Grid */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">ANALYSIS SCANS</span>
                <h3 className="text-base font-display font-medium text-cyan-200">24-HOUR TEMP & RAIN TELEMETRY</h3>
              </div>
              <span className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono text-cyan-300">
                ACTIVE SENSORS
              </span>
            </div>
            
            {/* Charts Container */}
            <div className="h-60 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="rainGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(9, 13, 22, 0.9)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                    labelStyle={{ color: '#06b6d4', fontFamily: 'monospace', fontSize: 11 }}
                    itemStyle={{ color: '#e5e7eb', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#tempGlow)" />
                  <Area type="monotone" dataKey="rain" name="Rain Prob (%)" stroke="#6366f1" strokeWidth={1} fillOpacity={1} fill="url(#rainGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 mt-4 text-center">
            <div>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">BAROMETRIC STATUS</span>
              <span className="text-xs font-mono text-cyan-400">NOMINAL</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">HUMIDITY TREND</span>
              <span className="text-xs font-mono text-indigo-400">STABILIZING</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">AI CONFIDENCE LEVEL</span>
              <span className="text-xs font-mono text-emerald-400">98.4%</span>
            </div>
          </div>
        </div>

        {/* AI Climate Insights Section */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">COGNITIVE COMPUTE</span>
                <h3 className="text-sm font-display font-medium text-cyan-200">AI WEATHER INSIGHTS</h3>
              </div>
            </div>

            {/* Insights Stack */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {insightsList.map((ins, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border text-[11px] font-mono leading-relaxed ${
                  ins.type === 'danger'
                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-200'
                    : ins.type === 'warning'
                      ? 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                      : ins.type === 'success'
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200'
                        : 'bg-white/5 border-white/5 text-cyan-100'
                }`}>
                  <div className="font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{ins.title}</span>
                    <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded">NODE_{idx + 1}</span>
                  </div>
                  {ins.desc}
                </div>
              ))}
            </div>
          </div>

          <div className="text-[9px] font-mono text-gray-500 border-t border-white/5 pt-3 mt-4 text-center">
            DADV ENGINE V1.2 // GENERATED DYNAMICALLY
          </div>
        </div>
      </div>

      {/* Mini Bar Preview representing agricultural/soil ratings */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-display font-medium text-indigo-200">AGRICULTURAL TELEMETRY PROBES</h4>
            <p className="text-xs font-sans text-gray-400 font-light mt-0.5">
              Soil PH is currently {selectedCity.soilPh} with {selectedCity.soilMoisture}% relative water content.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">SOIL MOISTURE</span>
            <span className="text-sm font-mono text-cyan-400 font-bold">{selectedCity.soilMoisture}%</span>
          </div>
          <div className="text-center border-l border-white/10 pl-6">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">SOIL PH</span>
            <span className="text-sm font-mono text-indigo-400 font-bold">{selectedCity.soilPh} pH</span>
          </div>
          <div className="text-center border-l border-white/10 pl-6">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">AGRI COMPLIANCE</span>
            <span className="text-sm font-mono text-emerald-400 font-bold">EXCELLENT</span>
          </div>
        </div>
      </div>

    </div>
  );
};
