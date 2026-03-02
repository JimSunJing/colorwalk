'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  COVERAGE_THRESHOLD,
  DOMINANT_DISTANCE_THRESHOLD,
  QUICK_COLORS,
  analyzeImageByHue,
  applyTargetTheme,
  createCollageExportDataUrl,
  fileToImage,
  formatDateLabel,
  formatHM,
  freshState,
  getColorName,
  hexToHue,
  imageToCompressedDataUrl,
  loadState,
  saveState,
  todayKey,
} from './utils';

const EXPORT_SCALE = 2;
const INSTALL_TIPS = [
  '建议把 Color Walk 添加到手机主屏，体验更像原生 App：',
  'iPhone Safari：分享按钮 -> 添加到主屏幕',
  'Android Chrome：菜单 -> 添加到主屏幕',
].join('\n');

export default function WalkPage() {
  const [state, setState] = useState(() => freshState('1970-01-01'));
  const [hydrated, setHydrated] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState({ text: '', type: 'idle' });
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);

  const colorName = useMemo(() => getColorName(state.colorHex), [state.colorHex]);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const today = todayKey();
    if (state.date !== today) setState(freshState(today));
  }, [hydrated, state.date]);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [hydrated, state]);

  useEffect(() => {
    applyTargetTheme(state.colorHex);
  }, [state.colorHex]);

  if (!hydrated) return <div className="min-h-screen bg-[#040913]" />;

  const openPicker = () => {
    if (!state.locked) return;
    fileInputRef.current?.click();
  };

  const lockTodayColor = () => {
    if (state.locked) return;
    setState((prev) => ({ ...prev, locked: true, colorHue: hexToHue(prev.colorHex) }));
    setAnalysisMessage({ text: '颜色已锁定，开始你的色彩狩猎。', type: 'ok' });
  };

  const resetToday = () => {
    const ok = window.confirm('将清空今天已锁定颜色与街拍墙，确定继续吗？');
    if (!ok) return;
    setState(freshState(todayKey()));
    setAnalysisMessage({ text: '今天的数据已重置。', type: 'idle' });
    window.alert(INSTALL_TIPS);
  };

  const exportTodayImage = async () => {
    if (isExporting || state.photos.length === 0) return;
    setIsExporting(true);
    try {
      const dataUrl = await createCollageExportDataUrl(state.photos, {
        scale: EXPORT_SCALE,
        date: state.date,
        themeName: colorName,
        themeHex: state.colorHex,
      });
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `colorwalk-collage-${state.date}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setAnalysisMessage({ text: '拼贴图片已导出。', type: 'ok' });
    } catch (error) {
      console.error(error);
      setAnalysisMessage({ text: '导出失败，请重试。', type: 'fail' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !state.locked) return;

    setAnalysisMessage({ text: '正在进行色相分析...', type: 'idle' });

    try {
      const image = await fileToImage(file);
      const analysis = analyzeImageByHue(image, state.colorHue);
      const pass = analysis.coverage >= COVERAGE_THRESHOLD && analysis.dominantDistance <= DOMINANT_DISTANCE_THRESHOLD;

      if (!pass) {
        setAnalysisMessage({
          text: `未通过：目标色占比 ${Math.round(analysis.coverage * 100)}%（需 >= ${Math.round(COVERAGE_THRESHOLD * 100)}%）`,
          type: 'fail',
        });
        return;
      }

      const dataUrl = await imageToCompressedDataUrl(image, 1080, 0.88);
      setState((prev) => ({
        ...prev,
        photos: [
          {
            id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            dataUrl,
            coverage: analysis.coverage,
            at: new Date().toISOString(),
          },
          ...prev.photos,
        ].slice(0, 36),
      }));
      setAnalysisMessage({ text: `通过：目标色占比 ${Math.round(analysis.coverage * 100)}%`, type: 'ok' });
    } catch (error) {
      console.error(error);
      setAnalysisMessage({ text: '图片处理失败，请重试。', type: 'fail' });
    }
  };

  return (
    <div className="min-h-screen text-[var(--ink)]">
      <div className="aurora-layer" />
      <div className="noise-overlay" />

      <main className="relative z-10 mx-auto w-full max-w-[1320px] px-4 pb-40 pt-6 sm:px-6 lg:px-8">
        <header className="landing-topbar">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="ColorWalk 标志" className="h-9 w-9" />
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-white/75">COLOR WALK</p>
              <p className="text-xs text-white/60">Daily Mission Console</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="landing-nav-btn">首页</Link>
            <Link href="/author" className="landing-nav-btn">作者</Link>
          </div>
        </header>

        <section className="mt-4 grid gap-4 xl:grid-cols-[360px_1fr]">
          <aside className="chrome-panel h-fit rounded-3xl p-5 xl:sticky xl:top-6">
            <p className="font-mono text-[11px] tracking-[0.2em] text-white/65">CONTROL PANEL</p>
            <h1 className="mt-3 font-display text-4xl font-black leading-[1.04] text-white">今天，只追一种颜色</h1>
            <p className="mt-3 text-sm text-white/72">锁定主题色后，上传照片并自动筛选。只有通过检测的作品会进入今日墙。</p>

            <div className="mt-5 grid gap-2">
              <div className="metric-pill rounded-xl px-3 py-2">
                <p className="text-[11px] text-white/60">今日日期</p>
                <p className="text-sm font-semibold text-white">{formatDateLabel(state.date)}</p>
              </div>
              <div className="metric-pill rounded-xl px-3 py-2">
                <p className="text-[11px] text-white/60">当前主题</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="pulse-dot inline-block h-3.5 w-3.5 rounded-full border border-white/40" style={{ background: state.colorHex }} />
                  <p className="text-sm font-semibold text-white">{colorName}</p>
                </div>
              </div>
            </div>

            <h2 className="mt-6 font-mono text-xs tracking-[0.18em] text-white/70">步骤 01 / 选择颜色</h2>
            <input
              className="color-input mt-3"
              type="color"
              value={state.colorHex}
              onInput={(e) => !state.locked && setState((prev) => ({ ...prev, colorHex: e.target.value, colorHue: hexToHue(e.target.value) }))}
              disabled={state.locked}
              aria-label="选择今日主题色"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_COLORS.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  className={`color-swatch ${state.colorHex.toLowerCase() === swatch.hex.toLowerCase() ? 'active' : ''}`}
                  style={{ background: swatch.hex }}
                  title={swatch.name}
                  aria-label={swatch.name}
                  disabled={state.locked}
                  onClick={() => setState((prev) => ({ ...prev, colorHex: swatch.hex, colorHue: hexToHue(swatch.hex) }))}
                />
              ))}
            </div>
            <button
              className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-45"
              type="button"
              onClick={lockTodayColor}
              disabled={state.locked}
            >
              {state.locked ? `已锁定：${colorName}` : '锁定今天颜色'}
            </button>
          </aside>

          <section className="grid gap-4">
            <article className="chrome-panel rounded-3xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-mono text-xs tracking-[0.18em] text-white/70">步骤 02 / 上传检测</h2>
                <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-semibold text-white/70">阈值 {Math.round(COVERAGE_THRESHOLD * 100)}%</span>
              </div>
              <div className="upload-drop mt-3 rounded-2xl p-4 sm:p-5">
                <p className="text-sm leading-relaxed text-white/72">上传后自动进行色相匹配，只有通过检测的照片会加入画廊。</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-white/90 disabled:opacity-50"
                    type="button"
                    onClick={openPicker}
                    disabled={!state.locked}
                  >
                    拍一张 / 选一张
                  </button>
                  <p className={`text-sm font-semibold ${analysisMessage.type === 'ok' ? 'text-emerald-300' : analysisMessage.type === 'fail' ? 'text-rose-300' : 'text-white/65'}`}>
                    {analysisMessage.text || '等待上传'}
                  </p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" hidden accept="image/*" capture="environment" onChange={handleFileChange} />
            </article>

            <article className="chrome-panel rounded-3xl p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-mono text-xs tracking-[0.18em] text-white/70">步骤 03 / 今日街拍墙</h2>
                <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-semibold text-white/70">{state.photos.length} 张</span>
              </div>

              {state.photos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/28 bg-white/[0.04] p-12 text-center text-sm text-white/65">还没有通过检测的照片。去街头抓取你的第一张色彩样本。</div>
              ) : (
                <div className="masonry-wall mt-4">
                  {state.photos.map((photo) => (
                    <article key={photo.id} className="masonry-item photo-tile overflow-hidden rounded-2xl">
                      <img className="block h-auto w-full" loading="lazy" src={photo.dataUrl} alt="Color Walk 街拍照片" />
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs text-white/70 backdrop-blur-sm">
                        <span>{Math.round(photo.coverage * 100)}% · {formatHM(photo.at)}</span>
                        <button
                          className="rounded-full border border-white/24 px-2 py-1 text-[10px] font-semibold text-white/80 transition hover:bg-white/10"
                          type="button"
                          onClick={() => setState((prev) => ({ ...prev, photos: prev.photos.filter((item) => item.id !== photo.id) }))}
                        >
                          移除
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>
        </section>

        <div className="floating-actions">
          <div className="floating-actions-inner">
            <button
              className="floating-btn floating-btn--primary"
              type="button"
              onClick={exportTodayImage}
              disabled={isExporting || state.photos.length === 0}
            >
              {isExporting ? '导出中...' : '导出今日拼贴'}
            </button>
            <button
              className="floating-btn floating-btn--ghost"
              type="button"
              onClick={resetToday}
            >
              重置今天颜色与街拍
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
