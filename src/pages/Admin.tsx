import React, { useState, useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';
import { SlidersHorizontal, ShieldAlert, Check, RefreshCw, AlertTriangle, Play, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Admin: React.FC = () => {
  const { selectedCity, updateCityWeather, selectedCityName } = useWeather();

  const [temp, setTemp] = useState<number>(20);
  const [humidity, setHumidity] = useState<number>(50);
  const [windSpeed, setWindSpeed] = useState<number>(10);
  const [aqi, setAqi] = useState<number>(40);
  const [uvIndex, setUvIndex] = useState<number>(5);
  const [condition, setCondition] = useState<'Sunny' | 'Rain' | 'Thunderstorm' | 'Clouds' | 'Fog'>('Sunny');
  
  // Alert fields
  const [alertType, setAlertType] = useState<string>("Cyclone Warning");
  const [alertLevel, setAlertLevel] = useState<'Low' | 'Medium' | 'High' | 'Critical'>("High");
  const [alertMessage, setAlertMessage] = useState<string>("");

  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<boolean>(false);

  // Sync controls with selectedCity values when selectedCity changes
  useEffect(() => {
    if (selectedCity) {
      setTemp(selectedCity.temperature);
      setHumidity(selectedCity.humidity);
      setWindSpeed(selectedCity.windSpeed);
      setAqi(selectedCity.aqi);
      setUvIndex(selectedCity.uvIndex);
      setCondition(selectedCity.condition);
    }
  }, [selectedCityName, selectedCity]);

  if (!selectedCity) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <span className="font-mono text-cyan-400 text-xs">AWAITING STATION ASSIGNMENT...</span>
      </div>
    );
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateStatus(false);

    try {
      await updateCityWeather(selectedCity.name, {
        temperature: temp,
        humidity,
        windSpeed,
        aqi,
        uvIndex,
        condition
      });
      setUpdateStatus(true);
      setTimeout(() => setUpdateStatus(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInjectAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage.trim()) return;

    setIsUpdating(true);
    try {
      const newAlert = {
        id: Math.random().toString(36).substring(7),
        type: alertType,
        level: alertLevel,
        message: alertMessage,
        active: true
      };

      const updatedAlerts = [...selectedCity.alerts, newAlert];
      await updateCityWeather(selectedCity.name, { alerts: updatedAlerts });
      
      setAlertMessage("");
      setUpdateStatus(true);
      setTimeout(() => setUpdateStatus(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearAlerts = async () => {
    setIsUpdating(true);
    try {
      await updateCityWeather(selectedCity.name, { alerts: [] });
      setUpdateStatus(true);
      setTimeout(() => setUpdateStatus(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      
      {/* Upper description card */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <SlidersHorizontal className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-display font-medium text-cyan-200">GRID PARAMETER SIMULATOR</h3>
            <p className="text-[10px] font-mono text-gray-500 mt-1 uppercase tracking-widest">
              Station Override console // Target: {selectedCity.name}
            </p>
          </div>
        </div>

        {updateStatus && (
          <motion.div 
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Check className="w-3.5 h-3.5" />
            GRID TELEMETRY METRICS SYNCHRONIZED
          </motion.div>
        )}
      </div>

      {/* Grid: Controls deck & Alerts Injector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Parametric slider form */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <form onSubmit={handleApply} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-display font-medium text-cyan-200 uppercase tracking-wide">
                1. ATMOSPHERIC PARAMETERS OVERRIDE
              </h3>
              <span className="px-2 py-0.5 bg-cyan-500/10 text-[8px] font-mono text-cyan-400 rounded">METRIC_PROBES</span>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span>Ambient Temperature</span>
                <span className="text-cyan-300 font-bold">{temp}°C</span>
              </div>
              <input 
                type="range" min="-10" max="50" step="0.5" value={temp} 
                onChange={(e) => setTemp(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Humidity Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span>Atmospheric Humidity</span>
                <span className="text-cyan-300 font-bold">{humidity}%</span>
              </div>
              <input 
                type="range" min="0" max="100" step="1" value={humidity} 
                onChange={(e) => setHumidity(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Wind Speed Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span>Kinetic Wind Velocity</span>
                <span className="text-cyan-300 font-bold">{windSpeed} km/h</span>
              </div>
              <input 
                type="range" min="0" max="120" step="0.5" value={windSpeed} 
                onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* AQI Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span>Particulate Density (AQI)</span>
                <span className="text-cyan-300 font-bold">{aqi}</span>
              </div>
              <input 
                type="range" min="0" max="300" step="1" value={aqi} 
                onChange={(e) => setAqi(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* UV Index Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span>Radiation Index (UV)</span>
                <span className="text-cyan-300 font-bold">{uvIndex} UV</span>
              </div>
              <input 
                type="range" min="0" max="15" step="0.1" value={uvIndex} 
                onChange={(e) => setUvIndex(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Conditions selection chips */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Metereological Condition Injector</span>
              <div className="flex flex-wrap gap-2">
                {['Sunny', 'Rain', 'Thunderstorm', 'Clouds', 'Fog'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c as any)}
                    className={`px-3 py-1.5 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                      condition === c
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-200'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full py-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white rounded-xl font-mono text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all hover:scale-[1.01] disabled:opacity-50 mt-4"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  APPLYING GRID OVERRIDES...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  APPLY SIMULATOR PARAMETERS
                </>
              )}
            </button>
          </form>
        </div>

        {/* Alerts Generator form */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-display font-medium text-cyan-200 uppercase tracking-wide">
                2. ACTIVE HAZARD INJECTOR CORE
              </h3>
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>

            <form onSubmit={handleInjectAlert} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[9px] font-mono text-gray-500 uppercase mb-1">Hazard Vector Type</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className="bg-slate-950 border border-white/10 text-cyan-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-400 transition-all font-display cursor-pointer"
                >
                  <option value="Cyclone Warning">Cyclone Warning</option>
                  <option value="Flood Warning">Flood Warning</option>
                  <option value="Heatwave Alert">Heatwave Alert</option>
                  <option value="Air Quality Alert">Air Quality Alert</option>
                  <option value="Tidal Surge Hazard">Tidal Surge Hazard</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[9px] font-mono text-gray-500 uppercase mb-1">Severity Hazard Level</label>
                <div className="flex gap-4">
                  {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                    <label key={level} className="flex items-center gap-1.5 cursor-pointer font-mono text-xs text-gray-400 select-none hover:text-cyan-300">
                      <input 
                        type="radio" 
                        name="hazardLevel" 
                        value={level} 
                        checked={alertLevel === level}
                        onChange={() => setAlertLevel(level as any)}
                        className="accent-cyan-500 cursor-pointer"
                      />
                      {level.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[9px] font-mono text-gray-500 uppercase mb-1">Broadcast Emergency Message</label>
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="e.g. Cyclone 'Kraken' approaching the western harbor. Deploy coastal barriers immediately."
                  rows={3}
                  className="bg-slate-950/80 border border-white/10 hover:border-cyan-400/50 text-cyan-200 text-xs rounded-xl p-3 focus:outline-none focus:border-cyan-400 transition-all font-mono placeholder-cyan-900 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating || !alertMessage.trim()}
                className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl font-mono text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                BROADCAST EMERGENCY INJECTION
              </button>
            </form>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6">
            <button
              onClick={handleClearAlerts}
              disabled={isUpdating || selectedCity.alerts.length === 0}
              className="w-full py-2 bg-slate-950/50 hover:bg-rose-950/20 text-gray-500 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 rounded-xl font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-30 disabled:hover:text-gray-500 disabled:hover:border-white/5 disabled:hover:bg-slate-950/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              CLEAR ACTIVE WARNING VECTORS
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
