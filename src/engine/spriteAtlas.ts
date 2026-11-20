import { CONFETTI_PALETTE, type ConfettiEngine } from './confettiWasm';

const TAU = Math.PI * 2;
const SQRT1_2 = Math.SQRT1_2;
const FADE_WINDOW_S = 0.45;
const INV_FADE_WINDOW = 1 / FADE_WINDOW_S;

// Precomputed 2-sided 3D shading LUT:
// - Front faces (cos(tilt) >= 0): vibrant base palette + specular highlight tint
// - Back faces  (cos(tilt) <  0): 42% darkened shade for realistic 3D flip depth
const BACK_PALETTE: readonly string[] = CONFETTI_PALETTE.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 0xff) * 0.54);
  const g = Math.round(((n >> 8) & 0xff) * 0.54);
  const b = Math.round((n & 0xff) * 0.54);
  return `rgb(${r},${g},${b})`;
});

const HIGHLIGHT_PALETTE: readonly string[] = CONFETTI_PALETTE.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 0xff) * 0.78 + 56));
  const g = Math.min(255, Math.round(((n >> 8) & 0xff) * 0.78 + 56));
  const b = Math.min(255, Math.round((n & 0xff) * 0.78 + 56));
  return `rgb(${r},${g},${b})`;
});

/**
 * Draws all active particles from WASM zero-copy SoA TypedArray views using:
 * - Precomputed 2-sided front/back color LUT (no per-frame hex/CSS string allocation)
 * - Fast alpha quantization (only mutates ctx.globalAlpha on 5% bucket changes)
 * - Zero-path geometry for Rectangles, Ribbons, and 45°-rotated Diamonds (fillRect only)
 */
export function renderSoAParticles(
  ctx: CanvasRenderingContext2D,
  engine: ConfettiEngine,
  dpr: number
): void {
  const count = engine.activeCount;
  if (count <= 0) return;

  const { x, y, rot, tilt, size, remLife, meta } = engine.views;
  const paletteLen = CONFETTI_PALETTE.length;
  let lastAlphaQuant = -1;
  let lastFill = '';

  for (let i = 0; i < count; i++) {
    const rem = remLife[i];
    if (rem <= 0.005) continue;

    const aq = rem >= FADE_WINDOW_S ? 20 : (rem * INV_FADE_WINDOW * 20) | 0;
    if (aq <= 0) continue;
    if (aq !== lastAlphaQuant) {
      ctx.globalAlpha = aq * 0.05;
      lastAlphaQuant = aq;
    }

    const m = meta[i];
    const cIdx = (m & 0x0f) % paletteLen;
    const shape = (m >> 4) & 0x03;

    const rawScaleY = Math.cos(tilt[i]);
    const isBackFace = rawScaleY < 0;
    const scaleY = isBackFace ? -rawScaleY : rawScaleY;
    const clampedScaleY = scaleY < 0.09 ? 0.09 : scaleY;

    const fill = isBackFace ? BACK_PALETTE[cIdx] : CONFETTI_PALETTE[cIdx];
    if (fill !== lastFill) {
      ctx.fillStyle = fill;
      lastFill = fill;
    }

    const r = rot[i];
    const cosR = Math.cos(r);
    const sinR = Math.sin(r);

    const px = dpr * x[i];
    const py = dpr * y[i];
    const s = size[i];

    if (shape === 0) {
      // Classic 2-sided rectangle
      ctx.setTransform(
        dpr * cosR,
        dpr * sinR,
        -dpr * sinR * clampedScaleY,
        dpr * cosR * clampedScaleY,
        px,
        py
      );
      const w = s * 1.15;
      const h = s * 0.64;
      ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
      if (!isBackFace && clampedScaleY > 0.35) {
        ctx.fillStyle = HIGHLIGHT_PALETTE[cIdx];
        ctx.fillRect(-w * 0.5, -h * 0.5, w, h * 0.28);
        lastFill = HIGHLIGHT_PALETTE[cIdx];
      }
    } else if (shape === 1) {
      // Slender twisting ribbon
      ctx.setTransform(
        dpr * cosR,
        dpr * sinR,
        -dpr * sinR * clampedScaleY,
        dpr * cosR * clampedScaleY,
        px,
        py
      );
      const w = s * 1.65;
      const h = s * 0.36;
      ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
    } else if (shape === 2) {
      // Diamond shard rendered as 45°-rotated square (zero Path2D allocation)
      const cosD = (cosR - sinR) * SQRT1_2;
      const sinD = (sinR + cosR) * SQRT1_2;
      ctx.setTransform(
        dpr * cosD,
        dpr * sinD,
        -dpr * sinD * clampedScaleY,
        dpr * cosD * clampedScaleY,
        px,
        py
      );
      const d = s * 0.78;
      ctx.fillRect(-d * 0.5, -d * 0.5, d, d);
    } else {
      // Circular disc
      ctx.setTransform(
        dpr * cosR,
        dpr * sinR,
        -dpr * sinR * clampedScaleY,
        dpr * cosR * clampedScaleY,
        px,
        py
      );
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.44, 0, TAU);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
