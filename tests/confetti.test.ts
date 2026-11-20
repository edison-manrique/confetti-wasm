import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ConfettiEngine } from '../src/engine/confettiWasm';
import {
  degToSpreadRad,
  degToWasmAngle,
  resolveBurstParams,
} from '../src/engine/confettiWrapper';
import { runVerificationSuite, runPhysicsBenchmark } from '../src/engine/verification';
import { tokenizeCode } from '../src/utils/highlightCode';

const wasmPath = path.resolve(process.cwd(), 'public/confetti.wasm');
const wasmBytes = fs.readFileSync(wasmPath);

test('AssemblyScript confetti.wasm passes all < 1 MB static arena, RAII, SIMD, and physics checks', async () => {
  const results = await runVerificationSuite(wasmBytes);
  assert.equal(results.length, 6);
  for (const r of results) {
    assert.equal(r.passed, true, `Check "${r.name}" failed: ${r.detail}`);
  }
});

test('ConfettiEngine locks total memory <= 1 MB (15 pages = 960 KiB) and handles 19,200 particles', async () => {
  const engine = await ConfettiEngine.fromBytes(wasmBytes);
  const cap = engine.init(19200, 1920, 1080);
  assert.equal(cap, 19200);
  assert.equal(engine.exports.getMemoryPages(), 15);
  assert.ok(engine.exports.memory.buffer.byteLength <= 1048576);
  assert.equal(engine.exports.getBytesPerParticle(), 49);

  // Confirm WASM memory hard ceiling cannot grow beyond 15 pages
  assert.throws(() => engine.exports.memory.grow(1), RangeError);

  const memBytesBefore = engine.exports.memory.buffer.byteLength;
  const spawned = engine.spawnBurst(960, 540, 19200, 900, Math.PI * 2, -Math.PI / 2, 4, 10, 1.0, 2.0);
  assert.equal(spawned, 19200);
  assert.equal(engine.activeCount, 19200);

  // RAII Arena.save / alloc16 / restore check via computeColorHistogram()
  const arenaBefore = engine.exports.getArenaCurrent();
  const hist = engine.computeColorHistogram();
  assert.equal(engine.exports.getArenaCurrent(), arenaBefore);
  let histTotal = 0;
  for (let i = 0; i < 12; i++) histTotal += hist[i];
  assert.equal(histTotal, 19200);

  for (let i = 0; i < 120; i++) {
    engine.step(1 / 60);
  }

  assert.equal(engine.exports.memory.buffer.byteLength, memBytesBefore);
  assert.equal(engine.exports.getPostInitGrowCount(), 0);
  assert.ok(engine.activeCount < 19200, 'Some particles should have expired or exited viewport after 2 seconds');

  engine.secureWipe();
  assert.equal(engine.activeCount, 0);
  assert.equal(engine.views.x[0], 0);
  assert.equal(engine.views.y[0], 0);

  const dualSpawned = engine.spawnDualCannons(1280, 720, 50, 900, 1.0);
  assert.equal(dualSpawned, 100);
  assert.equal(engine.activeCount, 100);
  assert.equal(engine.exports.memory.buffer.byteLength, memBytesBefore);
});

test('Benchmark completes cleanly and WASM SoA + SIMD executes without buffer growth', async () => {
  const bench = await runPhysicsBenchmark(wasmBytes, 10000, 60);
  assert.equal(bench.wasmBufferDeltaBytes, 0);
  assert.ok(bench.wasmTotalMs > 0);
  assert.ok(bench.jsTotalMs > 0);
});

test('confettiWrapper angle & burst parameter normalization maps degrees and normalized origin accurately', () => {
  assert.ok(Math.abs(degToWasmAngle(90) - -Math.PI / 2) < 1e-6);
  assert.ok(Math.abs(degToWasmAngle(0) - 0) < 1e-6);
  assert.ok(Math.abs(degToWasmAngle(180) - -Math.PI) < 1e-6);
  assert.ok(Math.abs(degToSpreadRad(90) - Math.PI / 2) < 1e-6);
  assert.ok(Math.abs(degToSpreadRad(500) - Math.PI * 2) < 1e-6);

  const resolved = resolveBurstParams(
    { particleCount: 250, startVelocity: 920, spread: 120, angle: 90, origin: { x: 0.25, y: 0.5 } },
    1000,
    800
  );
  assert.equal(resolved.originX, 250);
  assert.equal(resolved.originY, 400);
  assert.equal(resolved.count, 250);
  assert.equal(resolved.speed, 920);
  assert.ok(Math.abs(resolved.angleRad - -Math.PI / 2) < 1e-6);
  assert.ok(Math.abs(resolved.spreadRad - (120 * Math.PI) / 180) < 1e-6);

  // Clamping guard
  const clamped = resolveBurstParams({ count: 999999, origin: { x: 320, y: 240 } }, 1000, 800);
  assert.equal(clamped.count, 19200);
  assert.equal(clamped.originX, 320);
  assert.equal(clamped.originY, 240);
});

