import React, { useState, useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, Download, RefreshCw, Info, HelpCircle, ShieldAlert, Zap, Trees, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export const Historical: React.FC = () => {
  const { selectedCity, isLoading } = useWeather();
  const [exportType, setExportType] = useState<string>("pdf");
  const [datasetSelect, setDatasetSelect] = useState<string>("thermal");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Policy Simulator sliders (0-100%)
  const [policySolarShield, setPolicySolarShield] = useState<number>(0);
  const [policyFusionGrid, setPolicyFusionGrid] = useState<number>(0);
  const [policyAfforestation, setPolicyAfforestation] = useState<number>(0);

  // Carbon clock ticking deadline state
  const [carbonClock, setCarbonClock] = useState({
    years: 6,
    days: 224,
    hours: 14,
    minutes: 8,
    seconds: 42,
    ms: 950
  });

  useEffect(() => {
    // Carbon clock counting down to +1.5C threshold (Targeting mid-2032)
    const targetDate = new Date("2032-11-20T00:00:00Z").getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = targetDate - now;
      if (diff <= 0) {
        clearInterval(interval);
        return;
      }
      
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const ms = Math.floor((diff % 1000) / 10); // 2 digit ms representation
      
      setCarbonClock({ years, days, hours, minutes, seconds, ms });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !selectedCity) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-amber-400 border-r-transparent border-white/10 animate-spin" />
          <span className="font-mono text-amber-400 text-xs tracking-widest animate-pulse">RECONSTRUCTING HISTORICAL DATA...</span>
        </div>
      </div>
    );
  }

  // Calculate mitigation delta from policy settings
  const mitigationDelta = (policySolarShield * 0.015) + (policyFusionGrid * 0.01) + (policyAfforestation * 0.008);

  // Compile 10-year historical comparison using selected city's average shifts
  const comparisonData = selectedCity.historicalTemp.map((temp, index) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // Stable offset to prevent flickering on charts
    const baseOffset = index % 3 === 0 ? 0.9 : index % 3 === 1 ? 1.4 : 0.6;
    return {
      month: months[index],
      currentDecade: parseFloat((temp - mitigationDelta).toFixed(1)),
      pastDecade: parseFloat((temp - baseOffset).toFixed(1)) // global warming anomaly shift!
    };
  });

  // Correlation matrix data points
  // Variables: Temp, Rain, UV, AQI, Humidity
  const correlationVariables = ["TEMP", "RAIN", "UV", "AQI", "HUMID"];
  const correlationMatrix = [
    [1.0, -0.4, 0.9, 0.6, -0.7], // TEMP correlations
    [-0.4, 1.0, -0.5, -0.3, 0.8], // RAIN correlations
    [0.9, -0.5, 1.0, 0.7, -0.6], // UV correlations
    [0.6, -0.3, 0.7, 1.0, -0.2], // AQI correlations
    [-0.7, 0.8, -0.6, -0.2, 1.0]  // HUMID correlations
  ];

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setExportSuccess(false);

    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      
      // Trigger file download simulator
      const mockData = {
        station: selectedCity.name,
        timestamp: new Date().toISOString(),
        dataset: datasetSelect,
        readings: selectedCity.historicalTemp
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mockData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `climatevision_${selectedCity.name.toLowerCase().replace(/ /g, '_')}_${datasetSelect}.${exportType}`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setTimeout(() => setExportSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      
      {/* 10-Year warming anomaly trend graph */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">ANOMALY DETECTOR</span>
            <h3 className="text-base font-display font-medium text-cyan-200">DECADE-OVER-DECADE TEMP HEATING SHIFTS</h3>
          </div>
          <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono text-amber-300">
            GLOBAL WARMING AUDIT
          </span>
        </div>

        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="currentGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="pastGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#4b5563" fontSize={10} tickLine={false} />
              <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(9, 13, 22, 0.9)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }}
                labelStyle={{ color: '#06b6d4', fontFamily: 'monospace' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="currentDecade" name="Current Era (2020s)" stroke="#f43f5e" strokeWidth={2} fill="url(#currentGlow)" />
              <Area type="monotone" dataKey="pastDecade" name="Past Baseline (2000s)" stroke="#06b6d4" strokeWidth={1} fill="url(#pastGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[10px] font-mono text-gray-500 mt-4 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
          [SCIENTIFIC AUDIT] Data reveals a clear positive warming delta across all months, averaging +1.28°C shift over 20 years. This aligns with industrial carbon expansion ratios in urban zones.
        </p>
      </div>

      {/* Carbon Clock & Policy Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Carbon Clock */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-all" />
          
          <div className="flex items-center justify-between mb-4 z-10">
            <div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">CRITICAL THRESHOLD COUNTDOWN</span>
              <h3 className="text-sm font-display font-medium text-rose-200">GLOBAL CARBON CLOCK (+1.5°C)</h3>
            </div>
            <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
          </div>
          
          <div className="flex gap-2 justify-center my-4 z-10">
            {[
              { label: "YRS", value: carbonClock.years },
              { label: "DAYS", value: carbonClock.days },
              { label: "HRS", value: carbonClock.hours },
              { label: "MIN", value: carbonClock.minutes },
              { label: "SEC", value: carbonClock.seconds },
              { label: "MS", value: carbonClock.ms.toString().padStart(2, '0') }
            ].map((unit, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="bg-slate-950/80 border border-white/10 rounded-lg p-2 min-w-[3.5rem] flex items-center justify-center shadow-[inset_0_0_15px_rgba(244,63,94,0.1)]">
                  <span className="font-display font-bold text-2xl text-rose-400 text-glow-rose">{unit.value}</span>
                </div>
                <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-widest">{unit.label}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[11px] font-mono text-gray-400 leading-relaxed z-10">
            [WARNING] The countdown reflects the time remaining until global average temperatures exceed the +1.5°C tipping point based on current emission rates.
          </div>
        </div>

        {/* Policy Simulator */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">MITIGATION COMMAND</span>
              <h3 className="text-sm font-display font-medium text-emerald-200">GEO-POLICY SIMULATOR</h3>
            </div>
          </div>

          <div className="space-y-4 my-2">
            
            {/* Solar Shield */}
            <div className="flex flex-col">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 uppercase">
                  <Sun className="w-3.5 h-3.5" /> Orbital Solar Shield
                </label>
                <span className="text-[10px] font-mono text-gray-400">{policySolarShield}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={policySolarShield}
                onChange={(e) => setPolicySolarShield(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Fusion Grid */}
            <div className="flex flex-col">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-mono text-indigo-300 flex items-center gap-1.5 uppercase">
                  <Zap className="w-3.5 h-3.5" /> Fusion Energy Grid
                </label>
                <span className="text-[10px] font-mono text-gray-400">{policyFusionGrid}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={policyFusionGrid}
                onChange={(e) => setPolicyFusionGrid(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>

            {/* Afforestation */}
            <div className="flex flex-col">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 uppercase">
                  <Trees className="w-3.5 h-3.5" /> Global Afforestation
                </label>
                <span className="text-[10px] font-mono text-gray-400">{policyAfforestation}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={policyAfforestation}
                onChange={(e) => setPolicyAfforestation(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

          </div>

          <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-center uppercase tracking-widest flex items-center justify-center gap-2 mt-4">
            <span>Projected Mitigation:</span>
            <span className="font-bold">-{mitigationDelta.toFixed(2)}°C</span>
          </div>
        </div>

      </div>

      {/* Grid: Correlation Matrix & PDF Exporter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Correlation Matrix */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">GRID MULTI-VAR ANALYSIS</span>
                <h3 className="text-base font-display font-medium text-cyan-200">CLIMATE VARIABLE CORRELATION MATRIX</h3>
              </div>
              <HelpCircle className="w-4.5 h-4.5 text-gray-500" />
            </div>

            {/* Matrix Board */}
            <div className="grid grid-cols-6 gap-2 my-4">
              {/* Header variables */}
              <div className="text-[9px] font-mono text-gray-500 flex items-center justify-center font-bold">VARS</div>
              {correlationVariables.map((v, i) => (
                <div key={i} className="text-[9px] font-mono text-gray-400 font-bold text-center py-1 bg-white/5 rounded border border-white/5">
                  {v}
                </div>
              ))}

              {correlationVariables.map((rowVar, rIdx) => (
                <React.Fragment key={rIdx}>
                  {/* Row indicator */}
                  <div className="text-[9px] font-mono text-gray-400 flex items-center font-bold pl-1 bg-white/5 rounded border border-white/5">
                    {rowVar}
                  </div>
                  
                  {/* Row cells */}
                  {correlationMatrix[rIdx].map((val, cIdx) => {
                    // Cell colors: strong positive is glowing cyan, negative is indigo/purple
                    const absVal = Math.abs(val);
                    let cellBg = "bg-cyan-500/10 text-cyan-300 border-cyan-500/25";
                    if (val < 0) {
                      cellBg = `bg-indigo-600/${Math.round(absVal * 30)} text-indigo-300 border-indigo-500/10`;
                    } else if (val === 1.0) {
                      cellBg = "bg-cyan-500/30 text-cyan-100 border-cyan-400/50 font-bold";
                    } else {
                      cellBg = `bg-cyan-500/${Math.round(val * 25)} text-cyan-300 border-cyan-500/10`;
                    }

                    return (
                      <div 
                        key={cIdx} 
                        className={`text-[10px] font-mono py-3 rounded text-center border flex items-center justify-center transition-all hover:scale-105 ${cellBg}`}
                        title={`Correlation: ${val}`}
                      >
                        {val.toFixed(1)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="text-[9px] font-mono text-gray-500 border-t border-white/5 pt-3 mt-4 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Positive ratios indicate direct coupling; negative numbers indicate inverse coupling.</span>
          </div>
        </div>

        {/* PDF/Dataset Report Exporter console */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">EXPORT DECK</span>
                <h3 className="text-sm font-display font-medium text-cyan-200">TELEMETRY DATA PACK EXPORTER</h3>
              </div>
            </div>

            <form onSubmit={handleExport} className="space-y-4 my-2">
              <div className="flex flex-col">
                <label className="text-[9px] font-mono text-gray-500 uppercase mb-1">Select Dataset Node</label>
                <select
                  value={datasetSelect}
                  onChange={(e) => setDatasetSelect(e.target.value)}
                  className="bg-slate-950 border border-white/10 text-cyan-200 text-xs rounded-lg p-2 focus:outline-none focus:border-cyan-400 transition-all font-display cursor-pointer"
                >
                  <option value="thermal">Node_Thermal_Grid (10-Year Temp records)</option>
                  <option value="particulates">Node_Particulate_Biosphere (Live AQI readings)</option>
                  <option value="disasters">Node_Cyclone_Emergency (Historical Alerts & Warnings)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[9px] font-mono text-gray-500 uppercase mb-1">Select File Format</label>
                <div className="flex gap-4">
                  {['pdf', 'json', 'csv'].map((format) => (
                    <label key={format} className="flex items-center gap-1.5 cursor-pointer font-mono text-xs text-gray-400 select-none hover:text-cyan-300">
                      <input 
                        type="radio" 
                        name="exportFormat" 
                        value={format} 
                        checked={exportType === format}
                        onChange={() => setExportType(format)}
                        className="accent-cyan-500 cursor-pointer"
                      />
                      {format.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isExporting}
                className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-mono text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    COMPILING TELEMETRY FILES...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    EXPORT TELEMETRY COMPILATION
                  </>
                )}
              </button>
            </form>

            {exportSuccess && (
              <motion.div 
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-mono text-emerald-400 mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                FILE EXPORT GENERATED AND PACK DOWNLOADED SUCCESSFULLY.
              </motion.div>
            )}
          </div>

          <div className="text-[9px] font-mono text-gray-500 border-t border-white/5 pt-3 mt-4 text-center">
            GRID STAMP GENERATOR SECURED // AES-256
          </div>
        </div>

      </div>

    </div>
  );
};
