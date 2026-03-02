export const STORAGE_KEY = 'colorwalk.daily.v2';
export const COVERAGE_THRESHOLD = 0.28;
export const DOMINANT_DISTANCE_THRESHOLD = 30;

export const QUICK_COLORS = [
  { hex: '#ff6f3c', name: '橙色' },
  { hex: '#f24867', name: '洋红' },
  { hex: '#f4b400', name: '金黄' },
  { hex: '#00b07a', name: '祖母绿' },
  { hex: '#35b8ff', name: '湖蓝' },
  { hex: '#6d6eff', name: '电紫' },
  { hex: '#f2f3f8', name: '银白' },
  { hex: '#121216', name: '炭黑' },
];

export function loadState() {
  const today = todayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState(today);
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.date !== today) return freshState(today);

    const photos = Array.isArray(parsed.photos)
      ? parsed.photos
          .map((photo) => ({
            id: typeof photo?.id === 'string' ? photo.id : makeId(),
            dataUrl: typeof photo?.dataUrl === 'string' ? photo.dataUrl : '',
            coverage: Number.isFinite(photo?.coverage) ? photo.coverage : 0,
            at: typeof photo?.at === 'string' ? photo.at : new Date().toISOString(),
          }))
          .filter((photo) => photo.dataUrl)
      : [];

    const defaultHex = typeof parsed.colorHex === 'string' ? parsed.colorHex : '#ff6f3c';
    return {
      date: parsed.date,
      colorHex: defaultHex,
      colorHue: Number.isFinite(parsed.colorHue) ? parsed.colorHue : hexToHue(defaultHex),
      locked: Boolean(parsed.locked),
      photos,
    };
  } catch {
    return freshState(today);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function freshState(date) {
  return {
    date,
    colorHex: '#ff6f3c',
    colorHue: hexToHue('#ff6f3c'),
    locked: false,
    photos: [],
  };
}

export function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(dateKey) {
  const [y, m, d] = String(dateKey || '').split('-');
  if (!y || !m || !d) return todayKey().replaceAll('-', '.');
  return `${y}.${m}.${d}`;
}

export function formatHM(dateInput) {
  const d = new Date(dateInput);
  if (Number.isNaN(d.valueOf())) return '--:--';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load error'));
    };
    img.src = url;
  });
}

export function imageToCompressedDataUrl(img, maxSide = 1080, quality = 0.88) {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  return Promise.resolve(canvas.toDataURL('image/jpeg', quality));
}

export async function createCollageExportDataUrl(photos, options = {}) {
  const exportItems = Array.isArray(photos) ? photos.slice(0, 12) : [];
  if (!exportItems.length) throw new Error('no photos to export');

  const count = exportItems.length;
  const cols = count <= 2 ? count : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);

  const scale = Number.isFinite(options.scale) ? Math.min(4, Math.max(1, options.scale)) : 2;
  const dateLabel = formatDateLabel(options.date || todayKey());
  const themeName = options.themeName || '未命名色';
  const themeHex = options.themeHex || '#ff6f3c';

  const padding = 54;
  const gap = 18;
  const cellW = 250;
  const cellH = 200;
  const headerH = 154;
  const footerH = 124;
  const width = padding * 2 + cols * cellW + (cols - 1) * gap;
  const gridH = rows * cellH + (rows - 1) * gap;
  const height = padding * 2 + headerH + gap + gridH + footerH;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#050a19');
  bg.addColorStop(0.45, '#0b1330');
  bg.addColorStop(1, '#070b18');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width * 0.78, height * 0.2, 0, width * 0.78, height * 0.2, 280);
  glow.addColorStop(0, hexToRgba(themeHex, 0.5));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  drawRoundedRect(ctx, padding, padding, width - padding * 2, headerH, 24, 'rgba(255,255,255,0.08)');
  strokeRoundedRect(ctx, padding, padding, width - padding * 2, headerH, 24, 'rgba(255,255,255,0.2)', 1.25);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = "600 14px 'IBM Plex Mono', monospace";
  ctx.fillText('COLORWALK DAILY BOARD', padding + 24, padding + 32);
  ctx.fillStyle = '#fff';
  ctx.font = "700 38px 'Noto Serif SC', serif";
  ctx.fillText(dateLabel, padding + 24, padding + 82);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = "600 24px 'Noto Sans SC', sans-serif";
  ctx.fillText(`今日colorwalk主题：${themeName}`, padding + 24, padding + 124);
  drawRoundedRect(ctx, width - padding - 64, padding + 104, 32, 32, 8, themeHex);

  const loaded = await Promise.all(exportItems.map((item) => safeLoadImage(item.dataUrl)));
  const gridY = padding + headerH + gap;
  for (let i = 0; i < count; i += 1) {
    const x = padding + (i % cols) * (cellW + gap);
    const y = gridY + Math.floor(i / cols) * (cellH + gap);
    drawRoundedRect(ctx, x, y, cellW, cellH, 18, 'rgba(10,15,32,0.9)');
    strokeRoundedRect(ctx, x, y, cellW, cellH, 18, 'rgba(255,255,255,0.12)', 1);
    if (loaded[i]) drawImageCoverRounded(ctx, loaded[i], x + 6, y + 6, cellW - 12, cellH - 12, 14);
  }

  const footerY = height - footerH;
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(padding, footerY, width - padding * 2, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = "600 24px 'Noto Sans SC', sans-serif";
  ctx.fillText('colorwalk.netlify.app', padding, footerY + 44);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = "500 18px 'Noto Sans SC', sans-serif";
  ctx.fillText(`主题：${themeName}  ·  日期：${dateLabel}`, padding, footerY + 78);

  return canvas.toDataURL('image/png');
}

