export async function instantiate(module, imports = {}) {
  const { exports } = await WebAssembly.instantiate(module, imports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    getRngState() {
      // assembly/confetti/getRngState() => u32
      return exports.getRngState() >>> 0;
    },
    getArenaStart() {
      // assembly/confetti/getArenaStart() => usize
      return exports.getArenaStart() >>> 0;
    },
    getArenaBytes() {
      // assembly/confetti/getArenaBytes() => usize
      return exports.getArenaBytes() >>> 0;
    },
    getMemoryBytes() {
      // assembly/confetti/getMemoryBytes() => usize
      return exports.getMemoryBytes() >>> 0;
    },
    getHeapBase() {
      // assembly/confetti/getHeapBase() => usize
      return exports.getHeapBase() >>> 0;
    },
    getTotalSpawned() {
      // assembly/confetti/getTotalSpawned() => u32
      return exports.getTotalSpawned() >>> 0;
    },
    getTotalRecycled() {
      // assembly/confetti/getTotalRecycled() => u32
      return exports.getTotalRecycled() >>> 0;
    },
    getArenaCurrent() {
      // assembly/confetti/getArenaCurrent() => usize
      return exports.getArenaCurrent() >>> 0;
    },
    getXPtr() {
      // assembly/confetti/getXPtr() => usize
      return exports.getXPtr() >>> 0;
    },
    getYPtr() {
      // assembly/confetti/getYPtr() => usize
      return exports.getYPtr() >>> 0;
    },
    getVxPtr() {
      // assembly/confetti/getVxPtr() => usize
      return exports.getVxPtr() >>> 0;
    },
    getVyPtr() {
      // assembly/confetti/getVyPtr() => usize
      return exports.getVyPtr() >>> 0;
    },
    getRotPtr() {
      // assembly/confetti/getRotPtr() => usize
      return exports.getRotPtr() >>> 0;
    },
    getTiltPtr() {
      // assembly/confetti/getTiltPtr() => usize
      return exports.getTiltPtr() >>> 0;
    },
    getSizePtr() {
      // assembly/confetti/getSizePtr() => usize
      return exports.getSizePtr() >>> 0;
    },
    getRemLifePtr() {
      // assembly/confetti/getRemLifePtr() => usize
      return exports.getRemLifePtr() >>> 0;
    },
    getMetaPtr() {
      // assembly/confetti/getMetaPtr() => usize
      return exports.getMetaPtr() >>> 0;
    },
    EMITTER_WORK_PTR: {
      // assembly/arena/EMITTER_WORK_PTR: usize
      valueOf() { return this.value; },
      get value() {
        return exports.EMITTER_WORK_PTR.value >>> 0;
      }
    },
    PARAM_IN_PTR: {
      // assembly/arena/PARAM_IN_PTR: usize
      valueOf() { return this.value; },
      get value() {
        return exports.PARAM_IN_PTR.value >>> 0;
      }
    },
    PARAM_OUT_PTR: {
      // assembly/arena/PARAM_OUT_PTR: usize
      valueOf() { return this.value; },
      get value() {
        return exports.PARAM_OUT_PTR.value >>> 0;
      }
    },
    PARTICLES_WORK_PTR: {
      // assembly/arena/PARTICLES_WORK_PTR: usize
      valueOf() { return this.value; },
      get value() {
        return exports.PARTICLES_WORK_PTR.value >>> 0;
      }
    },
    PARTICLES_WORK_SIZE: {
      // assembly/arena/PARTICLES_WORK_SIZE: usize
      valueOf() { return this.value; },
      get value() {
        return exports.PARTICLES_WORK_SIZE.value >>> 0;
      }
    },
    SCRATCH_SIZE: {
      // assembly/arena/SCRATCH_SIZE: usize
      valueOf() { return this.value; },
      get value() {
        return exports.SCRATCH_SIZE.value >>> 0;
      }
    },
    SCRATCH_WORK_PTR: {
      // assembly/arena/SCRATCH_WORK_PTR: usize
      valueOf() { return this.value; },
      get value() {
        return exports.SCRATCH_WORK_PTR.value >>> 0;
      }
    },
    TOTAL_ARENA_SIZE: {
      // assembly/arena/TOTAL_ARENA_SIZE: usize
      valueOf() { return this.value; },
      get value() {
        return exports.TOTAL_ARENA_SIZE.value >>> 0;
      }
    },
  }, exports);
  return adaptedExports;
}
