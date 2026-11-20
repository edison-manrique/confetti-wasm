import { For, Show, createSignal, onCleanup, onMount } from 'solid-js';
import { BenchmarkPanel } from './components/BenchmarkPanel';
import {
  type BurstConfig,
  ConfettiCanvas,
  type PhysicsConfig,
  type SimulationStats,
} from './components/ConfettiCanvas';
import { ControlSidebar } from './components/ControlSidebar';
import { DocsPanel } from './components/DocsPanel';
import { MemoryInspectorPanel } from './components/MemoryInspectorPanel';
import { PaymentSuccessSimulator } from './components/PaymentSuccessSimulator';
import { VerificationPanel } from './components/VerificationPanel';
import { ConfettiEngine, getDefaultWasmUrl } from './engine/confettiWasm';
import {
  type BenchmarkResult,
  runPhysicsBenchmark,
  runVerificationSuite,
  type VerificationCheckResult,
} from './engine/verification';

type ActiveTab = 'simulator' | 'checkout' | 'docs' | 'tests' | 'benchmark' | 'memory';

const INITIAL_CAPACITY = 19200;

export default function App() {
  const [activeTab, setActiveTab] = createSignal<ActiveTab>('simulator');
  const [engine, setEngine] = createSignal<ConfettiEngine | null>(null);
  const [wasmBytes, setWasmBytes] = createSignal<ArrayBuffer | null>(null);
  const [wasmError, setWasmError] = createSignal<string | null>(null);

  let canvasDims = { width: 960, height: 600 };
  let initialBurstDone = false;

  const [paused, setPaused] = createSignal(false);
  const [physics, setPhysics] = createSignal<PhysicsConfig>({
    gravity: 980,
    drag: 1.65,
    wind: 0,
    turbulence: 180,
  });
  const [burst, setBurst] = createSignal<BurstConfig>({
    count: 1600,
    speed: 875,
    spreadDeg: 140,
    emitterMode: 'burst',
  });

  const [stats, setStats] = createSignal<SimulationStats>({
    activeCount: 0,
    capacity: INITIAL_CAPACITY,
    stepMs: 0,
    renderMs: 0,
    fps: 60,
    totalSpawned: 0,
    totalRecycled: 0,
    postInitGrowCount: 0,
    arenaBytes: 963328,
    memoryBytes: 983040,
    bytesPerParticle: 49,
  });

  const [testResults, setTestResults] = createSignal<VerificationCheckResult[]>([]);
  const [testsRunning, setTestsRunning] = createSignal(false);
  const [testsLastRun, setTestsLastRun] = createSignal<string | null>(null);

  const [benchTarget, setBenchTarget] = createSignal(10000);
  const [benchResult, setBenchResult] = createSignal<BenchmarkResult | null>(null);
  const [benchRunning, setBenchRunning] = createSignal(false);

  const runTests = async (bytesOverride?: ArrayBuffer) => {
    const bytes = bytesOverride ?? wasmBytes();
    if (!bytes) return;
    setTestsRunning(true);
    try {
      const results = await runVerificationSuite(bytes);
      setTestResults(results);
      setTestsLastRun(new Date().toLocaleTimeString('es-ES', { hour12: false }));
    } finally {
      setTestsRunning(false);
    }
  };

  const runBenchmark = async () => {
    const bytes = wasmBytes();
    if (!bytes) return;
    setBenchRunning(true);
    await new Promise((r) => setTimeout(r, 20));
    try {
      const res = await runPhysicsBenchmark(bytes, benchTarget(), 180);
      setBenchResult(res);
    } finally {
      setBenchRunning(false);
    }
  };

  onMount(() => {
    let cancelled = false;

    const bootWasm = async () => {
      try {
        const res = await fetch(getDefaultWasmUrl());
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} al cargar /confetti.wasm`);
        }
        const bytes = await res.arrayBuffer();
        if (cancelled) return;
        setWasmBytes(bytes);

        const instance = await ConfettiEngine.fromBytes(bytes);
        if (cancelled) return;

        const { width, height } = canvasDims;
        instance.init(INITIAL_CAPACITY, width, height);
        const p = physics();
        instance.setPhysics(p.gravity, p.drag, p.wind, p.turbulence);
        setEngine(instance);

        const diag = instance.getDiagnostics();
        setStats((prev) => ({
          ...prev,
          capacity: diag.capacity,
          arenaBytes: diag.arenaBytes,
          memoryBytes: diag.memoryBytes,
          bytesPerParticle: diag.bytesPerParticle,
          postInitGrowCount: diag.postInitGrowCount,
        }));

        if (!initialBurstDone) {
          initialBurstDone = true;
          instance.spawnBurst(
            width * 0.5,
            height * 0.62,
            1200,
            900,
            (140 * Math.PI) / 180,
            -Math.PI / 2,
            5,
            11,
            3.2,
            5.4
          );
          window.setTimeout(() => {
            if (!cancelled) {
              const dims = canvasDims;
              instance.spawnDualCannons(dims.width, dims.height, 300, 960, (65 * Math.PI) / 180);
            }
          }, 350);
        }

        window.setTimeout(() => {
          if (!cancelled) {
            void runTests(bytes);
          }
        }, 450);
      } catch (err) {
        if (!cancelled) {
          setWasmError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    void bootWasm();
    onCleanup(() => {
      cancelled = true;
    });
  });

  const handleCanvasReady = (dims: { width: number; height: number }) => {
    canvasDims = dims;
    const eng = engine();
    if (eng && !initialBurstDone) {
      initialBurstDone = true;
      eng.spawnBurst(
        dims.width * 0.5,
        dims.height * 0.62,
        2400,
        920,
        (140 * Math.PI) / 180,
        -Math.PI / 2,
        5,
        11,
        2.2,
        4.2
      );
    }
  };

  const fireCenterBurst = () => {
    const eng = engine();
    if (!eng) return;
    if (activeTab() !== 'simulator') {
      setActiveTab('simulator');
    }
    if (paused()) {
      setPaused(false);
    }
    const { width, height } = canvasDims;
    const b = burst();
    const spreadRad = (b.spreadDeg * Math.PI) / 180;
    if (b.emitterMode === 'cannons') {
      const half = Math.max(100, Math.round(b.count * 0.5));
      eng.spawnDualCannons(width, height, half, b.speed * 1.1, spreadRad * 0.45);
    } else {
      eng.spawnBurst(width * 0.5, height * 0.6, b.count, b.speed, spreadRad, -Math.PI / 2, 5, 11, 2.2, 4.4);
    }
  };

  const fireDualCannons = () => {
    const eng = engine();
    if (!eng) return;
    if (paused()) setPaused(false);
    const { width, height } = canvasDims;
    const b = burst();
    const half = Math.max(100, Math.round(b.count * 0.5));
    const spreadRad = (Math.min(90, b.spreadDeg) * Math.PI) / 180;
    eng.spawnDualCannons(width, height, half, b.speed * 1.15, spreadRad);
  };

  const handleClear = () => {
    const eng = engine();
    if (!eng) return;
    eng.clear();
    setStats((prev) => ({ ...prev, activeCount: 0 }));
  };

  const passedTests = () => testResults().filter((t) => t.passed).length;

  const navTabs = () =>
    [
      { id: 'simulator', label: 'Simulador' },
      { id: 'checkout', label: 'Pago Exitoso' },
      { id: 'docs', label: 'Documentación' },
      {
        id: 'tests',
        label: testResults().length > 0 ? `Pruebas (${passedTests()}/${testResults().length})` : 'Pruebas',
      },
      { id: 'benchmark', label: 'Benchmark' },
      { id: 'memory', label: 'Memoria SoA' },
    ] as const;

  return (
    <div
      class="min-h-screen flex flex-col bg-[#07090E] text-slate-100"
      data-wasm-ready={engine() ? 'true' : 'false'}
      data-active-count={stats().activeCount}
    >
      {/* Top Bar Contract: strictly 3 zones separated by gap-8 */}
      <header class="border-b border-slate-800 bg-[#0B0F19]">
        <div class="mx-auto max-w-[1440px] px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('simulator');
            }}
            class="font-mono text-base font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
          >
            confetti-wasm
          </a>

          <nav aria-label="Vistas del laboratorio" class="hidden md:flex items-center gap-6 h-full">
            <For each={navTabs()}>
              {(tab) => {
                const active = () => activeTab() === tab.id;
                return (
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    class={`h-full inline-flex items-center border-b-2 text-sm font-medium transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer ${
                      active()
                        ? 'border-cyan-400 text-slate-100'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              }}
            </For>
          </nav>

          <div class="shrink-0">
            <button
              type="button"
              disabled={!engine()}
              onClick={fireCenterBurst}
              class="rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Disparar Ráfaga
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <nav
          aria-label="Navegación móvil"
          class="flex md:hidden items-center gap-3 overflow-x-auto border-t border-slate-800/80 px-4 py-2"
        >
          <For each={navTabs()}>
            {(tab) => {
              const active = () => activeTab() === tab.id;
              return (
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  class={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
                    active()
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            }}
          </For>
        </nav>
      </header>

      <main class="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 flex flex-col gap-6">
        <Show when={wasmError()}>
          <div
            role="alert"
            class="rounded-lg border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200"
          >
            Error cargando el módulo WebAssembly: {wasmError()}
          </div>
        </Show>

        <Show when={activeTab() === 'simulator'}>
          <div class="flex flex-col gap-8">
            <div class="flex flex-col lg:flex-row gap-5 min-h-[580px]">
              <div class="order-2 lg:order-1 flex">
                <ControlSidebar
                  physics={physics()}
                  burst={burst()}
                  paused={paused()}
                  wasmReady={Boolean(engine())}
                  onChangePhysics={setPhysics}
                  onChangeBurst={setBurst}
                  onTriggerCenterBurst={fireCenterBurst}
                  onTriggerDualCannons={fireDualCannons}
                  onTogglePause={() => setPaused((p) => !p)}
                  onClear={handleClear}
                />
              </div>

              <div class="order-1 lg:order-2 flex-1 flex flex-col gap-4 min-w-0">
                <div class="relative flex-1 flex flex-col min-h-[340px] lg:min-h-[440px]">
                  <ConfettiCanvas
                    engine={engine()}
                    paused={paused()}
                    physics={physics()}
                    burst={burst()}
                    onStatsUpdate={setStats}
                    onCanvasReady={handleCanvasReady}
                  />

                  <div class="pointer-events-none absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-slate-800 bg-[#0B0F19]/90 px-3 py-1.5 font-mono text-xs tabular-nums">
                      <div>
                        <span class="text-slate-400">Activas </span>
                        <span data-testid="hud-active-count" class="font-semibold text-cyan-300">
                          {stats().activeCount.toLocaleString()}
                        </span>
                        <span class="text-slate-500"> / {stats().capacity.toLocaleString()}</span>
                      </div>
                      <span class="hidden sm:inline text-slate-700" aria-hidden="true">|</span>
                      <div>
                        <span class="text-slate-400">step() </span>
                        <span class="font-semibold text-slate-100">
                          {stats().stepMs.toFixed(2)} ms
                        </span>
                      </div>
                      <span class="hidden sm:inline text-slate-700" aria-hidden="true">|</span>
                      <div>
                        <span class="text-slate-400">FPS </span>
                        <span class="font-semibold text-slate-100">{stats().fps}</span>
                      </div>
                    </div>

                    <div class="rounded-md border border-slate-800 bg-[#0B0F19]/90 px-3 py-1.5 font-mono text-xs tabular-nums text-emerald-400">
                      ● ZERO-ALLOC · Grow Post-Init: {stats().postInitGrowCount}
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div class="rounded-lg border border-slate-800 bg-[#0D111A] px-4 py-3">
                    <div class="text-xs text-slate-400">Reserva Total WASM</div>
                    <div class="mt-0.5 font-mono text-lg font-semibold tabular-nums text-slate-100">
                      {(stats().memoryBytes / 1024).toFixed(0)}
                      <span class="ml-1 text-xs uppercase text-slate-400">KiB (15 pág.)</span>
                    </div>
                  </div>

                  <div class="rounded-lg border border-slate-800 bg-[#0D111A] px-4 py-3">
                    <div class="text-xs text-slate-400">Huella por Partícula</div>
                    <div class="mt-0.5 font-mono text-lg font-semibold tabular-nums text-slate-100">
                      {stats().bytesPerParticle}
                      <span class="ml-1 text-xs uppercase text-slate-400">B / SoA</span>
                    </div>
                  </div>

                  <div class="rounded-lg border border-slate-800 bg-[#0D111A] px-4 py-3">
                    <div class="text-xs text-slate-400">Emitidas Acumuladas</div>
                    <div class="mt-0.5 font-mono text-lg font-semibold tabular-nums text-slate-100">
                      {stats().totalSpawned.toLocaleString()}
                    </div>
                  </div>

                  <div class="rounded-lg border border-slate-800 bg-[#0D111A] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="min-w-0">
                      <div class="text-xs text-slate-400">Verificación WASM</div>
                      <div class="mt-0.5 font-mono text-sm font-semibold tabular-nums text-emerald-400">
                        {testResults().length > 0
                          ? `${passedTests()}/${testResults().length} Aprobadas`
                          : 'Pendiente'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tests')}
                      class="self-start sm:self-auto rounded border border-slate-700 bg-slate-800/70 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Ver Pruebas
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated Payment Success Simulator Module embedded cleanly below main lab */}
            <div class="border-t border-slate-800/80 pt-8">
              <PaymentSuccessSimulator wasmBytes={wasmBytes()} />
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'checkout'}>
          <PaymentSuccessSimulator wasmBytes={wasmBytes()} />
        </Show>

        <Show when={activeTab() === 'docs'}>
          <DocsPanel onNavigateTab={(tab) => setActiveTab(tab)} />
        </Show>

        <Show when={activeTab() === 'tests'}>
          <VerificationPanel
            results={testResults()}
            running={testsRunning()}
            lastRunAt={testsLastRun()}
            onRunTests={() => void runTests()}
          />
        </Show>

        <Show when={activeTab() === 'benchmark'}>
          <BenchmarkPanel
            result={benchResult()}
            running={benchRunning()}
            particleTarget={benchTarget()}
            onChangeTarget={setBenchTarget}
            onRunBenchmark={() => void runBenchmark()}
          />
        </Show>

        <Show when={activeTab() === 'memory'}>
          <MemoryInspectorPanel engine={engine()} />
        </Show>
      </main>
    </div>
  );
}
