# confetti-wasm

Motor de confeti de alto rendimiento escrito en **AssemblyScript WebAssembly** con arquitectura **Structure-of-Arrays (SoA) zero-alloc** bajo **1 MB de memoria fija** (`15` páginas WASM = `960 KiB`) y vectorización **SIMD `v128` (`f32x4`)**.

Incluye laboratorio interactivo en **SolidJS**, módulo de demostración **Simulador de Pago Exitoso**, suite de verificación determinista, comparativa de rendimiento contra JavaScript AoS y documentación integrada.

---

## Características clave

- **Zero-Alloc estricto (`0 B` de crecimiento post-init):** Toda la memoria se reserva en tiempo de compilación dentro del segmento estático `memory.data` (`assembly/arena.ts`), sellado con `initialMemory = maximumMemory = 15`.
- **Huella ultra compacta (`49 B/partícula`):** 12 carriles `f32` alineados a 16 bytes + 1 carril `u8` empaquetado (`color` + `shape`), permitiendo hasta **19,200 partículas simultáneas** por debajo de 1 MB.
- **Física SIMD `f32x4` sin divisiones:** Bucle `step(dt)` en dos pasadas con aproximación trigonométrica `fastSin4` y compactación `O(1)` por `swapRemove`.
- **Binario minúsculo:** `public/confetti.wasm` pesa **4.8 KiB** compilado con `--runtime stub --enable simd --optimizeLevel 3 --converge --noAssert`.
- **Renderizado Canvas 2D de doble cara:** Tabla precalculada frontal/trasera (`src/engine/spriteAtlas.ts`) sin asignaciones por frame.

---

## Inicio Rápido

### 1. Instalar dependencias y compilar WASM

```bash
npm install
npm run build:wasm
npm run dev
```

### 2. Usar `ConfettiEngine` en tu aplicación

```ts
import { ConfettiEngine } from './src/engine/confettiWasm';
import { renderSoAParticles } from './src/engine/spriteAtlas';

const canvas = document.querySelector<HTMLCanvasElement>('#confetti')!;
const ctx = canvas.getContext('2d')!;
const dpr = Math.min(window.devicePixelRatio || 1, 2);

const engine = await ConfettiEngine.fromUrl();
engine.init(19200, canvas.clientWidth, canvas.clientHeight);
engine.setPhysics(980, 1.65, 0, 180);

// Cañones dobles desde las esquinas inferiores
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
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

---

## Referencia de API (`ConfettiEngine`)

| Método | Descripción |
| :--- | :--- |
| `ConfettiEngine.fromUrl(url?)` | Descarga e instancia `confetti.wasm` respetando `import.meta.env.BASE_URL`. |
| `ConfettiEngine.fromBytes(bytes)` | Instancia el motor a partir de un `BufferSource` ya cargado en memoria. |
| `engine.init(capacity, width, height)` | Inicializa capacidad (`64..19200`), dimensiones del canvas y vistas `TypedArray` zero-copy. |
| `engine.setPhysics(gravity, drag, wind, turbulence)` | Ajusta parámetros físicos en tiempo real. |
| `engine.spawnBurst(x, y, count, speed, spreadRad, angleRad, sizeMin, sizeMax, lifeMin, lifeMax)` | Emite una ráfaga radial usando PRNG `xorshift32` y trigonometría rápida en WASM. |
| `engine.spawnDualCannons(width, height, countPerSide, speed, spreadRad)` | Dispara simultáneamente cañones izquierdo y derecho en una sola llamada WASM. |
| `engine.step(dt)` | Avanza la física SIMD `f32x4` y compacta partículas expiradas con `swapRemove`. |
| `engine.resize(width, height)` | Actualiza la cota de descarte vertical al redimensionar el canvas. |
| `engine.clear()` / `engine.secureWipe()` | Limpia el contador activo o sobrescribe con ceros toda la arena estática. |

---

## Arquitectura de Memoria (`assembly/arena.ts`)

```text
TOTAL_ARENA_SIZE = 963,328 B  (< 1 MB, dentro de 15 páginas WASM = 983,040 B)
├── PARAM_IN       [0 .. 2048)         I/O entrada (2 KiB)
├── PARAM_OUT      [2048 .. 4096)      I/O salida  (2 KiB)
├── SCRATCH_WORK   [4096 .. 20480)     Arena bump RAII save/restore (16 KiB)
├── EMITTER_WORK   [20480 .. 22528)    Layout fijo emisores (2 KiB)
└── PARTICLES_WORK [22528 .. 963328)   13 carriles SoA (19,200 part. × 49 B, alineado 16B)
```

---

## Scripts disponibles

- `npm run dev`: Inicia el servidor de desarrollo Vite + SolidJS en el puerto `3000`.
- `npm run build:wasm`: Compila `assembly/confetti.ts` a `public/confetti.wasm` y `public/confetti.wat`.
- `npm run build:lib`: Compila el paquete publicable de npm en `dist-lib/` (`index.js`, `*.d.ts` y `confetti.wasm`).
- `npm test`: Ejecuta la suite de pruebas unitarias sobre el binario WASM (`tests/confetti.test.ts`).
- `npm run lint`: Verifica tipos TypeScript (`tsc --noEmit`).
- `npm run build`: Compila el binario WASM y genera el bundle de producción en `dist/`.

---

## Publicación en GitHub Pages con GitHub Actions

El repositorio incluye `.github/workflows/deploy-pages.yml`, que en cada `push` a `main`:

1. Instala dependencias (`npm ci`), compila `confetti.wasm` y ejecuta `npm test`.
2. Configura `VITE_BASE_PATH` según el repositorio (`/<repo>/` o `/`).
3. Construye `dist/` y despliega con `actions/deploy-pages@v4`.

En GitHub activa **Settings → Pages → Build and deployment → Source: GitHub Actions**.

---

## Publicación en npm con GitHub Actions

El repositorio incluye `.github/workflows/publish-npm.yml` para publicar `confetti-wasm` automáticamente con **npm Provenance** cada vez que subes un tag `v*` (por ejemplo `v1.0.0`) o lanzas el workflow manualmente desde la pestaña **Actions**.

### Opción recomendada: Token Granular en GitHub Secrets (`NPM_TOKEN`)

1. Inicia sesión en [npmjs.com](https://www.npmjs.com) y abre **Access Tokens → Generate New Token → Granular Access Token**.
2. Asigna permisos **Read and write** sobre paquetes (con *Bypass two-factor authentication* activado para CI).
3. En tu repositorio de GitHub ve a **Settings → Secrets and variables → Actions → New repository secret**, crea el secreto `NPM_TOKEN` con ese token.
4. Sube un tag para disparar la publicación automática:

```bash
git tag v1.0.0
git push origin v1.0.0
```

> Si prefieres publicar desde tu terminal local sin CI, ejecuta `npm login`, luego `npm run build:lib` y finalmente `npm publish --access public`.

