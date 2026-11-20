/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  arena.ts — Arena global zero-alloc (< 1 MB total, 15 páginas WASM fijas)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reserva TODO en el DATA SEGMENT (`memory.data`): NUNCA heap.alloc, NUNCA
 * memory.grow. Cinco mundos disjuntos empaquetados bajo 1 MB (960 KiB techo):
 *
 *   1) PARAM_IN       [0, 2048)         I/O entrada (2 KiB)
 *   2) PARAM_OUT      [2048, 4096)      I/O salida  (2 KiB)
 *   3) SCRATCH_WORK   [4096, 20480)     arena bump save/restore (16 KiB)
 *   4) EMITTER_WORK   [20480, 22528)    layout fijo emisores (2 KiB)
 *   5) PARTICLES_WORK [22528, 963328)   SoA 19,200 partículas × 49 B (16B SIMD)
 *
 * Optimización SoA: 49 B/partícula (antes 58 B) eliminando alpha[] y life[],
 * unificando age+life en remLife[] y empaquetando color(4b)+shape(2b) en meta[].
 */

// ═══════════════════════════════════════════════════════════════════════════
// TAMAÑOS Y CAPACIDAD ESTÁTICA (< 1 MB)
// ═══════════════════════════════════════════════════════════════════════════

export const MAX_CAPACITY: i32 = 19200; // Múltiplo de 16 para SIMD v128
export const MIN_CAPACITY: i32 = 64;

export const PARAM_IN_SIZE: usize = 2048;     // 2 KiB
export const PARAM_OUT_SIZE: usize = 2048;    // 2 KiB
export const WORK_SIZE: usize = 16384;        // 16 KiB bump scratch
export const EMITTER_WORK_SIZE: usize = 2048; // 2 KiB layout fijo emisores

export const F32_LANE_BYTES: usize = (<usize>MAX_CAPACITY) << 2; // 76,800 B (múltiplo de 16)
export const U8_LANE_BYTES: usize = <usize>MAX_CAPACITY;         // 19,200 B (múltiplo de 16)

// 12 carriles f32 (48 B) + 1 carril u8 meta (1 B) = 49 B / partícula
export const BYTES_PER_PARTICLE: i32 = 49;
export const PARTICLES_WORK_SIZE: usize = F32_LANE_BYTES * 12 + U8_LANE_BYTES; // 940,800 B

export const SCRATCH_SIZE: usize =
  PARAM_IN_SIZE + PARAM_OUT_SIZE + WORK_SIZE + EMITTER_WORK_SIZE; // 22,528 B

export const TOTAL_ARENA_SIZE: usize = SCRATCH_SIZE + PARTICLES_WORK_SIZE; // 963,328 B (< 1 MB)

// ═══════════════════════════════════════════════════════════════════════════
// RESERVA ÚNICA EN DATA SEGMENT (alineada a 16 bytes para WASM SIMD v128)
// ═══════════════════════════════════════════════════════════════════════════

const ARENA_BASE: usize = memory.data(<i32>TOTAL_ARENA_SIZE, 16);

// ═══════════════════════════════════════════════════════════════════════════
// PUNTEROS COMPILADOS EN TIEMPO DE COMPILACIÓN (Mundos 1..5)
// ═══════════════════════════════════════════════════════════════════════════

export const PARAM_IN_PTR: usize = ARENA_BASE;
export const PARAM_OUT_PTR: usize = ARENA_BASE + PARAM_IN_SIZE;
export const SCRATCH_WORK_PTR: usize = PARAM_OUT_PTR + PARAM_OUT_SIZE;
export const EMITTER_WORK_PTR: usize = SCRATCH_WORK_PTR + WORK_SIZE;
export const PARTICLES_WORK_PTR: usize = EMITTER_WORK_PTR + EMITTER_WORK_SIZE;

// 13 Carriles SoA compactos alineados a 16 bytes (constantes puras)
export const P_X_PTR: usize = PARTICLES_WORK_PTR;
export const P_Y_PTR: usize = P_X_PTR + F32_LANE_BYTES;
export const P_VX_PTR: usize = P_Y_PTR + F32_LANE_BYTES;
export const P_VY_PTR: usize = P_VX_PTR + F32_LANE_BYTES;
export const P_ROT_PTR: usize = P_VY_PTR + F32_LANE_BYTES;
export const P_VROT_PTR: usize = P_ROT_PTR + F32_LANE_BYTES;
export const P_TILT_PTR: usize = P_VROT_PTR + F32_LANE_BYTES;
export const P_VTILT_PTR: usize = P_TILT_PTR + F32_LANE_BYTES;
export const P_WOBBLE_PTR: usize = P_VTILT_PTR + F32_LANE_BYTES;
export const P_VWOBBLE_PTR: usize = P_WOBBLE_PTR + F32_LANE_BYTES;
export const P_SIZE_PTR: usize = P_VWOBBLE_PTR + F32_LANE_BYTES;
export const P_REM_LIFE_PTR: usize = P_SIZE_PTR + F32_LANE_BYTES;
export const P_META_PTR: usize = P_REM_LIFE_PTR + F32_LANE_BYTES; // color(0..3) | shape(4..5)

// @ts-ignore
@inline
export function align8(ptr: usize): usize {
  return (ptr + 7) & ~7;
}

// @ts-ignore
@inline
export function align16(ptr: usize): usize {
  return (ptr + 15) & ~15;
}

// ═══════════════════════════════════════════════════════════════════════════
// ARENA BUMP (Mundo 3: SCRATCH_WORK)
// ═══════════════════════════════════════════════════════════════════════════

// @ts-ignore
@final
export class Arena {
  static current: usize = SCRATCH_WORK_PTR;

  // @ts-ignore
  @inline
  static alloc(size: usize): usize {
    const ptr = align8(Arena.current);
    const next = ptr + size;
    if (next > SCRATCH_WORK_PTR + WORK_SIZE) unreachable();
    Arena.current = next;
    return ptr;
  }

  // @ts-ignore
  @inline
  static alloc16(size: usize): usize {
    const ptr = align16(Arena.current);
    const next = ptr + size;
    if (next > SCRATCH_WORK_PTR + WORK_SIZE) unreachable();
    Arena.current = next;
    return ptr;
  }

  // @ts-ignore
  @inline
  static reset(): void {
    Arena.current = SCRATCH_WORK_PTR;
  }

  // @ts-ignore
  @inline
  static save(): usize {
    return Arena.current;
  }

  // @ts-ignore
  @inline
  static restore(savedPtr: usize): void {
    Arena.current = savedPtr;
  }

  // @ts-ignore
  @inline
  static wipe(): void {
    memory.fill(ARENA_BASE, 0, TOTAL_ARENA_SIZE);
    Arena.current = SCRATCH_WORK_PTR;
  }
}

export function secure_wipe(): void {
  Arena.wipe();
}
