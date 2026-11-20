export interface ConfettiWasmExports {
  memory: WebAssembly.Memory;
  PARAM_IN_PTR: WebAssembly.Global | number;
  PARAM_OUT_PTR: WebAssembly.Global | number;
  SCRATCH_WORK_PTR: WebAssembly.Global | number;
  EMITTER_WORK_PTR: WebAssembly.Global | number;
  PARTICLES_WORK_PTR: WebAssembly.Global | number;
  SCRATCH_SIZE: WebAssembly.Global | number;
  PARTICLES_WORK_SIZE: WebAssembly.Global | number;
  TOTAL_ARENA_SIZE: WebAssembly.Global | number;
  init(requestedCapacity: number, width: number, height: number): number;
  resize(width: number, height: number): void;
  seedRng(seed: number): void;
  setPhysics(gravity: number, drag: number, wind: number, turbulence: number): void;
  spawnBurst(
    originX: number,
    originY: number,
    count: number,
    baseSpeed: number,
    spreadRad: number,
    angleRad: number,
    sizeMin: number,
    sizeMax: number,
    lifeMin: number,
    lifeMax: number
  ): number;
  spawnDualCannons(
    width: number,
    height: number,
    countPerSide: number,
    baseSpeed: number,
    spreadRad: number
  ): number;
  spawnParticleExact(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    life: number,
    colorIdx: number,
    shape: number
  ): number;
  computeColorHistogram(): number;
  secure_wipe(): void;
  step(dt: number): number;
  clear(): void;
  getActiveCount(): number;
  getCapacity(): number;
  getMaxCapacity(): number;
  getBytesPerParticle(): number;
  getArenaStart(): number;
  getArenaBytes(): number;
  getArenaCurrent(): number;
  getMemoryPages(): number;
  getMemoryBytes(): number;
  getHeapBase(): number;
  getPostInitGrowCount(): number;
  getTotalSpawned(): number;
  getTotalRecycled(): number;
  getXPtr(): number;
  getYPtr(): number;
  getVxPtr(): number;
  getVyPtr(): number;
  getRotPtr(): number;
  getTiltPtr(): number;
  getSizePtr(): number;
  getRemLifePtr(): number;
  getMetaPtr(): number;
}

export interface SoAViews {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  rot: Float32Array;
  tilt: Float32Array;
  size: Float32Array;
  remLife: Float32Array;
  meta: Uint8Array;
  paramOutI32: Int32Array;
}

export interface SoALaneDescriptor {
  name: string;
  type: 'f32' | 'u8';
  ptr: number;
  byteLength: number;
}

export interface ArenaWorldDescriptor {
  name: string;
  purpose: string;
  ptr: number;
  byteLength: number;
}

export interface MemoryDiagnostics {
  capacity: number;
  maxCapacity: number;
  activeCount: number;
  heapBase: number;
  arenaStart: number;
  arenaBytes: number;
  arenaCurrent: number;
  memoryPages: number;
  memoryBytes: number;
  bytesPerParticle: number;
  totalSpawned: number;
  totalRecycled: number;
  postInitGrowCount: number;
  lanes: SoALaneDescriptor[];
  worlds: ArenaWorldDescriptor[];
}

export const CONFETTI_PALETTE: readonly string[] = [
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#10B981', // Emerald
  '#3B82F6', // Cobalt
  '#EC4899', // Magenta
  '#EAB308', // Gold
  '#8B5CF6', // Violet
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#38BDF8', // Sky
  '#FDE047', // Lemon
];

export const SHAPE_NAMES = ['Rectángulo', 'Cinta', 'Rombo', 'Círculo'] as const;

function readGlobal(val: WebAssembly.Global | number | undefined, fallback: number): number {
  if (typeof val === 'number') return val;
  if (val && typeof val.value === 'number') return val.value;
  return fallback;
}

export class ConfettiEngine {
  public readonly exports: ConfettiWasmExports;
  public views!: SoAViews;
  private boundBuffer: ArrayBuffer | null = null;

  private constructor(exports: ConfettiWasmExports) {
    this.exports = exports;
  }

