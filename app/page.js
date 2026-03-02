import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing-shell min-h-screen text-white">
      <div className="landing-mesh" />
      <div className="landing-noise" />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-12">
        <header className="landing-topbar">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="ColorWalk 标志" className="h-10 w-10" />
            <div>
              <p className="font-mono text-[11px] tracking-[0.24em] text-white/80">COLOR WALK</p>
              <p className="text-xs text-white/60">城市色彩漫游计划</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/author" className="landing-nav-btn">作者</Link>
            <Link href="/walk" className="landing-nav-btn landing-nav-btn--solid">进入应用</Link>
          </nav>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="landing-hero">
            <p className="landing-chip">DAILY COLOR CURATION</p>
            <h1 className="mt-5 font-display text-5xl font-black leading-[0.98] text-white sm:text-6xl lg:text-7xl">
              用一种颜色
              <br />
              重写今天的街道
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/74 sm:text-base">
              这不是普通拍照打卡。ColorWalk 每天给你一个明确色彩约束，系统自动筛选，通过后才进入今日画廊，最后导出可分享的视觉日签。
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/walk" className="landing-cta">开始今日 ColorWalk</Link>
              <Link href="/author" className="landing-ghost">查看作者主页</Link>
            </div>
          </article>

          <article className="landing-panel">
            <p className="font-mono text-[11px] tracking-[0.24em] text-white/70">APP DNA</p>
            <div className="mt-4 space-y-3">
              <div className="landing-item">
                <h3>单色约束</h3>
                <p>每天锁定一个主题色，形成清晰审美边界。</p>
              </div>
              <div className="landing-item">
                <h3>自动判断</h3>
                <p>按色相占比过滤照片，不靠主观挑选。</p>
              </div>
              <div className="landing-item">
                <h3>高质导出</h3>
                <p>拼贴图自动包含日期与今日主题，适合分享。</p>
              </div>
            </div>
          </article>
        </section>

        <section className="landing-strip mt-8">
          <p>COLOR CURATION · CITY TEXTURE · RULE-BASED CREATIVITY · DAILY VISUAL LOG</p>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <article className="landing-stat">
            <p className="font-mono text-xs text-white/55">01</p>
            <p className="mt-3 text-xl font-semibold">强规则，强风格</p>
          </article>
          <article className="landing-stat">
            <p className="font-mono text-xs text-white/55">02</p>
            <p className="mt-3 text-xl font-semibold">移动端即时反馈</p>
          </article>
          <article className="landing-stat">
            <p className="font-mono text-xs text-white/55">03</p>
            <p className="mt-3 text-xl font-semibold">作品化每日记录</p>
          </article>
        </section>
      </main>
    </div>
  );
}
