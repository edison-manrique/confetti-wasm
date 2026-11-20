import { ConfettiEngine, getDefaultWasmUrl } from './confettiWasm';
import { renderSoAParticles } from './spriteAtlas';

export interface PhysicsOptions {
  /** Aceleración vertical en px/s² (por defecto: 980) */
  gravity: number;
  /** Arrastre exponencial aerodinámico 1/s (por defecto: 1.65) */
  drag: number;
  /** Viento lateral constante en px/s² (por defecto: 0) */
  wind: number;
  /** Amplitud de turbulencia sinusoidal en px/s² (por defecto: 180) */
  turbulence: number;
}

export interface NormalizedOrigin {
  /** Posición horizontal normalizada (0..1) o en px si > 1 (por defecto: 0.5) */
  x?: number;
  /** Posición vertical normalizada (0..1) o en px si > 1 (por defecto: 0.6) */
  y?: number;
}

export interface BurstOptions {
  /** Cantidad de partículas a emitir (por defecto: 180) */
  count?: number;
  /** Alias compatible con canvas-confetti para `count` */
  particleCount?: number;
  /** Velocidad inicial en px/s (por defecto: 880) */
  speed?: number;
  /** Alias compatible con canvas-confetti para `speed` */
  startVelocity?: number;
  /** Ángulo de dispersión en grados (por defecto: 85) */
  spread?: number;
  /** Dirección en grados: 90 = arriba, 0 = derecha, 180 = izquierda, 270 = abajo (por defecto: 90) */
  angle?: number;
  /** Origen relativo (0..1) o en píxeles (por defecto: { x: 0.5, y: 0.6 }) */
  origin?: NormalizedOrigin;
  /** Rango de tamaño [min, max] en px (por defecto: [5, 11]) */
  size?: [number, number];
  /** Rango de tiempo de vida [min, max] en segundos (por defecto: [2.4, 4.2]) */
  life?: [number, number];
}

export interface CannonsOptions {
  /** Partículas por cada cañón lateral (por defecto: 360) */
  countPerSide?: number;
  /** Velocidad de lanzamiento en px/s (por defecto: 940) */
  speed?: number;
  /** Dispersión en grados (por defecto: 64) */
  spread?: number;
}

export interface CelebrateOptions {
  /** Partículas por cañón en el disparo inicial (por defecto: 360) */
  cannonCount?: number;
  /** Partículas de la lluvia superior posterior (por defecto: 480) */
  showerCount?: number;
  /** Retardo en ms de la segunda oleada (por defecto: 220) */
  delayMs?: number;
}

export interface RainOptions {
  /** Cantidad de partículas en la lluvia superior (por defecto: 260) */
  count?: number;
  /** Velocidad inicial hacia abajo en px/s (por defecto: 320) */
  speed?: number;
  /** Dispersión en grados (por defecto: 150) */
  spread?: number;
}

export interface ConfettiFrameStats {
  activeCount: number;
  stepMs: number;
}

export interface ConfettiWrapperOptions {
  /** Elemento `<canvas>` o selector CSS; si se omite se crea uno automático */
  canvas?: HTMLCanvasElement | string;
  /** Contenedor donde montar el canvas automático (si se omite usa `document.body` fixed) */
  container?: HTMLElement | string;
  /** URL personalizada de `confetti.wasm` */
  wasmUrl?: string;
  /** Bytes precargados de `confetti.wasm` (evita fetch extra) */
  wasmBytes?: BufferSource;
  /** Capacidad máxima en arena WASM <= 19200 (por defecto: 19200) */
  capacity?: number;
  /** Límite de Device Pixel Ratio para el canvas (por defecto: 2) */
  maxDpr?: number;
  /** z-index del canvas automático (por defecto: 9999) */
  zIndex?: number;
  /** Semilla inicial determinista del PRNG xorshift32 */
  seed?: number;
  /** Parámetros físicos iniciales */
  physics?: Partial<PhysicsOptions>;
  /** Respeta `prefers-reduced-motion: reduce` omitiendo emisiones (por defecto: true) */
  respectReducedMotion?: boolean;
}

