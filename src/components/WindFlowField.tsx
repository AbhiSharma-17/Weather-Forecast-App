import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  speed: number;
  length: number;
  angleOffset: number;
}

interface WindFlowFieldProps {
  windSpeed: number; // in km/h
  windDirection: string; // e.g. "N", "NE", "E", "S", "W"
}

export const WindFlowField: React.FC<WindFlowFieldProps> = ({ windSpeed, windDirection }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Map compass directions to angles in radians
  const getDirectionAngle = (dir: string): number => {
    const d = dir.toUpperCase();
    if (d.includes('N') && d.includes('E')) return -Math.PI / 4;
    if (d.includes('S') && d.includes('E')) return Math.PI / 4;
    if (d.includes('S') && d.includes('W')) return 3 * Math.PI / 4;
    if (d.includes('N') && d.includes('W')) return -3 * Math.PI / 4;
    if (d.startsWith('N')) return -Math.PI / 2;
    if (d.startsWith('E')) return 0;
    if (d.startsWith('S')) return Math.PI / 2;
    if (d.startsWith('W')) return Math.PI;
    return 0; // default East
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 250);
    let height = (canvas.height = 100);

    const resize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || 250;
      height = canvas.height = 100;
    };
    window.addEventListener('resize', resize);

    // Dynamic configuration based on wind speed
    const baseSpeed = Math.max(0.8, windSpeed / 12);
    const particleCount = Math.min(100, Math.round(15 + windSpeed * 0.8));
    const targetAngle = getDirectionAngle(windDirection);

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: baseSpeed * (0.6 + Math.random() * 0.8),
      length: Math.max(5, 5 + Math.random() * windSpeed * 0.3),
      angleOffset: (Math.random() * 2 - 1) * 0.15 // slight individual variance
    }));

    const draw = () => {
      // Clear with transparency to create glowing trails
      ctx.fillStyle = 'rgba(3, 7, 18, 0.12)';
      ctx.fillRect(0, 0, width, height);

      // Draw particle trails
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 4;

      particles.forEach((p) => {
        // Compute direction + noise
        const flowAngle = targetAngle + Math.sin(p.x * 0.05 + p.y * 0.05) * 0.12 + p.angleOffset;
        
        // Calculate velocity
        const vx = Math.cos(flowAngle) * p.speed;
        const vy = Math.sin(flowAngle) * p.speed;

        // Draw line segment
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.25 + (p.speed / baseSpeed) * 0.35})`; // indigo
        ctx.shadowColor = '#6366f1';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - vx * p.length * 0.2, p.y - vy * p.length * 0.2);
        ctx.stroke();

        // Update positions
        p.x += vx;
        p.y += vy;

        // Wrap around borders
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [windSpeed, windDirection]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-[100px] rounded-xl bg-slate-950/30 border border-white/5" 
    />
  );
};
