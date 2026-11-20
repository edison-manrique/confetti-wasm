import { For, Show, createMemo, createSignal } from 'solid-js';
import { RefreshCw } from 'lucide-solid';
import { type ConfettiEngine, SHAPE_NAMES } from '../engine/confettiWasm';

interface MemoryInspectorPanelProps {
  engine: ConfettiEngine | null;
}

export function MemoryInspectorPanel(props: MemoryInspectorPanelProps) {
  const [tick, setTick] = createSignal(0);

  const diag = createMemo(() => {
    tick();
    return props.engine ? props.engine.getDiagnostics() : null;
  });

  const sampleIndices = createMemo(() => {
    const d = diag();
    if (!d) return [];
    const count = Math.min(6, d.activeCount);
    return Array.from({ length: count }, (_, i) => i);
  });

  return (
    <Show
      when={diag()}
      fallback={
        <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-8 text-sm text-slate-400">
          Instancia WASM inicializándose...
        </div>
      }
    >
      {(d) => (
        <section aria-labelledby="mem-heading" class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800 bg-[#0D111A] p-5">
            <div class="space-y-1 max-w-2xl">
              <h2 id="mem-heading" class="font-display text-lg font-semibold text-slate-100">
                Inspector de Arena Estática (&lt; 1 MB · {d().memoryPages} Páginas Fijas)
              </h2>
              <p class="text-sm text-slate-400">
                Reserva única en segmento de datos estático (<code class="font-mono text-xs text-cyan-300">initialMemory = maximumMemory = {d().memoryPages}</code> ={' '}
                {(d().memoryBytes / 1024).toFixed(0)} KiB). SoA comprimido a{' '}
                <code class="font-mono text-xs text-cyan-300">{d().bytesPerParticle} B/partícula</code> alineado a 16B para SIMD <code class="font-mono text-xs text-cyan-300">v128</code>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setTick((t) => t + 1)}
              class="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw class="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              <span>Actualizar Lectura</span>
            </button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4">
              <div class="text-xs text-slate-400">Segmento Estático (ARENA_BASE)</div>
              <div class="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-100">
                0x{d().arenaStart.toString(16).toUpperCase().padStart(4, '0')}
              </div>
              <div class="font-mono text-xs text-slate-500 tabular-nums">
                __heap_base: 0x{d().heapBase.toString(16).toUpperCase()}
              </div>
            </div>

            <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4">
              <div class="text-xs text-slate-400">Arena Total Reservada</div>
              <div class="mt-1 font-mono text-lg font-semibold tabular-nums text-cyan-300">
                {(d().arenaBytes / 1024).toFixed(1)} KiB
              </div>
              <div class="font-mono text-xs text-slate-500 tabular-nums">
                {d().bytesPerParticle} B / partícula SoA
              </div>
            </div>

            <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4">
              <div class="text-xs text-slate-400">Páginas Fijas (Min = Max)</div>
              <div class="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-100">
                {d().memoryPages} / {d().memoryPages} pág.
              </div>
              <div class="font-mono text-xs text-slate-500 tabular-nums">
                {(d().memoryBytes / 1024).toFixed(0)} KiB (&lt; 1 MB tope)
              </div>
            </div>

            <div class="rounded-lg border border-slate-800 bg-[#0D111A] p-4">
              <div class="text-xs text-slate-400">Puntero Bump Arena.current</div>
              <div class="mt-1 font-mono text-lg font-semibold tabular-nums text-emerald-400">
                0x{d().arenaCurrent.toString(16).toUpperCase().padStart(4, '0')}
              </div>
              <div class="font-mono text-xs text-slate-500 tabular-nums">
                Grow Post-Init: {d().postInitGrowCount}
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-800 bg-[#0D111A] overflow-hidden">
            <div class="border-b border-slate-800 px-4 py-3">
              <h3 class="font-display text-sm font-semibold text-slate-100">
                Mundos Disjuntos en memory.data (Zero-Alloc por Construcción)
              </h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 bg-[#07090E]/50">
                    <th class="px-4 py-2">Mundo</th>
                    <th class="px-4 py-2">Propósito</th>
                    <th class="px-4 py-2">Puntero Base</th>
                    <th class="px-4 py-2 text-right">Tamaño</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/70 font-mono text-xs tabular-nums">
                  <For each={d().worlds}>
                    {(world) => (
                      <tr class="hover:bg-slate-800/30">
                        <td class="px-4 py-2 text-cyan-300 font-medium">{world.name}</td>
                        <td class="px-4 py-2 font-sans text-slate-300">{world.purpose}</td>
                        <td class="px-4 py-2 text-slate-300">
                          0x{world.ptr.toString(16).toUpperCase().padStart(6, '0')}
                        </td>
                        <td class="px-4 py-2 text-right text-slate-300">
                          {(world.byteLength / 1024).toFixed(1)} KiB
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="rounded-lg border border-slate-800 bg-[#0D111A] overflow-hidden">
              <div class="border-b border-slate-800 px-4 py-3">
                <h3 class="font-display text-sm font-semibold text-slate-100">
                  Tabla de Carriles SoA (Capacidad: {d().capacity.toLocaleString()})
                </h3>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 bg-[#07090E]/50">
                      <th class="px-4 py-2">Carril</th>
                      <th class="px-4 py-2">Tipo</th>
                      <th class="px-4 py-2">Puntero Base</th>
                      <th class="px-4 py-2 text-right">Tamaño</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/70 font-mono text-xs tabular-nums">
                    <For each={d().lanes}>
                      {(lane) => (
                        <tr class="hover:bg-slate-800/30">
                          <td class="px-4 py-2 text-cyan-300 font-medium">{lane.name}</td>
                          <td class="px-4 py-2 text-slate-400">{lane.type}</td>
                          <td class="px-4 py-2 text-slate-300">
                            0x{lane.ptr.toString(16).toUpperCase().padStart(6, '0')}
                          </td>
                          <td class="px-4 py-2 text-right text-slate-300">
                            {(lane.byteLength / 1024).toFixed(1)} KiB
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="rounded-lg border border-slate-800 bg-[#0D111A] overflow-hidden">
              <div class="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <h3 class="font-display text-sm font-semibold text-slate-100">
                  Muestra en Vivo de Slots Activos ({d().activeCount.toLocaleString()})
                </h3>
                <span class="font-mono text-xs text-slate-500">
                  Primeros {sampleIndices().length} índices
                </span>
              </div>
              <Show
                when={sampleIndices().length > 0}
                fallback={
                  <div class="p-8 text-center text-xs text-slate-400">
                    No hay partículas activas en este instante. Dispara una ráfaga en el simulador para inspeccionar los valores SoA en vivo.
                  </div>
                }
              >
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 bg-[#07090E]/50">
                        <th class="px-3 py-2">Slot</th>
                        <th class="px-3 py-2">Pos (x, y)</th>
                        <th class="px-3 py-2">Vel (vx, vy)</th>
                        <th class="px-3 py-2">Vida Rest.</th>
                        <th class="px-3 py-2">Forma / Color</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/70 font-mono text-xs tabular-nums">
                      <For each={sampleIndices()}>
                        {(idx) => {
                          const eng = props.engine!;
                          const m = eng.views.meta[idx];
                          const colorIdx = m & 0x0f;
                          const shapeIdx = (m >> 4) & 0x03;
                          return (
                            <tr class="hover:bg-slate-800/30">
                              <td class="px-3 py-2 text-cyan-300">#{idx}</td>
                              <td class="px-3 py-2 text-slate-200">
                                {eng.views.x[idx].toFixed(1)}, {eng.views.y[idx].toFixed(1)}
                              </td>
                              <td class="px-3 py-2 text-slate-300">
                                {eng.views.vx[idx].toFixed(0)}, {eng.views.vy[idx].toFixed(0)}
                              </td>
                              <td class="px-3 py-2 text-slate-300">
                                {eng.views.remLife[idx].toFixed(2)}s
                              </td>
                              <td class="px-3 py-2 text-slate-400">
                                {SHAPE_NAMES[shapeIdx]} · #{colorIdx}
                              </td>
                            </tr>
                          );
                        }}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </div>
          </div>
        </section>
      )}
    </Show>
  );
}
