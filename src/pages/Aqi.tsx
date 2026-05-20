import React from 'react';
import { useWeather } from '../context/WeatherContext';
import { Wind, ShieldCheck, Sun, Eye, ShieldAlert } from 'lucide-react';
import { SatelliteFeed } from '../components/SatelliteFeed';

export const Aqi: React.FC = () => {
  const { selectedCity, isLoading } = useWeather();

  if (isLoading || !selectedCity) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-emerald-400 border-r-transparent border-white/10 animate-spin" />
          <span className="font-mono text-emerald-400 text-xs tracking-widest animate-pulse">CONNECTING TO BIOSPHERE NETWORK...</span>
        </div>
      </div>
    );
  }

  const aqi = selectedCity.aqi;
  
  // Compute ratings and colors based on AQI
  let aqiRating = "Pristine";
  let aqiColor = "text-emerald-400 text-glow-cyan";
  let aqiBgColor = "bg-emerald-500/10 border-emerald-500/30";
  let aqiStatus = "Safe";
  let aqiDesc = "Respiration conditions are optimal. No filtration masks required. All atmospheric parameters are fully balanced.";
  
  if (aqi > 100) {
    aqiRating = "Highly Polluted";
    aqiColor = "text-rose-500 text-glow-rose";
    aqiBgColor = "bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]";
    aqiStatus = "Hazardous Warning";
    aqiDesc = "Particulate concentrations exceed safe tolerances. Wear active filtration masks (level 1-A). Seal secondary ventilation shafts.";
  } else if (aqi > 50) {
    aqiRating = "Moderate";
    aqiColor = "text-amber-400 text-glow-amber";
    aqiBgColor = "bg-amber-500/10 border-amber-500/30";
    aqiStatus = "Acceptable";
    aqiDesc = "Atmosphere contains moderate particulate clusters. Minor sensitivity warning for individuals with acute respiratory anomalies.";
  }

  // Generate pollutant metrics based on AQI
  const pollutants = [
    { name: "PM2.5 (Fine Dust)", value: Math.round(aqi * 0.42), limit: 15, unit: "μg/m³", desc: "Fine inhalable combustion particles." },
    { name: "PM10 (Coarse Dust)", value: Math.round(aqi * 0.72), limit: 45, unit: "μg/m³", desc: "Dust, pollen, and mechanical friction particles." },
    { name: "NO2 (Nitrogen Dioxide)", value: Math.round(aqi * 0.28), limit: 20, unit: "ppb", desc: "Traffic emissions, industrial thermal output." },
    { name: "SO2 (Sulfur Dioxide)", value: Math.round(aqi * 0.15), limit: 40, unit: "ppb", desc: "Fossil fuel burning by orbital/surface heavy plants." },
    { name: "O3 (Ozone)", value: Math.round(aqi * 0.55), limit: 60, unit: "ppb", desc: "Photochemical reaction output in upper grids." },
    { name: "CO (Carbon Monoxide)", value: parseFloat((aqi * 0.008).toFixed(2)), limit: 4.0, unit: "mg/m³", desc: "Incomplete combustion by grid engines." }
  ];

  // Dynamic UV risk calculations
  const uv = selectedCity.uvIndex;
  let uvRisk = "Low";
  let uvColor = "text-emerald-400";
  if (uv > 10) {
    uvRisk = "Extreme Warning";
    uvColor = "text-rose-500 text-glow-rose";
  } else if (uv > 6) {
    uvRisk = "Very High";
    uvColor = "text-amber-500";
  } else if (uv > 3) {
    uvRisk = "Moderate";
    uvColor = "text-cyan-400";
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      
      {/* Top Section: AQI Circle Gauge & UV Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Large AQI Circular Gauge */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
          
          <div className="w-full flex items-center justify-between text-gray-500 text-[10px] font-mono tracking-widest uppercase">
            <span>ATMOSPHERE SCANNER</span>
            <span>NODE_AQI_GRID</span>
          </div>

          <div className="my-8 relative flex items-center justify-center">
            {/* Pulsing visual glow ring */}
            <div className={`absolute w-36 h-36 rounded-full border-4 border-dashed border-white/5 animate-spin-slow`} />
            <div className={`w-32 h-32 rounded-full border border-white/10 flex flex-col items-center justify-center bg-slate-950/40 relative z-10`}>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">INDEX RATING</span>
              <span className={`text-4xl font-display font-extrabold ${aqiColor}`}>{aqi}</span>
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-1">{aqiRating}</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border w-full text-left text-xs font-mono leading-relaxed ${aqiBgColor}`}>
            <div className="font-bold mb-1 flex items-center gap-1.5">
              {aqi > 100 ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              <span>{aqiStatus}</span>
            </div>
            <p className="text-gray-300 font-sans font-light">{aqiDesc}</p>
          </div>
        </div>

        {/* Pollutants Breakdown List (Area/Grid) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">ATMOSPHERIC AUDITING</span>
              <h3 className="text-base font-display font-medium text-cyan-200">POLLUTANT CONCENTRATION DETAILS</h3>
            </div>
            <Wind className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
            {pollutants.map((p, idx) => {
              const isOver = p.value > p.limit;
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-white/5 bg-slate-950/20 relative group hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                    <span className="text-gray-400 font-bold">{p.name}</span>
                    <span className={isOver ? 'text-rose-400 font-bold' : 'text-cyan-400'}>
                      {p.value} {p.unit}
                    </span>
                  </div>

                  {/* Meter bar */}
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isOver ? 'bg-rose-500' : 'bg-cyan-500'}`} 
                      style={{ width: `${Math.min(100, (Number(p.value) / (p.limit * 1.5)) * 100)}%` }} 
                    />
                  </div>

                  <p className="text-[9px] text-gray-500 font-mono mt-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {p.desc} Limit: {p.limit} {p.unit}.
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-[9px] font-mono text-gray-500 border-t border-white/5 pt-3 mt-4 text-center">
            PARTICULATE ANALYSIS SHIELD TELEMETRY synced
          </div>
        </div>
      </div>

      {/* Environmental Radiation, Visibility & Satellite scans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* UV Index Gauge */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">RADIATION SENSOR</span>
              <h3 className="text-sm font-display font-medium text-cyan-200">SOLAR UV INDEX SPECTRUM</h3>
            </div>
            <Sun className="w-4.5 h-4.5 text-amber-400 animate-spin-slow" />
          </div>

          <div className="flex items-baseline gap-2 my-4">
            <span className={`text-5xl font-display font-extrabold ${uvColor}`}>
              {uv} <span className="text-sm text-gray-500 uppercase font-mono tracking-wider">INDEX</span>
            </span>
          </div>

          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5 flex">
            {Array.from({ length: 11 }, (_, i) => (
              <div 
                key={i} 
                className={`flex-1 h-full border-r border-slate-950 ${
                  i < uv 
                    ? i > 7 
                      ? 'bg-rose-500' 
                      : i > 4 
                        ? 'bg-amber-500' 
                        : 'bg-emerald-400' 
                    : 'bg-slate-900'
                }`} 
              />
            ))}
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mt-4 uppercase">
            <span>UV RISK PROFILE:</span>
            <span className={`${uvColor} font-bold`}>{uvRisk}</span>
          </div>
        </div>

        {/* Visibility & Secondary indicators */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">AEROSOL GRID SCANS</span>
              <h3 className="text-sm font-display font-medium text-cyan-200">ATMOSPHERIC VISIBILITY</h3>
            </div>
            <Eye className="w-4.5 h-4.5 text-cyan-400" />
          </div>

          <div className="my-4">
            {/* If fog or thunderstorm, reduce visibility */}
            {selectedCity.condition === 'Fog' || selectedCity.condition === 'Thunderstorm' ? (
              <div className="text-4xl font-display font-bold text-glow-rose text-rose-300">
                1.8 <span className="text-sm text-gray-500">km</span>
              </div>
            ) : (
              <div className="text-4xl font-display font-bold text-glow-cyan text-cyan-100">
                14.2 <span className="text-sm text-gray-500">km</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[11px] font-mono text-gray-400 leading-relaxed">
            {selectedCity.condition === 'Fog'
              ? "[VISIBILITY RESTRICTED] Extreme moisture aerosols detected in low altitude layers."
              : "[NOMINAL RANGE] Atmospheric haze is minimal. Trans-continental scanning operations active."}
          </div>

          <div className="text-[9px] font-mono text-gray-500 mt-4 uppercase flex justify-between">
            <span>GRID SENSOR SCAN:</span>
            <span className="text-cyan-400 font-bold">ONLINE</span>
          </div>
        </div>

        {/* Satellite weather imaging scans */}
        <SatelliteFeed 
          cityName={selectedCity.name} 
          condition={selectedCity.condition} 
        />

      </div>
    </div>
  );
};
