declare namespace __AdaptedExports {
  /** Exported memory */
  export const memory: WebAssembly.Memory;
  /**
   * assembly/confetti/init
   * @param requestedCapacity `i32`
   * @param width `f32`
   * @param height `f32`
   * @returns `i32`
   */
  export function init(requestedCapacity: number, width: number, height: number): number;
  /**
   * assembly/confetti/resize
   * @param width `f32`
   * @param height `f32`
   */
  export function resize(width: number, height: number): void;
  /**
   * assembly/confetti/seedRng
   * @param seed `u32`
   */
  export function seedRng(seed: number): void;
  /**
   * assembly/confetti/setPhysics
   * @param newGravity `f32`
   * @param newDrag `f32`
   * @param newWind `f32`
   * @param newTurbulence `f32`
   */
  export function setPhysics(newGravity: number, newDrag: number, newWind: number, newTurbulence: number): void;
  /**
   * assembly/confetti/spawnBurst
   * @param originX `f32`
   * @param originY `f32`
   * @param count `i32`
   * @param baseSpeed `f32`
   * @param spreadRad `f32`
   * @param angleRad `f32`
   * @param sizeMin `f32`
   * @param sizeMax `f32`
   * @param lifeMin `f32`
   * @param lifeMax `f32`
   * @returns `i32`
   */
  export function spawnBurst(originX: number, originY: number, count: number, baseSpeed: number, spreadRad: number, angleRad: number, sizeMin: number, sizeMax: number, lifeMin: number, lifeMax: number): number;
  /**
   * assembly/confetti/spawnDualCannons
   * @param width `f32`
   * @param height `f32`
   * @param countPerSide `i32`
   * @param baseSpeed `f32`
   * @param spreadRad `f32`
   * @returns `i32`
   */
  export function spawnDualCannons(width: number, height: number, countPerSide: number, baseSpeed: number, spreadRad: number): number;
  /**
   * assembly/confetti/spawnParticleExact
   * @param x `f32`
   * @param y `f32`
   * @param vx `f32`
   * @param vy `f32`
   * @param size `f32`
   * @param life `f32`
   * @param colorIdx `u8`
   * @param shape `u8`
   * @returns `i32`
   */
  export function spawnParticleExact(x: number, y: number, vx: number, vy: number, size: number, life: number, colorIdx: number, shape: number): number;
  /**
   * assembly/confetti/computeColorHistogram
   * @returns `i32`
   */
  export function computeColorHistogram(): number;
  /**
   * assembly/confetti/step
   * @param dt `f32`
   * @returns `i32`
   */
  export function step(dt: number): number;
  /**
   * assembly/confetti/clear
   */
  export function clear(): void;
  /**
   * assembly/confetti/getActiveCount
   * @returns `i32`
   */
  export function getActiveCount(): number;
  /**
   * assembly/confetti/getCapacity
   * @returns `i32`
   */
  export function getCapacity(): number;
  /**
   * assembly/confetti/getMaxCapacity
   * @returns `i32`
   */
  export function getMaxCapacity(): number;
  /**
   * assembly/confetti/getBytesPerParticle
   * @returns `i32`
   */
  export function getBytesPerParticle(): number;
  /**
   * assembly/confetti/getArenaStart
   * @returns `usize`
   */
  export function getArenaStart(): number;
  /**
   * assembly/confetti/getArenaBytes
   * @returns `usize`
   */
  export function getArenaBytes(): number;
  /**
   * assembly/confetti/getMemoryPages
   * @returns `i32`
   */
  export function getMemoryPages(): number;
  /**
   * assembly/confetti/getMemoryBytes
   * @returns `usize`
   */
  export function getMemoryBytes(): number;
  /**
   * assembly/confetti/getHeapBase
   * @returns `usize`
   */
  export function getHeapBase(): number;
  /**
   * assembly/confetti/getPostInitGrowCount
   * @returns `i32`
   */
  export function getPostInitGrowCount(): number;
  /**
   * assembly/confetti/getTotalSpawned
   * @returns `u32`
   */
  export function getTotalSpawned(): number;
  /**
   * assembly/confetti/getTotalRecycled
   * @returns `u32`
   */
  export function getTotalRecycled(): number;
  /**
   * assembly/confetti/getArenaCurrent
   * @returns `usize`
   */
  export function getArenaCurrent(): number;
  /**
   * assembly/confetti/getXPtr
   * @returns `usize`
   */
  export function getXPtr(): number;
  /**
   * assembly/confetti/getYPtr
   * @returns `usize`
   */
  export function getYPtr(): number;
  /**
   * assembly/confetti/getVxPtr
   * @returns `usize`
   */
  export function getVxPtr(): number;
  /**
   * assembly/confetti/getVyPtr
   * @returns `usize`
   */
  export function getVyPtr(): number;
  /**
   * assembly/confetti/getRotPtr
   * @returns `usize`
   */
  export function getRotPtr(): number;
  /**
   * assembly/confetti/getTiltPtr
   * @returns `usize`
   */
  export function getTiltPtr(): number;
  /**
   * assembly/confetti/getSizePtr
   * @returns `usize`
   */
  export function getSizePtr(): number;
  /**
   * assembly/confetti/getRemLifePtr
   * @returns `usize`
   */
  export function getRemLifePtr(): number;
  /**
   * assembly/confetti/getMetaPtr
   * @returns `usize`
   */
  export function getMetaPtr(): number;
  /** assembly/arena/BYTES_PER_PARTICLE */
  export const BYTES_PER_PARTICLE: {
    /** @type `i32` */
    get value(): number
  };
  /** assembly/arena/EMITTER_WORK_PTR */
  export const EMITTER_WORK_PTR: {
    /** @type `usize` */
    get value(): number
  };
  /** assembly/arena/PARAM_IN_PTR */
  export const PARAM_IN_PTR: {
    /** @type `usize` */
    get value(): number
  };
  /** assembly/arena/PARAM_OUT_PTR */
  export const PARAM_OUT_PTR: {
    /** @type `usize` */
    get value(): number
  };
  /** assembly/arena/PARTICLES_WORK_PTR */
  export const PARTICLES_WORK_PTR: {
    /** @type `usize` */
    get value(): number
  };
  /** assembly/arena/PARTICLES_WORK_SIZE */
  export const PARTICLES_WORK_SIZE: {
    /** @type `usize` */
    get value(): number
  };
  /** assembly/arena/SCRATCH_SIZE */
  export const SCRATCH_SIZE: {
    /** @type `usize` */
    get value(): number
  };
  /** assembly/arena/SCRATCH_WORK_PTR */
  export const SCRATCH_WORK_PTR: {
    /** @type `usize` */
    get value(): number
  };
  /** assembly/arena/TOTAL_ARENA_SIZE */
  export const TOTAL_ARENA_SIZE: {
    /** @type `usize` */
    get value(): number
  };
  /**
   * assembly/arena/secure_wipe
   */
  export function secure_wipe(): void;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
}): Promise<typeof __AdaptedExports>;
