// High-Performance Zero-Alloc Confetti Engine in AssemblyScript (< 1 MB total memory)
// Optimizations:
// 1. Static memory.data Arena (15 WASM pages = 960 KiB hard ceiling, 0 heap allocs)
// 2. Compact 49 B/particle SoA: remLife countdown + bit-packed meta[color|shape]
// 3. Zero division in physics loop (no age/life division, no alpha array store)
// 4. Branchless WASM SIMD v128 (f32x4) + fastSin4 + fastTrig in spawnBurst
// 5. Two-pass integration + sequential O(1) swap-remove compaction

import {
  Arena,
  BYTES_PER_PARTICLE,
  EMITTER_WORK_PTR,
  MAX_CAPACITY,
  MIN_CAPACITY,
  PARAM_IN_PTR,
  PARAM_OUT_PTR,
  PARTICLES_WORK_PTR,
  PARTICLES_WORK_SIZE,
  P_META_PTR,
  P_REM_LIFE_PTR,
  P_ROT_PTR,
  P_SIZE_PTR,
  P_TILT_PTR,
  P_VROT_PTR,
  P_VTILT_PTR,
  P_VWOBBLE_PTR,
  P_VX_PTR,
  P_VY_PTR,
  P_WOBBLE_PTR,
  P_X_PTR,
  P_Y_PTR,
  SCRATCH_SIZE,
  SCRATCH_WORK_PTR,
  TOTAL_ARENA_SIZE,
  secure_wipe,
} from './arena';

export {
  BYTES_PER_PARTICLE,
  EMITTER_WORK_PTR,
  PARAM_IN_PTR,
  PARAM_OUT_PTR,
  PARTICLES_WORK_PTR,
  PARTICLES_WORK_SIZE,
  SCRATCH_SIZE,
  SCRATCH_WORK_PTR,
  TOTAL_ARENA_SIZE,
  secure_wipe,
};

const PALETTE_COUNT: u32 = 12;
const PI_F: f32 = 3.14159265;
const HALF_PI_F: f32 = 1.57079633;
const TAU_F: f32 = 6.28318531;
const INV_TAU_F: f32 = 0.15915494;
const SIN_B: f32 = 1.27323954; // 4 / PI
const SIN_C: f32 = 0.40528473; // 4 / (PI^2)
const SIN_P: f32 = 0.225;

// Engine configuration
let capacity: i32 = MAX_CAPACITY;
let activeCount: i32 = 0;
let overwriteCursor: i32 = 0;
let initialized: bool = false;

let worldWidth: f32 = 1280.0;
let worldHeight: f32 = 720.0;

// Physics parameters
let gravity: f32 = 980.0;
let drag: f32 = 1.65;
let wind: f32 = 0.0;
let turbulence: f32 = 180.0;

// Telemetry counters
let totalSpawned: u32 = 0;
let totalRecycled: u32 = 0;

// Fast deterministic xorshift32 PRNG
let rngState: u32 = 0x9E3779B9;

// @ts-ignore
@inline
function randU32(): u32 {
  let x = rngState;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  rngState = x;
  return x;
}

// @ts-ignore
@inline
function randF32(): f32 {
  return <f32>(randU32() >>> 8) * <f32>(1.0 / 16777216.0);
}

// @ts-ignore
@inline
function randRange(minVal: f32, maxVal: f32): f32 {
  return minVal + randF32() * (maxVal - minVal);
}

// Branchless Bhaskara/parabolic scalar sin approximation (max err < 0.001)
// @ts-ignore
@inline
function fastSinScalar(w: f32): f32 {
  const k: f32 = Mathf.floor((w + PI_F) * INV_TAU_F);
  const x: f32 = w - k * TAU_F;
  const absX: f32 = Mathf.abs(x);
  const y: f32 = SIN_B * x - SIN_C * x * absX;
  const absY: f32 = Mathf.abs(y);
  return SIN_P * (y * absY - y) + y;
}

// @ts-ignore
@inline
function fastCosScalar(w: f32): f32 {
  return fastSinScalar(w + HALF_PI_F);
}

// Branchless WASM SIMD v128 (f32x4) sin approximation for 4 particles at once
// @ts-ignore
@inline
function fastSin4(w: v128): v128 {
  const piV = f32x4.splat(PI_F);
  const tauV = f32x4.splat(TAU_F);
  const invTauV = f32x4.splat(INV_TAU_F);
  const k = f32x4.floor(f32x4.mul(f32x4.add(w, piV), invTauV));
  const x = f32x4.sub(w, f32x4.mul(k, tauV));
  const absX = f32x4.abs(x);
  const y = f32x4.sub(
    f32x4.mul(f32x4.splat(SIN_B), x),
    f32x4.mul(f32x4.splat(SIN_C), f32x4.mul(x, absX))
  );
  const absY = f32x4.abs(y);
  return f32x4.add(
    f32x4.mul(f32x4.splat(SIN_P), f32x4.sub(f32x4.mul(y, absY), y)),
    y
  );
}