  public static async fromUrl(url = '/confetti.wasm'): Promise<ConfettiEngine> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${url}: HTTP ${response.status}`);
    }
    const bytes = await response.arrayBuffer();
    return ConfettiEngine.fromBytes(bytes);
  }

  public static async fromBytes(bytes: BufferSource): Promise<ConfettiEngine> {
    const { instance } = await WebAssembly.instantiate(bytes, {
      env: {
        abort: (msgPtr: number, filePtr: number, line: number, col: number) => {
          throw new Error(`WASM abort (${msgPtr}:${filePtr}) at ${line}:${col}`);
        },
      },
    });
    const exports = instance.exports as unknown as ConfettiWasmExports;
    return new ConfettiEngine(exports);
  }

  public init(capacity: number, width: number, height: number): number {
    const actualCap = this.exports.init(capacity, width, height);
    if (actualCap < 0) {
      throw new Error('Error al inicializar la arena estática');
    }
    this.rebindViews();
    return actualCap;
  }

  public rebindViews(): void {
    const buf = this.exports.memory.buffer;
    const cap = this.exports.getCapacity();
    const paramOutPtr = readGlobal(this.exports.PARAM_OUT_PTR, this.exports.getArenaStart() + 2048);
    this.boundBuffer = buf;
    this.views = {
      x: new Float32Array(buf, this.exports.getXPtr(), cap),
      y: new Float32Array(buf, this.exports.getYPtr(), cap),
      vx: new Float32Array(buf, this.exports.getVxPtr(), cap),
      vy: new Float32Array(buf, this.exports.getVyPtr(), cap),
      rot: new Float32Array(buf, this.exports.getRotPtr(), cap),
      tilt: new Float32Array(buf, this.exports.getTiltPtr(), cap),
      size: new Float32Array(buf, this.exports.getSizePtr(), cap),
      remLife: new Float32Array(buf, this.exports.getRemLifePtr(), cap),
      meta: new Uint8Array(buf, this.exports.getMetaPtr(), cap),
      paramOutI32: new Int32Array(buf, paramOutPtr, 12),
    };
  }

  public ensureViewsCurrent(): boolean {
    return this.boundBuffer === this.exports.memory.buffer;
  }

  public resize(width: number, height: number): void {
    this.exports.resize(width, height);
  }

  public seedRng(seed: number): void {
    this.exports.seedRng(seed >>> 0);
  }

  public setPhysics(gravity: number, drag: number, wind: number, turbulence: number): void {
    this.exports.setPhysics(gravity, drag, wind, turbulence);
  }

  public spawnBurst(
    originX: number,
    originY: number,
    count: number,
    baseSpeed: number,
    spreadRad: number,
    angleRad: number,
    sizeMin: number,
    sizeMax: number,
    lifeMin: number,
    lifeMax: number
  ): number {
    return this.exports.spawnBurst(
      originX,
      originY,
      count,
      baseSpeed,
      spreadRad,
      angleRad,
      sizeMin,
      sizeMax,
      lifeMin,
      lifeMax
    );
  }

  public spawnDualCannons(
    width: number,
    height: number,
    countPerSide: number,
    baseSpeed: number,
    spreadRad: number
  ): number {
    return this.exports.spawnDualCannons(width, height, countPerSide, baseSpeed, spreadRad);
  }

  public spawnParticleExact(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    life: number,
    colorIdx: number,
    shape: number
  ): number {
    return this.exports.spawnParticleExact(x, y, vx, vy, size, life, colorIdx, shape);
  }

  public computeColorHistogram(): Int32Array {
    this.exports.computeColorHistogram();
    return this.views.paramOutI32;
  }

  public secureWipe(): void {
    this.exports.clear();
    this.exports.secure_wipe();
  }

  public step(dt: number): number {
    return this.exports.step(dt);
  }

  public clear(): void {
    this.exports.clear();
  }

  public get activeCount(): number {
    return this.exports.getActiveCount();
  }

  public get capacity(): number {
    return this.exports.getCapacity();
  }

  public getDiagnostics(): MemoryDiagnostics {
    const cap = this.exports.getCapacity();
    const maxCap = this.exports.getMaxCapacity();
    const f32Len = cap * 4;
    const u8Len = cap;
    const arenaStart = this.exports.getArenaStart();
    const paramInPtr = readGlobal(this.exports.PARAM_IN_PTR, arenaStart);
    const paramOutPtr = readGlobal(this.exports.PARAM_OUT_PTR, paramInPtr + 2048);
    const scratchPtr = readGlobal(this.exports.SCRATCH_WORK_PTR, paramOutPtr + 2048);
    const emitterPtr = readGlobal(this.exports.EMITTER_WORK_PTR, scratchPtr + 16384);
    const particlesPtr = readGlobal(this.exports.PARTICLES_WORK_PTR, emitterPtr + 2048);
    const particlesSize = readGlobal(this.exports.PARTICLES_WORK_SIZE, 940800);

    const worlds: ArenaWorldDescriptor[] = [
      { name: 'PARAM_IN', purpose: 'I/O entrada batch', ptr: paramInPtr, byteLength: 2048 },
      { name: 'PARAM_OUT', purpose: 'I/O salida telemetría', ptr: paramOutPtr, byteLength: 2048 },
      { name: 'SCRATCH_WORK', purpose: 'Arena bump RAII (save/restore)', ptr: scratchPtr, byteLength: 16384 },
      { name: 'EMITTER_WORK', purpose: 'Layout fijo emisores', ptr: emitterPtr, byteLength: 2048 },
      { name: 'PARTICLES_WORK', purpose: `Carriles SoA ${(maxCap / 1000).toFixed(1)}k part. (16B)`, ptr: particlesPtr, byteLength: particlesSize },
    ];

    // Note: in static arena, each f32 lane stride is MAX_CAPACITY * 4 (76.8 KiB)
    const maxF32Stride = maxCap * 4;
    const lanes: SoALaneDescriptor[] = [
      { name: 'x[]', type: 'f32', ptr: this.exports.getXPtr(), byteLength: f32Len },
      { name: 'y[]', type: 'f32', ptr: this.exports.getYPtr(), byteLength: f32Len },
      { name: 'vx[]', type: 'f32', ptr: this.exports.getVxPtr(), byteLength: f32Len },
      { name: 'vy[]', type: 'f32', ptr: this.exports.getVyPtr(), byteLength: f32Len },
      { name: 'rot[]', type: 'f32', ptr: this.exports.getRotPtr(), byteLength: f32Len },
      { name: 'vRot[]', type: 'f32', ptr: this.exports.getRotPtr() + maxF32Stride, byteLength: f32Len },
      { name: 'tilt[]', type: 'f32', ptr: this.exports.getTiltPtr(), byteLength: f32Len },
      { name: 'vTilt[]', type: 'f32', ptr: this.exports.getTiltPtr() + maxF32Stride, byteLength: f32Len },
      { name: 'wobble[]', type: 'f32', ptr: this.exports.getTiltPtr() + maxF32Stride * 2, byteLength: f32Len },
      { name: 'vWobble[]', type: 'f32', ptr: this.exports.getTiltPtr() + maxF32Stride * 3, byteLength: f32Len },
      { name: 'size[]', type: 'f32', ptr: this.exports.getSizePtr(), byteLength: f32Len },
      { name: 'remLife[]', type: 'f32', ptr: this.exports.getRemLifePtr(), byteLength: f32Len },
      { name: 'meta[]', type: 'u8', ptr: this.exports.getMetaPtr(), byteLength: u8Len },
    ];

    return {
      capacity: cap,
      maxCapacity: maxCap,
      activeCount: this.exports.getActiveCount(),
      heapBase: this.exports.getHeapBase(),
      arenaStart,
      arenaBytes: this.exports.getArenaBytes(),
      arenaCurrent: this.exports.getArenaCurrent(),
      memoryPages: this.exports.getMemoryPages(),
      memoryBytes: this.exports.getMemoryBytes(),
      bytesPerParticle: this.exports.getBytesPerParticle(),
      totalSpawned: this.exports.getTotalSpawned(),
      totalRecycled: this.exports.getTotalRecycled(),
      postInitGrowCount: this.exports.getPostInitGrowCount(),
      lanes,
      worlds,
    };
  }
}
