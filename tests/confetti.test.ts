import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ConfettiEngine } from '../src/engine/confettiWasm';
import { runVerificationSuite, runPhysicsBenchmark } from '../src/engine/verification';

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
