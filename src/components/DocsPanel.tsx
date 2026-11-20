import { For, Show, createSignal, onCleanup } from 'solid-js';
import { BookOpen, Check, Copy, CreditCard, Play, Rocket, Terminal } from 'lucide-solid';
import { confetti } from '../engine/confettiWrapper';
import type { CodeLanguage } from '../utils/highlightCode';
import { CodeBlock } from './CodeBlock';

interface DocsPanelProps {
  onNavigateTab: (tab: 'simulator' | 'checkout' | 'tests' | 'benchmark' | 'memory') => void;
}

interface CodeExample {
  id: string;
  title: string;
  filename: string;
  language: CodeLanguage;
  liveDemo?: 'celebrate' | 'burst';
  code: string;
}

const EXAMPLES: readonly CodeExample[] = [
  {
    id: 'quickstart',
    title: '1. Inicio Rápido (Wrapper Zero-Config en 3 líneas)',
    filename: 'quickstart.ts',
    language: 'ts',
    liveDemo: 'celebrate',
    code: `// npm install confetti-wasm
import { confetti } from 'confetti-wasm';

// Crea el <canvas> overlay, carga confetti.wasm y detiene el rAF al finalizar
await confetti.celebrate();

// Explosión radial 360° uniforme en disco 2D (sin hueco central ni acumulación)
confetti({ count: 260, spread: 360, origin: { x: 0.5, y: 0.55 } });

// Otros presets integrados (grados intuitivos: 90° = arriba)
confetti.cannons({ countPerSide: 360, speed: 940 });
confetti.rain({ count: 280 });`,
  },
  {
    id: 'scoped-solid',
    title: '2. Contenedor o Tarjeta en SolidJS / React (createConfetti)',
    filename: 'PaymentButton.tsx',
    language: 'tsx',
    liveDemo: 'burst',
    code: `import { onCleanup, onMount } from 'solid-js';
import { createConfetti, type ConfettiController } from 'confetti-wasm';

export function CheckoutCard() {
  let cardEl: HTMLDivElement | undefined;
  let fx: ConfettiController | null = null;

  onMount(() => {
    // Se ajusta automáticamente al contenedor con ResizeObserver, DPR nativo y semilla determinista
    fx = createConfetti({
      container: cardEl,
      seed: 0x9E3779B9,
      physics: { gravity: 760, drag: 2.35, wind: 0, turbulence: 210 },
    });
  });

  onCleanup(() => fx?.destroy());

  return (
    <div ref={cardEl} class="rounded-xl p-6">
      <button onClick={() => fx?.celebrate()}>Confirmar Pago</button>
    </div>
  );
}`,
  },
  {
    id: 'advanced',
    title: '3. API Avanzada Zero-Copy SoA + PRNG Determinista',
    filename: 'advanced-engine.ts',
    language: 'ts',
    code: `import { loadConfettiWasm, renderSoAParticles } from 'confetti-wasm';

const canvas = document.querySelector<HTMLCanvasElement>('#confetti')!;
const ctx = canvas.getContext('2d')!;
const engine = await loadConfettiWasm();

// Reserva estática en arena (< 1 MB) y estado PRNG determinista evolutivo
engine.init(19200, canvas.clientWidth, canvas.clientHeight);
engine.seedRng(0x9E3779B9);
engine.spawnDualCannons(canvas.clientWidth, canvas.clientHeight, 600, 940, 1.13);

const frame = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (engine.step(1 / 60) > 0) {
    renderSoAParticles(ctx, engine, window.devicePixelRatio || 1);
    requestAnimationFrame(frame);
  }
};
requestAnimationFrame(frame);`,
  },
];

const WRAPPER_API_METHODS = [
  {
    signature: 'confetti(options?) / confetti.burst(options?)',
    params: '{ count?, speed?, spread?, angle?, origin?, size?, life? }',
    description:
      'Dispara una ráfaga con densidad uniforme en disco 2D. Usa grados intuitivos (90° = arriba, 360° = círculo completo) y origen normalizado { x: 0..1, y: 0..1 }.',
  },
  {
    signature: 'confetti.cannons(options?)',
    params: '{ countPerSide?, speed?, spread? }',
    description:
      'Lanza cañones dobles desde las esquinas inferiores en una sola invocación WASM SIMD.',
  },
  {
    signature: 'confetti.celebrate(options?)',
    params: '{ cannonCount?, showerCount?, delayMs? }',
    description:
      'Secuencia en 2 oleadas (cañones + lluvia superior) lista para confirmaciones de pago y logros.',
  },
  {
    signature: 'confetti.rain(options?)',
    params: '{ count?, speed?, spread? }',
    description:
      'Emite una lluvia descendente suave desde el borde superior del viewport o contenedor.',
  },
  {
    signature: 'createConfetti(options?)',
    params: '{ canvas?, container?, physics?, capacity?, maxDpr?, seed? }',
    description:
      'Crea un controlador independiente con ResizeObserver, semilla PRNG opcional, auto-pausa rAF (0% CPU en reposo) y respeto a prefers-reduced-motion.',
  },
  {
    signature: 'fx.setPhysics(patch) / fx.clear() / fx.destroy()',
    params: 'Partial<PhysicsOptions>',
    description:
      'Ajusta gravedad (760), arrastre (2.35), viento (0) o turbulencia (210) en vivo, limpia partículas o desmonta listeners y canvas.',
  },
] as const;

