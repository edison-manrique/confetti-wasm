import { For, Show } from 'solid-js';
import { CheckCircle2, Play, RotateCw, XCircle } from 'lucide-solid';
import type { VerificationCheckResult } from '../engine/verification';

interface VerificationPanelProps {
  results: VerificationCheckResult[];
  running: boolean;
  lastRunAt: string | null;
  onRunTests: () => void;
}

export function VerificationPanel(props: VerificationPanelProps) {
  const passedCount = () => props.results.filter((r) => r.passed).length;
  const totalCount = () => props.results.length;
  const allPassed = () => totalCount() > 0 && passedCount() === totalCount();

  return (
    <section aria-labelledby="tests-heading" class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800 bg-[#0D111A] p-5">
        <div class="space-y-1 max-w-2xl">
          <h2 id="tests-heading" class="font-display text-lg font-semibold text-slate-100">
            Suite de Verificación WASM en Vivo
          </h2>
          <p class="text-sm text-slate-400">
            Ejecuta comprobaciones deterministas directamente sobre el binario{' '}
            <code class="font-mono text-xs text-cyan-300">public/confetti.wasm</code>{' '}
            instanciado en WebAssembly para validar la arquitectura zero-alloc y la física.
          </p>
        </div>

        <div class="flex items-center gap-4">
          <Show when={totalCount() > 0}>
            <div class="text-right">
              <div
                data-testid="test-summary-status"
                class={`font-mono text-sm font-semibold tabular-nums ${
                  allPassed() ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {allPassed() ? '● TODAS APROBADAS' : '✖ FALLOS DETECTADOS'} ({passedCount()}/{totalCount()})
              </div>
              <Show when={props.lastRunAt}>
                <div class="font-mono text-xs text-slate-500">
                  Última ejecución: {props.lastRunAt}
                </div>
              </Show>
            </div>
          </Show>

          <button
            type="button"
            disabled={props.running}
            onClick={() => props.onRunTests()}
            class="flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Show
              when={props.running}
              fallback={<Play class="h-3.5 w-3.5" aria-hidden="true" />}
            >
              <RotateCw class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            </Show>
            <span>{props.running ? 'Ejecutando...' : 'Ejecutar Pruebas'}</span>
          </button>
        </div>
      </div>

      <Show
        when={props.results.length > 0}
        fallback={
          <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-8 text-center text-sm text-slate-400">
            Pulsa &ldquo;Ejecutar Pruebas&rdquo; para validar los 6 invariantes del motor AssemblyScript.
          </div>
        }
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <For each={props.results}>
            {(item) => (
              <article
                data-testid={`test-card-${item.id}`}
                class="rounded-lg border border-slate-800 bg-[#0D111A] p-4 flex flex-col justify-between gap-3"
              >
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between gap-3">
                    <h3 class="font-display text-sm font-semibold text-slate-100">
                      {item.name}
                    </h3>
                    <span
                      class={`inline-flex items-center gap-1 font-mono text-xs font-semibold shrink-0 ${
                        item.passed ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <Show
                        when={item.passed}
                        fallback={
                          <>
                            <XCircle class="h-3.5 w-3.5" aria-hidden="true" />
                            <span>FALLIDA</span>
                          </>
                        }
                      >
                        <CheckCircle2 class="h-3.5 w-3.5" aria-hidden="true" />
                        <span>APROBADA</span>
                      </Show>
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div class="border-t border-slate-800/80 pt-2.5 flex items-center justify-between gap-3 font-mono text-xs">
                  <span class="text-slate-300 truncate" title={item.detail}>
                    {item.detail}
                  </span>
                  <span class="text-slate-500 tabular-nums shrink-0">
                    {item.durationMs.toFixed(2)} ms
                  </span>
                </div>
              </article>
            )}
          </For>
        </div>
      </Show>
    </section>
  );
}
