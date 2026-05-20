import React, { useState, useRef, useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';
import { Send, Trash2, Cpu, Terminal, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AiAssistant: React.FC = () => {
  const { chatHistory, sendChatMessage, clearChatHistory, selectedCityName, setActivePage } = useWeather();
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setIsTyping(true);

    // Dynamic typing delay simulation
    await sendChatMessage(userMessage);
    setIsTyping(false);
  };

  const handlePresetQuery = async (query: string) => {
    setIsTyping(true);
    await sendChatMessage(query);
    setIsTyping(false);
  };

  const presets = [
    { label: "Rain ForecastTomorrow", query: "Will it rain tomorrow?" },
    { label: "Agriculture Suitability", query: "Is the weather suitable for farming crops?" },
    { label: "Active Disaster Status", query: "Are there any active weather hazard alerts?" },
    { label: "Bio Air Quality Index", query: "Detail the particulate AQI pollution metrics." }
  ];

  return (
    <div className="p-6 h-[calc(100vh-80px)] max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 select-none overflow-hidden relative">

      {/* Global Close Button */}
      <button 
        onClick={() => setActivePage('dashboard')}
        className="absolute top-6 right-6 z-50 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-gray-400 transition-all cursor-pointer shadow-lg"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Left panel: HUD controls, presets, stats */}
      <div className="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0">
        
        {/* Assistant Header Card */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg animate-pulse-slow">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-medium text-cyan-200">CLIMATEVISION AI</h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                NODE_AGENT_ONLINE
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 font-sans font-light mt-3 leading-relaxed">
            Direct interface to the cognitive climate processing node. Can run queries matching weather models, soil moisture levels, and regional hazard warnings.
          </p>
        </div>

        {/* Quick telemetry presets */}
        <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold">PRESET MACRO QUERIES</span>
            </div>
            <div className="space-y-2 mt-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetQuery(p.query)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 text-[11px] font-mono text-gray-300 transition-all cursor-pointer truncate"
                >
                  &gt; {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-4 space-y-2 text-[10px] font-mono text-gray-500">
            <div className="flex items-center justify-between">
              <span>TARGET CONTEXT:</span>
              <span className="text-cyan-400 font-bold uppercase">{selectedCityName.split(' ')[0]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>NLP LATENCY:</span>
              <span className="text-emerald-400">14ms</span>
            </div>
          </div>
        </div>

      </div>

      {/* Right panel: Chat dialogue board */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Board Header */}
        <div className="px-5 py-4 border-b border-white/5 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider">COGNITIVE STREAM TELEMETRY</span>
          </div>

          <button
            onClick={clearChatHistory}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
            title="Wipe Telemetry History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Dialogues list */}
        <div 
          ref={scrollRef}
          className="flex-1 p-5 overflow-y-auto space-y-4"
        >
          <AnimatePresence initial={false}>
            {chatHistory.map((msg) => {
              const isAi = msg.sender.startsWith("ClimateVision");
              return (
                <motion.div
                  key={msg.id}
                  className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`max-w-xl p-3.5 rounded-2xl text-xs font-mono border relative overflow-hidden leading-relaxed ${
                    isAi
                      ? 'bg-slate-900/60 border-cyan-500/15 text-cyan-100 rounded-bl-none shadow-[0_4px_15px_rgba(6,182,212,0.02)]'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100 rounded-br-none'
                  }`}>
                    {isAi && (
                      <div className="absolute top-0 right-0 px-2 py-0.5 bg-cyan-500/10 text-[8px] text-cyan-400 font-bold border-l border-b border-cyan-500/15 uppercase tracking-widest font-mono">
                        CORE_RESPONSE
                      </div>
                    )}
                    <span className="block font-bold text-[9px] text-gray-500 uppercase tracking-widest mb-1.5 font-mono">
                      {msg.sender} // {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="whitespace-pre-line">{msg.message}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-900/60 border border-white/5 p-3.5 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-white/5 bg-slate-950/40">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ASK TELEMETRY GRID... (e.g. Will it rain tomorrow?)"
              className="flex-1 bg-slate-950/80 border border-white/10 hover:border-cyan-400/50 text-cyan-200 text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-400 transition-all font-mono placeholder-cyan-800"
            />
            <button
              type="submit"
              className="px-5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 border border-cyan-300/10 flex items-center justify-center text-white cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all hover:scale-[1.02]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