const ENGINE_API_METHODS = [
  {
    signature: 'loadConfettiWasm(url?) / ConfettiEngine.fromUrl(url?)',
    params: 'url?: string',
    description:
      'Descarga e instancia confetti.wasm sin wrapper de bucle ni canvas (ideal para renderizadores WebGL/Canvas propios).',
  },
  {
    signature: 'engine.init(capacity, width, height)',
    params: 'capacity <= 19200, width, height',
    description:
      'Configura los límites de la arena estática (49 B/partícula), reinicia el PRNG al estado determinista base y enlaza vistas zero-copy.',
  },
  {
    signature: 'engine.seedRng(seed) / getRngState() / nextRand()',
    params: 'seed: number (u32)',
    description:
      'Fija o consulta el estado interno del generador xorshift32; avanza determinísticamente en cada emisión o lectura.',
  },
  {
    signature: 'engine.step(dt)',
    params: 'dt: number (segundos)',
    description:
      'Integra la física con vectorización SIMD f32x4 (arrastre variable + sustentación) y compactación O(1) swap-remove.',
  },
  {
    signature: 'engine.secureWipe()',
    params: 'void',
    description:
      'Limpia el contador activo y pone a cero los 963,328 bytes completos de la arena estática.',
  },
] as const;

export function DocsPanel(props: DocsPanelProps) {
  const [copiedId, setCopiedId] = createSignal<string | null>(null);

  onCleanup(() => {
    confetti.clear();
  });

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

  const runLiveDemo = (mode: 'celebrate' | 'burst') => {
    if (mode === 'celebrate') {
      void confetti.celebrate({ cannonCount: 280, showerCount: 360, delayMs: 200 });
    } else {
      void confetti({ count: 220, spread: 100, origin: { x: 0.5, y: 0.55 } });
    }
  };

  return (
    <section aria-labelledby="docs-heading" class="space-y-6">
      {/* Header Banner */}
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0D111A] p-6">
        <div class="space-y-1.5 max-w-2xl">
          <div class="inline-flex items-center gap-2 font-mono text-xs text-cyan-300">
            <BookOpen class="h-4 w-4" aria-hidden="true" />
            <span>DOCUMENTACIÓN OFICIAL · WRAPPER ZERO-CONFIG</span>
          </div>
          <h1 id="docs-heading" class="font-display text-2xl font-bold tracking-tight text-slate-100">
            Guía rápida de <span class="text-cyan-300 font-mono">confetti-wasm</span>
          </h1>
          <p class="text-sm text-slate-400 leading-relaxed">
            Usa el wrapper de alto nivel <code class="font-mono text-xs text-emerald-300">confetti</code> en
            una sola línea sin configurar canvas ni bucles <code class="font-mono text-xs text-sky-300">rAF</code>,
            o accede directamente al motor <code class="font-mono text-xs text-cyan-300">ConfettiEngine</code> SoA
            zero-alloc (&lt; 1 MB · SIMD <code class="font-mono text-xs text-amber-300">v128</code>).
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-testid="docs-try-celebrate"
            onClick={() => runLiveDemo('celebrate')}
            class="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play class="h-3.5 w-3.5" aria-hidden="true" />
            <span>Probar confetti.celebrate()</span>
          </button>
          <button
            type="button"
            onClick={() => props.onNavigateTab('checkout')}
            class="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CreditCard class="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>Ver Demo Pago Exitoso</span>
          </button>
          <button
            type="button"
            onClick={() => props.onNavigateTab('simulator')}
            class="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Rocket class="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span>Abrir Simulador</span>
          </button>
        </div>
      </div>

      {/* 3-Card Architectural Highlights */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4 space-y-1.5">
          <div class="font-mono text-xs text-cyan-300">WRAPPER EN 1 LÍNEA</div>
          <div class="font-display text-base font-semibold text-slate-100">Cero Boilerplate</div>
          <p class="text-xs text-slate-400">
            <code class="font-mono text-emerald-300">confetti.celebrate()</code> gestiona el canvas, DPR,{' '}
            <code class="font-mono text-sky-300">ResizeObserver</code> y auto-pausa el loop al terminar.
          </p>
        </div>
        <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4 space-y-1.5">
          <div class="font-mono text-xs text-emerald-400">ARENA ESTÁTICA &lt; 1 MB</div>
          <div class="font-display text-base font-semibold text-slate-100">15 páginas fijas (960 KiB)</div>
          <p class="text-xs text-slate-400">
            Reserva única en <code class="font-mono text-sky-300">memory.data</code> para hasta 19,200 partículas a 49 B/partícula y binario de 5.3 KiB.
          </p>
        </div>
        <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4 space-y-1.5">
          <div class="font-mono text-xs text-amber-300">SIMD + PRNG CON ESTADO</div>
          <div class="font-display text-base font-semibold text-slate-100">13 Carriles SoA Deterministas</div>
          <p class="text-xs text-slate-400">
            Física vectorizada <code class="font-mono text-amber-300">f32x4</code>, densidad uniforme en disco 2D (<code class="font-mono text-cyan-300">sqrt(u)</code>) y semilla evolutiva sin pausas de GC.
          </p>
        </div>
      </div>

      {/* Code Examples with Syntax Highlighting & Copy Buttons */}
      <div class="space-y-4">
        <For each={EXAMPLES}>
          {(ex) => (
            <article class="rounded-xl border border-slate-800 bg-[#0D111A] overflow-hidden">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 bg-[#090D16]">
                <div class="flex items-center gap-2.5">
                  <Terminal class="h-4 w-4 text-cyan-400" aria-hidden="true" />
                  <h2 class="font-display text-sm font-semibold text-slate-100">{ex.title}</h2>
                  <span class="font-mono text-xs text-slate-500">
                    {ex.filename} · {ex.language.toUpperCase()}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <Show when={ex.liveDemo}>
                    {(mode) => (
                      <button
                        type="button"
                        onClick={() => runLiveDemo(mode())}
                        class="inline-flex items-center gap-1.5 rounded border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                      >
                        <Play class="h-3 w-3" aria-hidden="true" />
                        <span>Probar</span>
                      </button>
                    )}
                  </Show>

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
              </div>
              <CodeBlock code={ex.code} language={ex.language} />
            </article>
          )}
        </For>
      </div>

      {/* Wrapper API Reference Table */}
      <div class="rounded-xl border border-slate-800 bg-[#0D111A] overflow-hidden">
        <div class="border-b border-slate-800 px-5 py-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-display text-base font-semibold text-slate-100">
            API Fácil — Wrapper (<code class="font-mono text-sm text-emerald-300">confetti</code> /{' '}
            <code class="font-mono text-sm text-cyan-300">createConfetti</code>)
          </h2>
          <span class="text-xs text-slate-500">Recomendado para el 95% de aplicaciones web</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-800 bg-[#07090E]/60 font-mono text-[11px] uppercase text-slate-400">
                <th class="px-5 py-3">Función / Método</th>
                <th class="px-5 py-3">Opciones</th>
                <th class="px-5 py-3">Descripción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/70 text-xs">
              <For each={WRAPPER_API_METHODS}>
                {(method) => (
                  <tr class="hover:bg-slate-800/25 align-top">
                    <td class="px-5 py-3 font-mono font-semibold text-cyan-300 whitespace-nowrap">
                      {method.signature}
                    </td>
                    <td class="px-5 py-3 font-mono text-amber-300/90 whitespace-nowrap">
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

      {/* Low-level Engine API Reference Table */}
      <div class="rounded-xl border border-slate-800 bg-[#0D111A] overflow-hidden">
        <div class="border-b border-slate-800 px-5 py-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-display text-base font-semibold text-slate-100">
            API Avanzada Zero-Copy (<code class="font-mono text-sm text-sky-300">ConfettiEngine</code>)
          </h2>
          <span class="text-xs text-slate-500">Acceso directo a vistas Float32Array / Uint8Array</span>
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
              <For each={ENGINE_API_METHODS}>
                {(method) => (
                  <tr class="hover:bg-slate-800/25 align-top">
                    <td class="px-5 py-3 font-mono font-semibold text-sky-300 whitespace-nowrap">
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
