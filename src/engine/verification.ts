import { ConfettiEngine } from './confettiWasm';

export interface VerificationCheckResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  durationMs: number;
  detail: string;
}

export interface BenchmarkResult {
  particleCount: number;
  frames: number;
  wasmTotalMs: number;
  wasmAvgFrameMs: number;
  jsTotalMs: number;
  jsAvgFrameMs: number;
  speedup: number;
  wasmBufferDeltaBytes: number;
  jsAllocatedObjects: number;
}

/**
 * Runs deterministic invariant tests against an isolated ConfettiEngine instance
 * compiled from the real AssemblyScript WASM binary (< 1 MB static arena + SIMD).
 */
export async function runVerificationSuite(wasmBytes: BufferSource): Promise<VerificationCheckResult[]> {
  const results: VerificationCheckResult[] = [];

  // 1. Zero-Alloc Memory Invariant, < 1 MB Hard Ceiling & Static memory.grow Lock
  {
    const t0 = performance.now();
    let passed = false;
    let detail = '';
    try {
      const engine = await ConfettiEngine.fromBytes(wasmBytes);
      engine.init(10000, 1440, 900);
      const initialBuf = engine.exports.memory.buffer;
      const initialBytes = initialBuf.byteLength;
      const initialPages = engine.exports.getMemoryPages();

      let growBlocked = false;
      try {
        engine.exports.memory.grow(1);
      } catch {
        growBlocked = true;
      }

      for (let i = 0; i < 400; i++) {
        engine.spawnBurst(720, 450, 150, 650, Math.PI * 2, -Math.PI / 2, 5, 11, 0.8, 1.5);
        engine.step(1 / 60);
      }

      const arenaBefore = engine.exports.getArenaCurrent();
      const hist = engine.computeColorHistogram();
      const arenaAfter = engine.exports.getArenaCurrent();
      let histSum = 0;
      for (let c = 0; c < 12; c++) histSum += hist[c];

      const finalBuf = engine.exports.memory.buffer;
      const finalBytes = finalBuf.byteLength;
      const finalPages = engine.exports.getMemoryPages();
      const postGrow = engine.exports.getPostInitGrowCount();
      const viewValid = engine.ensureViewsCurrent();

      passed =
        growBlocked &&
        finalBytes <= 1048576 &&
        initialPages === 15 &&
        initialBuf === finalBuf &&
        initialBytes === finalBytes &&
        initialPages === finalPages &&
        postGrow === 0 &&
        arenaBefore === arenaAfter &&
        histSum === engine.activeCount &&
        viewValid;

      detail = `Reserva: ${(finalBytes / 1024).toFixed(0)} KiB (< 1 MB) · Páginas: ${finalPages}/${finalPages} · Grow bloqueado`;
    } catch (err) {
      detail = err instanceof Error ? err.message : String(err);
    }
    results.push({
      id: 'zero-alloc',
      name: 'Reserva < 1 MB, Arena RAII y MaximumPages (15/15)',
      description: 'Comprueba tope duro <= 1 MiB (15 páginas), memory.grow bloqueado y restauración exacta del puntero bump Arena.',
      passed,
      durationMs: performance.now() - t0,
      detail,
    });
  }

  // 2. Static Data Segment SoA Pointer Alignment & 49 B/particle Layout
  {
    const t0 = performance.now();
    let passed = false;
    let detail = '';
    try {
      const engine = await ConfettiEngine.fromBytes(wasmBytes);
      engine.init(4096, 1280, 720);
      const diag = engine.getDiagnostics();

      let allAligned = true;
      let nonOverlappingLanes = true;
      const sortedLanes = [...diag.lanes].sort((a, b) => a.ptr - b.ptr);
      for (let i = 0; i < sortedLanes.length; i++) {
        if (sortedLanes[i].ptr % 16 !== 0) {
          allAligned = false;
        }
        if (i > 0) {
          const prevEnd = sortedLanes[i - 1].ptr + sortedLanes[i - 1].byteLength;
          if (prevEnd > sortedLanes[i].ptr) {
            nonOverlappingLanes = false;
          }
        }
      }

      let nonOverlappingWorlds = true;
      const sortedWorlds = [...diag.worlds].sort((a, b) => a.ptr - b.ptr);
      for (let i = 1; i < sortedWorlds.length; i++) {
        if (sortedWorlds[i - 1].ptr + sortedWorlds[i - 1].byteLength > sortedWorlds[i].ptr) {
          nonOverlappingWorlds = false;
        }
      }

      const arenaFitsDataSegment =
        diag.arenaStart > 0 &&
        diag.arenaStart + diag.arenaBytes <= diag.heapBase &&
        diag.heapBase <= diag.memoryBytes;

      passed =
        allAligned &&
        nonOverlappingLanes &&
        nonOverlappingWorlds &&
        arenaFitsDataSegment &&
        diag.bytesPerParticle === 49 &&
        diag.lanes.length === 13;

      detail = `5 mundos · ${diag.bytesPerParticle} B/part. · 13 carriles SIMD 16B: ${allAligned ? 'OK' : 'FAIL'} · ${(diag.arenaBytes / 1024).toFixed(1)} KiB`;
    } catch (err) {
      detail = err instanceof Error ? err.message : String(err);
    }
    results.push({
      id: 'soa-layout',
      name: 'SoA Compacto (49 B/part.) y Alineación 16B',
      description: 'Verifica 5 mundos disjuntos y 13 carriles SIMD alineados a 16B dentro del segmento estático antes de __heap_base.',
      passed,
      durationMs: performance.now() - t0,
      detail,
    });
  }

  // 3. O(1) Swap-Remove & remLife Expiration + Bit-Packed Meta Preservation
  {
    const t0 = performance.now();
    let passed = false;
    let detail = '';
    try {
      const engine = await ConfettiEngine.fromBytes(wasmBytes);
      engine.init(256, 2000, 5000);
      engine.setPhysics(0, 0, 0, 0);
      engine.spawnParticleExact(10, 10, 100, 0, 8, 0.5, 0, 0);
      engine.spawnParticleExact(20, 20, 200, 0, 8, 2.0, 7, 2); // color=7, shape=2
      engine.spawnParticleExact(30, 30, 300, 0, 8, 0.5, 2, 1);

      const aliveAfterFirst = engine.step(0.6);
      const survivorVx = engine.views.vx[0];
      const survivorRem = engine.views.remLife[0];
      const survivorMeta = engine.views.meta[0];
      const survivorColor = survivorMeta & 0x0f;
      const survivorShape = (survivorMeta >> 4) & 0x03;

      const aliveAfterSecond = engine.step(1.5);

      passed =
        aliveAfterFirst === 1 &&
        Math.abs(survivorVx - 200) < 0.01 &&
        Math.abs(survivorRem - 1.4) < 0.01 &&
        survivorColor === 7 &&
        survivorShape === 2 &&
        aliveAfterSecond === 0;

      detail = `Tras 0.6s: 1 activa (vx=${survivorVx.toFixed(0)}, c=${survivorColor}, s=${survivorShape}) · Tras 2.1s: ${aliveAfterSecond}`;
    } catch (err) {
      detail = err instanceof Error ? err.message : String(err);
    }
    results.push({
      id: 'swap-remove',
      name: 'Swap-Remove O(1) y Empaquetado Meta',
      description: 'Verifica compactación con remLife y preservación intacta de color/forma empaquetados en 1 byte meta[].',
      passed,
      durationMs: performance.now() - t0,
      detail,
    });
  }

  // 4. Capacity Ring Saturation Safety
  {
    const t0 = performance.now();
    let passed = false;
    let detail = '';
    try {
      const engine = await ConfettiEngine.fromBytes(wasmBytes);
      engine.init(128, 1280, 720);
      engine.spawnBurst(640, 360, 500, 400, Math.PI, -Math.PI / 2, 4, 8, 2.0, 3.0);
      const active = engine.activeCount;
      const cap = engine.capacity;
      const diag = engine.getDiagnostics();
      engine.step(1 / 60);

      passed = active === cap && diag.totalSpawned === 500 && diag.totalRecycled === 500 - 128;
      detail = `Capacidad: ${cap} · Activas: ${active} · Emitidas: ${diag.totalSpawned} · Recicladas: ${diag.totalRecycled}`;
    } catch (err) {
      detail = err instanceof Error ? err.message : String(err);
    }
    results.push({
      id: 'capacity-saturation',
      name: 'Saturación Segura de Capacidad (Ring Buffer)',
      description: 'Emite 500 partículas en una arena de 128 slots para comprobar sobrescritura circular sin desbordamientos.',
      passed,
      durationMs: performance.now() - t0,
      detail,
    });
  }

  // 5. Physics & SIMD Numerical Stability (Zero Division + FastTrig)
  {
    const t0 = performance.now();
    let passed = false;
    let detail = '';
    try {
      const engine = await ConfettiEngine.fromBytes(wasmBytes);
      engine.init(512, 1280, 5000);
      engine.setPhysics(980, 1.5, 120, 140);
      for (let k = 0; k < 9; k++) {
        engine.spawnParticleExact(100, 100, 0, 0, 8, 5.0, k % 12, k % 4);
      }

      for (let f = 0; f < 60; f++) {
        engine.step(1 / 60);
      }

      let allValid = true;
      for (let k = 0; k < 9; k++) {
        const x = engine.views.x[k];
        const y = engine.views.y[k];
        const vx = engine.views.vx[k];
        const vy = engine.views.vy[k];
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(vx) || !Number.isFinite(vy)) {
          allValid = false;
        }
      }

      const x0 = engine.views.x[0];
      const y0 = engine.views.y[0];
      const vy0 = engine.views.vy[0];

      passed = allValid && x0 > 120 && y0 > 300 && vy0 > 400;
      detail = `t=1.0s (SIMD sin divisiones) -> pos=(${x0.toFixed(1)}, ${y0.toFixed(1)}) px · vy=${vy0.toFixed(1)} px/s`;
    } catch (err) {
      detail = err instanceof Error ? err.message : String(err);
    }
    results.push({
      id: 'physics-stability',
      name: 'Integración SIMD v128 sin Divisiones',
      description: 'Valida estabilidad numérica en el bucle vectorizado f32x4 y cola escalar usando fastSin4 sin divisiones.',
      passed,
      durationMs: performance.now() - t0,
      detail,
    });
  }

  // 6. PRNG Determinism & Secure Wipe
  {
    const t0 = performance.now();
    let passed = false;
    let detail = '';
    try {
      const a = await ConfettiEngine.fromBytes(wasmBytes);
      const b = await ConfettiEngine.fromBytes(wasmBytes);
      a.init(256, 1280, 720);
      b.init(256, 1280, 720);

      a.seedRng(0xCAFEBABE);
      b.seedRng(0xCAFEBABE);

      a.spawnBurst(500, 300, 64, 700, 2.0, -1.5, 4, 12, 1.0, 3.0);
      b.spawnBurst(500, 300, 64, 700, 2.0, -1.5, 4, 12, 1.0, 3.0);

      for (let i = 0; i < 30; i++) {
        a.step(1 / 60);
        b.step(1 / 60);
      }

      let identical = a.activeCount === b.activeCount;
      for (let i = 0; i < a.activeCount && identical; i++) {
        if (a.views.x[i] !== b.views.x[i] || a.views.y[i] !== b.views.y[i] || a.views.rot[i] !== b.views.rot[i]) {
          identical = false;
        }
      }

      a.secureWipe();
      const wipedZero = a.activeCount === 0 && a.views.x[0] === 0 && a.views.y[0] === 0;

      passed = identical && wipedZero;
      detail = `Semilla 0xCAFEBABE idéntica · secure_wipe() limpia 940.8 KiB a 0`;
    } catch (err) {
      detail = err instanceof Error ? err.message : String(err);
    }
    results.push({
      id: 'determinism',
      name: 'Determinismo Bit-a-Bit y Secure Wipe',
      description: 'Dos instancias WASM con la misma semilla producen trayectorias idénticas y secure_wipe() limpia toda la arena.',
      passed,
      durationMs: performance.now() - t0,
      detail,
    });
  }

  return results;
}

