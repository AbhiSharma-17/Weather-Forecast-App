import React, { useState, useEffect } from 'react';
import { AuthModal } from '../components/AuthModal';
import { useWeather } from '../context/WeatherContext';
import { Bell, VolumeX, Search, MapPin, User, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    user, 
    signOut,
    cities, 
    selectedCityName, 
    setSelectedCityName, 
    activePage,
    audioTelemetryEnabled,
    setAudioTelemetryEnabled,
    unitSystem,
    setUnitSystem,
    addCustomLocation
  } = useWeather();
  
  const [authOpen, setAuthOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTime(date.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (activePage) {
      case 'landing': return 'CORE INTERFACE PORTAL';
      case 'dashboard': return 'REAL-TIME TELEMETRY DECK';
      case 'forecast': return 'PREDICTIVE CLIMATE PROJECTIONS';
      case 'disaster': return 'DISASTER MONITORING & ALERTS';
      case 'aqi': return 'BIO-ENVIRONMENTAL AUDITING';
      case 'historical': return 'HISTORICAL TREND ANALYSIS';
      case 'ai-assistant': return 'COGNITIVE CLIMATE ASSISTANT';
      case 'admin': return 'SYSTEM PARAMETER CONTROL';
      default: return 'CLIMATEVISION CORE';
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCityName(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedCityName(searchQuery.trim());
      setSearchQuery("");
    }
  };

  const handleLocateMe = async () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log("[CLIMATEVISION GEO] Got coordinates:", latitude, longitude);
          const name = "Current Location";
          try {
            await addCustomLocation(name, latitude, longitude);
            setSelectedCityName(name);
          } catch (e) {
            console.error("[CLIMATEVISION GEO] Failed to add custom location:", e);
          }
        },
        (error) => {
          console.error("[CLIMATEVISION GEO] Geolocation error:", error);
        }
      );
    } else {
      console.error("[CLIMATEVISION GEO] Geolocation is not supported by this browser.");
    }
  };

  const totalAlerts = cities.reduce((acc, c) => acc + c.alerts.length, 0);

  return (
    <header className="glass-panel border-b border-white/5 h-20 px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      
      {/* Left Title */}
      <div className="flex flex-col">
        <span className="text-[10px] font-mono tracking-widest text-cyan-400">
          SYSTEM LEVEL DECK
        </span>
        <h2 className="text-sm md:text-lg font-display font-medium tracking-wide text-glow-cyan text-cyan-100 uppercase">
          {getPageTitle()}
        </h2>
      </div>

      {/* Middle/Right Controls */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Real-time Clock */}
        <div className="hidden lg:flex flex-col items-end border-r border-white/10 pr-6">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            GRID STAMP TIME
          </span>
          <span className="text-xs font-mono text-cyan-400/90 tracking-widest">
            {time || "SYNCING..."}
          </span>
        </div>

        {/* Global Search */}
        <form onSubmit={handleSearch} className="hidden md:flex relative group">
          <input 
            type="text" 
            placeholder="Search Global Grid..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 bg-slate-950/80 border border-white/10 hover:border-cyan-400/50 text-cyan-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-400 transition-all font-display placeholder-gray-600"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
        </form>

        {/* Auth / Locate Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={user ? signOut : () => setAuthOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
            title={user ? "Sign Out" : "Operator Login"}
          >
            {user ? <LogOut className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </button>
          {user && (
            <span className="text-xs font-mono text-cyan-300">
              {user.displayName || user.email?.split('@')[0]}
            </span>
          )}
        </div>

        <button
          onClick={handleLocateMe}
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
          title="Locate Me (Geolocation)"
        >
          <MapPin className="w-4 h-4" />
        </button>

        {/* Station Selector */}
        <div className="flex flex-col items-start border-l border-white/10 pl-4 md:pl-6">
          <label htmlFor="station-select" className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-0.5">
            SELECT INTEL STATION
          </label>
          <div className="relative">
            <select
              id="station-select"
              value={selectedCityName}
              onChange={handleCityChange}
              className="bg-slate-950/80 border border-white/10 hover:border-cyan-400/50 text-cyan-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400 transition-all duration-300 font-display cursor-pointer"
            >
              {cities.map((city) => (
                <option key={city.name} value={city.name} className="bg-slate-950 text-cyan-200">
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric / Imperial Unit Toggle */}
        <button
          onClick={() => setUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric')}
          className="flex items-center justify-center h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-[10px] font-mono text-gray-400 hover:bg-white/10 transition-all uppercase tracking-widest"
          title="Toggle Unit System"
        >
          {unitSystem === 'metric' ? '°C / KMH' : '°F / MPH'}
        </button>

        {/* Audio Telemetry Toggle */}
        <button
          onClick={() => setAudioTelemetryEnabled(!audioTelemetryEnabled)}
          className={`relative flex items-center justify-center w-10 h-10 rounded-xl border transition-all cursor-pointer ${
            audioTelemetryEnabled 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]' 
              : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
          }`}
          title="Toggle Generative Audio Telemetry"
        >
          {audioTelemetryEnabled ? (
            <div className="flex items-center gap-0.5 justify-center w-full h-full">
              <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-0.5 h-4.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Global Warning Status */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-400 transition-all hover:bg-white/10">
          <Bell className="w-4 h-4" />
          {totalAlerts > 0 ? (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          ) : (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </div>
      </div>
    </header>
  );
};
