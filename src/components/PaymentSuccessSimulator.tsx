import { For, Match, Switch, createSignal, onCleanup, onMount } from 'solid-js';
import { Check, CreditCard, Lock, RotateCcw, ShieldCheck, Sparkles } from 'lucide-solid';
import { ConfettiEngine, getDefaultWasmUrl } from '../engine/confettiWasm';
import { renderSoAParticles } from '../engine/spriteAtlas';

interface PaymentSuccessSimulatorProps {
  wasmBytes: ArrayBuffer | null;
}

type CheckoutStep = 'form' | 'processing' | 'success';

interface PlanOption {
  id: string;
  name: string;
  period: string;
  price: number;
  tax: number;
  summary: string;
}

const PLANS: readonly PlanOption[] = [
  {
    id: 'starter',
    name: 'Licencia Indie WASM',
    period: 'Pago único',
    price: 49,
    tax: 9.31,
    summary: 'Uso comercial en 1 proyecto web + código AssemblyScript',
  },
  {
    id: 'pro',
    name: 'Suite ZeroAlloc Pro',
    period: 'Suscripción anual',
    price: 149,
    tax: 28.31,
    summary: 'Motor SIMD multi-escena, soporte prioritario y builds dedicados',
  },
  {
    id: 'enterprise',
    name: 'Licencia Corporativa',
    period: 'Anual ilimitada',
    price: 499,
    tax: 94.81,
    summary: 'Despliegue global ilimitado en aplicaciones fintech y e-commerce',
  },
];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Tarjeta •••• 4242', detail: 'Visa · Exp 09/28' },
  { id: 'wallet', label: 'Pago Biométrico', detail: 'Apple Pay / Passkey' },
  { id: 'transfer', label: 'Transferencia SEPA', detail: 'Liquidación T+0' },
] as const;