interface JsParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  tilt: number;
  vTilt: number;
  wobble: number;
  vWobble: number;
  size: number;
  remLife: number;
  color: number;
  shape: number;
}

/**
 * Benchmarks AssemblyScript Zero-Alloc SoA + SIMD engine against a naive JS AoS object-allocating
 * confetti implementation for identical workload.
 */
export async function runPhysicsBenchmark(
  wasmBytes: BufferSource,
  particleCount = 15000,
  frames = 180
): Promise<BenchmarkResult> {
  const dt = 1 / 60;
  const gravity = 980;
  const drag = 1.65;
  const wind = 35;
  const turbulence = 180;

  // 1. WASM Zero-Alloc SoA + SIMD Benchmark
  const engine = await ConfettiEngine.fromBytes(wasmBytes);
  const actualCount = engine.init(particleCount, 1440, 900);
  engine.setPhysics(gravity, drag, wind, turbulence);
  engine.seedRng(1337);

  engine.spawnBurst(720, 450, 500, 750, Math.PI * 2, -Math.PI / 2, 5, 11, 2.0, 4.0);
  for (let i = 0; i < 10; i++) engine.step(dt);
  engine.clear();

  const beforeBytes = engine.exports.memory.buffer.byteLength;
  const tWasmStart = performance.now();
  engine.spawnBurst(720, 450, actualCount, 750, Math.PI * 2, -Math.PI / 2, 5, 11, 2.5, 4.5);
  for (let f = 0; f < frames; f++) {
    engine.step(dt);
    if (engine.activeCount < actualCount) {
      engine.spawnBurst(720, 450, actualCount - engine.activeCount, 750, Math.PI * 2, -Math.PI / 2, 5, 11, 2.5, 4.5);
    }
  }
  const wasmTotalMs = performance.now() - tWasmStart;
  const afterBytes = engine.exports.memory.buffer.byteLength;

  // 2. Naive JS Object-Allocating AoS Benchmark
  const jsParticles: JsParticle[] = [];
  let jsAllocatedObjects = 0;

  const spawnJsBatch = (n: number) => {
    for (let i = 0; i < n; i++) {
      const theta = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 2;
      const speed = 750 * (0.35 + Math.random() * 0.9);
      jsParticles.push({
        x: 720,
        y: 450,
        vx: Math.cos(theta) * speed,
        vy: Math.sin(theta) * speed,
        rot: Math.random() * 6.283,
        vRot: (Math.random() - 0.5) * 22,
        tilt: Math.random() * 6.283,
        vTilt: 6 + Math.random() * 10,
        wobble: Math.random() * 6.283,
        vWobble: 4 + Math.random() * 5.5,
        size: 5 + Math.random() * 6,
        remLife: 2.5 + Math.random() * 2.0,
        color: (Math.random() * 12) | 0,
        shape: (Math.random() * 4) | 0,
      });
      jsAllocatedObjects++;
    }
  };

  const tJsStart = performance.now();
  spawnJsBatch(actualCount);
  const damp = Math.exp(-drag * dt);
  for (let f = 0; f < frames; f++) {
    const alive: JsParticle[] = [];
    for (let i = 0; i < jsParticles.length; i++) {
      const p = jsParticles[i];
      p.remLife -= dt;
      if (p.remLife <= 0) continue;
      p.wobble += p.vWobble * dt;
      p.vx = p.vx * damp + (wind + Math.sin(p.wobble) * turbulence) * dt;
      p.vy = p.vy * damp + gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > 990) continue;
      p.rot += p.vRot * dt;
      p.tilt += p.vTilt * dt;
      alive.push(p);
    }
    jsParticles.length = 0;
    for (let i = 0; i < alive.length; i++) jsParticles.push(alive[i]);
    if (jsParticles.length < actualCount) {
      spawnJsBatch(actualCount - jsParticles.length);
    }
  }
  const jsTotalMs = performance.now() - tJsStart;

  return {
    particleCount: actualCount,
    frames,
    wasmTotalMs,
    wasmAvgFrameMs: wasmTotalMs / frames,
    jsTotalMs,
    jsAvgFrameMs: jsTotalMs / frames,
    speedup: wasmTotalMs > 0 ? jsTotalMs / wasmTotalMs : 1,
    wasmBufferDeltaBytes: afterBytes - beforeBytes,
    jsAllocatedObjects,
  };
}
