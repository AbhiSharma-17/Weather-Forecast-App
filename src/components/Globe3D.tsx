import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useWeather } from '../context/WeatherContext';

export const Globe3D: React.FC = () => {
  const { cities, selectedCityName, setSelectedCityName } = useWeather();
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Track references for drag operations
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const globeGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Dimensions
    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.08);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 15;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x06b6d4, 2.5); // Cyan light
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, 1.5); // Indigo light
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 5. Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    const globeRadius = 4.5;

    // Create dynamic thermal canvas texture
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 1024;
    texCanvas.height = 512;
    const texCtx = texCanvas.getContext('2d');
    if (texCtx) {
      texCtx.fillStyle = '#050810';
      texCtx.fillRect(0, 0, 1024, 512);

      // Generate random thermal weather blobs
      for (let i = 0; i < 8; i++) {
        const cx = Math.random() * 1024;
        const cy = Math.random() * 512;
        const r = 80 + Math.random() * 200;
        const grad = texCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
        
        // Randomize heat/cold colors based on mock temperatures
        const isHot = Math.random() > 0.4;
        const hue = isHot ? 'rgba(225, 29, 72,' : 'rgba(6, 182, 212,'; // Hot rose vs Cold cyan
        const intensity = (0.2 + Math.random() * 0.5).toFixed(2);
        
        grad.addColorStop(0, `${hue}${intensity})`);
        grad.addColorStop(1, `${hue}0)`);
        
        texCtx.fillStyle = grad;
        texCtx.beginPath();
        texCtx.arc(cx, cy, r, 0, Math.PI * 2);
        texCtx.fill();
      }
      
      // Add digital scanline pattern overlay
      texCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let y = 0; y < 512; y += 4) {
        texCtx.fillRect(0, y, 1024, 1);
      }
    }
    const thermalTexture = new THREE.CanvasTexture(texCanvas);
    thermalTexture.colorSpace = THREE.SRGBColorSpace;

    // Base Sphere Core
    const sphereGeo = new THREE.SphereGeometry(globeRadius, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: thermalTexture,
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.95,
    });
    const sphereCore = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphereCore);

    // Latitude / Longitude Holographic Grid lines
    const gridGeo = new THREE.SphereGeometry(globeRadius + 0.02, 24, 24);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    globeGroup.add(grid);

    // Outer faint shield
    const shieldGeo = new THREE.SphereGeometry(globeRadius + 0.3, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.05,
      wireframe: true
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    globeGroup.add(shield);

    // Particle Cloud (dots)
    const pointsCount = 400;
    const pointsGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(pointsCount * 3);
    for (let i = 0; i < pointsCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = globeRadius + 0.05;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.05,
      transparent: true,
      opacity: 0.4
    });
    const points = new THREE.Points(pointsGeo, pointsMat);
    globeGroup.add(points);

    // 6. Map Cities onto the Globe
    const convertCoords = (lat: number, lon: number, radius: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.sin(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);
      return new THREE.Vector3(x, y, z);
    };

    const pinGroups: { name: string; mesh: THREE.Group; alertLevel: string; isSelected: boolean }[] = [];

    cities.forEach(city => {
      const [lon, lat] = city.coordinates;
      const pos = convertCoords(lat, lon, globeRadius + 0.05);

      const pinGroup = new THREE.Group();
      pinGroup.position.copy(pos);
      
      // Orient the pin to look outward from the center
      const pinDirection = pos.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, pinDirection);
      pinGroup.quaternion.copy(quaternion);

      // Alert level colors
      const hasAlert = city.alerts.length > 0;
      const isCritical = city.alerts.some(a => a.level === 'Critical' || a.level === 'High');
      const isSelected = city.name.startsWith(selectedCityName);
      
      let beaconColor = 0x06b6d4; // Cyan default
      if (hasAlert) {
        beaconColor = isCritical ? 0xf43f5e : 0xf59e0b; // Rose or Amber
      }
      if (isSelected) {
        beaconColor = 0xffffff; // White center
      }

      // Draw center core dot
      const pinCoreGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const pinCoreMat = new THREE.MeshBasicMaterial({ color: beaconColor });
      const pinCore = new THREE.Mesh(pinCoreGeo, pinCoreMat);
      pinGroup.add(pinCore);

      // Draw outer glowing halo rings
      const ringGeo = new THREE.RingGeometry(0.1, 0.22, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: hasAlert ? (isCritical ? 0xf43f5e : 0xf59e0b) : 0x06b6d4,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2; // Flat relative to pin surface
      pinGroup.add(ring);

      globeGroup.add(pinGroup);
      pinGroups.push({
        name: city.name,
        mesh: pinGroup,
        alertLevel: hasAlert ? (isCritical ? 'Critical' : 'Medium') : 'None',
        isSelected
      });
    });

    // 7. Mouse / Touch Events (Rotation drag)
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !globeGroup) return;

      const deltaMove = {
        x: e.clientX - previousMousePosition.current.x,
        y: e.clientY - previousMousePosition.current.y
      };

      // Drag coefficients
      globeGroup.rotation.y += deltaMove.x * 0.005;
      globeGroup.rotation.x += deltaMove.y * 0.005;

      previousMousePosition.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    // Touch events for mobile support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || !globeGroup || e.touches.length !== 1) return;

      const deltaMove = {
        x: e.touches[0].clientX - previousMousePosition.current.x,
        y: e.touches[0].clientY - previousMousePosition.current.y
      };

      globeGroup.rotation.y += deltaMove.x * 0.006;
      globeGroup.rotation.x += deltaMove.y * 0.006;

      previousMousePosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    currentMount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    currentMount.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    // 8. Resize Handler
    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Auto rotation when user is not dragging
      if (!isDragging.current && globeGroup) {
        globeGroup.rotation.y += 0.0018;
      }

      // Animate pulsing halo rings for city beacons
      pinGroups.forEach(pin => {
        const ring = pin.mesh.children[1] as THREE.Mesh;
        if (ring) {
          // Pulse scale based on alert level
          let scaleFactor = 1;
          if (pin.isSelected) {
            scaleFactor = 1.0 + Math.sin(elapsed * 5) * 0.3; // fast pulse
          } else if (pin.alertLevel === 'Critical') {
            scaleFactor = 1.0 + Math.sin(elapsed * 8) * 0.5; // frantic flash
          } else if (pin.alertLevel === 'Medium') {
            scaleFactor = 1.0 + Math.sin(elapsed * 4) * 0.25; // moderate pulse
          } else {
            scaleFactor = 1.0 + Math.sin(elapsed * 2) * 0.12; // slow drift
          }
          ring.scale.set(scaleFactor, scaleFactor, 1);
          
          // Animate ring opacity
          const mat = ring.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.8 - (scaleFactor - 0.7) * 0.6;
        }
      });

      // Animate dot cloud
      points.rotation.y = elapsed * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      currentMount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      currentMount.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);

      window.removeEventListener('resize', handleResize);
      
      // Memory cleanup
      sphereGeo.dispose();
      sphereMat.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      shieldGeo.dispose();
      shieldMat.dispose();
      pointsGeo.dispose();
      pointsMat.dispose();

      pinGroups.forEach(pin => {
        pin.mesh.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            child.material.dispose();
          }
        });
      });

      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cities, selectedCityName]);

  // Click handler to select a city from the list
  const handleCitySelect = (cityName: string) => {
    setSelectedCityName(cityName);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-full h-[380px] sm:h-[450px] cursor-grab active:cursor-grabbing"
      />

      {/* Floating HUD controls underneath */}
      <div className="absolute bottom-2 flex flex-wrap gap-2 justify-center px-4 z-10">
        {cities.map(c => {
          const isSelected = c.name.startsWith(selectedCityName);
          const hasAlert = c.alerts.length > 0;
          return (
            <button
              key={c.name}
              onClick={() => handleCitySelect(c.name)}
              className={`px-2.5 py-1 text-xs font-display rounded-full border transition-all duration-300 backdrop-blur-md cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : hasAlert
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                isSelected
                  ? 'bg-cyan-400 animate-ping'
                  : hasAlert
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-gray-500'
              }`} />
              {c.name.split(' ')[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