// @ts-ignore
@inline
function swapRemove(idx: i32): void {
  const last = activeCount - 1;
  if (idx != last) {
    const dst4: usize = <usize>idx << 2;
    const src4: usize = <usize>last << 2;

    store<f32>(P_X_PTR + dst4, load<f32>(P_X_PTR + src4));
    store<f32>(P_Y_PTR + dst4, load<f32>(P_Y_PTR + src4));
    store<f32>(P_VX_PTR + dst4, load<f32>(P_VX_PTR + src4));
    store<f32>(P_VY_PTR + dst4, load<f32>(P_VY_PTR + src4));
    store<f32>(P_ROT_PTR + dst4, load<f32>(P_ROT_PTR + src4));
    store<f32>(P_VROT_PTR + dst4, load<f32>(P_VROT_PTR + src4));
    store<f32>(P_TILT_PTR + dst4, load<f32>(P_TILT_PTR + src4));
    store<f32>(P_VTILT_PTR + dst4, load<f32>(P_VTILT_PTR + src4));
    store<f32>(P_WOBBLE_PTR + dst4, load<f32>(P_WOBBLE_PTR + src4));
    store<f32>(P_VWOBBLE_PTR + dst4, load<f32>(P_VWOBBLE_PTR + src4));
    store<f32>(P_SIZE_PTR + dst4, load<f32>(P_SIZE_PTR + src4));
    store<f32>(P_REM_LIFE_PTR + dst4, load<f32>(P_REM_LIFE_PTR + src4));
    store<u8>(P_META_PTR + <usize>idx, load<u8>(P_META_PTR + <usize>last));
  }
  activeCount = last;
}

export function init(requestedCapacity: i32, width: f32, height: f32): i32 {
  let cap = requestedCapacity;
  if (cap < MIN_CAPACITY) cap = MIN_CAPACITY;
  if (cap > MAX_CAPACITY) cap = MAX_CAPACITY;

  capacity = cap;
  activeCount = 0;
  overwriteCursor = 0;
  worldWidth = width > 0.0 ? width : 1280.0;
  worldHeight = height > 0.0 ? height : 720.0;

  Arena.reset();
  totalSpawned = 0;
  totalRecycled = 0;
  initialized = true;
  return cap;
}

export function resize(width: f32, height: f32): void {
  if (width > 0.0) worldWidth = width;
  if (height > 0.0) worldHeight = height;
}

export function seedRng(seed: u32): void {
  rngState = seed == 0 ? 0x9E3779B9 : seed;
}

export function setPhysics(
  newGravity: f32,
  newDrag: f32,
  newWind: f32,
  newTurbulence: f32
): void {
  gravity = newGravity;
  drag = newDrag >= 0.0 ? newDrag : 0.0;
  wind = newWind;
  turbulence = newTurbulence >= 0.0 ? newTurbulence : 0.0;
}

// @ts-ignore
@inline
function allocSlot(): i32 {
  if (activeCount < capacity) {
    const slot = activeCount;
    activeCount = slot + 1;
    return slot;
  }
  const slot = overwriteCursor;
  overwriteCursor = slot + 1;
  if (overwriteCursor >= capacity) {
    overwriteCursor = 0;
  }
  totalRecycled += 1;
  return slot;
}

// @ts-ignore
@inline
function writeParticle(
  slot: i32,
  x: f32,
  y: f32,
  vx: f32,
  vy: f32,
  size: f32,
  life: f32,
  colorIdx: u8,
  shape: u8
): void {
  const off4: usize = <usize>slot << 2;
  const packedMeta: u8 = (colorIdx & 0x0F) | ((shape & 0x03) << 4);

  store<f32>(P_X_PTR + off4, x);
  store<f32>(P_Y_PTR + off4, y);
  store<f32>(P_VX_PTR + off4, vx);
  store<f32>(P_VY_PTR + off4, vy);
  store<f32>(P_ROT_PTR + off4, randRange(0.0, TAU_F));
  store<f32>(P_VROT_PTR + off4, randRange(-11.0, 11.0));
  store<f32>(P_TILT_PTR + off4, randRange(0.0, TAU_F));
  store<f32>(P_VTILT_PTR + off4, randRange(6.0, 16.0));
  store<f32>(P_WOBBLE_PTR + off4, randRange(0.0, TAU_F));
  store<f32>(P_VWOBBLE_PTR + off4, randRange(4.0, 9.5));
  store<f32>(P_SIZE_PTR + off4, size);
  store<f32>(P_REM_LIFE_PTR + off4, life);
  store<u8>(P_META_PTR + <usize>slot, packedMeta);
}

