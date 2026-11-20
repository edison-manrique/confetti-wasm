import { For, Show, createSignal } from 'solid-js';
import { BookOpen, Check, Copy, CreditCard, Rocket, Terminal } from 'lucide-solid';

interface DocsPanelProps {
  onNavigateTab: (tab: 'simulator' | 'checkout' | 'tests' | 'benchmark' | 'memory') => void;
}

interface CodeExample {
  id: string;
  title: string;
  filename: string;
  code: string;
}

const EXAMPLES: readonly CodeExample[] = [
  {
    id: 'quickstart',
    title: '1. Inicio Rápido (Vanilla JS / TypeScript)',
    filename: 'main.ts',
    code: `import { loadConfettiWasm, renderSoAParticles } from 'confetti-wasm';

const canvas = document.querySelector<HTMLCanvasElement>('#confetti')!;
const ctx = canvas.getContext('2d')!;
const dpr = Math.min(window.devicePixelRatio || 1, 2);

// 1. Cargar e inicializar arena estática (0 allocs post-init, techo 15 págs = 960 KiB)
const engine = await loadConfettiWasm();
engine.init(19200, canvas.clientWidth, canvas.clientHeight);
engine.setPhysics(980, 1.65, 0, 180);

// 2. Disparar cañones dobles desde ambas esquinas inferiores
engine.spawnDualCannons(canvas.clientWidth, canvas.clientHeight, 600, 940, (65 * Math.PI) / 180);

// 3. Bucle de física SIMD + renderizado zero-copy
let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  if (engine.activeCount > 0) {
    engine.step(dt);
    renderSoAParticles(ctx, engine, dpr);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);`,
  },
  {
    id: 'solidjs',
    title: '2. Integración en SolidJS (Celebración de Pago Exitoso)',
    filename: 'PaymentCelebration.tsx',
    code: `import { createSignal, onCleanup, onMount } from 'solid-js';
import { ConfettiEngine, loadConfettiWasm, renderSoAParticles } from 'confetti-wasm';

export function PaymentCelebration() {
  let canvasRef: HTMLCanvasElement | undefined;
  let engine: ConfettiEngine | null = null;
  let rafId = 0;
  const [paid, setPaid] = createSignal(false);

  const runLoop = () => {
    if (rafId || !canvasRef || !engine) return;
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, canvasRef!.width, canvasRef!.height);
      engine!.step(dt);
      renderSoAParticles(ctx, engine!, 1);
      rafId = engine!.activeCount > 0 ? requestAnimationFrame(tick) : 0;
    };
    rafId = requestAnimationFrame(tick);
  };

  onMount(async () => {
    engine = await loadConfettiWasm();
    engine.init(19200, window.innerWidth, window.innerHeight);
  });

  onCleanup(() => cancelAnimationFrame(rafId));

  const celebrate = () => {
    setPaid(true);
    engine?.spawnDualCannons(window.innerWidth, window.innerHeight, 360, 940, 1.1);
    runLoop();
  };

  return (
    <div class="relative">
      <button onClick={celebrate}>{paid() ? 'Pago Aprobado' : 'Pagar Ahora'}</button>
      <canvas ref={canvasRef} class="pointer-events-none fixed inset-0 z-50" />
    </div>
  );
}`,
  },
  {
    id: 'ghpages',
    title: '3. Publicar en GitHub Pages y npm (OIDC Trusted Publishing)',
    filename: 'publish.sh',
    code: `# A. Subir repositorio y activar GitHub Pages (.github/workflows/deploy-pages.yml)
git init
git add .
git commit -m "feat: confetti-wasm v1.0.0"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/confetti-wasm.git
git push -u origin main
# En GitHub: Settings -> Pages -> Source: "GitHub Actions"

# B. Publicar en npm con sello "OIDC GitHub Actions" (.github/workflows/publish-npm.yml)
# 1) Primer publish único para crear el paquete en npmjs.com:
npm login && npm run build:lib && npm publish --access public
# 2) En npmjs.com/package/confetti-wasm/access -> Trusted Publisher -> GitHub Actions:
#    Workflow filename: publish-npm.yml (sin NPM_TOKEN ni Bypass 2FA)
# 3) Siguientes versiones automáticas por OIDC:
npm version patch && git push origin main --follow-tags`,
  },
];

