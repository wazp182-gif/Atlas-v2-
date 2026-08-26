import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Sparkles,
  Zap,
  Radio,
  Cpu,
  Activity,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Compass,
  Layers,
  RotateCcw,
  Sliders,
  Play,
  Pause,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type AtlasPresenceState =
  | 'idle'
  | 'processing'
  | 'response'
  | 'listening'
  | 'thinking'
  | 'projecting'
  | 'speaking';
export type VisualizerMode = 'orb' | 'vortex' | 'flow' | 'matrix';
export type VisualizerTheme = 'cyan' | 'sapphire' | 'violet' | 'emerald' | 'amber';

export interface AtlasVisualizerProps {
  state?: AtlasPresenceState;
  onStateChange?: (newState: AtlasPresenceState) => void;
  mode?: VisualizerMode;
  theme?: VisualizerTheme;
  interactive?: boolean;
  showHUD?: boolean;
  height?: number | string;
  activePrompt?: string;
  subtext?: string;
  className?: string;
  onTriggerBurst?: () => void;
  onSelectAction?: (actionName: string) => void;
}

interface Particle {
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
  baseSize: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  glowColor: string;
  layer: 'core' | 'inner' | 'outer' | 'stream' | 'spark';
  pulsePhase: number;
  pulseSpeed: number;
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  speed: number;
}

interface LightBeam {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  alpha: number;
  color: string;
  width: number;
}

const THEME_PALETTES: Record<VisualizerTheme, {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  core: string;
  glow: string;
  bgGlow: string;
  cssGlow: string;
}> = {
  cyan: {
    name: 'Cyan Quantum',
    primary: '#06b6d4',
    secondary: '#22d3ee',
    accent: '#a5f3fc',
    core: '#ffffff',
    glow: 'rgba(34, 211, 238, 0.4)',
    bgGlow: 'rgba(6, 182, 212, 0.15)',
    cssGlow: 'shadow-[0_0_40px_rgba(6,182,212,0.35)]',
  },
  sapphire: {
    name: 'Sapphire Deep',
    primary: '#0284c7',
    secondary: '#38bdf8',
    accent: '#bae6fd',
    core: '#ffffff',
    glow: 'rgba(56, 189, 248, 0.4)',
    bgGlow: 'rgba(2, 132, 199, 0.15)',
    cssGlow: 'shadow-[0_0_40px_rgba(2,132,199,0.35)]',
  },
  violet: {
    name: 'Violet Nebula',
    primary: '#9333ea',
    secondary: '#c084fc',
    accent: '#f3e8ff',
    core: '#ffffff',
    glow: 'rgba(192, 132, 252, 0.4)',
    bgGlow: 'rgba(147, 51, 234, 0.15)',
    cssGlow: 'shadow-[0_0_40px_rgba(147,51,234,0.35)]',
  },
  emerald: {
    name: 'Emerald Aurora',
    primary: '#059669',
    secondary: '#34d399',
    accent: '#a7f3d0',
    core: '#ffffff',
    glow: 'rgba(52, 211, 153, 0.4)',
    bgGlow: 'rgba(5, 150, 105, 0.15)',
    cssGlow: 'shadow-[0_0_40px_rgba(5,150,105,0.35)]',
  },
  amber: {
    name: 'Solar Plasma',
    primary: '#d97706',
    secondary: '#fbbf24',
    accent: '#fef3c7',
    core: '#ffffff',
    glow: 'rgba(251, 191, 36, 0.4)',
    bgGlow: 'rgba(217, 119, 6, 0.15)',
    cssGlow: 'shadow-[0_0_40px_rgba(217,119,6,0.35)]',
  },
};