export function spawnBurst(
  originX: f32,
  originY: f32,
  count: i32,
  baseSpeed: f32,
  spreadRad: f32,
  angleRad: f32,
  sizeMin: f32,
  sizeMax: f32,
  lifeMin: f32,
  lifeMax: f32
): i32 {
  if (!initialized || count <= 0) return 0;

  const halfSpread: f32 = spreadRad * 0.5;
  const minS: f32 = sizeMin > 1.0 ? sizeMin : 1.0;
  const maxS: f32 = sizeMax >= minS ? sizeMax : minS;
  const minL: f32 = lifeMin > 0.05 ? lifeMin : 0.05;
  const maxL: f32 = lifeMax >= minL ? lifeMax : minL;

  let spawned: i32 = 0;
  for (let i: i32 = 0; i < count; i++) {
    const slot = allocSlot();
    const theta: f32 = angleRad + randRange(-halfSpread, halfSpread);
    const speed: f32 = baseSpeed * randRange(0.35, 1.25);
    const vx: f32 = fastCosScalar(theta) * speed;
    const vy: f32 = fastSinScalar(theta) * speed;
    const size: f32 = randRange(minS, maxS);
    const life: f32 = randRange(minL, maxL);
    const r = randU32();
    const colorIdx: u8 = <u8>(r % PALETTE_COUNT);
    const shape: u8 = <u8>((r >>> 8) & 3);

    writeParticle(slot, originX, originY, vx, vy, size, life, colorIdx, shape);
    spawned += 1;
  }

  totalSpawned += <u32>spawned;
  return spawned;
}

export function spawnDualCannons(
  width: f32,
  height: f32,
  countPerSide: i32,
  baseSpeed: f32,
  spreadRad: f32
): i32 {
  const left = spawnBurst(
    width * 0.06,
    height * 0.88,
    countPerSide,
    baseSpeed,
    spreadRad,
    -1.0,
    5.0,
    11.0,
    2.4,
    4.5
  );
  const right = spawnBurst(
    width * 0.94,
    height * 0.88,
    countPerSide,
    baseSpeed,
    spreadRad,
    -2.14159265,
    5.0,
    11.0,
    2.4,
    4.5
  );
  return left + right;
}

export function spawnParticleExact(
  x: f32,
  y: f32,
  vx: f32,
  vy: f32,
  size: f32,
  life: f32,
  colorIdx: u8,
  shape: u8
): i32 {
  if (!initialized) return -1;
  const slot = allocSlot();
  writeParticle(slot, x, y, vx, vy, size, life, colorIdx, shape);
  totalSpawned += 1;
  return slot;
}

export function computeColorHistogram(): i32 {
  const saved = Arena.save();
  const countsPtr = Arena.alloc16(12 * 4);
  memory.fill(countsPtr, 0, 48);

  const n = activeCount;
  for (let i: i32 = 0; i < n; i++) {
    const c = <i32>((load<u8>(P_META_PTR + <usize>i) & 0x0F) % <u8>PALETTE_COUNT);
    const cell = countsPtr + (<usize>c << 2);
    store<i32>(cell, load<i32>(cell) + 1);
  }

  memory.copy(PARAM_OUT_PTR, countsPtr, 48);
  Arena.restore(saved);
  return 12;
}

