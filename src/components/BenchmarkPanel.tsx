import { For, Show } from 'solid-js';
import { Gauge, RotateCw } from 'lucide-solid';
import type { BenchmarkResult } from '../engine/verification';

interface BenchmarkPanelProps {
  result: BenchmarkResult | null;
  running: boolean;
  particleTarget: number;
  onChangeTarget: (count: number) => void;
  onRunBenchmark: () => void;
}

const TARGET_PRESETS = [5000, 10000, 19200] as const;

export function BenchmarkPanel(props: BenchmarkPanelProps) {
  const maxTime = () => {
    const r = props.result;
    return r ? Math.max(r.wasmTotalMs, r.jsTotalMs, 0.01) : 1;
  };

  return (
    <section aria-labelledby="bench-heading" class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800 bg-[#0D111A] p-5">
        <div class="space-y-1 max-w-2xl">
          <h2 id="bench-heading" class="font-display text-lg font-semibold text-slate-100">
            Benchmark: AssemblyScript Zero-Alloc SoA vs JS AoS
          </h2>
          <p class="text-sm text-slate-400">
            Compara 180 pasos físicos completos (<code class="font-mono text-xs text-cyan-300">dt = 1/60s</code>)
            entre el motor WebAssembly SIMD sobre memoria estática (&lt; 1 MB) y objetos JS en el heap.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-1 rounded-md border border-slate-800 bg-[#07090E] p-1">
            <For each={TARGET_PRESETS}>
              {(count) => (
                <button
                  type="button"
                  onClick={() => props.onChangeTarget(count)}
                  class={`px-2.5 py-1.5 font-mono text-xs tabular-nums rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    props.particleTarget === count
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {count === 19200 ? '19.2k part.' : `${(count / 1000).toFixed(0)}k part.`}
                </button>
              )}
            </For>
          </div>

          <button
            type="button"
            disabled={props.running}
            onClick={() => props.onRunBenchmark()}
            class="flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Show
              when={props.running}
              fallback={<Gauge class="h-3.5 w-3.5" aria-hidden="true" />}
            >
              <RotateCw class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            </Show>
            <span>{props.running ? 'Midiendo...' : 'Ejecutar Benchmark'}</span>
          </button>
        </div>
      </div>

      <Show
        when={props.result}
        fallback={
          <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-8 text-center text-sm text-slate-400">
            Selecciona la carga de partículas y ejecuta la medición para comparar tiempos de CPU y presión de memoria.
          </div>
        }
      >
        {(res) => (
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4 space-y-1">
                <div class="text-xs font-medium text-slate-400">
                  Aceleración WASM SoA + SIMD
                </div>
                <div
                  data-testid="bench-speedup"
                  class="font-mono text-3xl font-bold tabular-nums text-cyan-300"
                >
                  {res().speedup.toFixed(2)}x
                </div>
                <div class="font-mono text-xs text-slate-500 tabular-nums">
                  {res().particleCount.toLocaleString()} partículas · {res().frames} frames
                </div>
              </div>

              <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4 space-y-1">
                <div class="text-xs font-medium text-slate-400">
                  Crecimiento Buffer WASM (Post-Init)
                </div>
                <div class="font-mono text-3xl font-bold tabular-nums text-emerald-400">
                  {res().wasmBufferDeltaBytes}
                  <span class="ml-1.5 text-xs uppercase text-slate-400">B</span>
                </div>
                <div class="font-mono text-xs text-slate-500">
                  0 objetos JS creados durante simulación
                </div>
              </div>

              <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4 space-y-1">
                <div class="text-xs font-medium text-slate-400">
                  Objetos Asignados (JS AoS)
                </div>
                <div class="font-mono text-3xl font-bold tabular-nums text-amber-400">
                  {res().jsAllocatedObjects.toLocaleString()}
                </div>
                <div class="font-mono text-xs text-slate-500">
                  Más arrays temporales por frame en GC
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-5 space-y-4">
              <h3 class="font-display text-sm font-semibold text-slate-100">
                Tiempo Total de Simulación (Menor es mejor)
              </h3>

              <div class="space-y-3">
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-medium text-slate-200">
                      AssemblyScript WASM (Zero-Alloc SoA + SIMD v128)
                    </span>
                    <span class="font-mono tabular-nums text-cyan-300">
                      {res().wasmTotalMs.toFixed(2)} ms total · {res().wasmAvgFrameMs.toFixed(3)} ms/frame
                    </span>
                  </div>
                  <div class="h-3 w-full rounded bg-[#07090E] border border-slate-800 overflow-hidden">
                    <div
                      class="h-full bg-cyan-500"
                      style={{ width: `${Math.max(2, (res().wasmTotalMs / maxTime()) * 100)}%` }}
                    />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-medium text-slate-200">
                      JavaScript Convencional (Heap Objects AoS)
                    </span>
                    <span class="font-mono tabular-nums text-amber-300">
                      {res().jsTotalMs.toFixed(2)} ms total · {res().jsAvgFrameMs.toFixed(3)} ms/frame
                    </span>
                  </div>
                  <div class="h-3 w-full rounded bg-[#07090E] border border-slate-800 overflow-hidden">
                    <div
                      class="h-full bg-amber-500"
                      style={{ width: `${Math.max(2, (res().jsTotalMs / maxTime()) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </section>
  );
}
