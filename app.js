const STORAGE_KEY = "colorwalk.daily.v1";
const QUICK_COLORS = [
  "#ff6f3c",
  "#00a66f",
  "#1e88e5",
  "#f4b400",
  "#f06292",
  "#7b61ff",
  "#5d4037",
  "#111111",
];

const el = {
  todayText: document.querySelector("#todayText"),
  colorInput: document.querySelector("#colorInput"),
  targetColorDot: document.querySelector("#targetColorDot"),
  targetColorHex: document.querySelector("#targetColorHex"),
  quickColors: document.querySelector("#quickColors"),
  lockColorBtn: document.querySelector("#lockColorBtn"),
  lockHint: document.querySelector("#lockHint"),
  captureBtn: document.querySelector("#captureBtn"),
  photoInput: document.querySelector("#photoInput"),
  analysisResult: document.querySelector("#analysisResult"),
  photoCount: document.querySelector("#photoCount"),
  gallery: document.querySelector("#gallery"),
  resetBtn: document.querySelector("#resetBtn"),
};

let state = loadState();
render();
bindEvents();

function bindEvents() {
  el.colorInput.addEventListener("input", () => {
    previewColor(el.colorInput.value);
  });

  el.lockColorBtn.addEventListener("click", () => {
    if (state.locked) return;
    const hex = el.colorInput.value;
    state.colorHex = hex;
    state.colorHue = hexToHue(hex);
    state.locked = true;
    saveState();
    render();
  });

  el.captureBtn.addEventListener("click", () => {
    el.photoInput.click();
  });

  el.photoInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !state.locked) return;

    setResult("分析中...", "");
    try {
      const image = await fileToImage(file);
      const analysis = analyzeImageByHue(image, state.colorHue);
      const pass = analysis.coverage >= 0.28 && analysis.dominantDistance <= 30;

      if (!pass) {
        setResult(`未通过：目标色占比 ${Math.round(analysis.coverage * 100)}%（至少 28%）`, "fail");
        return;
      }

      const dataUrl = await imageToCompressedDataUrl(image, 900, 0.86);
      state.photos.unshift({
        id: makeId(),
        dataUrl,
        coverage: analysis.coverage,
        at: new Date().toISOString(),
      });
      state.photos = state.photos.slice(0, 30);
      saveState();
      render();
      setResult(`通过：目标色占比 ${Math.round(analysis.coverage * 100)}%`, "ok");
    } catch (error) {
      setResult("图片处理失败，请重试", "fail");
      console.error(error);
    }
  });

  el.resetBtn.addEventListener("click", () => {
    state = freshState(todayKey());
    saveState();
    render();
    setResult("已重置今天记录。", "");
  });
}

function render() {
  const today = todayKey();
  el.todayText.textContent = today;
  previewColor(state.colorHex);

  if (!state.locked) {
    el.lockHint.textContent = "锁定后，当天不可再改。";
    el.captureBtn.disabled = true;
    el.colorInput.disabled = false;
    el.lockColorBtn.disabled = false;
  } else {
    el.lockHint.textContent = "今天颜色已锁定，开始你的色彩狩猎。";
    el.captureBtn.disabled = false;
    el.colorInput.disabled = true;
    el.lockColorBtn.disabled = true;
  }

  renderQuickColors();
  renderGallery();
}

function renderQuickColors() {
  el.quickColors.innerHTML = "";
  for (const color of QUICK_COLORS) {
    const btn = document.createElement("button");
    btn.className = "swatch";
    btn.type = "button";
    btn.style.background = color;
    btn.title = color;
    btn.disabled = state.locked;
    btn.addEventListener("click", () => {
      if (state.locked) return;
      el.colorInput.value = color;
      previewColor(color);
    });
    el.quickColors.appendChild(btn);
  }
}

function renderGallery() {
  const photos = state.photos;
  el.photoCount.textContent = `${photos.length} 张`;
  el.gallery.innerHTML = "";

  if (!photos.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "还没有通过检测的照片。";
    el.gallery.appendChild(empty);
    return;
  }

  for (const photo of photos) {
    const card = document.createElement("article");
    card.className = "photo-card";
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = photo.dataUrl;
    img.alt = "Color Walk street shot";
    const meta = document.createElement("div");
    meta.className = "photo-meta";
    const left = document.createElement("span");
    left.textContent = `${Math.round(photo.coverage * 100)}%`;
    const right = document.createElement("span");
    right.textContent = formatHM(photo.at);
    meta.append(left, right);
    card.append(img, meta);
    el.gallery.appendChild(card);
  }
}

function setResult(text, cls) {
  el.analysisResult.textContent = text;
  el.analysisResult.className = `analysis-result ${cls}`.trim();
}

function previewColor(hex) {
  el.targetColorDot.style.background = hex;
  el.targetColorHex.textContent = hex;
}

function loadState() {
  const today = todayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState(today);
    const parsed = JSON.parse(raw);
    if (parsed.date !== today) return freshState(today);
    return {
      date: parsed.date,
      colorHex: parsed.colorHex || "#ff6f3c",
      colorHue: Number.isFinite(parsed.colorHue) ? parsed.colorHue : hexToHue(parsed.colorHex || "#ff6f3c"),
      locked: !!parsed.locked,
      photos: Array.isArray(parsed.photos) ? parsed.photos : [],
    };
  } catch {
    return freshState(today);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function freshState(date) {
  return {
    date,
    colorHex: "#ff6f3c",
    colorHue: hexToHue("#ff6f3c"),
    locked: false,
    photos: [],
  };
}

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatHM(dateInput) {
  const d = new Date(dateInput);
  if (Number.isNaN(d.valueOf())) return "--:--";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load error"));
    };
    img.src = url;
  });
}

function imageToCompressedDataUrl(img, maxSide = 900, quality = 0.86) {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return Promise.resolve(canvas.toDataURL("image/jpeg", quality));
}

function analyzeImageByHue(img, targetHue) {
  const size = 140;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const pixels = ctx.getImageData(0, 0, size, size).data;

  let valid = 0;
  let targetMatch = 0;
  const bins = new Array(12).fill(0);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] / 255;
    const g = pixels[i + 1] / 255;
    const b = pixels[i + 2] / 255;
    const [h, s, l] = rgbToHsl(r, g, b);
    if (s < 0.2 || l < 0.06 || l > 0.94) continue;

    valid += 1;
    const dist = hueDistance(h, targetHue);
    if (dist <= 25) targetMatch += 1;
    bins[Math.floor(h / 30) % 12] += 1;
  }

  if (!valid) return { coverage: 0, dominantDistance: 180 };

  let dominantBin = 0;
  for (let i = 1; i < bins.length; i += 1) {
    if (bins[i] > bins[dominantBin]) dominantBin = i;
  }
  const dominantHue = dominantBin * 30 + 15;
  return {
    coverage: targetMatch / valid,
    dominantDistance: hueDistance(dominantHue, targetHue),
  };
}

function hueDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function hexToHue(hex) {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const [h] = rgbToHsl(r, g, b);
  return h;
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
    switch (max) {
      case r:
        h = ((g - b) / delta) % 6;
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return [h, s, l];
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