const API_METHODS = [
  {
    signature: 'ConfettiEngine.fromUrl(url?)',
    params: 'url?: string',
    description:
      'Descarga e instancia confetti.wasm. Por defecto resuelve import.meta.env.BASE_URL + "confetti.wasm" (compatible con subrutas de GitHub Pages).',
  },
  {
    signature: 'engine.init(capacity, width, height)',
    params: 'capacity <= 19200, width, height',
    description:
      'Configura los límites de la arena estática (49 B/partícula) y enlaza las vistas zero-copy Float32Array / Uint8Array sobre memory.buffer.',
  },
  {
    signature: 'engine.setPhysics(gravity, drag, wind, turbulence)',
    params: 'f32, f32, f32, f32',
    description:
      'Actualiza gravedad (px/s²), arrastre exponencial (1/s), viento lateral y turbulencia sinusoidal sin reiniciar partículas activas.',
  },
  {
    signature: 'engine.spawnBurst(x, y, count, speed, spreadRad, angleRad, sMin, sMax, lMin, lMax)',
    params: '10 parámetros numéricos',
    description:
      'Emite una ráfaga radial usando el PRNG xorshift32 interno y trigonometría parabólica rápida dentro de WASM.',
  },
  {
    signature: 'engine.spawnDualCannons(width, height, countPerSide, speed, spreadRad)',
    params: 'f32, f32, i32, f32, f32',
    description:
      'Dispara simultáneamente cañones en ambas esquinas inferiores (6% y 94% del ancho) en una sola invocación WASM.',
  },
  {
    signature: 'engine.step(dt)',
    params: 'dt: number (segundos)',
    description:
      'Integra todas las partículas en dos pasadas: vectorización SIMD f32x4 (4 partículas/ciclo) y compactación O(1) swap-remove.',
  },
  {
    signature: 'engine.resize(width, height) / clear() / secureWipe()',
    params: 'width, height',
    description:
      'Ajusta el plano de recorte inferior, reinicia activeCount o pone a cero los 963,328 bytes de la arena estática.',
  },
] as const;