export interface ResolvedBurstParams {
  originX: number;
  originY: number;
  count: number;
  speed: number;
  spreadRad: number;
  angleRad: number;
  sizeMin: number;
  sizeMax: number;
  lifeMin: number;
  lifeMax: number;
}

const DEFAULT_PHYSICS: PhysicsOptions = {
  gravity: 760,
  drag: 2.35,
  wind: 0,
  turbulence: 210,
};

/**
 * Convierte grados intuitivos (90° = arriba, 0° = derecha, 180° = izquierda, 270° = abajo)
 * al sistema de radianes Canvas 2D (+Y hacia abajo).
 */
export function degToWasmAngle(deg: number): number {
  return (-deg * Math.PI) / 180;
}

/**
 * Convierte grados de dispersión a radianes acotados en [0.05, 2π].
 */
export function degToSpreadRad(spreadDeg: number): number {
  const clamped = Math.max(2, Math.min(360, spreadDeg));
  return (clamped * Math.PI) / 180;
}

/**
 * Normaliza opciones de ráfaga amigables hacia parámetros exactos de `ConfettiEngine.spawnBurst`.
 */
export function resolveBurstParams(
  opts: BurstOptions = {},
  width: number,
  height: number
): ResolvedBurstParams {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const rawCount = opts.count ?? opts.particleCount ?? 180;
  const count = Math.max(1, Math.min(19200, Math.round(rawCount)));
  const speed = Math.max(40, opts.speed ?? opts.startVelocity ?? 880);
  const spreadRad = degToSpreadRad(opts.spread ?? 85);
  const angleRad = degToWasmAngle(opts.angle ?? 90);

  const ox = opts.origin?.x ?? 0.5;
  const oy = opts.origin?.y ?? 0.6;
  const originX = ox >= 0 && ox <= 1 ? ox * safeW : ox;
  const originY = oy >= 0 && oy <= 1 ? oy * safeH : oy;

  const sizeMin = Math.max(2, opts.size?.[0] ?? 4.2);
  const sizeMax = Math.max(sizeMin, opts.size?.[1] ?? 8.6);
  const lifeMin = Math.max(0.2, opts.life?.[0] ?? 2.4);
  const lifeMax = Math.max(lifeMin, opts.life?.[1] ?? 4.4);

  return {
    originX,
    originY,
    count,
    speed,
    spreadRad,
    angleRad,
    sizeMin,
    sizeMax,
    lifeMin,
    lifeMax,
  };
}

let cachedDefaultWasmBytesPromise: Promise<ArrayBuffer> | null = null;
let customDefaultWasmResolver: (() => string) | null = null;

/**
 * Configura el resolvedor por defecto de `confetti.wasm` (usado por el paquete npm).
 */
export function setDefaultWasmUrlResolver(resolver: () => string): void {
  customDefaultWasmResolver = resolver;
}