export const AtlasVisualizer: React.FC<AtlasVisualizerProps> = ({
  state = 'idle',
  onStateChange,
  mode: initialMode = 'orb',
  theme: initialTheme = 'cyan',
  interactive = true,
  showHUD = true,
  height = 480,
  activePrompt,
  subtext,
  className = '',
  onTriggerBurst,
  onSelectAction,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Component UI states
  const [currentMode, setCurrentMode] = useState<VisualizerMode>(initialMode);
  const [currentTheme, setCurrentTheme] = useState<VisualizerTheme>(initialTheme);
  const [currentState, setCurrentState] = useState<AtlasPresenceState>(state);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [coherence, setCoherence] = useState(98.4);
  const [particleCount, setParticleCount] = useState(320);
  const [fps, setFps] = useState(60);

  // Sync external state changes
  useEffect(() => {
    setCurrentState(state);
  }, [state]);

  const palette = THEME_PALETTES[currentTheme];

  // Simulation refs
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const lightBeamsRef = useRef<LightBeam[]>([]);
  const mouseRef = useRef<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    isHovering: boolean;
    isDown: boolean;
    radius: number;
  }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    isHovering: false,
    isDown: false,
    radius: 120,
  });

  const rotationRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const energyRef = useRef<number>(1.0);
  const timeRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Audio frequency simulation (synthesizes audio waveform bars when listening/speaking)
  const audioFreqRef = useRef<number[]>(new Array(16).fill(0.2));

  // Initialize particles based on selected mode
  const initParticles = useCallback((width: number, height: number, mode: VisualizerMode) => {
    const particles: Particle[] = [];
    const count = mode === 'matrix' ? 380 : mode === 'vortex' ? 360 : mode === 'flow' ? 340 : 320;
    setParticleCount(count);

    const cx = 0;
    const cy = 0;
    const baseRadius = Math.min(width, height) * 0.32;

    if (mode === 'orb') {
      // 3D Fibonacci Sphere + Concentric Orbital Rings + Singularity Core
      const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio

      // Outer Fibonacci spherical shell
      const outerCount = Math.floor(count * 0.55);
      for (let i = 0; i < outerCount; i++) {
        const y = 1 - (i / (outerCount - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phi * i;
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;
        const r = baseRadius * (0.85 + Math.random() * 0.3);

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
          size: 1.8 + Math.random() * 2.2,
          baseSize: 1.8 + Math.random() * 2.2,
          alpha: 0.5 + Math.random() * 0.5,
          baseAlpha: 0.5 + Math.random() * 0.5,
          color: Math.random() > 0.35 ? palette.secondary : palette.accent,
          glowColor: palette.glow,
          layer: 'outer',
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.03,
          orbitAngle: theta,
          orbitRadius: r,
          orbitSpeed: 0.005 + Math.random() * 0.008,
        });
      }

      // Inner orbital rings
      const innerCount = Math.floor(count * 0.3);
      for (let i = 0; i < innerCount; i++) {
        const angle = (i / innerCount) * Math.PI * 2;
        const r = baseRadius * (0.45 + Math.random() * 0.25);
        const inclination = (Math.PI / 4) * Math.sin(i);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * Math.sin(inclination) * r;
        const z = Math.sin(angle) * Math.cos(inclination) * r;

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
          size: 2.2 + Math.random() * 2.5,
          baseSize: 2.2 + Math.random() * 2.5,
          alpha: 0.7 + Math.random() * 0.3,
          baseAlpha: 0.7 + Math.random() * 0.3,
          color: palette.core,
          glowColor: palette.secondary,
          layer: 'inner',
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.03 + Math.random() * 0.04,
          orbitAngle: angle,
          orbitRadius: r,
          orbitSpeed: 0.012 + Math.random() * 0.015,
        });
      }

      // Singularity core
      const coreCount = count - outerCount - innerCount;
      for (let i = 0; i < coreCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phiAngle = Math.acos(2.0 * v - 1.0);
        const r = baseRadius * 0.2 * Math.cbrt(Math.random());
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
          size: 2.5 + Math.random() * 3.0,
          baseSize: 2.5 + Math.random() * 3.0,
          alpha: 0.9,
          baseAlpha: 0.9,
          color: palette.core,
          glowColor: palette.primary,
          layer: 'core',
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.05 + Math.random() * 0.04,
          orbitAngle: theta,
          orbitRadius: r,
          orbitSpeed: 0.02,
        });
      }
    } else if (mode === 'vortex') {
      // Logarithmic Gravitational Swarm Vortex
      for (let i = 0; i < count; i++) {
        const spiralArm = i % 3;
        const armOffset = (spiralArm * (Math.PI * 2)) / 3;
        const progress = i / count;
        const angle = progress * Math.PI * 8 + armOffset;
        const r = Math.pow(progress, 0.75) * baseRadius * 1.4 + 15;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        const z = (Math.sin(angle * 2) * baseRadius * 0.4) * (1 - progress);

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
          size: (1 - progress * 0.5) * 3.5 + 1.2,
          baseSize: (1 - progress * 0.5) * 3.5 + 1.2,
          alpha: 0.3 + (1 - progress) * 0.7,
          baseAlpha: 0.3 + (1 - progress) * 0.7,
          color: progress < 0.2 ? palette.core : progress < 0.6 ? palette.secondary : palette.primary,
          glowColor: palette.glow,
          layer: progress < 0.2 ? 'core' : 'stream',
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.04,
          orbitAngle: angle,
          orbitRadius: r,
          orbitSpeed: 0.015 + (1 - progress) * 0.03,
        });
      }
    } else if (mode === 'flow') {
      // Synaptic Filament Waves
      for (let i = 0; i < count; i++) {
        const streamIndex = i % 8;
        const streamProgress = Math.floor(i / 8) / (count / 8);
        const x = (streamProgress - 0.5) * width * 0.9;
        const y = (streamIndex - 3.5) * 28 + Math.sin(streamProgress * Math.PI * 4) * 45;
        const z = Math.cos(streamProgress * Math.PI * 3 + streamIndex) * 80;

        particles.push({
          x,
          y,
          z,
          ox: x,
          oy: y,
          oz: z,
          vx: 1.2 + Math.random() * 0.8,
          vy: 0,
          vz: 0,
          size: 2.0 + Math.random() * 2.2,
          baseSize: 2.0 + Math.random() * 2.2,
          alpha: 0.4 + Math.random() * 0.6,
          baseAlpha: 0.4 + Math.random() * 0.6,
          color: streamIndex % 2 === 0 ? palette.secondary : palette.accent,
          glowColor: palette.glow,
          layer: 'stream',
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.03,
          orbitAngle: streamProgress * Math.PI * 2,
          orbitRadius: 40,
          orbitSpeed: 0.02,
        });
      }
    } else {
      // matrix / cybernetic wave plane
      const cols = 20;
      const rows = Math.floor(count / cols);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = (c / (cols - 1) - 0.5) * width * 0.8;
          const y = (r / (rows - 1) - 0.5) * height * 0.6;
          const z = 0;

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
            size: 2.2,
            baseSize: 2.2,
            alpha: 0.6,
            baseAlpha: 0.6,
            color: (r + c) % 3 === 0 ? palette.core : palette.secondary,
            glowColor: palette.primary,
            layer: 'outer',
            pulsePhase: (r * 0.3 + c * 0.3),
            pulseSpeed: 0.04,
            orbitAngle: 0,
            orbitRadius: 0,
            orbitSpeed: 0,
          });
        }
      }
    }

    particlesRef.current = particles;
  }, [palette]);

  // Trigger Shockwave on click / tap
  const triggerShockwave = useCallback((x: number, y: number) => {
    shockwavesRef.current.push({
      x,
      y,
      radius: 5,
      maxRadius: 280,
      alpha: 1.0,
      color: palette.secondary,
      speed: 7.5,
    });

    // Create 15 radiant spark particles
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      particlesRef.current.push({
        x: x - (canvasRef.current?.width || 0) / 2,
        y: y - (canvasRef.current?.height || 0) / 2,
        z: (Math.random() - 0.5) * 50,
        ox: 0,
        oy: 0,
        oz: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: (Math.random() - 0.5) * 4,
        size: 3.5,
        baseSize: 3.5,
        alpha: 1.0,
        baseAlpha: 1.0,
        color: palette.core,
        glowColor: palette.accent,
        layer: 'spark',
        pulsePhase: 0,
        pulseSpeed: 0.1,
        orbitAngle: angle,
        orbitRadius: 0,
        orbitSpeed: 0,
      });
    }

    if (onTriggerBurst) {
      onTriggerBurst();
    }
  }, [palette, onTriggerBurst]);

  // Trigger Light Projection Beams when processing/projecting
  const triggerProjectionBeams = useCallback((width: number, height: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const numBeams = 6;
    for (let i = 0; i < numBeams; i++) {
      const angle = (i / numBeams) * Math.PI * 2 + Math.random() * 0.4;
      const dist = Math.min(width, height) * 0.48;
      lightBeamsRef.current.push({
        startX: cx,
        startY: cy,
        endX: cx + Math.cos(angle) * dist,
        endY: cy + Math.sin(angle) * dist,
        progress: 0,
        alpha: 1.0,
        color: i % 2 === 0 ? palette.secondary : palette.core,
        width: 2.0 + Math.random() * 2.5,
      });
    }
  }, [palette]);

  // Handle Canvas Resize and Particle Reset
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const computedHeight = rect.height || (typeof height === 'number' ? height : 480);

      canvasRef.current.width = width * dpr;
      canvasRef.current.height = computedHeight * dpr;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${computedHeight}px`;

      initParticles(width, computedHeight, currentMode);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentMode, initParticles, height]);

  // Trigger beam projection on state transitions
  useEffect(() => {
    if (
      currentState === 'response' ||
      currentState === 'projecting' ||
      currentState === 'speaking' ||
      currentState === 'processing' ||
      currentState === 'thinking'
    ) {
      if (canvasRef.current) {
        triggerProjectionBeams(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    }
  }, [currentState, triggerProjectionBeams]);

  // Dynamic Audio frequency oscillation simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return;
      const isActive =
        currentState === 'listening' ||
        currentState === 'speaking' ||
        currentState === 'thinking' ||
        currentState === 'processing' ||
        currentState === 'response';
      audioFreqRef.current = audioFreqRef.current.map(() => {
        if (!isActive) return 0.15 + Math.random() * 0.15;
        return 0.3 + Math.random() * 0.7;
      });

      // Update synthetic coherence
      if (currentState === 'thinking' || currentState === 'processing') {
        setCoherence(+(99.2 + Math.random() * 0.7).toFixed(1));
      } else if (currentState === 'response' || currentState === 'speaking') {
        setCoherence(+(99.7 + Math.random() * 0.3).toFixed(1));
      } else {
        setCoherence(+(97.8 + Math.random() * 1.5).toFixed(1));
      }
    }, 120);

    return () => clearInterval(interval);
  }, [currentState, isPaused]);

  // Main Render & Physics Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Calculate FPS
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      if (!isPaused) {
        timeRef.current += 0.016;
      }
      const t = timeRef.current;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const cx = width / 2;
      const cy = height / 2;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Smooth Trail Clear
      ctx.fillStyle = 'rgba(6, 11, 25, 0.32)';
      ctx.fillRect(0, 0, width, height);

      // Mouse smooth interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.1;

      // Energy scaling by state
      let stateSpeedMul = 1.0;
      let stateScaleMul = 1.0;
      let stateGlowIntensity = 1.0;

      if (currentState === 'idle') {
        stateSpeedMul = 0.7;
        stateScaleMul = 1.0 + Math.sin(t * 1.5) * 0.04;
        stateGlowIntensity = 0.85;
      } else if (currentState === 'listening') {
        stateSpeedMul = 1.3;
        stateScaleMul = 1.08 + Math.sin(t * 4.0) * 0.08;
        stateGlowIntensity = 1.2;
      } else if (currentState === 'processing' || currentState === 'thinking') {
        stateSpeedMul = 2.8;
        stateScaleMul = 0.88 + Math.sin(t * 8.0) * 0.06;
        stateGlowIntensity = 1.7;
      } else if (currentState === 'response' || currentState === 'projecting' || currentState === 'speaking') {
        stateSpeedMul = 1.8;
        stateScaleMul = 1.18 + Math.sin(t * 3.0) * 0.07;
        stateGlowIntensity = 1.6;
      }

      // Smooth Rotation in 3D
      if (!isPaused) {
        rotationRef.current.y += 0.006 * stateSpeedMul;
        rotationRef.current.x += 0.003 * stateSpeedMul;
      }
      const rotX = rotationRef.current.x;
      const rotY = rotationRef.current.y;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // 1. Ambient Background Core Glow & Harmonic Rings
      const radialGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.45 * stateScaleMul);
      radialGlow.addColorStop(0, palette.bgGlow);
      radialGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.04)');
      radialGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // Harmonic Resonance Waves around Core
      const waveCount = currentState === 'listening' ? 4 : 2;
      for (let w = 0; w < waveCount; w++) {
        const waveRadius = ((t * 45 + w * 55) % (Math.min(width, height) * 0.42)) * stateScaleMul;
        const waveAlpha = Math.max(0, 1 - waveRadius / (Math.min(width, height) * 0.42)) * 0.25 * stateGlowIntensity;
        ctx.beginPath();
        ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = palette.secondary;
        ctx.globalAlpha = waveAlpha;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // 2. Shockwaves Update & Render
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += sw.speed;
        sw.alpha *= 0.94;

        if (sw.alpha <= 0.02 || sw.radius >= sw.maxRadius) {
          shockwavesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // 3. Light Beams Update & Render
      for (let i = lightBeamsRef.current.length - 1; i >= 0; i--) {
        const beam = lightBeamsRef.current[i];
        beam.progress += 0.04;
        beam.alpha *= 0.96;

        if (beam.progress >= 1.0 || beam.alpha <= 0.02) {
          lightBeamsRef.current.splice(i, 1);
          continue;
        }

        const currentEndX = beam.startX + (beam.endX - beam.startX) * Math.min(1, beam.progress * 1.5);
        const currentEndY = beam.startY + (beam.endY - beam.startY) * Math.min(1, beam.progress * 1.5);

        const beamGrad = ctx.createLinearGradient(beam.startX, beam.startY, currentEndX, currentEndY);
        beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        beamGrad.addColorStop(0.5, beam.color);
        beamGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(beam.startX, beam.startY);
        ctx.lineTo(currentEndX, currentEndY);
        ctx.strokeStyle = beamGrad;
        ctx.globalAlpha = beam.alpha;
        ctx.lineWidth = beam.width;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // 4. Project and Sort Particles
      const particles = particlesRef.current;
      const projectedList: {
        p: Particle;
        screenX: number;
        screenY: number;
        screenSize: number;
        depth: number;
        alpha: number;
      }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.layer === 'spark') {
          // Firework sparks decay
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
          p.alpha *= 0.95;
          if (p.alpha < 0.05) {
            particles.splice(i, 1);
            i--;
            continue;
          }
          projectedList.push({
            p,
            screenX: cx + p.x,
            screenY: cy + p.y,
            screenSize: p.size,
            depth: p.z + 200,
            alpha: p.alpha,
          });
          continue;
        }

        // Standard 3D Rotation Physics
        let px = p.ox;
        let py = p.oy;
        let pz = p.oz;

        if (currentMode === 'orb') {
          p.orbitAngle += p.orbitSpeed * stateSpeedMul;
          if (p.layer === 'inner') {
            px = Math.cos(p.orbitAngle) * p.orbitRadius * stateScaleMul;
            pz = Math.sin(p.orbitAngle) * p.orbitRadius * stateScaleMul;
          } else if (p.layer === 'core') {
            const wobble = Math.sin(t * 4 + p.pulsePhase) * 6;
            px = (p.ox + wobble) * stateScaleMul;
            py = (p.oy + wobble) * stateScaleMul;
            pz = (p.oz + wobble) * stateScaleMul;
          }
        } else if (currentMode === 'vortex') {
          p.orbitAngle += p.orbitSpeed * stateSpeedMul;
          px = Math.cos(p.orbitAngle) * p.orbitRadius * stateScaleMul;
          py = Math.sin(p.orbitAngle) * p.orbitRadius * stateScaleMul;
          pz = Math.sin(p.orbitAngle * 2 + t) * 40;
        } else if (currentMode === 'flow') {
          p.ox += p.vx * stateSpeedMul;
          if (p.ox > width * 0.5) p.ox = -width * 0.5;
          px = p.ox;
          py = p.oy + Math.sin(p.ox * 0.02 + t * 2) * 25;
          pz = p.oz;
        } else if (currentMode === 'matrix') {
          const distFromCenter = Math.hypot(p.ox, p.oy);
          pz = Math.sin(distFromCenter * 0.05 - t * 3) * 35 * stateScaleMul;
          px = p.ox;
          py = p.oy;
        }

        // Apply 3D matrix transform
        // Y-axis rotation
        const x1 = px * cosY - pz * sinY;
        const z1 = px * sinY + pz * cosY;

        // X-axis rotation
        const y2 = py * cosX - z1 * sinX;
        const z2 = py * sinX + z1 * cosX;

        // Perspective Projection (Focal distance ~500px)
        const fov = 480;
        const perspective = fov / (fov + z2 + 180);
        const screenX = cx + x1 * perspective;
        const screenY = cy + y2 * perspective;
        const screenSize = Math.max(0.5, p.baseSize * perspective * stateScaleMul);

        // Interactive Mouse Gravitational Wake
        let finalScreenX = screenX;
        let finalScreenY = screenY;

        if (interactive && mouseRef.current.isHovering) {
          const dx = mouseRef.current.x - screenX;
          const dy = mouseRef.current.y - screenY;
          const dist = Math.hypot(dx, dy);

          if (dist < mouseRef.current.radius) {
            const force = (1 - dist / mouseRef.current.radius) * 32;
            const dir = mouseRef.current.isDown ? -1 : 1; // Pull on click, push on hover
            finalScreenX += (dx / dist) * force * dir;
            finalScreenY += (dy / dist) * force * dir;
          }
        }

        // Dynamic Alpha and Pulse
        const pulse = Math.sin(t * 3 + p.pulsePhase);
        const dynamicAlpha = Math.min(1.0, Math.max(0.15, p.baseAlpha * perspective * (0.8 + pulse * 0.25) * stateGlowIntensity));

        projectedList.push({
          p,
          screenX: finalScreenX,
          screenY: finalScreenY,
          screenSize,
          depth: z2,
          alpha: dynamicAlpha,
        });
      }

      // Sort by depth for correct 3D rendering order (back to front)
      projectedList.sort((a, b) => b.depth - a.depth);

      // 5. Render Interconnecting Synaptic Constellation Lines
      const maxConnectDist = currentMode === 'matrix' ? 38 : 55;
      const maxConnections = 3;

      ctx.lineWidth = 0.8;
      for (let i = 0; i < projectedList.length; i += 2) {
        let connCount = 0;
        const p1 = projectedList[i];
        if (p1.alpha < 0.25) continue;

        for (let j = i + 1; j < projectedList.length; j += 2) {
          const p2 = projectedList[j];
          const dx = p1.screenX - p2.screenX;
          const dy = p1.screenY - p2.screenY;
          const dist = Math.hypot(dx, dy);

          if (dist < maxConnectDist) {
            const lineAlpha = (1 - dist / maxConnectDist) * p1.alpha * p2.alpha * 0.45;
            ctx.beginPath();
            ctx.moveTo(p1.screenX, p1.screenY);
            ctx.lineTo(p2.screenX, p2.screenY);
            ctx.strokeStyle = palette.secondary;
            ctx.globalAlpha = lineAlpha;
            ctx.stroke();

            connCount++;
            if (connCount >= maxConnections) break;
          }
        }
      }
      ctx.globalAlpha = 1.0;

      // 6. Draw Particles with Glow
      for (let i = 0; i < projectedList.length; i++) {
        const item = projectedList[i];

        ctx.save();
        ctx.globalAlpha = item.alpha;

        // Outer Glow halo
        if (item.screenSize > 1.8) {
          ctx.beginPath();
          ctx.arc(item.screenX, item.screenY, item.screenSize * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = item.p.glowColor;
          ctx.globalAlpha = item.alpha * 0.35;
          ctx.fill();
        }

        // Particle Core
        ctx.beginPath();
        ctx.arc(item.screenX, item.screenY, item.screenSize, 0, Math.PI * 2);
        ctx.fillStyle = item.p.color;
        ctx.globalAlpha = item.alpha;
        ctx.fill();

        ctx.restore();
      }

      // 7. Central Radiant Singularity / Light Core
      ctx.save();
      const coreSize = (currentMode === 'orb' ? 24 : 16) * stateScaleMul;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, palette.secondary);
      coreGrad.addColorStop(0.8, palette.primary);
      coreGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.globalAlpha = 0.85 * stateGlowIntensity;
      ctx.fill();
      ctx.restore();

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [currentMode, palette, currentState, isPaused, interactive]);

  // Pointer Interaction Handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.targetX = e.clientX - rect.left;
    mouseRef.current.targetY = e.clientY - rect.top;
    mouseRef.current.isHovering = true;
  };

  const handlePointerLeave = () => {
    mouseRef.current.isHovering = false;
    mouseRef.current.isDown = false;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseRef.current.isDown = true;
    triggerShockwave(x, y);
  };

  const handlePointerUp = () => {
    mouseRef.current.isDown = false;
  };

  // State Change Dispatcher
  const handleSetState = (newState: AtlasPresenceState) => {
    setCurrentState(newState);
    if (onStateChange) {
      onStateChange(newState);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ${className}`}
      style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* 1. Dynamic Canvas Layer */}
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 h-full w-full cursor-crosshair touch-none select-none"
      />

      {/* 2. Top HUD Bar - Telemetry & Status Indicator */}
      {showHUD && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          {/* Left: Assistant Presence Badge */}
          <div className="flex items-center gap-2.5 bg-slate-900/80 border border-cyan-500/30 px-3.5 py-1.5 rounded-full backdrop-blur-md pointer-events-auto">
            <div className="relative flex h-3 w-3 items-center justify-center">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
                style={{ backgroundColor: palette.secondary }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: palette.primary }}
              />
            </div>
            <span className="text-xs font-semibold text-cyan-200 uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              Atlas Presence
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border bg-cyan-950/70 border-cyan-500/30 text-cyan-300">
              {currentState.toUpperCase()}
            </span>
          </div>

          {/* Right: Quantum Telemetry HUD & Mode Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Quick Mode Toggles */}
            <div className="hidden sm:flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-0.5 backdrop-blur-md">
              {(['orb', 'vortex', 'flow', 'matrix'] as VisualizerMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setCurrentMode(m)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all capitalize ${
                    currentMode === m
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Quick State Trigger Controls */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-lg p-1 backdrop-blur-md">
              <button
                onClick={() => handleSetState(currentState === 'thinking' ? 'idle' : 'thinking')}
                title="Simular Procesamiento / Pensamiento"
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  currentState === 'thinking' || currentState === 'processing'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleSetState(currentState === 'listening' ? 'idle' : 'listening')}
                title="Modo Escucha / Audio"
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  currentState === 'listening'
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Reanudar Simulación' : 'Pausar Simulación'}
                className="p-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsControlsOpen(!isControlsOpen)}
                title="Configuración de Esfera & Temas"
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  isControlsOpen
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Settings Drawer / Overlay */}
      <AnimatePresence>
        {isControlsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 right-3 z-20 w-72 rounded-xl border border-cyan-500/30 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl text-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Parámetros del Núcleo
              </span>
              <button
                onClick={() => setIsControlsOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Visualizer Themes */}
            <div className="mt-3">
              <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Paleta de Frecuencia</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(THEME_PALETTES) as VisualizerTheme[]).map((thm) => (
                  <button
                    key={thm}
                    onClick={() => setCurrentTheme(thm)}
                    className={`px-2 py-1.5 text-xs rounded-lg border text-left flex items-center gap-2 transition-all ${
                      currentTheme === thm
                        ? 'border-cyan-400 bg-cyan-950/60 text-white font-medium'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: THEME_PALETTES[thm].primary }}
                    />
                    <span className="truncate text-[11px]">{THEME_PALETTES[thm].name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Presets & States */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Estado de Consciencia</label>
              <div className="grid grid-cols-3 gap-1">
                {(['idle', 'listening', 'thinking', 'processing', 'projecting', 'speaking'] as AtlasPresenceState[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleSetState(st)}
                    className={`px-2 py-1 text-[10px] rounded border capitalize text-center truncate transition-colors ${
                      currentState === st
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 font-semibold'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Telemetry info */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Nodos: {particleCount}</span>
              <span>FPS: {fps}</span>
              <span>Coherencia: {coherence}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Center Reactive Activity Subtitle / Prompt Halo */}
      <div className="absolute inset-x-0 bottom-4 flex flex-col items-center justify-center pointer-events-none px-4 z-10">
        {/* Animated Soundwave Frequency spectrum bars */}
        {(currentState === 'listening' || currentState === 'speaking' || currentState === 'thinking') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1 mb-2 bg-slate-950/80 border border-cyan-500/30 px-3 py-1.5 rounded-full backdrop-blur-md"
          >
            {audioFreqRef.current.map((freq, idx) => (
              <span
                key={idx}
                className="w-1 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(4, freq * 20)}px`,
                  backgroundColor: palette.secondary,
                  opacity: 0.4 + freq * 0.6,
                }}
              />
            ))}
            <span className="text-[10px] text-cyan-300 font-mono ml-1.5">
              {currentState === 'listening' ? 'ESCUDRIÑANDO...' : currentState === 'thinking' ? 'ORQUESTANDO...' : 'PROYECTANDO'}
            </span>
          </motion.div>
        )}

        {/* Dynamic Context Header or Active Prompt */}
        {activePrompt ? (
          <div className="max-w-xl text-center bg-slate-950/85 border border-cyan-500/30 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg pointer-events-auto">
            <p className="text-xs sm:text-sm font-medium text-cyan-200 leading-snug">
              {activePrompt}
            </p>
            {subtext && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                {subtext}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center opacity-75 hover:opacity-100 transition-opacity">
            <p className="text-[11px] text-cyan-400/80 font-mono tracking-wider">
              ✦ HAZ CLIC O ARRASTRA PARA GENERAR ONDAS DE CHOQUE Y MODULAR LA ENERGÍA
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