test('tokenizeCode preserves exact characters and assigns colorful token kinds across TS/TSX/Bash', () => {
  const tsSample = `import { confetti } from 'confetti-wasm';\n// dispara\nawait confetti.celebrate({ count: 220 });`;
  const tsLines = tokenizeCode(tsSample, 'ts');
  assert.equal(tsLines.map((l) => l.map((t) => t.text).join('')).join('\n'), tsSample);
  assert.ok(tsLines[0].some((t) => t.kind === 'keyword' && t.text === 'import'));
  assert.ok(tsLines[0].some((t) => t.kind === 'type' && t.text === 'confetti'));
  assert.ok(tsLines[0].some((t) => t.kind === 'string' && t.text === "'confetti-wasm'"));
  assert.ok(tsLines[1].some((t) => t.kind === 'comment'));
  assert.ok(tsLines[2].some((t) => t.kind === 'function' && t.text === 'celebrate'));
  assert.ok(tsLines[2].some((t) => t.kind === 'number' && t.text === '220'));

  const bashSample = `# OIDC publish\nnpm publish --access public`;
  const bashLines = tokenizeCode(bashSample, 'bash');
  assert.equal(bashLines.map((l) => l.map((t) => t.text).join('')).join('\n'), bashSample);
  assert.equal(bashLines[0][0].kind, 'comment');
  assert.ok(bashLines[1].some((t) => t.kind === 'keyword' && t.text === 'npm'));
  assert.ok(bashLines[1].some((t) => t.kind === 'flag' && t.text === '--access'));
});

test('360-degree circular burst produces uniform 2D density across core, mid, and outer rim', async () => {
  const engine = await ConfettiEngine.fromBytes(wasmBytes);
  engine.init(4096, 1600, 1200);
  engine.seedRng(0x12345678);
  engine.setPhysics(0, 2.35, 0, 120); // Zero gravity isolates pure radial expansion check

  const originX = 800;
  const originY = 600;
  engine.spawnBurst(originX, originY, 2000, 900, Math.PI * 2, -Math.PI / 2, 4.2, 8.6, 2.5, 4.0);

  for (let i = 0; i < 20; i++) {
    engine.step(1 / 60);
  }

  const n = engine.activeCount;
  assert.equal(n, 2000);

  const radii: number[] = [];
  for (let i = 0; i < n; i++) {
    const dx = engine.views.x[i] - originX;
    const dy = engine.views.y[i] - originY;
    radii.push(Math.hypot(dx, dy));
  }
  radii.sort((a, b) => a - b);

  const p95Radius = radii[Math.floor(n * 0.95)];
  const innerCoreCount = radii.filter((r) => r < p95Radius * 0.3).length;
  const midBandCount = radii.filter((r) => r >= p95Radius * 0.3 && r < p95Radius * 0.65).length;
  const outerRimCount = radii.filter((r) => r >= p95Radius * 0.65).length;

  assert.ok(p95Radius > 200, `Expected radial expansion > 200px, got ${p95Radius}`);
  // Uniform 2D disk area shares: ~9% in [0..0.30R], ~33% in [0.30..0.65R], ~58% in [0.65R..]
  assert.ok(
    innerCoreCount >= n * 0.06 && innerCoreCount <= n * 0.18,
    `Expected balanced inner core density (6%..18%), got ${((innerCoreCount / n) * 100).toFixed(1)}%`
  );
  assert.ok(
    midBandCount >= n * 0.25 && midBandCount <= n * 0.45,
    `Expected uniform mid band (25%..45%), got ${((midBandCount / n) * 100).toFixed(1)}%`
  );
  assert.ok(
    outerRimCount >= n * 0.42,
    `Expected strong outer spread (>= 42%), got ${((outerRimCount / n) * 100).toFixed(1)}%`
  );
});

test('Engine starts with deterministic state and advances seed state deterministically across calls', async () => {
  const a = await ConfettiEngine.fromBytes(wasmBytes);
  const b = await ConfettiEngine.fromBytes(wasmBytes);

  a.init(1024, 1280, 720);
  b.init(1024, 1280, 720);

  // Starts from identical deterministic default seed state (0x9E3779B9)
  const s0 = a.getRngState();
  assert.equal(s0, 0x9E3779B9);
  assert.equal(b.getRngState(), s0);

  // First call mutates PRNG state deterministically
  a.spawnBurst(640, 360, 120, 800, Math.PI * 2, -Math.PI / 2, 4.2, 8.6, 2.0, 4.0);
  const s1 = a.getRngState();
  assert.notEqual(s1, s0);

  const firstBurstX = Array.from(a.views.x.subarray(0, 120));
  a.clear();

  // Second call uses the updated state -> produces different burst while remaining deterministic
  a.spawnBurst(640, 360, 120, 800, Math.PI * 2, -Math.PI / 2, 4.2, 8.6, 2.0, 4.0);
  const s2 = a.getRngState();
  assert.notEqual(s2, s1);
  const secondBurstX = Array.from(a.views.x.subarray(0, 120));
  assert.notDeepEqual(secondBurstX, firstBurstX);

  // Independent engine `b` replays the exact same sequence -> identical states & outputs bit-for-bit
  b.spawnBurst(640, 360, 120, 800, Math.PI * 2, -Math.PI / 2, 4.2, 8.6, 2.0, 4.0);
  assert.equal(b.getRngState(), s1);
  b.clear();
  b.spawnBurst(640, 360, 120, 800, Math.PI * 2, -Math.PI / 2, 4.2, 8.6, 2.0, 4.0);
  assert.equal(b.getRngState(), s2);
  assert.deepEqual(Array.from(b.views.x.subarray(0, 120)), secondBurstX);
});
