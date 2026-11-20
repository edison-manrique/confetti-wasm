# confetti-wasm

Motor de confeti de alto rendimiento escrito en **AssemblyScript WebAssembly** con arquitectura **Structure-of-Arrays (SoA) zero-alloc** bajo **1 MB de memoria fija** (`15` páginas WASM = `960 KiB`) y vectorización **SIMD `v128` (`f32x4`)**.

Ahora incluye un **wrapper zero-config** (`confetti` y `createConfetti`) para integrarlo en **3 líneas de código** sin escribir bucles `requestAnimationFrame`, cálculos de `devicePixelRatio` ni `ResizeObserver`.

---

## Instalación

```bash
npm install confetti-wasm
```

---

## Inicio Rápido (Wrapper Zero-Config)

### 1. Una sola línea en cualquier app web

```ts
import { confetti } from 'confetti-wasm';

// Crea el canvas overlay, carga confetti.wasm y se auto-detiene al finalizar
await confetti.celebrate();

// Disparo personalizado (grados intuitivos y origen normalizado 0..1)
confetti({
  count: 220,
  spread: 90,
  angle: 90,
  origin: { x: 0.5, y: 0.6 },
});

// Otros presets integrados
confetti.cannons({ countPerSide: 360, speed: 940 });
confetti.rain({ count: 280 });
```

### 2. Contenedor o tarjeta específica (SolidJS / React / Vue / Vanilla)

Usa `createConfetti` cuando quieras encerrar el confeti dentro de una tarjeta, modal o componente reutilizable con limpieza automática:

```tsx
import { onCleanup, onMount } from 'solid-js';
import { createConfetti, type ConfettiController } from 'confetti-wasm';

export function CheckoutSuccessCard() {
  let cardEl: HTMLDivElement | undefined;
  let fx: ConfettiController | null = null;

  onMount(() => {
    fx = createConfetti({
      container: cardEl,
      physics: { gravity: 840, drag: 1.55, turbulence: 160 },
    });
  });

  onCleanup(() => fx?.destroy());

  return (
    <div ref={cardEl} class="rounded-xl p-6">
      <button onClick={() => fx?.celebrate()}>Confirmar Pago</button>
    </div>
  );
}
```

---

## Referencia del Wrapper (`confetti` / `createConfetti`)

| Función / Método | Opciones principales | Descripción |
| :--- | :--- | :--- |
| `confetti(options?)` / `confetti.burst(options?)` | `{ count?, particleCount?, speed?, spread?, angle?, origin?, size?, life? }` | Emite una ráfaga en un canvas overlay automático (`angle: 90` apunta hacia arriba; `origin` usa coordenadas `0..1`). |
| `confetti.cannons(options?)` | `{ countPerSide?, speed?, spread? }` | Dispara simultáneamente cañones en las esquinas inferiores izquierda y derecha. |
| `confetti.celebrate(options?)` | `{ cannonCount?, showerCount?, delayMs? }` | Secuencia coreografiada en 2 oleadas (cañones + lluvia superior) para pagos aprobados o logros. |
| `confetti.rain(options?)` | `{ count?, speed?, spread? }` | Lluvia suave descendente desde el borde superior. |
| `createConfetti(options?)` | `{ canvas?, container?, wasmUrl?, wasmBytes?, capacity?, maxDpr?, zIndex?, seed?, physics?, respectReducedMotion? }` | Crea un controlador independiente con `ResizeObserver`, `rAF` bajo demanda (0% CPU en reposo) y limpieza con `.destroy()`. |
| `fx.setPhysics(patch)` | `{ gravity?, drag?, wind?, turbulence? }` | Actualiza parámetros físicos en caliente sin reiniciar las partículas activas. |
| `fx.clear()` / `fx.destroy()` | — | Limpia las partículas activas o desmonta el canvas y listeners por completo. |

---

## API Avanzada Zero-Copy (`ConfettiEngine`)

Si necesitas controlar tu propio bucle `requestAnimationFrame`, dibujar en un renderizador propio o leer los buffers compartidos sin copias:

```ts
import { loadConfettiWasm, renderSoAParticles } from 'confetti-wasm';

const canvas = document.querySelector<HTMLCanvasElement>('#confetti')!;
const ctx = canvas.getContext('2d')!;
const dpr = Math.min(window.devicePixelRatio || 1, 2);

const engine = await loadConfettiWasm();
engine.init(19200, canvas.clientWidth, canvas.clientHeight);
engine.setPhysics(980, 1.65, 0, 180);

engine.spawnDualCannons(canvas.clientWidth, canvas.clientHeight, 600, 940, (65 * Math.PI) / 180);

let last = performance.now();
function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  if (engine.activeCount > 0) {
    engine.step(dt);
    renderSoAParticles(ctx, engine, dpr);
    requestAnimationFrame(loop);
  }
}
requestAnimationFrame(loop);
```

