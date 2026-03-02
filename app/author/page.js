import Link from 'next/link';

export default function AuthorPage() {
  return (
    <div className="landing-shell min-h-screen text-white">
      <div className="landing-mesh" />
      <div className="landing-noise" />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-24 pt-10 sm:px-8">
        <header className="landing-topbar">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="ColorWalk 标志" className="h-10 w-10" />
            <div>
              <p className="font-mono text-[11px] tracking-[0.24em] text-white/80">AUTHOR</p>
              <p className="text-xs text-white/60">创作者信息</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="landing-nav-btn">首页</Link>
            <Link href="/walk" className="landing-nav-btn landing-nav-btn--solid">进入应用</Link>
          </div>
        </header>

        <section className="mt-10 rounded-3xl border border-white/15 bg-white/[0.06] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
          <p className="font-mono text-[11px] tracking-[0.22em] text-white/65">PROFILE</p>
          <h1 className="mt-4 font-display text-4xl font-black text-white sm:text-5xl">YuYi</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            感谢访问 ColorWalk。这里是作者主页，你可以通过小红书与我连接。
          </p>

          <div className="mt-7 grid gap-3">
            <div className="rounded-2xl border border-white/15 bg-black/25 px-4 py-4">
              <p className="text-xs text-white/60">小红书</p>
              <p className="mt-1 text-lg font-semibold text-white">YuYi</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/25 px-4 py-4">
              <p className="text-xs text-white/60">小红书号</p>
              <p className="mt-1 font-mono text-lg font-semibold tracking-wide text-white">942618069</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-white/82">
            <p>小红书：YuYi</p>
            <p>小红书号: 942618069</p>
          </div>
        </section>
      </main>
    </div>
  );
}