export function analyzeImageByHue(img, targetHue) {
  const size = 160;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const pixels = ctx.getImageData(0, 0, size, size).data;
  let valid = 0;
  let targetMatch = 0;
  const bins = new Array(12).fill(0);
  for (let i = 0; i < pixels.length; i += 4) {
    const [h, s, l] = rgbToHsl(pixels[i] / 255, pixels[i + 1] / 255, pixels[i + 2] / 255);
    if (s < 0.2 || l < 0.06 || l > 0.94) continue;
    valid += 1;
    if (hueDistance(h, targetHue) <= 25) targetMatch += 1;
    bins[Math.floor(h / 30) % 12] += 1;
  }
  if (!valid) return { coverage: 0, dominantDistance: 180 };
  let dominantBin = 0;
  for (let i = 1; i < bins.length; i += 1) if (bins[i] > bins[dominantBin]) dominantBin = i;
  return {
    coverage: targetMatch / valid,
    dominantDistance: hueDistance(dominantBin * 30 + 15, targetHue),
  };
}

export function applyTargetTheme(hex) {
  const [h, s, l] = hexToHsl(hex);
  const sat = Math.max(44, Math.round(s * 100));
  const light = Math.round(l * 100);
  document.documentElement.style.setProperty('--target', `hsl(${Math.round(h)} ${sat}% ${light}%)`);
  document.documentElement.style.setProperty(
    '--target-soft',
    `hsl(${Math.round(h)} ${Math.max(34, sat - 30)}% ${Math.min(84, light + 20)}% / 0.22)`,
  );
  document.documentElement.style.setProperty('--target-deep', `hsl(${Math.round(h)} ${Math.min(92, sat + 12)}% ${Math.max(28, light - 22)}%)`);
}

export function hexToHue(hex) {
  return hexToHsl(hex)[0];
}

export function getColorName(hex) {
  const [h, s, l] = hexToHsl(hex);
  if (l >= 0.94) return '白色';
  if (l <= 0.12) return '黑色';
  if (s <= 0.12) return '灰色';
  if (h >= 20 && h < 45 && s < 0.62 && l < 0.5) return '棕色';
  if (h < 15 || h >= 345) return '红色';
  if (h < 45) return '橙色';
  if (h < 70) return '黄色';
  if (h < 165) return '绿色';
  if (h < 200) return '青色';
  if (h < 255) return '蓝色';
  if (h < 300) return '紫色';
  return '粉色';
}

function hexToHsl(hex) {
  const normalized = String(hex || '#ff6f3c').replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return rgbToHsl(r, g, b);
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;
  let h = 0;
  let s = 0;
  if (delta > 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hueDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeLoadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRect(ctx, x, y, w, h, r, fill) {
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRoundedRect(ctx, x, y, w, h, r, stroke, lineWidth = 1) {
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.floor(Math.min(w, h) / 2)));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawImageCoverRounded(ctx, img, x, y, w, h, r) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function hexToRgba(hex, alpha) {
  const normalized = String(hex || '#000000').replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((s) => s + s).join('') : normalized;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
