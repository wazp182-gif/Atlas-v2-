import React, { useEffect, useRef } from 'react';

export type AtlasCoreState = 'idle' | 'listening' | 'thinking' | 'projecting' | 'docked';

interface AtlasParticleCoreProps {
  state?: AtlasCoreState;
  size?: number; // width/height in px
  interactive?: boolean;
  className?: string;
  theme?: 'cyber_blue' | 'purple_nebula' | 'pure_cyan';
  onCoreClick?: () => void;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  baseColor: string;
  glowColor: string;
  layer: 'core' | 'inner_ring' | 'outer_sphere' | 'corona_dust';
  pulsePhase: number;
}

export const AtlasParticleCore: React.FC<AtlasParticleCoreProps> = ({
  state = 'idle',
  size = 400,
  interactive = true,
  className = '',
  theme = 'pure_cyan',
  onCoreClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle3D[]>([]);
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean; targetRotX: number; targetRotY: number }>({
    x: 0,
    y: 0,
    isDown: false,
    targetRotX: 0,
    targetRotY: 0,
  });
  const rotRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  // Initialize 3D particle constellation matching user's uploaded images
  useEffect(() => {
    const particles: Particle3D[] = [];
    const sphereRadius = size * 0.38;
    const numOuter = 160;
    const numInner = 80;
    const numCore = 40;
    const numCorona = 90;

    // Palette configurations based on uploaded images
    const palette = {
      cyber_blue: {
        core: '#ffffff',
        coreGlow: '#00e5ff',
        outer: '#38bdf8',
        outerGlow: '#0284c7',
        line: 'rgba(56, 189, 248, ',
        corona: '#818cf8',
      },
      purple_nebula: {
        core: '#ffffff',
        coreGlow: '#c084fc',
        outer: '#a855f7',
        outerGlow: '#3b82f6',
        line: 'rgba(168, 85, 247, ',
        corona: '#e879f9',
      },
      pure_cyan: {
        core: '#ffffff',
        coreGlow: '#22d3ee',
        outer: '#06b6d4',
        outerGlow: '#0891b2',
        line: 'rgba(34, 211, 238, ',
        corona: '#67e8f9',
      },
    }[theme];

    // 1. Outer Sphere (Fibonacci sphere distribution)
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    for (let i = 0; i < numOuter; i++) {
      const y = 1 - (i / (numOuter - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const r = sphereRadius * (0.95 + Math.random() * 0.1);
      particles.push({
        x: x * r,
        y: y * r,
        z: z * r,
        ox: x * r,
        oy: y * r,
        oz: z * r,
        vx: 0,
        vy: 0,
        vz: 0,
        size: 1.8 + Math.random() * 1.6,
        baseColor: Math.random() > 0.3 ? palette.outer : palette.core,
        glowColor: palette.outerGlow,
        layer: 'outer_sphere',
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // 2. Inner Ring / Secondary Orbital Shell
    for (let i = 0; i < numInner; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phiAngle = Math.acos(2.0 * v - 1.0);
      const r = sphereRadius * 0.55 * (0.9 + Math.random() * 0.2);

      const sinPhi = Math.sin(phiAngle);
      const x = r * sinPhi * Math.cos(theta);
      const y = r * sinPhi * Math.sin(theta);
      const z = r * Math.cos(phiAngle);

      particles.push({
        x,
        y,
        z,
        ox: x,
        oy: y,
        oz: z,
        vx: 0,
        vy: 0,
        vz: 0,
        size: 1.4 + Math.random() * 1.5,
        baseColor: '#ffffff',
        glowColor: palette.coreGlow,
        layer: 'inner_ring',
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // 3. Central Core Pulsar Nodes
    for (let i = 0; i < numCore; i++) {
      const r = sphereRadius * 0.22 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phiAngle = Math.acos(2 * Math.random() - 1);

      const sinPhi = Math.sin(phiAngle);
      const x = r * sinPhi * Math.cos(theta);
      const y = r * sinPhi * Math.sin(theta);
      const z = r * Math.cos(phiAngle);

      particles.push({
        x,
        y,
        z,
        ox: x,
        oy: y,
        oz: z,
        vx: 0,
        vy: 0,
        vz: 0,
        size: 2.2 + Math.random() * 2.0,
        baseColor: '#ffffff',
        glowColor: palette.coreGlow,
        layer: 'core',
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // 4. Outer Corona / Quantum Energy Spores
    for (let i = 0; i < numCorona; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phiAngle = Math.acos(2 * Math.random() - 1);
      const r = sphereRadius * (1.1 + Math.random() * 0.45);

      const sinPhi = Math.sin(phiAngle);
      const x = r * sinPhi * Math.cos(theta);
      const y = r * sinPhi * Math.sin(theta);
      const z = r * Math.cos(phiAngle);

      particles.push({
        x,
        y,
        z,
        ox: x,
        oy: y,
        oz: z,
        vx: 0,
        vy: 0,
        vz: 0,
        size: 0.8 + Math.random() * 1.2,
        baseColor: palette.corona,
        glowColor: palette.outerGlow,
        layer: 'corona_dust',
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    particlesRef.current = particles;
  }, [size, theme]);

  // Main Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const fov = size * 0.95;
    const centerX = size / 2;
    const centerY = size / 2;

    const render = () => {
      time += 0.018;
      ctx.clearRect(0, 0, size, size);

      // State-based dynamics
      let speedMult = 1.0;
      let explosionFactor = 0;
      let pulseAmp = 1.0;
      let lineDistLimit = size * 0.17;

      if (state === 'listening') {
        speedMult = 2.4;
        pulseAmp = 1.25 + Math.sin(time * 8) * 0.2;
      } else if (state === 'thinking') {
        speedMult = 4.0;
        pulseAmp = 1.4 + Math.sin(time * 14) * 0.35;
        lineDistLimit = size * 0.22;
      } else if (state === 'projecting') {
        speedMult = 3.5;
        explosionFactor = (Math.sin(time * 5) + 1) * 0.35;
      } else if (state === 'docked') {
        speedMult = 0.7;
        lineDistLimit = size * 0.15;
      }

      // Smooth rotation with mouse influence
      rotRef.current.y += 0.007 * speedMult + mouseRef.current.targetRotY * 0.04;
      rotRef.current.x += 0.004 * speedMult + mouseRef.current.targetRotX * 0.04;
      rotRef.current.z += 0.002 * speedMult;

      // Damp mouse target
      mouseRef.current.targetRotX *= 0.92;
      mouseRef.current.targetRotY *= 0.92;

      const cosY = Math.cos(rotRef.current.y);
      const sinY = Math.sin(rotRef.current.y);
      const cosX = Math.cos(rotRef.current.x);
      const sinX = Math.sin(rotRef.current.x);
      const cosZ = Math.cos(rotRef.current.z);
      const sinZ = Math.sin(rotRef.current.z);

      const projectedPoints: { x: number; y: number; z: number; scale: number; p: Particle3D }[] = [];

      // Transform all 3D particles
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Organic pulse movement
        const currentPulse = Math.sin(time * 3 + p.pulsePhase) * 0.06 * pulseAmp;
        const distScale = (1 + currentPulse) * (1 + explosionFactor);

        let curX = p.ox * distScale;
        let curY = p.oy * distScale;
        let curZ = p.oz * distScale;

        // Turbulence if thinking/projecting
        if (state === 'thinking' || state === 'projecting') {
          curX += Math.sin(time * 10 + p.oy) * 4;
          curY += Math.cos(time * 10 + p.ox) * 4;
        }

        // 3D Matrix Rotation (Y -> X -> Z)
        // Y-axis rotation
        let x1 = curX * cosY + curZ * sinY;
        let y1 = curY;
        let z1 = -curX * sinY + curZ * cosY;

        // X-axis rotation
        let x2 = x1;
        let y2 = y1 * cosX - z1 * sinX;
        let z2 = y1 * sinX + z1 * cosX;

        // Z-axis rotation
        let x3 = x2 * cosZ - y2 * sinZ;
        let y3 = x2 * sinZ + y2 * cosZ;
        let z3 = z2;

        // Perspective projection
        const depth = fov / (fov + z3 + size * 0.4);
        const screenX = centerX + x3 * depth;
        const screenY = centerY + y3 * depth;

        projectedPoints.push({
          x: screenX,
          y: screenY,
          z: z3,
          scale: depth,
          p,
        });
      }

      // Sort by depth (back to front for proper illumination stacking)
      projectedPoints.sort((a, b) => b.z - a.z);

      // Draw Center Core Glow Aura
      const corePulse = (Math.sin(time * 4) + 1) * 0.5;
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        size * 0.35 * (0.9 + corePulse * 0.25)
      );
      if (theme === 'purple_nebula') {
        auraGradient.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
        auraGradient.addColorStop(0.3, 'rgba(168, 85, 247, 0.18)');
        auraGradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.06)');
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        auraGradient.addColorStop(0, 'rgba(34, 211, 238, 0.55)');
        auraGradient.addColorStop(0.3, 'rgba(6, 182, 212, 0.22)');
        auraGradient.addColorStop(0.7, 'rgba(2, 132, 199, 0.08)');
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Draw Interconnected Constellation Lines
      ctx.lineWidth = 0.8;
      const numPoints = projectedPoints.length;
      for (let i = 0; i < numPoints; i++) {
        const pt1 = projectedPoints[i];
        if (pt1.p.layer === 'corona_dust') continue;

        let connections = 0;
        for (let j = i + 1; j < numPoints; j++) {
          const pt2 = projectedPoints[j];
          if (pt2.p.layer === 'corona_dust') continue;

          const dx = pt1.x - pt2.x;
          const dy = pt1.y - pt2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < lineDistLimit) {
            const alpha = (1 - dist / lineDistLimit) * 0.45 * Math.min(pt1.scale, pt2.scale);
            if (theme === 'purple_nebula') {
              ctx.strokeStyle = `rgba(192, 132, 252, ${alpha})`;
            } else {
              ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            }
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.stroke();
            connections++;
            if (connections > 4) break; // limit density for crisp aesthetic
          }
        }
      }

      // Draw Nodes / Particles
      for (let i = 0; i < projectedPoints.length; i++) {
        const pt = projectedPoints[i];
        const rad = Math.max(0.5, pt.p.size * pt.scale * 1.3);
        const alpha = Math.min(1, Math.max(0.15, pt.scale * 1.2));

        // Node Glow Halo
        if (pt.p.layer === 'core' || pt.p.size > 2.2) {
          const glowRad = rad * 3.5;
          const glowGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowRad);
          glowGrad.addColorStop(0, pt.p.glowColor);
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, glowRad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Particle Core
        ctx.fillStyle = pt.p.baseColor;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [size, state, theme]);

  // Mouse interaction handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - size / 2) / (size / 2);
    const y = (e.clientY - rect.top - size / 2) / (size / 2);
    mouseRef.current.targetRotY = x * 0.08;
    mouseRef.current.targetRotX = -y * 0.08;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!interactive || !e.touches[0]) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.touches[0].clientX - rect.left - size / 2) / (size / 2);
    const y = (e.touches[0].clientY - rect.top - size / 2) / (size / 2);
    mouseRef.current.targetRotY = x * 0.1;
    mouseRef.current.targetRotX = -y * 0.1;
  };

  return (
    <div
      onClick={onCoreClick}
      className={`relative flex items-center justify-center select-none ${interactive ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="w-full h-full filter drop-shadow-[0_0_25px_rgba(6,182,212,0.35)]"
      />
    </div>
  );
};
