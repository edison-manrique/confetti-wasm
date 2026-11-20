import { ConfettiEngine } from './engine/confettiWasm';
import { setDefaultWasmUrlResolver } from './engine/confettiWrapper';

setDefaultWasmUrlResolver(() => new URL('./confetti.wasm', import.meta.url).href);

export {
  ConfettiController,
  confetti,
  createConfetti,
  degToSpreadRad,
  degToWasmAngle,
  resolveBurstParams,
  type BurstOptions,
  type CannonsOptions,
  type CelebrateOptions,
  type ConfettiFrameStats,
  type ConfettiWrapperOptions,
  type GlobalConfettiFn,
  type NormalizedOrigin,
  type PhysicsOptions,
  type RainOptions,
  type ResolvedBurstParams,
} from './engine/confettiWrapper';

export {
  CONFETTI_PALETTE,
  ConfettiEngine,
  SHAPE_NAMES,
  getDefaultWasmUrl,
  type ArenaWorldDescriptor,
  type ConfettiWasmExports,
  type MemoryDiagnostics,
  type SoALaneDescriptor,
  type SoAViews,
} from './engine/confettiWasm';

export { renderSoAParticles } from './engine/spriteAtlas';

/**
 * Resolves the bundled `confetti.wasm` asset sitting next to the published ESM bundle
 * (`dist-lib/confetti.wasm`) and returns an instantiated `ConfettiEngine`.
 */
export async function loadConfettiWasm(wasmUrl?: string): Promise<ConfettiEngine> {
  const resolved = wasmUrl ?? new URL('./confetti.wasm', import.meta.url).href;
  return ConfettiEngine.fromUrl(resolved);
}
