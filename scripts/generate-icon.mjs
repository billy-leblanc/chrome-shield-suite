/**
 * Generates icon.png (128x128) for the Safety Intercept extension.
 * Run: node scripts/generate-icon.mjs
 * Requires: npm install -D sharp (one-time)
 */
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 128; // scale factor

  // Background: rounded square with dark navy gradient
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, '#1a3a60');
  bgGrad.addColorStop(1, '#0f2040');

  const r = 28 * s;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Subtle glow overlay
  const glowGrad = ctx.createRadialGradient(size / 2, size * 0.35, 0, size / 2, size * 0.35, size * 0.6);
  glowGrad.addColorStop(0, 'rgba(56,189,248,0.12)');
  glowGrad.addColorStop(1, 'rgba(56,189,248,0)');
  ctx.fillStyle = glowGrad;
  ctx.fill();

  // Shield shape
  ctx.save();
  const cx = size / 2;
  const top = 18 * s;
  const bottom = 108 * s;
  const hw = 44 * s; // half-width at shoulders

  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.lineTo(cx + hw, top + 18 * s);
  ctx.quadraticCurveTo(cx + hw + 4 * s, top + 30 * s, cx + hw + 2 * s, top + 52 * s);
  ctx.quadraticCurveTo(cx + hw - 4 * s, top + 70 * s, cx, bottom);
  ctx.quadraticCurveTo(cx - hw + 4 * s, top + 70 * s, cx - hw - 2 * s, top + 52 * s);
  ctx.quadraticCurveTo(cx - hw - 4 * s, top + 30 * s, cx - hw, top + 18 * s);
  ctx.closePath();

  // Shield fill
  const shieldGrad = ctx.createLinearGradient(cx - hw, top, cx + hw, bottom);
  shieldGrad.addColorStop(0, 'rgba(56,189,248,0.18)');
  shieldGrad.addColorStop(1, 'rgba(56,189,248,0.04)');
  ctx.fillStyle = shieldGrad;
  ctx.fill();

  // Shield stroke
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 3 * s;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();

  // Checkmark inside shield
  ctx.save();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 5 * s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(56,189,248,0.6)';
  ctx.shadowBlur = 8 * s;
  ctx.beginPath();
  ctx.moveTo(cx - 18 * s, cy(size));
  ctx.lineTo(cx - 4 * s, cy(size) + 16 * s);
  ctx.lineTo(cx + 20 * s, cy(size) - 14 * s);
  ctx.stroke();
  ctx.restore();

  return canvas.toBuffer('image/png');
}

function cy(size) { return size * 0.56; }

try {
  const buf128 = generateIcon(128);
  const buf48  = generateIcon(48);
  const buf32  = generateIcon(32);
  const buf16  = generateIcon(16);

  writeFileSync(join(__dirname, '../public/icon.png'), buf128);
  writeFileSync(join(__dirname, '../public/icon48.png'), buf48);
  writeFileSync(join(__dirname, '../public/icon32.png'), buf32);
  writeFileSync(join(__dirname, '../public/icon16.png'), buf16);

  console.log('✓ Icons generated: icon.png, icon48.png, icon32.png, icon16.png');
} catch (e) {
  console.error('Failed:', e.message);
  console.log('\nRun: npm install -D canvas\nThen: node scripts/generate-icon.mjs');
}
