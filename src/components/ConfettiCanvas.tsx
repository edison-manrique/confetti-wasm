import { createEffect, onCleanup, onMount } from 'solid-js';
import type { ConfettiEngine } from '../engine/confettiWasm';
import { renderSoAParticles } from '../engine/spriteAtlas';

export interface SimulationStats {
  activeCount: number;
  capacity: number;
  stepMs: number;
  renderMs: number;
  fps: number;
  totalSpawned: number;
  totalRecycled: number;
  postInitGrowCount: number;
  arenaBytes: number;
  memoryBytes: number;
  bytesPerParticle: number;
}

export interface PhysicsConfig {
  gravity: number;
  drag: number;
  wind: number;
  turbulence: number;
}

export interface BurstConfig {
  count: number;
  speed: number;
  spreadDeg: number;
  emitterMode: 'burst' | 'cannons' | 'stream';
}

interface ConfettiCanvasProps {
  engine: ConfettiEngine | null;
  paused: boolean;
  physics: PhysicsConfig;
  burst: BurstConfig;
  onStatsUpdate: (stats: SimulationStats) => void;
  onCanvasReady?: (dims: { width: number; height: number }) => void;
}

export function ConfettiCanvas(props: ConfettiCanvasProps) {
  let containerRef: HTMLDivElement | undefined;
  let canvasRef: HTMLCanvasElement | undefined;
  let dims = { width: 960, height: 600, dpr: 1 };
  let dragging = false;

  // Sync physics parameters and canvas dimensions into WASM reactively
  createEffect(() => {
    const eng = props.engine;
    const p = props.physics;
    if (eng) {
      eng.resize(dims.width, dims.height);
      eng.setPhysics(p.gravity, p.drag, p.wind, p.turbulence);
    }
  });

  onMount(() => {
    if (!canvasRef || !containerRef) return;
    const ctx = canvasRef.getContext('2d', { alpha: false });
    if (!ctx) return;

    const updateSize = () => {
      if (!canvasRef || !containerRef) return;
      const rect = containerRef.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(340, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvasRef.width = Math.floor(width * dpr);
      canvasRef.height = Math.floor(height * dpr);
      dims = { width, height, dpr };

      if (props.engine) {
        props.engine.resize(width, height);
      }
      props.onCanvasReady?.({ width, height });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef);

    let rafId = 0;
    let lastTime = performance.now();
    let fpsFrames = 0;
    let fpsAccum = 0;
    let currentFps = 60;
    let statsTimer = 0;
    let streamAccum = 0;
    let needsPausedRedraw = true;

    const renderFrame = (now: number) => {
      rafId = requestAnimationFrame(renderFrame);

      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = rawDt > 0 && rawDt < 0.05 ? rawDt : 1 / 60;

      fpsFrames++;
      fpsAccum += rawDt;
      if (fpsAccum >= 0.4) {
        currentFps = Math.round(fpsFrames / fpsAccum);
        fpsFrames = 0;
        fpsAccum = 0;
      }

      const { width, height, dpr } = dims;
      const eng = props.engine;
      const isPaused = props.paused;

      let stepMs = 0;
      if (eng && !isPaused) {
        needsPausedRedraw = true;
        if (props.burst.emitterMode === 'stream') {
          streamAccum += dt;
          if (streamAccum >= 0.05) {
            streamAccum = 0;
            const streamCount = Math.max(20, Math.round(props.burst.count * 0.08));
            const spreadRad = (props.burst.spreadDeg * Math.PI) / 180;
            eng.spawnBurst(
              width * (0.15 + eng.nextRand() * 0.7),
              height * 0.12,
              streamCount,
              props.burst.speed * 0.75,
              spreadRad,
              Math.PI / 2,
              4.2,
              8.6,
              2.2,
              4.2
            );
          }
        }

        const t0 = performance.now();
        eng.step(dt);
        stepMs = performance.now() - t0;
      }

      let renderMs = 0;
      if (!isPaused || needsPausedRedraw) {
        needsPausedRedraw = false;
        const r0 = performance.now();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#07090E';
        ctx.fillRect(0, 0, width, height);

        // Subtle laboratory coordinate grid
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.42)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const gridStep = 64;
        for (let gx = gridStep; gx < width; gx += gridStep) {
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, height);
        }
        for (let gy = gridStep; gy < height; gy += gridStep) {
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
        }
        ctx.stroke();

        if (eng) {
          renderSoAParticles(ctx, eng, dpr);
        }

        renderMs = performance.now() - r0;
      }

      statsTimer += rawDt;
      if (eng && statsTimer >= 0.1) {
        statsTimer = 0;
        const diag = eng.getDiagnostics();
        props.onStatsUpdate({
          activeCount: diag.activeCount,
          capacity: diag.capacity,
          stepMs,
          renderMs,
          fps: currentFps,
          totalSpawned: diag.totalSpawned,
          totalRecycled: diag.totalRecycled,
          postInitGrowCount: diag.postInitGrowCount,
          arenaBytes: diag.arenaBytes,
          memoryBytes: diag.memoryBytes,
          bytesPerParticle: diag.bytesPerParticle,
        });
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    onCleanup(() => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    });
  });

  const spawnAtPointer = (clientX: number, clientY: number, scale = 1) => {
    if (!canvasRef || !props.engine) return;
    const rect = canvasRef.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const spreadRad = (props.burst.spreadDeg * Math.PI) / 180;
    const count = Math.max(25, Math.round(props.burst.count * scale));
    props.engine.spawnBurst(
      x,
      y,
      count,
      props.burst.speed,
      spreadRad,
      -Math.PI / 2,
      4.2,
      8.6,
      2.2,
      4.4
    );
  };

  return (
    <div
      ref={containerRef}
      class="relative flex-1 min-h-[340px] lg:min-h-[420px] w-full overflow-hidden rounded-lg border border-slate-800 bg-[#07090E]"
    >
      <canvas
        ref={canvasRef}
        data-testid="confetti-canvas"
        aria-label="Lienzo de simulación física de confeti en WebAssembly"
        class="block h-full w-full cursor-crosshair touch-none"
        onPointerDown={(e) => {
          dragging = true;
          spawnAtPointer(e.clientX, e.clientY, 1);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          spawnAtPointer(e.clientX, e.clientY, 0.12);
        }}
        onPointerUp={() => {
          dragging = false;
        }}
        onPointerLeave={() => {
          dragging = false;
        }}
      />
    </div>
  );
}
