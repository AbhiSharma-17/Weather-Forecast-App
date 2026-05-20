import React, { useEffect, useRef } from 'react';
import { useWeather } from '../context/WeatherContext';

export const AudioTelemetry: React.FC = () => {
  const { selectedCity, audioTelemetryEnabled } = useWeather();
  
  // Keep refs for Web Audio API nodes to modify them in real-time
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Ambient Master Gain & Nodes
  const masterGainRef = useRef<GainNode | null>(null);
  const droneOsc1Ref = useRef<OscillatorNode | null>(null);
  const droneOsc2Ref = useRef<OscillatorNode | null>(null);
  const weatherGainRef = useRef<GainNode | null>(null);
  
  // Rain/Noise Nodes
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseFilterRef = useRef<BiquadFilterNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);
  
  // Solar/Sunny Nodes
  const solarOscRef = useRef<OscillatorNode | null>(null);
  const solarLfoRef = useRef<OscillatorNode | null>(null);
  const solarGainRef = useRef<GainNode | null>(null);
  
  // Alert/Pinger Interval
  const alertIntervalRef = useRef<number | null>(null);

  // Helper to generate pink/white noise buffer
  const createNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter approximation
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // scale volume down
      b6 = white * 0.115926;
    }
    return buffer;
  };

  useEffect(() => {
    if (!audioTelemetryEnabled) {
      cleanupAudio();
      return;
    }

    // Initialize Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // Master telemetry gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.5); // smooth fade-in
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // 1. Core Sci-Fi Grid Drone (Dual detuned oscillators for phasing effect)
    const droneOsc1 = ctx.createOscillator();
    const droneOsc2 = ctx.createOscillator();
    const droneGain = ctx.createGain();
    
    droneOsc1.type = 'triangle';
    droneOsc1.frequency.setValueAtTime(65.41, ctx.currentTime); // C2 note
    
    droneOsc2.type = 'sawtooth';
    droneOsc2.frequency.setValueAtTime(65.95, ctx.currentTime); // slightly detuned
    
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(120, ctx.currentTime);
    
    droneGain.gain.setValueAtTime(0.08, ctx.currentTime);
    
    droneOsc1.connect(droneFilter);
    droneOsc2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);
    
    droneOsc1.start();
    droneOsc2.start();
    
    droneOsc1Ref.current = droneOsc1;
    droneOsc2Ref.current = droneOsc2;

    // 2. Weather Specific Gain Nodes
    const weatherGain = ctx.createGain();
    weatherGain.gain.setValueAtTime(0.1, ctx.currentTime);
    weatherGain.connect(masterGain);
    weatherGainRef.current = weatherGain;

    // Setup Noise Engine (for Rain / Wind)
    const noiseBuffer = createNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(400, ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.0, ctx.currentTime);
    
    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0, ctx.currentTime);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(rainGain);
    rainGain.connect(weatherGain);
    
    noiseSource.start();
    
    noiseSourceRef.current = noiseSource;
    noiseFilterRef.current = noiseFilter;
    rainGainRef.current = rainGain;

    // Setup Solar Engine (for Sunny / Radiation hum)
    const solarOsc = ctx.createOscillator();
    solarOsc.type = 'sine';
    solarOsc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note (sunny frequency)
    
    const solarLfo = ctx.createOscillator();
    const solarLfoGain = ctx.createGain();
    solarLfo.frequency.setValueAtTime(0.15, ctx.currentTime); // slow pulse LFO
    solarLfoGain.gain.setValueAtTime(5, ctx.currentTime);
    
    const solarGain = ctx.createGain();
    solarGain.gain.setValueAtTime(0, ctx.currentTime);
    
    solarLfo.connect(solarLfoGain);
    solarLfoGain.connect(solarOsc.frequency); // modulate pitch slightly for shimmer
    solarOsc.connect(solarGain);
    solarGain.connect(weatherGain);
    
    solarOsc.start();
    solarLfo.start();
    
    solarOscRef.current = solarOsc;
    solarLfoRef.current = solarLfo;
    solarGainRef.current = solarGain;

    // 3. Telemetry Warning Alert Beeper Loop (once every 12s)
    const scheduleAlertBeep = () => {
      alertIntervalRef.current = window.setInterval(() => {
        if (!ctx || ctx.state === 'closed' || !selectedCity) return;
        if (selectedCity.alerts.length > 0) {
          // Play telemetry alarm chime
          const alarmOsc = ctx.createOscillator();
          const alarmGain = ctx.createGain();
          
          alarmOsc.type = 'sine';
          alarmOsc.frequency.setValueAtTime(950, ctx.currentTime);
          alarmOsc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.1);
          
          alarmGain.gain.setValueAtTime(0, ctx.currentTime);
          alarmGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
          alarmGain.gain.exponentialRampToValueAtTime(0, ctx.currentTime + 0.3);
          
          alarmOsc.connect(alarmGain);
          alarmGain.connect(masterGain);
          
          alarmOsc.start();
          alarmOsc.stop(ctx.currentTime + 0.45);
        }
      }, 12000);
    };
    
    scheduleAlertBeep();

    return () => {
      cleanupAudio();
    };
  }, [audioTelemetryEnabled]);

  // Handle weather changes in real-time
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === 'closed' || !selectedCity || !audioTelemetryEnabled) return;

    const currentCondition = selectedCity.condition;
    const windSpeed = selectedCity.windSpeed;
    const temp = selectedCity.temperature;

    // Modulate Core Drone Pitch slightly based on city temp
    if (droneOsc1Ref.current && droneOsc2Ref.current) {
      const targetFreq1 = 65.41 + (temp - 20) * 0.25; // pitch up/down with temp
      const targetFreq2 = 65.95 + (temp - 20) * 0.25;
      droneOsc1Ref.current.frequency.setTargetAtTime(targetFreq1, ctx.currentTime, 1.0);
      droneOsc2Ref.current.frequency.setTargetAtTime(targetFreq2, ctx.currentTime, 1.0);
    }

    // Set weather sound balances
    if (rainGainRef.current && noiseFilterRef.current && solarGainRef.current) {
      if (currentCondition === 'Rain' || currentCondition === 'Thunderstorm') {
        // Activate Rain Noise
        rainGainRef.current.gain.setTargetAtTime(0.25, ctx.currentTime, 0.8);
        solarGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
        
        // Modulate rain noise filter with wind speed
        const filterCutoff = 350 + windSpeed * 8;
        noiseFilterRef.current.frequency.setTargetAtTime(filterCutoff, ctx.currentTime, 0.4);
      } else if (currentCondition === 'Sunny') {
        // Activate Shimmering Solar Osc
        rainGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
        solarGainRef.current.gain.setTargetAtTime(0.04, ctx.currentTime, 1.0);
      } else if (currentCondition === 'Fog' || currentCondition === 'Clouds') {
        // Muted environment - slight low wind rumble
        rainGainRef.current.gain.setTargetAtTime(0.06, ctx.currentTime, 1.0);
        solarGainRef.current.gain.setTargetAtTime(0.01, ctx.currentTime, 1.0);
        noiseFilterRef.current.frequency.setTargetAtTime(250, ctx.currentTime, 0.8);
      } else {
        // Default calm state
        rainGainRef.current.gain.setTargetAtTime(0.02, ctx.currentTime, 1.0);
        solarGainRef.current.gain.setTargetAtTime(0.02, ctx.currentTime, 1.0);
        noiseFilterRef.current.frequency.setTargetAtTime(300, ctx.currentTime, 1.0);
      }
    }

    // Handle Thunderstorm lightning sound discharges randomly
    let thunderTimer: number | null = null;
    if (currentCondition === 'Thunderstorm') {
      const playThunderRumble = () => {
        if (!ctx || ctx.state === 'closed' || selectedCity.condition !== 'Thunderstorm') return;
        
        const rumbleOsc = ctx.createOscillator();
        const rumbleFilter = ctx.createBiquadFilter();
        const rumbleGain = ctx.createGain();

        rumbleOsc.type = 'sawtooth';
        rumbleOsc.frequency.setValueAtTime(35, ctx.currentTime); // low rumble
        
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.setValueAtTime(80, ctx.currentTime);
        
        rumbleGain.gain.setValueAtTime(0, ctx.currentTime);
        rumbleGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.1); // quick strike
        rumbleGain.gain.exponentialRampToValueAtTime(0, ctx.currentTime + 3.0); // long decay
        
        rumbleOsc.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        rumbleGain.connect(ctx.destination);

        rumbleOsc.start();
        rumbleOsc.stop(ctx.currentTime + 3.2);

        // Schedule next lightning rumble between 15-30s
        const nextTime = Math.random() * 15000 + 15000;
        thunderTimer = window.setTimeout(playThunderRumble, nextTime);
      };
      
      // Delay first strike
      thunderTimer = window.setTimeout(playThunderRumble, 5000);
    }

    return () => {
      if (thunderTimer) clearTimeout(thunderTimer);
    };
  }, [selectedCity?.name, selectedCity?.condition, selectedCity?.windSpeed, selectedCity?.temperature, audioTelemetryEnabled]);

  const cleanupAudio = () => {
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }
    
    // Stop all oscillators
    try { droneOsc1Ref.current?.stop(); } catch {}
    try { droneOsc2Ref.current?.stop(); } catch {}
    try { noiseSourceRef.current?.stop(); } catch {}
    try { solarOscRef.current?.stop(); } catch {}
    try { solarLfoRef.current?.stop(); } catch {}

    droneOsc1Ref.current = null;
    droneOsc2Ref.current = null;
    noiseSourceRef.current = null;
    solarOscRef.current = null;
    solarLfoRef.current = null;

    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    }
  };

  return null; // Silent controller component
};
