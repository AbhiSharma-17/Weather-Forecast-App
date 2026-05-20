import React from 'react';
import { useWeather } from '../context/WeatherContext';
import { 
  Globe, 
  LayoutDashboard, 
  CloudSun, 
  ShieldAlert, 
  Leaf, 
  BarChart3, 
  MessageSquareCode, 
  SlidersHorizontal,
  MapPin
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, cities } = useWeather();

  const menuItems: SidebarItem[] = [
    { id: 'landing', label: 'Climate Portal', icon: Globe },
    { id: 'dashboard', label: 'Telemetry Overview', icon: LayoutDashboard },
    { id: 'forecast', label: 'Predictive Forecast', icon: CloudSun },
    { id: 'map', label: 'GIS Satellite Map', icon: MapPin },
    { id: 'disaster', label: 'Disaster Monitoring', icon: ShieldAlert },
    { id: 'aqi', label: 'Environmental AQI', icon: Leaf },
    { id: 'historical', label: 'Historical Reports', icon: BarChart3 },
    { id: 'ai-assistant', label: 'Climate AI Agent', icon: MessageSquareCode },
    { id: 'admin', label: 'System Control', icon: SlidersHorizontal },
  ];

  // Count active emergency alerts to show badge
  const totalAlerts = cities.reduce((acc, city) => acc + city.alerts.length, 0);

  return (
    <aside className="w-20 md:w-64 glass-panel border-r border-white/5 h-screen sticky top-0 flex flex-col justify-between py-6 z-30 transition-all duration-300">
      {/* Brand Header */}
      <div className="flex items-center px-4 md:px-6 gap-3 select-none">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] flex-shrink-0 animate-pulse-slow">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div className="hidden md:block">
          <h1 className="font-display font-bold text-base tracking-wider text-glow-cyan text-cyan-200">
            CLIMATEVISION
          </h1>
          <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400/70">
            AI MONITORING
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 my-8 px-3 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-center md:justify-start px-3 py-3 rounded-xl transition-all duration-300 group cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-200 border-l-4 border-cyan-400 shadow-[inset_0_0_8px_rgba(6,182,212,0.05)] font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-l-4 border-transparent'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-cyan-300' : 'text-gray-400'
                }`} />
                {/* Specific Badge for Alert Center */}
                {item.id === 'disaster' && totalAlerts > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-[10px] text-white w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold animate-pulse font-mono border border-dark-bg">
                    {totalAlerts}
                  </span>
                )}
              </div>
              <span className="hidden md:block ml-4 text-sm tracking-wide font-display font-light">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="px-4 text-center hidden md:block select-none">
        <div className="bg-slate-900/40 rounded-xl p-3 border border-white/5">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-mono text-emerald-400 tracking-wider">
              TELEMETRY SYNCED
            </span>
          </div>
          <span className="text-[9px] font-mono text-gray-500">
            V4.8.2 // SECURE CONNECTION
          </span>
        </div>
      </div>
    </aside>
  );
};