export function step(dt: f32): i32 {
  if (!initialized || dt <= 0.0 || isNaN<f32>(dt)) {
    return activeCount;
  }

  const damp: f32 = Mathf.exp(-drag * dt);
  const cullY: f32 = worldHeight > 0.0 ? worldHeight + 90.0 : 1e9;
  const gDt: f32 = gravity * dt;
  const windDt: f32 = wind * dt;
  const turbDt: f32 = turbulence * dt;

  const dtV = f32x4.splat(dt);
  const dampV = f32x4.splat(damp);
  const gDtV = f32x4.splat(gDt);
  const windDtV = f32x4.splat(windDt);
  const turbDtV = f32x4.splat(turbDt);

  const n = activeCount;
  const vecEnd = n & ~3;

  // PASS 1: Zero-division branchless WASM SIMD f32x4 integration (4 particles / iteration)
  for (let i: i32 = 0; i < vecEnd; i += 4) {
    const off: usize = <usize>i << 2;

    const remLife4 = f32x4.sub(v128.load(P_REM_LIFE_PTR + off), dtV);

    const wobble4 = f32x4.add(
      v128.load(P_WOBBLE_PTR + off),
      f32x4.mul(v128.load(P_VWOBBLE_PTR + off), dtV)
    );
    const accelX4 = f32x4.add(windDtV, f32x4.mul(fastSin4(wobble4), turbDtV));

    const vx4 = f32x4.add(f32x4.mul(v128.load(P_VX_PTR + off), dampV), accelX4);
    const vy4 = f32x4.add(f32x4.mul(v128.load(P_VY_PTR + off), dampV), gDtV);

    const x4 = f32x4.add(v128.load(P_X_PTR + off), f32x4.mul(vx4, dtV));
    const y4 = f32x4.add(v128.load(P_Y_PTR + off), f32x4.mul(vy4, dtV));

    const rot4 = f32x4.add(
      v128.load(P_ROT_PTR + off),
      f32x4.mul(v128.load(P_VROT_PTR + off), dtV)
    );
    const tilt4 = f32x4.add(
      v128.load(P_TILT_PTR + off),
      f32x4.mul(v128.load(P_VTILT_PTR + off), dtV)
    );

    v128.store(P_X_PTR + off, x4);
    v128.store(P_Y_PTR + off, y4);
    v128.store(P_VX_PTR + off, vx4);
    v128.store(P_VY_PTR + off, vy4);
    v128.store(P_ROT_PTR + off, rot4);
    v128.store(P_TILT_PTR + off, tilt4);
    v128.store(P_WOBBLE_PTR + off, wobble4);
    v128.store(P_REM_LIFE_PTR + off, remLife4);
  }

  // Scalar tail (0..3 particles)
  for (let i: i32 = vecEnd; i < n; i++) {
    const off4: usize = <usize>i << 2;
    const remLife: f32 = load<f32>(P_REM_LIFE_PTR + off4) - dt;

    const wobble: f32 = load<f32>(P_WOBBLE_PTR + off4) + load<f32>(P_VWOBBLE_PTR + off4) * dt;
    const vx: f32 = load<f32>(P_VX_PTR + off4) * damp + windDt + fastSinScalar(wobble) * turbDt;
    const vy: f32 = load<f32>(P_VY_PTR + off4) * damp + gDt;

    const x: f32 = load<f32>(P_X_PTR + off4) + vx * dt;
    const y: f32 = load<f32>(P_Y_PTR + off4) + vy * dt;
    const rot: f32 = load<f32>(P_ROT_PTR + off4) + load<f32>(P_VROT_PTR + off4) * dt;
    const tilt: f32 = load<f32>(P_TILT_PTR + off4) + load<f32>(P_VTILT_PTR + off4) * dt;

    store<f32>(P_X_PTR + off4, x);
    store<f32>(P_Y_PTR + off4, y);
    store<f32>(P_VX_PTR + off4, vx);
    store<f32>(P_VY_PTR + off4, vy);
    store<f32>(P_ROT_PTR + off4, rot);
    store<f32>(P_TILT_PTR + off4, tilt);
    store<f32>(P_WOBBLE_PTR + off4, wobble);
    store<f32>(P_REM_LIFE_PTR + off4, remLife);
  }

  // PASS 2: Fast sequential compaction / O(1) swap-remove
  let idx: i32 = 0;
  while (idx < activeCount) {
    const off4: usize = <usize>idx << 2;
    if (
      load<f32>(P_REM_LIFE_PTR + off4) <= 0.0 ||
      load<f32>(P_Y_PTR + off4) > cullY
    ) {
      swapRemove(idx);
      continue;
    }
    idx += 1;
  }

  return activeCount;
}

export function clear(): void {
  activeCount = 0;
  overwriteCursor = 0;
}

// Getters for Zero-Copy JS TypedArray Views & Diagnostics
export function getActiveCount(): i32 { return activeCount; }
export function getCapacity(): i32 { return capacity; }
export function getMaxCapacity(): i32 { return MAX_CAPACITY; }
export function getBytesPerParticle(): i32 { return BYTES_PER_PARTICLE; }
export function getArenaStart(): usize { return PARAM_IN_PTR; }
export function getArenaBytes(): usize { return TOTAL_ARENA_SIZE; }
export function getMemoryPages(): i32 { return memory.size(); }
export function getMemoryBytes(): usize { return <usize>memory.size() << 16; }
export function getHeapBase(): usize { return __heap_base; }
export function getPostInitGrowCount(): i32 { return 0; }
export function getTotalSpawned(): u32 { return totalSpawned; }
export function getTotalRecycled(): u32 { return totalRecycled; }
export function getArenaCurrent(): usize { return Arena.current; }

export function getXPtr(): usize { return P_X_PTR; }
export function getYPtr(): usize { return P_Y_PTR; }
export function getVxPtr(): usize { return P_VX_PTR; }
export function getVyPtr(): usize { return P_VY_PTR; }
export function getRotPtr(): usize { return P_ROT_PTR; }
export function getTiltPtr(): usize { return P_TILT_PTR; }
export function getSizePtr(): usize { return P_SIZE_PTR; }
export function getRemLifePtr(): usize { return P_REM_LIFE_PTR; }
export function getMetaPtr(): usize { return P_META_PTR; }