async function fetchDefaultWasmBytes(url?: string): Promise<ArrayBuffer> {
  if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No se pudo cargar ${url}: HTTP ${res.status}`);
    return res.arrayBuffer();
  }
  if (!cachedDefaultWasmBytesPromise) {
    const target = customDefaultWasmResolver ? customDefaultWasmResolver() : getDefaultWasmUrl();
    cachedDefaultWasmBytesPromise = fetch(target).then((res) => {
      if (!res.ok) {
        cachedDefaultWasmBytesPromise = null;
        throw new Error(`No se pudo cargar ${target}: HTTP ${res.status}`);
      }
      return res.arrayBuffer();
    });
  }
  return cachedDefaultWasmBytesPromise;
}

export class ConfettiController {
  public readonly canvas: HTMLCanvasElement;
  public readonly ready: Promise<void>;
  public engine: ConfettiEngine | null = null;

  private readonly ownedCanvas: boolean;
  private readonly maxDpr: number;
  private readonly respectReducedMotion: boolean;
  private readonly mountTarget: HTMLElement | null;
  private physics: PhysicsOptions;
  private ctx: CanvasRenderingContext2D | null = null;
  private dims = { width: 960, height: 540, dpr: 1 };
  private rafId = 0;
  private lastTime = 0;
  private destroyed = false;
  private resizeObserver: ResizeObserver | null = null;
  private windowResizeHandler: (() => void) | null = null;
  private timers = new Set<number>();
  private frameListeners = new Set<(stats: ConfettiFrameStats) => void>();

  constructor(options: ConfettiWrapperOptions = {}) {
    if (typeof document === 'undefined') {
      throw new Error('createConfetti requiere un entorno de navegador con DOM.');
    }

    this.maxDpr = Math.max(1, Math.min(3, options.maxDpr ?? 2));
    this.respectReducedMotion = options.respectReducedMotion ?? true;
    this.physics = { ...DEFAULT_PHYSICS, ...options.physics };

    let resolvedCanvas: HTMLCanvasElement | null = null;
    if (typeof options.canvas === 'string') {
      resolvedCanvas = document.querySelector<HTMLCanvasElement>(options.canvas);
      if (!resolvedCanvas) {
        throw new Error(`No se encontró ningún <canvas> para el selector "${options.canvas}".`);
      }
    } else if (options.canvas) {
      resolvedCanvas = options.canvas;
    }

    let containerEl: HTMLElement | null = null;
    if (typeof options.container === 'string') {
      containerEl = document.querySelector<HTMLElement>(options.container);
    } else if (options.container) {
      containerEl = options.container;
    }
    this.mountTarget = containerEl;

    if (resolvedCanvas) {
      this.canvas = resolvedCanvas;
      this.ownedCanvas = false;
    } else {
      const autoCanvas = document.createElement('canvas');
      autoCanvas.setAttribute('aria-hidden', 'true');
      autoCanvas.dataset.confettiWasmOverlay = 'true';
      autoCanvas.style.pointerEvents = 'none';
      autoCanvas.style.zIndex = String(options.zIndex ?? 9999);

      if (containerEl) {
        const computedPos = window.getComputedStyle(containerEl).position;
        if (computedPos === 'static') {
          containerEl.style.position = 'relative';
        }
        autoCanvas.style.position = 'absolute';
        autoCanvas.style.inset = '0';
        autoCanvas.style.width = '100%';
        autoCanvas.style.height = '100%';
        containerEl.appendChild(autoCanvas);
      } else {
        autoCanvas.style.position = 'fixed';
        autoCanvas.style.inset = '0';
        autoCanvas.style.width = '100vw';
        autoCanvas.style.height = '100vh';
        document.body.appendChild(autoCanvas);
      }

      this.canvas = autoCanvas;
      this.ownedCanvas = true;
    }

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    if (typeof ResizeObserver !== 'undefined') {
      const target = this.mountTarget ?? (this.ownedCanvas ? null : this.canvas);
      if (target) {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(target);
      }
    }
    if (!this.mountTarget) {
      this.windowResizeHandler = () => this.resize();
      window.addEventListener('resize', this.windowResizeHandler, { passive: true });
    }

    const capacity = Math.max(64, Math.min(19200, Math.round(options.capacity ?? 19200)));
    this.ready = this.bootEngine(capacity, options);
  }

  private async bootEngine(capacity: number, options: ConfettiWrapperOptions): Promise<void> {
    const bytes = options.wasmBytes ?? (await fetchDefaultWasmBytes(options.wasmUrl));
    if (this.destroyed) return;
    const eng = await ConfettiEngine.fromBytes(bytes);
    if (this.destroyed) return;
    eng.init(capacity, this.dims.width, this.dims.height);
    if (typeof options.seed === 'number') {
      eng.seedRng(options.seed);
    }
    eng.setPhysics(
      this.physics.gravity,
      this.physics.drag,
      this.physics.wind,
      this.physics.turbulence
    );
    this.engine = eng;
  }

  private shouldSkipForMotionPreference(): boolean {
    if (!this.respectReducedMotion || typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  public get activeCount(): number {
    return this.engine?.activeCount ?? 0;
  }

  public resize(): void {
    if (this.destroyed) return;
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    let width: number;
    let height: number;

    if (this.mountTarget) {
      const rect = this.mountTarget.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
    } else if (this.ownedCanvas) {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
    } else {
      const rect = this.canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width || this.canvas.clientWidth || 960));
      height = Math.max(1, Math.floor(rect.height || this.canvas.clientHeight || 540));
    }

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.dims = { width, height, dpr };
    this.engine?.resize(width, height);
  }

  public setPhysics(patch: Partial<PhysicsOptions>): void {
    this.physics = { ...this.physics, ...patch };
    this.engine?.setPhysics(
      this.physics.gravity,
      this.physics.drag,
      this.physics.wind,
      this.physics.turbulence
    );
  }

  public onFrame(listener: (stats: ConfettiFrameStats) => void): () => void {
    this.frameListeners.add(listener);
    return () => {
      this.frameListeners.delete(listener);
    };
  }

  private emitStats(activeCount: number, stepMs: number): void {
    for (const listener of this.frameListeners) {
      listener({ activeCount, stepMs });
    }
  }

  private startLoop(): void {
    if (this.rafId !== 0 || this.destroyed || !this.ctx || !this.engine) return;
    this.lastTime = performance.now();

    const tick = (now: number) => {
      if (this.destroyed || !this.ctx || !this.engine) {
        this.rafId = 0;
        return;
      }

      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = rawDt > 0 && rawDt < 0.05 ? rawDt : 1 / 60;

      const { width, height, dpr } = this.dims;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.clearRect(0, 0, width, height);

      let stepMs = 0;
      if (this.engine.activeCount > 0) {
        const t0 = performance.now();
        this.engine.step(dt);
        stepMs = performance.now() - t0;
        renderSoAParticles(this.ctx, this.engine, dpr);
      }

      const count = this.engine.activeCount;
      this.emitStats(count, stepMs);

      if (count > 0) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = 0;
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private async ensureReadyEngine(): Promise<ConfettiEngine | null> {
    await this.ready;
    if (this.destroyed || !this.engine) return null;
    this.resize();
    return this.engine;
  }

  /**
   * Emite una ráfaga radial en un punto normalizado (`0..1`) o en píxeles.
   */
  public async burst(options: BurstOptions = {}): Promise<number> {
    if (this.shouldSkipForMotionPreference()) return 0;
    const eng = await this.ensureReadyEngine();
    if (!eng) return 0;
    const p = resolveBurstParams(options, this.dims.width, this.dims.height);
    const spawned = eng.spawnBurst(
      p.originX,
      p.originY,
      p.count,
      p.speed,
      p.spreadRad,
      p.angleRad,
      p.sizeMin,
      p.sizeMax,
      p.lifeMin,
      p.lifeMax
    );
    this.emitStats(eng.activeCount, 0);
    this.startLoop();
    return spawned;
  }

  /**
   * Dispara cañones simultáneos desde las esquinas inferiores izquierda y derecha.
   */
  public async cannons(options: CannonsOptions = {}): Promise<number> {
    if (this.shouldSkipForMotionPreference()) return 0;
    const eng = await this.ensureReadyEngine();
    if (!eng) return 0;
    const countPerSide = Math.max(1, Math.min(9600, Math.round(options.countPerSide ?? 360)));
    const speed = Math.max(100, options.speed ?? 940);
    const spreadRad = degToSpreadRad(options.spread ?? 64);
    const spawned = eng.spawnDualCannons(
      this.dims.width,
      this.dims.height,
      countPerSide,
      speed,
      spreadRad
    );
    this.emitStats(eng.activeCount, 0);
    this.startLoop();
    return spawned;
  }

  /**
   * Lluvia suave descendente desde el borde superior.
   */
  public async rain(options: RainOptions = {}): Promise<number> {
    return this.burst({
      count: options.count ?? 260,
      speed: options.speed ?? 320,
      spread: options.spread ?? 150,
      angle: 270,
      origin: { x: 0.5, y: 0.04 },
      life: [2.8, 4.8],
    });
  }

  /**
   * Secuencia coreografiada en 2 oleadas ideal para pagos aprobados, compras o logros.
   */
  public async celebrate(options: CelebrateOptions = {}): Promise<void> {
    if (this.shouldSkipForMotionPreference()) return;
    await this.cannons({
      countPerSide: options.cannonCount ?? 360,
      speed: 940,
      spread: 64,
    });
    const delayMs = Math.max(0, options.delayMs ?? 220);
    const tId = window.setTimeout(() => {
      this.timers.delete(tId);
      if (this.destroyed) return;
      void this.burst({
        count: options.showerCount ?? 480,
        speed: 740,
        spread: 240,
        angle: 90,
        origin: { x: 0.5, y: 0.24 },
        size: [5, 11],
        life: [2.6, 4.4],
      });
    }, delayMs);
    this.timers.add(tId);
  }

  public clear(): void {
    for (const id of this.timers) {
      window.clearTimeout(id);
    }
    this.timers.clear();
    if (this.rafId !== 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.engine?.clear();
    if (this.ctx) {
      this.ctx.setTransform(this.dims.dpr, 0, 0, this.dims.dpr, 0, 0);
      this.ctx.clearRect(0, 0, this.dims.width, this.dims.height);
    }
    this.emitStats(0, 0);
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.clear();
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
      this.windowResizeHandler = null;
    }
    this.frameListeners.clear();
    if (this.ownedCanvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.engine = null;
    this.ctx = null;
  }
}

/**
 * Crea un controlador de confeti de alto nivel con manejo automático de WASM,
 * canvas responsive, DPR y bucle `requestAnimationFrame` bajo demanda.
 */
export function createConfetti(options: ConfettiWrapperOptions = {}): ConfettiController {
  return new ConfettiController(options);
}

let defaultController: ConfettiController | null = null;

function getDefaultController(): ConfettiController {
  if (!defaultController) {
    defaultController = createConfetti({ respectReducedMotion: true });
  }
  return defaultController;
}

export interface GlobalConfettiFn {
  (options?: BurstOptions): Promise<number>;
  burst(options?: BurstOptions): Promise<number>;
  cannons(options?: CannonsOptions): Promise<number>;
  celebrate(options?: CelebrateOptions): Promise<void>;
  rain(options?: RainOptions): Promise<number>;
  clear(): void;
  destroy(): void;
}

/**
 * API global sin configuración (`zero-config`):
 * ```ts
 * import { confetti } from 'confetti-wasm';
 * await confetti.celebrate();
 * // o ráfaga personalizada:
 * confetti({ count: 200, spread: 90, origin: { x: 0.5, y: 0.6 } });
 * ```
 */
export const confetti: GlobalConfettiFn = Object.assign(
  (options: BurstOptions = {}) => getDefaultController().burst(options),
  {
    burst: (options: BurstOptions = {}) => getDefaultController().burst(options),
    cannons: (options: CannonsOptions = {}) => getDefaultController().cannons(options),
    celebrate: (options: CelebrateOptions = {}) => getDefaultController().celebrate(options),
    rain: (options: RainOptions = {}) => getDefaultController().rain(options),
    clear: () => defaultController?.clear(),
    destroy: () => {
      defaultController?.destroy();
      defaultController = null;
    },
  }
);