| Método de `ConfettiEngine` | Descripción |
| :--- | :--- |
| `loadConfettiWasm(url?)` | Resuelve `confetti.wasm` junto al bundle ESM y devuelve una instancia lista. |
| `ConfettiEngine.fromBytes(bytes)` | Instancia el motor a partir de un `BufferSource` ya cargado en memoria. |
| `engine.init(capacity, width, height)` | Inicializa capacidad (`64..19200`), dimensiones del canvas y vistas `TypedArray` zero-copy. |
| `engine.spawnBurst(...)` | Emite una ráfaga radial usando PRNG `xorshift32` y trigonometría rápida en WASM. |
| `engine.step(dt)` | Avanza la física SIMD `f32x4` y compacta partículas expiradas con `swapRemove`. |
| `engine.clear()` / `engine.secureWipe()` | Reinicia el contador activo o sobrescribe con ceros toda la arena estática. |

---

## Características técnicas y Arquitectura de Memoria

- **Zero-Alloc estricto (`0 B` de crecimiento post-init):** Toda la memoria se reserva en tiempo de compilación dentro del segmento estático `memory.data` (`assembly/arena.ts`), sellado con `initialMemory = maximumMemory = 15`.
- **Huella ultra compacta (`49 B/partícula`):** 12 carriles `f32` alineados a 16 bytes + 1 carril `u8` empaquetado (`color` + `shape`), permitiendo hasta **19,200 partículas simultáneas** por debajo de 1 MB.
- **Física SIMD `f32x4` sin divisiones:** Bucle `step(dt)` en dos pasadas con aproximación trigonométrica `fastSin4` y compactación `O(1)` por `swapRemove`.
- **Binario minúsculo:** `public/confetti.wasm` pesa **4.8 KiB** compilado con `--runtime stub --enable simd --optimizeLevel 3 --converge --noAssert`.

```text
TOTAL_ARENA_SIZE = 963,328 B  (< 1 MB, dentro de 15 páginas WASM = 983,040 B)
├── PARAM_IN       [0 .. 2048)         I/O entrada (2 KiB)
├── PARAM_OUT      [2048 .. 4096)      I/O salida  (2 KiB)
├── SCRATCH_WORK   [4096 .. 20480)     Arena bump RAII save/restore (16 KiB)
├── EMITTER_WORK   [20480 .. 22528)    Layout fijo emisores (2 KiB)
└── PARTICLES_WORK [22528 .. 963328)   13 carriles SoA (19,200 part. × 49 B, alineado 16B)
```

---

## Scripts de desarrollo

- `npm run dev`: Inicia el servidor de desarrollo Vite + SolidJS en el puerto `3000`.
- `npm run build:wasm`: Compila `assembly/confetti.ts` a `public/confetti.wasm` y `public/confetti.wat`.
- `npm run build:lib`: Compila el paquete publicable de npm en `dist-lib/` (`index.js`, `*.d.ts` y `confetti.wasm`).
- `npm test`: Ejecuta la suite de pruebas unitarias sobre WASM, wrapper y tokenizer (`tests/confetti.test.ts`).
- `npm run lint`: Verifica tipos TypeScript (`tsc --noEmit`).
- `npm run build`: Compila el binario WASM y genera el bundle de producción en `dist/`.

---

## Publicación en GitHub Pages y npm (OIDC Trusted Publishing)

- **GitHub Pages (`.github/workflows/deploy-pages.yml`):** en cada `push` a `main` compila WASM, ejecuta `npm test` y despliega `./dist` con `actions/deploy-pages@v4`. Activa **Settings → Pages → Source: GitHub Actions**.
- **npm Trusted Publishing (`.github/workflows/publish-npm.yml`):** configurado con Node 24 (`id-token: write`) sin `NPM_TOKEN` ni *Bypass 2FA*.
  1. Primer registro único desde terminal: `npm login && npm run build:lib && npm publish --access public`.
  2. En `npmjs.com/package/confetti-wasm/access` → **Trusted Publisher** → **GitHub Actions** indica `publish-npm.yml`.
  3. Siguientes releases automáticos: `npm version patch && git push origin main --follow-tags`.