export function PaymentSuccessSimulator(props: PaymentSuccessSimulatorProps) {
  const [selectedPlanId, setSelectedPlanId] = createSignal<string>('pro');
  const [paymentMethod, setPaymentMethod] = createSignal<'card' | 'wallet' | 'transfer'>('card');
  const [customerName, setCustomerName] = createSignal('Elena Valdivia');
  const [customerEmail, setCustomerEmail] = createSignal('elena@acme-fintech.dev');
  const [formError, setFormError] = createSignal<string | null>(null);
  const [step, setStep] = createSignal<CheckoutStep>('form');
  const [txId, setTxId] = createSignal('TXN-8942-WASM');
  const [paidAt, setPaidAt] = createSignal('');
  const [activeParticles, setActiveParticles] = createSignal(0);
  const [stepTimeMs, setStepTimeMs] = createSignal(0);

  let stageRef: HTMLDivElement | undefined;
  let canvasRef: HTMLCanvasElement | undefined;
  let localEngine: ConfettiEngine | null = null;
  let dims = { width: 960, height: 620, dpr: 1 };
  let timers: number[] = [];

  const activePlan = () => PLANS.find((p) => p.id === selectedPlanId()) ?? PLANS[1];
  const totalAmount = () => (activePlan().price + activePlan().tax).toFixed(2);

  let rafId = 0;
  let lastTime = 0;
  let hudTimer = 0;
  let ctx2d: CanvasRenderingContext2D | null = null;

  const stopLoop = () => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const startLoop = () => {
    if (rafId !== 0 || !ctx2d) return;
    lastTime = performance.now();
    hudTimer = 0;

    const tick = (now: number) => {
      const ctx = ctx2d;
      if (!ctx) {
        rafId = 0;
        return;
      }

      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = rawDt > 0 && rawDt < 0.05 ? rawDt : 1 / 60;

      const { width, height, dpr } = dims;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      let measuredStep = 0;
      if (localEngine && localEngine.activeCount > 0) {
        const t0 = performance.now();
        localEngine.step(dt);
        measuredStep = performance.now() - t0;
        renderSoAParticles(ctx, localEngine, dpr);
      }

      hudTimer += rawDt;
      const count = localEngine ? localEngine.activeCount : 0;
      if (hudTimer >= 0.1 || count === 0) {
        hudTimer = 0;
        setActiveParticles(count);
        setStepTimeMs(measuredStep);
      }

      if (count > 0) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    rafId = requestAnimationFrame(tick);
  };

  const fireCelebration = () => {
    if (!localEngine) return;
    const { width, height } = dims;
    localEngine.setPhysics(840, 1.55, 0, 160);

    // Stage 1: Immediate dual corner cannons via single WASM call (720 particles)
    localEngine.spawnDualCannons(width, height, 360, 940, (64 * Math.PI) / 180);
    setActiveParticles(localEngine.activeCount);
    startLoop();

    // Stage 2: Choreographed top-center shower 220ms later (480 particles)
    const t1 = window.setTimeout(() => {
      if (!localEngine) return;
      localEngine.spawnBurst(
        width * 0.5,
        height * 0.24,
        480,
        740,
        Math.PI * 1.35,
        -Math.PI / 2,
        5,
        11,
        2.6,
        4.4
      );
      startLoop();
    }, 220);

    timers.push(t1);
  };

  onMount(() => {
    if (!canvasRef || !stageRef) return;
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;
    ctx2d = ctx;

    let cancelled = false;

    const bootLocalWasm = async () => {
      try {
        const bytes =
          props.wasmBytes ?? (await (await fetch(getDefaultWasmUrl())).arrayBuffer());
        if (cancelled) return;
        const eng = await ConfettiEngine.fromBytes(bytes);
        if (cancelled) return;
        eng.init(19200, dims.width, dims.height);
        eng.setPhysics(840, 1.55, 0, 160);
        localEngine = eng;
      } catch {
        // Handled cleanly if WASM fails
      }
    };

    void bootLocalWasm();

    const updateSize = () => {
      if (!canvasRef || !stageRef) return;
      const rect = stageRef.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(460, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvasRef.width = Math.floor(width * dpr);
      canvasRef.height = Math.floor(height * dpr);
      dims = { width, height, dpr };

      if (localEngine) {
        localEngine.resize(width, height);
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(stageRef);

    onCleanup(() => {
      cancelled = true;
      stopLoop();
      ro.disconnect();
      for (const id of timers) clearTimeout(id);
      timers = [];
    });
  });

  const handleSubmitPayment = (e: SubmitEvent) => {
    e.preventDefault();
    const name = customerName().trim();
    const email = customerEmail().trim();
    if (!name || !email || !email.includes('@')) {
      setFormError('Ingresa un titular y un correo electrónico válido para emitir el comprobante.');
      return;
    }
    setFormError(null);
    setStep('processing');

    const t = window.setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 8999);
      setTxId(`TXN-${code}-WASM`);
      setPaidAt(
        new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setStep('success');
      fireCelebration();
    }, 520);
    timers.push(t);
  };

  const resetCheckout = () => {
    for (const id of timers) clearTimeout(id);
    timers = [];
    stopLoop();
    localEngine?.clear();
    if (ctx2d) {
      ctx2d.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      ctx2d.clearRect(0, 0, dims.width, dims.height);
    }
    setActiveParticles(0);
    setStepTimeMs(0);
    setStep('form');
  };

  return (
    <section
      aria-labelledby="payment-sim-heading"
      ref={stageRef}
      class="relative overflow-hidden rounded-xl border border-slate-800 bg-[#0A0E17] p-5 sm:p-8 min-h-[580px] flex flex-col gap-6"
    >
      {/* Subtle architectural backdrop gradient */}
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(6,182,212,0.08),transparent_65%)]"
      />

      {/* Header row inside Checkout Stage */}
      <div class="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div class="space-y-0.5">
          <h2 id="payment-sim-heading" class="font-display text-lg font-semibold text-slate-100">
            Simulador de Pago Exitoso
          </h2>
          <p class="text-xs text-slate-400">
            Módulo SolidJS independiente impulsado por <code class="font-mono text-cyan-300">confetti-wasm</code> (&lt; 1 MB · SIMD v128).
          </p>
        </div>

        <div class="flex items-center gap-3 font-mono text-xs tabular-nums">
          <span class="text-slate-400">
            Partículas: <strong class="text-cyan-300">{activeParticles().toLocaleString()}</strong>
          </span>
          <span class="text-slate-700" aria-hidden="true">·</span>
          <span class="text-slate-400">
            step(): <strong class="text-slate-200">{stepTimeMs().toFixed(2)} ms</strong>
          </span>
          <span class="text-slate-700" aria-hidden="true">·</span>
          <span class="text-emerald-400">Grow: 0 B</span>
        </div>
      </div>

      {/* Main Checkout / Receipt Grid */}
      <div class="relative z-10 mx-auto my-auto w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Order Summary Card */}
        <div class="lg:col-span-5 rounded-lg border border-slate-800 bg-[#0E1420] p-5 space-y-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">Resumen de orden</span>
            <span class="font-mono text-xs text-cyan-300">USD</span>
          </div>

          <div class="space-y-2">
            <For each={PLANS}>
              {(plan) => {
                const selected = () => selectedPlanId() === plan.id;
                return (
                  <button
                    type="button"
                    disabled={step() !== 'form'}
                    onClick={() => setSelectedPlanId(plan.id)}
                    class={`w-full text-left rounded-md border p-3 transition-colors cursor-pointer disabled:cursor-default ${
                      selected()
                        ? 'border-cyan-500/60 bg-cyan-500/10'
                        : 'border-slate-800 bg-[#090D16] hover:border-slate-700'
                    }`}
                  >
                    <div class="flex items-baseline justify-between gap-2">
                      <span class="font-display text-sm font-semibold text-slate-100">
                        {plan.name}
                      </span>
                      <span class="font-mono text-sm font-semibold tabular-nums text-cyan-300">
                        ${plan.price.toFixed(2)}
                      </span>
                    </div>
                    <div class="mt-1 flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span>{plan.summary}</span>
                    </div>
                  </button>
                );
              }}
            </For>
          </div>

          <div class="border-t border-slate-800 pt-4 space-y-2 text-xs">
            <div class="flex justify-between text-slate-400">
              <span>Subtotal ({activePlan().period})</span>
              <span class="font-mono tabular-nums text-slate-200">${activePlan().price.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Impuestos digitales (19%)</span>
              <span class="font-mono tabular-nums text-slate-200">${activePlan().tax.toFixed(2)}</span>
            </div>
            <div class="border-t border-slate-800 pt-2.5 flex justify-between items-baseline">
              <span class="font-display text-sm font-semibold text-slate-100">Total a pagar</span>
              <span class="font-mono text-xl font-bold tabular-nums text-slate-100">
                ${totalAmount()} <span class="text-xs font-normal text-slate-400">USD</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Checkout Form or Success Receipt */}
        <div
          class={`lg:col-span-7 rounded-lg border bg-[#0E1420] p-5 sm:p-6 transition-colors ${
            step() === 'success'
              ? 'border-slate-700 border-t-2 border-t-emerald-400'
              : 'border-slate-800'
          }`}
        >
          <Switch>
            <Match when={step() === 'form'}>
              <form onSubmit={handleSubmitPayment} class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-display text-base font-semibold text-slate-100">
                    Método de Pago
                  </h3>
                  <span class="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <Lock class="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    <span>Simulación segura TLS</span>
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <For each={PAYMENT_METHODS}>
                    {(method) => {
                      const active = () => paymentMethod() === method.id;
                      return (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          class={`rounded-md border p-3 text-left transition-colors cursor-pointer ${
                            active()
                              ? 'border-cyan-500/60 bg-cyan-500/10 text-slate-100'
                              : 'border-slate-800 bg-[#090D16] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div class="text-xs font-semibold truncate">{method.label}</div>
                          <div class="mt-0.5 text-[11px] text-slate-500 truncate">{method.detail}</div>
                        </button>
                      );
                    }}
                  </For>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div class="space-y-1.5">
                    <label for="checkout-name" class="block text-xs font-medium text-slate-300">
                      Titular de la cuenta
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      value={customerName()}
                      onInput={(e) => setCustomerName(e.currentTarget.value)}
                      class="w-full rounded-md border border-slate-700 bg-[#07090E] px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label for="checkout-email" class="block text-xs font-medium text-slate-300">
                      Correo para recibo
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={customerEmail()}
                      onInput={(e) => setCustomerEmail(e.currentTarget.value)}
                      class="w-full rounded-md border border-slate-700 bg-[#07090E] px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                {formError() && (
                  <p role="alert" class="text-xs text-rose-400">
                    {formError()}
                  </p>
                )}

                <div class="pt-2 space-y-3">
                  <button
                    type="submit"
                    data-testid="pay-submit-btn"
                    class="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer"
                  >
                    <CreditCard class="h-4 w-4" aria-hidden="true" />
                    <span>Confirmar y Pagar ${totalAmount()} USD</span>
                  </button>
                  <p class="text-center text-[11px] text-slate-500">
                    Al confirmar, se ejecuta una transacción simulada y se disparan 1,200 partículas WASM sin asignaciones en heap.
                  </p>
                </div>
              </form>
            </Match>

            <Match when={step() === 'processing'}>
              <div class="py-16 flex flex-col items-center justify-center text-center space-y-4">
                <div class="h-10 w-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                <div class="space-y-1">
                  <div class="font-display text-base font-semibold text-slate-100">
                    Autorizando pago...
                  </div>
                  <p class="text-xs text-slate-400 font-mono tabular-nums">
                    Validando método · ${totalAmount()} USD
                  </p>
                </div>
              </div>
            </Match>

            <Match when={step() === 'success'}>
              <div data-testid="payment-success-receipt" class="space-y-5">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
                      <Check class="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div class="font-mono text-xs font-semibold text-emerald-400">
                        ● PAGO APROBADO
                      </div>
                      <h3 class="font-display text-xl font-bold text-slate-100">
                        Transacción completada con éxito
                      </h3>
                    </div>
                  </div>
                </div>

                <div class="rounded-md border border-slate-800 bg-[#090D16] p-4 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <div class="text-slate-500">Referencia</div>
                    <div class="mt-0.5 font-mono font-semibold text-slate-100 tabular-nums">
                      {txId()}
                    </div>
                  </div>
                  <div>
                    <div class="text-slate-500">Hora de autorización</div>
                    <div class="mt-0.5 font-mono text-slate-200 tabular-nums">
                      {paidAt()}
                    </div>
                  </div>
                  <div>
                    <div class="text-slate-500">Titular</div>
                    <div class="mt-0.5 text-slate-200 truncate">{customerName()}</div>
                  </div>
                  <div>
                    <div class="text-slate-500">Comprobante enviado a</div>
                    <div class="mt-0.5 text-slate-200 truncate">{customerEmail()}</div>
                  </div>
                  <div>
                    <div class="text-slate-500">Plan adquirido</div>
                    <div class="mt-0.5 text-slate-200">{activePlan().name}</div>
                  </div>
                  <div>
                    <div class="text-slate-500">Importe liquidado</div>
                    <div class="mt-0.5 font-mono font-semibold text-emerald-400 tabular-nums">
                      ${totalAmount()} USD
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div class="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <ShieldCheck class="h-4 w-4 text-cyan-400" aria-hidden="true" />
                    <span>Motor WASM activo en segundo plano</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fireCelebration}
                      class="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Sparkles class="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Repetir Celebración</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetCheckout}
                      class="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Nueva Simulación</span>
                    </button>
                  </div>
                </div>
              </div>
            </Match>
          </Switch>
        </div>
      </div>

      {/* Transparent Canvas Overlay for Celebratory WASM Confetti */}
      <canvas
        ref={canvasRef}
        data-testid="payment-confetti-canvas"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 z-20 h-full w-full"
      />
    </section>
  );
}