export function DocsPanel(props: DocsPanelProps) {
  const [copiedId, setCopiedId] = createSignal<string | null>(null);

  const copySnippet = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => {
        if (copiedId() === id) setCopiedId(null);
      }, 1800);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
  };

  return (
    <section aria-labelledby="docs-heading" class="space-y-6">
      {/* Header Banner */}
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0D111A] p-6">
        <div class="space-y-1.5 max-w-2xl">
          <div class="inline-flex items-center gap-2 font-mono text-xs text-cyan-300">
            <BookOpen class="h-4 w-4" aria-hidden="true" />
            <span>DOCUMENTACIÓN OFICIAL · v1.0.0</span>
          </div>
          <h1 id="docs-heading" class="font-display text-2xl font-bold tracking-tight text-slate-100">
            Guía de uso de <span class="text-cyan-300 font-mono">confetti-wasm</span>
          </h1>
          <p class="text-sm text-slate-400 leading-relaxed">
            Librería de confeti física en AssemblyScript WebAssembly diseñada para cero asignaciones en heap
            (&lt; 1 MB de memoria total fija), vectorización SIMD <code class="font-mono text-xs text-slate-200">v128</code> y
            renderizado 2D a 60 FPS sin pausas de Garbage Collector.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => props.onNavigateTab('simulator')}
            class="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer"
          >
            <Rocket class="h-3.5 w-3.5" aria-hidden="true" />
            <span>Abrir Simulador</span>
          </button>
          <button
            type="button"
            onClick={() => props.onNavigateTab('checkout')}
            class="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <CreditCard class="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>Ver Demo Pago Exitoso</span>
          </button>
        </div>
      </div>

      {/* 3-Card Architectural Highlights */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4 space-y-1.5">
          <div class="font-mono text-xs text-cyan-300">BINARIO ULTRALIGERO</div>
          <div class="font-display text-base font-semibold text-slate-100">4.8 KiB (.wasm)</div>
          <p class="text-xs text-slate-400">
            Compilado con <code class="font-mono text-slate-300">--runtime stub --converge</code> y sin cadenas de error ni GC interno.
          </p>
        </div>
        <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4 space-y-1.5">
          <div class="font-mono text-xs text-emerald-400">ARENA ESTÁTICA &lt; 1 MB</div>
          <div class="font-display text-base font-semibold text-slate-100">15 páginas fijas (960 KiB)</div>
          <p class="text-xs text-slate-400">
            Reserva única en <code class="font-mono text-slate-300">memory.data</code> para hasta 19,200 partículas a 49 B/partícula.
          </p>
        </div>
        <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4 space-y-1.5">
          <div class="font-mono text-xs text-amber-300">ZERO-COPY TYPED ARRAYS</div>
          <div class="font-display text-base font-semibold text-slate-100">13 Carriles SoA SIMD</div>
          <p class="text-xs text-slate-400">
            JavaScript lee posiciones y rotaciones directamente desde <code class="font-mono text-slate-300">WebAssembly.Memory</code> sin serialización.
          </p>
        </div>
      </div>

      {/* Code Examples with Copy Buttons */}
      <div class="space-y-4">
        <For each={EXAMPLES}>
          {(ex) => (
            <article class="rounded-xl border border-slate-800 bg-[#0D111A] overflow-hidden">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 bg-[#090D16]">
                <div class="flex items-center gap-2.5">
                  <Terminal class="h-4 w-4 text-cyan-400" aria-hidden="true" />
                  <h2 class="font-display text-sm font-semibold text-slate-100">{ex.title}</h2>
                  <span class="font-mono text-xs text-slate-500">{ex.filename}</span>
                </div>

                <button
                  type="button"
                  onClick={() => void copySnippet(ex.id, ex.code)}
                  class="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1 font-mono text-xs text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Show
                    when={copiedId() === ex.id}
                    fallback={
                      <>
                        <Copy class="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        <span>Copiar</span>
                      </>
                    }
                  >
                    <Check class="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    <span class="text-emerald-300">Copiado</span>
                  </Show>
                </button>
              </div>
              <pre class="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-200 bg-[#07090E]">
                <code>{ex.code}</code>
              </pre>
            </article>
          )}
        </For>
      </div>

      {/* API Reference Table */}
      <div class="rounded-xl border border-slate-800 bg-[#0D111A] overflow-hidden">
        <div class="border-b border-slate-800 px-5 py-4">
          <h2 class="font-display text-base font-semibold text-slate-100">
            Referencia Rápida de API (<code class="font-mono text-sm text-cyan-300">ConfettiEngine</code>)
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-800 bg-[#07090E]/60 font-mono text-[11px] uppercase text-slate-400">
                <th class="px-5 py-3">Método</th>
                <th class="px-5 py-3">Parámetros</th>
                <th class="px-5 py-3">Descripción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/70 text-xs">
              <For each={API_METHODS}>
                {(method) => (
                  <tr class="hover:bg-slate-800/25 align-top">
                    <td class="px-5 py-3 font-mono font-semibold text-cyan-300 whitespace-nowrap">
                      {method.signature}
                    </td>
                    <td class="px-5 py-3 font-mono text-slate-400 whitespace-nowrap">
                      {method.params}
                    </td>
                    <td class="px-5 py-3 text-slate-300 leading-relaxed">
                      {method.description}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
