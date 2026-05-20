import React, { useEffect, useRef } from 'react';
import { useWeather } from '../context/WeatherContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const WeatherBackground: React.FC = () => {
  const { selectedCity, activePage } = useWeather();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // We determine condition (default: Sunny)
  const condition = selectedCity?.condition || 'Sunny';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle pool
    const particles: Particle[] = [];
    const maxParticles = condition === 'Rain' || condition === 'Thunderstorm' ? 120 : 60;
    
    // Reset/Initialize particles
    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < maxParticles; i++) {
        particles.push(createParticle(true));
      }
    };

    const createParticle = (randomY = false): Particle => {
      const pY = randomY ? Math.random() * height : -10;
      if (condition === 'Rain' || condition === 'Thunderstorm') {
        return {
          x: Math.random() * width,
          y: pY,
          vx: (Math.random() * 2 - 1) - 2, // falling slightly left
          vy: Math.random() * 15 + 20, // fast fall
          size: Math.random() * 1.5 + 0.8,
          alpha: Math.random() * 0.4 + 0.3,
          color: 'rgba(156, 163, 175, 0.6)'
        };
      } else if (condition === 'Fog') {
        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.5 + height * 0.5, // bottom half mostly
          vx: Math.random() * 0.4 + 0.1, // slow drift right
          vy: (Math.random() * 0.2 - 0.1),
          size: Math.random() * 60 + 50, // huge soft blobs
          alpha: Math.random() * 0.12 + 0.03,
          color: 'rgba(203, 213, 225, 0.4)'
        };
      } else if (condition === 'Clouds') {
        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.4, // upper half mostly
          vx: Math.random() * 0.3 + 0.05, // very slow drift
          vy: 0,
          size: Math.random() * 120 + 80, // enormous cloud blobs
          alpha: Math.random() * 0.08 + 0.02,
          color: 'rgba(255, 255, 255, 0.3)'
        };
      } else {
        // Sunny (gentle floating amber/cyan dust particles)
        return {
          x: Math.random() * width,
          y: randomY ? Math.random() * height : height + 10,
          vx: Math.random() * 1 - 0.5,
          vy: -(Math.random() * 1.2 + 0.5), // float up
          size: Math.random() * 3 + 1,
          alpha: Math.random() * 0.4 + 0.1,
          color: Math.random() > 0.5 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(6, 182, 212, 0.2)'
        };
      }
    };

    initParticles();

    // Flash trigger for Thunderstorm
    let flashOpacity = 0;
    let nextFlashFrame = 120 + Math.random() * 300;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      // Background base gradient
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Deep atmospheric space glow
      const radialGlow = ctx.createRadialGradient(
        width / 2, height / 2, 10, 
        width / 2, height / 2, Math.max(width, height)
      );
      
      // Dynamic dark radial atmosphere
      if (condition === 'Sunny') {
        radialGlow.addColorStop(0, '#0a1628');
        radialGlow.addColorStop(0.5, '#040b17');
        radialGlow.addColorStop(1, '#030712');
      } else if (condition === 'Rain' || condition === 'Thunderstorm') {
        radialGlow.addColorStop(0, '#060d1b');
        radialGlow.addColorStop(0.6, '#03070f');
        radialGlow.addColorStop(1, '#02040a');
      } else if (condition === 'Fog') {
        radialGlow.addColorStop(0, '#0c1524');
        radialGlow.addColorStop(0.7, '#050a12');
        radialGlow.addColorStop(1, '#030712');
      } else {
        // Clouds
        radialGlow.addColorStop(0, '#081222');
        radialGlow.addColorStop(0.6, '#040914');
        radialGlow.addColorStop(1, '#030712');
      }
      
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw sun flare rotation if sunny
      if (condition === 'Sunny' && activePage === 'landing') {
        ctx.save();
        ctx.translate(width * 0.85, height * 0.15);
        ctx.rotate(Date.now() * 0.00003);
        
        // Sun core
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.shadowBlur = 120;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();

        // Rays (light gradients)
        for (let r = 0; r < 8; r++) {
          ctx.rotate(Math.PI / 4);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(25, -200);
          ctx.lineTo(-25, -200);
          ctx.closePath();
          
          const rayGrad = ctx.createLinearGradient(0, 0, 0, -200);
          rayGrad.addColorStop(0, 'rgba(245, 158, 11, 0.05)');
          rayGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = rayGrad;
          ctx.fill();
        }
        ctx.restore();
      }

      // Handle lightning flashes for Thunderstorm
      if (condition === 'Thunderstorm') {
        nextFlashFrame--;
        if (nextFlashFrame <= 0) {
          flashOpacity = Math.random() * 0.5 + 0.3; // bright flash!
          nextFlashFrame = 150 + Math.random() * 400; // time until next flash
        }

        if (flashOpacity > 0) {
          // Draw flash
          ctx.fillStyle = `rgba(6, 182, 212, ${flashOpacity})`;
          ctx.fillRect(0, 0, width, height);
          
          // Fast exponential decay
          flashOpacity *= 0.88;
          if (flashOpacity < 0.01) flashOpacity = 0;
        }
      }

      // Update and Draw Particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Draw particle
        ctx.beginPath();
        if (condition === 'Rain' || condition === 'Thunderstorm') {
          // Rain drops are lines
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.vy * 0.8);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.stroke();
        } else if (condition === 'Fog' || condition === 'Clouds') {
          // Soft radial gradient blob
          const blobGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          blobGrad.addColorStop(0, p.color);
          blobGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = blobGrad;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sunny amber dust is circles
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }

        // Boundary recycling
        let isOutOfBounds = false;
        if (condition === 'Rain' || condition === 'Thunderstorm') {
          if (p.y > height || p.x < -20 || p.x > width + 20) isOutOfBounds = true;
        } else if (condition === 'Fog' || condition === 'Clouds') {
          if (p.x - p.size > width) isOutOfBounds = true;
        } else {
          // Sunny (floating up)
          if (p.y < -10 || p.x < -10 || p.x > width + 10) isOutOfBounds = true;
        }

        if (isOutOfBounds) {
          particles[idx] = createParticle();
        }
      });

      // Ambient HUD grid scanlines overlay (faint horizontal bars for tech aesthetic)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.005)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [condition, activePage]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
    />
  );
};
