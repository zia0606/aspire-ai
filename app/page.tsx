import Link from "next/link";

const features = [
  {
    icon: "✦",
    title: "Career assessment",
    text: "Turn your education, skills, experience and interests into a focused career profile.",
  },
  {
    icon: "◈",
    title: "Career intelligence",
    text: "See a clear match score, your strongest skills and the gaps worth closing next.",
  },
  {
    icon: "↗",
    title: "Personalized roadmap",
    text: "Follow practical learning steps and projects built around your chosen career.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050708] text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-xl font-bold text-cyan-300">
            A
          </span>
          <span>
            <span className="block font-semibold">Aspire AI</span>
            <span className="block text-[10px] tracking-[0.25em] text-white/35">
              CAREER INTELLIGENCE
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-white/60 hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-white/60 hover:text-white">
            How it works
          </a>
          <Link href="/dashboard" className="text-sm text-white/60 hover:text-white">
            Dashboard
          </Link>
          <Link href="/assessment" className="button-primary px-6 py-3 text-sm">
            Get started
          </Link>
        </nav>

        <Link href="/assessment" className="button-primary px-5 py-2.5 text-sm md:hidden">
          Get started
        </Link>
      </header>

      <section className="relative">
        <div className="grid-background pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-12 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:px-10 md:pb-32 md:pt-28">
          <div className="max-w-4xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              AI-powered career intelligence
            </div>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Your future.
              <br />
              <span className="gradient-text">Intelligently</span> planned.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/50 md:text-xl">
              Understand your skills, discover the right career path, and build a roadmap you can actually follow.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/assessment" className="button-primary px-8 py-4 text-center">
                Start your assessment →
              </Link>
              <a href="#how-it-works" className="button-secondary px-8 py-4 text-center">
                See how it works
              </a>
            </div>
          </div>

          <div className="mt-20 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              ["AI", "Career intelligence"],
              ["5", "Profile dimensions"],
              ["1", "Personal roadmap"],
            ].map(([value, label]) => (
              <div key={label} className="card p-5">
                <div className="text-2xl font-bold">{value}</div>
                <div className="mt-1 text-sm text-white/40">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <p className="eyebrow">Features</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            Everything you need to move forward.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="card p-7">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-xl text-cyan-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-white/45">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24 md:px-10">
        <div className="text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Three steps. One direction.</h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            ["01", "Build your profile", "Complete the guided career assessment."],
            ["02", "See your match", "Understand your score, strengths and skill gaps."],
            ["03", "Start your roadmap", "Learn in clear phases and track every completed step."],
          ].map(([number, title, text]) => (
            <article key={number} className="card p-8">
              <div className="text-sm font-bold text-cyan-300">{number}</div>
              <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
              <p className="mt-4 leading-7 text-white/45">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:px-10">
          <div className="rounded-[2rem] border border-cyan-300/10 bg-cyan-300/[0.04] p-10 md:p-16">
            <p className="eyebrow">Your future starts here</p>
            <h2 className="mt-5 text-4xl font-bold md:text-5xl">Stop guessing. Start building.</h2>
            <Link href="/assessment" className="button-primary mt-8 inline-block px-8 py-4">
              Get started →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-white/35">
        © 2026 Aspire AI · Career intelligence for your future.
      </footer>
    </main>
  );
}
