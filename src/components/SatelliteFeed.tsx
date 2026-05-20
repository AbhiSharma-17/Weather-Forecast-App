import React, { useEffect, useRef, useState } from 'react';
import { Radio, Eye, Flame, ShieldAlert, Cpu } from 'lucide-react';

interface SatelliteFeedProps {
  cityName: string;
  condition: string;
}

type ScanMode = 'VIS' | 'IR' | 'REFLECTIVITY' | 'CO2';

export const SatelliteFeed: React.FC<SatelliteFeedProps> = ({ cityName, condition }) => {
  const [mode, setMode] = useState<ScanMode>('IR');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = 200);

    const resize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || 300;
      height = canvas.height = 200;
    };
    window.addEventListener('resize', resize);

    const drawScanner = () => {
      timeRef.current += 0.015;
      const t = timeRef.current;

      // Draw space-black background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Draw grid coordinates
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 25;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Generate cloud/thermal blobs dynamically using math waves
      const blobCount = 3;
      for (let i = 0; i < blobCount; i++) {
        // Compute shifting positions for cloud centers
        const cx = width * 0.5 + Math.sin(t * 0.4 + i) * 60 + Math.cos(t * 0.2 + i * 2) * 15;
        const cy = height * 0.5 + Math.cos(t * 0.35 - i) * 40;
        const radius = 45 + Math.sin(t * 0.2 + i * 3) * 15 + (condition === 'Thunderstorm' || condition === 'Rain' ? 15 : 0);

        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);

        if (mode === 'VIS') {
          // Visible: Soft white/gray translucent cloud layers
          grad.addColorStop(0, 'rgba(241, 245, 249, 0.55)');
          grad.addColorStop(0.5, 'rgba(203, 213, 225, 0.35)');
          grad.addColorStop(1, 'rgba(203, 213, 225, 0)');
        } else if (mode === 'IR') {
          // Thermal Infrared: Shifting heat pockets (Red, Yellow, Cyan, Blue)
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.65)'); // Hot red core
          grad.addColorStop(0.3, 'rgba(245, 158, 11, 0.5)'); // Yellow
          grad.addColorStop(0.6, 'rgba(6, 182, 212, 0.3)'); // Cyan
          grad.addColorStop(0.85, 'rgba(59, 130, 246, 0.15)'); // Blue
          grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
        } else if (mode === 'REFLECTIVITY') {
          // Storm Doppler radar: Dense precipitation zones (Green, Yellow, Red)
          if (condition === 'Rain' || condition === 'Thunderstorm') {
            grad.addColorStop(0, 'rgba(220, 38, 38, 0.8)'); // Extreme cell (red)
            grad.addColorStop(0.25, 'rgba(234, 179, 8, 0.65)'); // Moderate (yellow)
            grad.addColorStop(0.6, 'rgba(34, 197, 94, 0.35)'); // Light (green)
            grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
          } else {
            // Calm skies: scattered light green humidity
            grad.addColorStop(0, 'rgba(34, 197, 94, 0.18)');
            grad.addColorStop(0.7, 'rgba(34, 197, 94, 0.05)');
            grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
          }
        } else if (mode === 'CO2') {
          // Carbon Emissions: Glowing carbon plumes from station centers
          const px = width * 0.45;
          const py = height * 0.6;
          const emissionRadius = 70 + Math.sin(t * 0.6) * 10;
          const carbonGrad = ctx.createRadialGradient(px, py, 5, px + Math.sin(t) * 20, py - 20, emissionRadius);
          carbonGrad.addColorStop(0, 'rgba(168, 85, 247, 0.7)'); // Purple plume
          carbonGrad.addColorStop(0.4, 'rgba(236, 72, 153, 0.4)'); // Pink drift
          carbonGrad.addColorStop(0.8, 'rgba(168, 85, 247, 0.08)');
          carbonGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = carbonGrad;
          ctx.beginPath();
          ctx.arc(px + Math.sin(t) * 10, py - 10, emissionRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        if (mode !== 'CO2') {
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Add high-tech scanline sweep overlay
      const scanY = (t * 80) % height;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // HUD readout values overlay
      ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.font = '8px monospace';
      ctx.fillText(`SAT_ID: METEOSAT-EX4`, 10, 18);
      ctx.fillText(`GRID_REF: ${cityName.toUpperCase().substring(0,3)}_CELL`, 10, 28);
      ctx.fillText(`BANDWIDTH: 10.4 GHZ`, 10, 38);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(`TIME_INCR: +${(t * 12).toFixed(1)}s`, width - 85, 18);
      ctx.fillText(`RESOL: 0.38M/PIXEL`, width - 85, 28);
      ctx.fillStyle = mode === 'CO2' || mode === 'IR' ? 'rgba(244, 63, 94, 0.8)' : 'rgba(16, 185, 129, 0.8)';
      ctx.fillText(`STATUS: ONLINE`, width - 85, 38);

      animId = requestAnimationFrame(drawScanner);
    };

    drawScanner();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [mode, condition, cityName]);

  return (
    <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col gap-4 relative">
      
      {/* Top Banner Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest font-bold">
            MULTISPECTRAL IMAGING SCANNER
          </span>
        </div>

        {/* Buttons Group */}
        <div className="flex flex-wrap gap-1.5">
          {(['VIS', 'IR', 'REFLECTIVITY', 'CO2'] as ScanMode[]).map((m) => {
            const isActive = mode === m;
            let icon = <Eye className="w-3 h-3" />;
            if (m === 'IR') icon = <Flame className="w-3 h-3" />;
            if (m === 'REFLECTIVITY') icon = <ShieldAlert className="w-3 h-3" />;
            if (m === 'CO2') icon = <Cpu className="w-3 h-3" />;

            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[9px] flex items-center gap-1 cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    : 'bg-white/5 text-gray-500 border-white/5 hover:text-gray-300'
                }`}
              >
                {icon}
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Render Canvas */}
      <div className="relative border border-white/5 rounded-xl overflow-hidden bg-slate-950/60">
        <canvas ref={canvasRef} className="w-full h-[180px] block" />
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 border border-white/10 text-[9px] font-mono text-cyan-400">
          MODE: {mode === 'CO2' ? 'CO₂ PLUME MAPPING' : mode === 'REFLECTIVITY' ? 'RADAR REFLECTIVITY' : mode === 'IR' ? 'INFRARED RADIATION' : 'VISIBLE WAVE'}
        </div>
      </div>
    </div>
  );
};
