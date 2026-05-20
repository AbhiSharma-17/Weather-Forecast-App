import React, { Suspense } from 'react';
import { WeatherProvider, useWeather } from './context/WeatherContext';
import { WeatherBackground } from './components/WeatherBackground';
import { AudioTelemetry } from './components/AudioTelemetry';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Cpu } from 'lucide-react';

// Lazy loaded page components
const Landing = React.lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Forecast = React.lazy(() => import('./pages/Forecast').then(m => ({ default: m.Forecast })));
const Disaster = React.lazy(() => import('./pages/Disaster').then(m => ({ default: m.Disaster })));
const Aqi = React.lazy(() => import('./pages/Aqi').then(m => ({ default: m.Aqi })));
const Historical = React.lazy(() => import('./pages/Historical').then(m => ({ default: m.Historical })));
const AiAssistant = React.lazy(() => import('./pages/AiAssistant').then(m => ({ default: m.AiAssistant })));
const Admin = React.lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Globe = React.lazy(() => import('./pages/Globe').then(m => ({ default: m.Globe })));

const SuspenseFallback = () => (
  <div className="w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-950 text-cyan-400 select-none">
    <div className="relative">
      <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-ping" />
      <div className="w-20 h-20 border border-cyan-500/50 rounded-full flex items-center justify-center bg-cyan-950/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
        <Cpu className="w-8 h-8 animate-pulse text-cyan-300" />
      </div>
    </div>
    <div className="mt-8 flex items-center gap-3">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="font-mono text-sm tracking-[0.3em] uppercase">Loading Telemetry Matrices...</span>
    </div>
  </div>
);

const MainAppContent: React.FC = () => {
  const { activePage } = useWeather();

  const renderActivePage = () => {
    let Component;
    switch (activePage) {
      case 'landing': Component = Landing; break;
      case 'dashboard': Component = Dashboard; break;
      case 'forecast': Component = Forecast; break;
      case 'map': Component = Globe; break;
      case 'disaster': Component = Disaster; break;
      case 'aqi': Component = Aqi; break;
      case 'historical': Component = Historical; break;
      case 'ai-assistant': Component = AiAssistant; break;
      case 'admin': Component = Admin; break;
      default: Component = Dashboard; break;
    }
    
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <Component />
      </Suspense>
    );
  };

  // If we are on the landing page, we want a full screen display without sidebar/navbar
  if (activePage === 'landing') {
    return (
      <div className="relative w-full min-h-screen overflow-x-hidden">
        <WeatherBackground />
        <AnimatePresence mode="wait">
          <motion.main
            key={activePage}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            {renderActivePage()}
          </motion.main>
        </AnimatePresence>
      </div>
    );
  }

  // Dashboard / analytics dashboard layout
  return (
    <div className="relative flex w-full min-h-screen overflow-hidden bg-dark-bg text-gray-100">
      
      {/* Dynamic weather particles in the background */}
      <WeatherBackground />

      {/* Navigation sidebar */}
      <Sidebar />

      {/* Main console content deck */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Navigation telemetry bar */}
        <Navbar />

        {/* Dynamic page wrapper with custom animations */}
        <main className="flex-1 overflow-y-auto bg-slate-950/10 backdrop-blur-[2px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="w-full h-full"
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <WeatherProvider>
      <AudioTelemetry />
      <MainAppContent />
    </WeatherProvider>
  );
}

export default App;
