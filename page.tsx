import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050708] text-white">
      {/* NAVBAR */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-xl font-bold text-cyan-300">
            A
          </div>

          <div>
            <div className="font-semibold">Aspire AI</div>
            <div className="text-[10px] tracking-[0.25em] text-white/35">
              CAREER INTELLIGENCE
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-white/60 transition hover:text-white"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="text-sm text-white/60 transition hover:text-white"
          >
            How it works
          </a>

          <a
            href="#about"
            className="text-sm text-white/60 transition hover:text-white"
          >
            About
          </a>

          <Link
            href="/dashboard"
            className="text-sm text-white/60 transition hover:text-white"
          >
            Sign in
          </Link>

          <Link
            href="/assessment"
            className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-bold text-black transition hover:bg-cyan-200"
          >
            Get started
          </Link>
        </nav>

        {/* Mobile button */}
        <Link
          href="/assessment"
          className="rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-bold text-black md:hidden"
        >
          Get started
        </Link>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-20 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:px-10 md:pb-32 md:pt-28">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              AI-powered career intelligence
            </div>

            {/* Heading */}
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Your future.
              <br />

              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Intelligently
              </span>{" "}
              planned.
            </h1>

            {/* Description */}
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/50 md:text-xl">
              Aspire AI helps you understand your skills, discover the right
              career path, and build a personalized roadmap for your future.
            </p>

            {/* Buttons */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/assessment"
                className="rounded-full bg-cyan-300 px-8 py-4 text-center font-bold text-black transition hover:bg-cyan-200"
              >
                Start your assessment →
              </Link>

              <a
                href="#how-it-works"
                className="rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-center font-medium text-white transition hover:bg-white/[0.07]"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-2xl font-bold">AI</div>
              <div className="mt-1 text-sm text-white/40">
                Career intelligence
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-2xl font-bold">5</div>
              <div className="mt-1 text-sm text-white/40">
                Profile dimensions
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-2xl font-bold">1</div>
              <div className="mt-1 text-sm text-white/40">
                Personalized roadmap
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="border-t border-white/5 bg-white/[0.015]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              Features
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Everything you need to move forward.
            </h2>

            <p className="mt-5 text-white/50">
              Aspire AI brings your career information together and turns it
              into a clear direction.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-xl text-cyan-300">
                ✦
              </div>

              <h3 className="text-xl font-semibold">
                Career Assessment
              </h3>

              <p className="mt-3 leading-7 text-white/45">
                Tell Aspire AI about your education, skills, experience,
                interests and career goals.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-xl text-violet-300">
                ◈
              </div>

              <h3 className="text-xl font-semibold">
                Career Intelligence
              </h3>

              <p className="mt-3 leading-7 text-white/45">
                Understand which career paths match your current profile and
                where your biggest opportunities are.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/10 text-xl text-blue-300">
                ↗
              </div>

              <h3 className="text-xl font-semibold">
                Personalized Roadmap
              </h3>

              <p className="mt-3 leading-7 text-white/45">
                Get a structured direction for the skills and steps you need
                to reach your target career.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              How it works
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Three steps. One direction.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="text-sm font-bold text-cyan-300">01</div>

              <h3 className="mt-5 text-2xl font-semibold">
                Build your profile
              </h3>

              <p className="mt-4 leading-7 text-white/45">
                Complete the Aspire AI career assessment.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="text-sm font-bold text-cyan-300">02</div>

              <h3 className="mt-5 text-2xl font-semibold">
                Analyze your direction
              </h3>

              <p className="mt-4 leading-7 text-white/45">
                Aspire AI evaluates your goals, skills and interests.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="text-sm font-bold text-cyan-300">03</div>

              <h3 className="mt-5 text-2xl font-semibold">
                Start your roadmap
              </h3>

              <p className="mt-4 leading-7 text-white/45">
                Follow your personalized career strategy from the dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="border-t border-white/5">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:px-10">
          <div className="rounded-[2rem] border border-cyan-300/10 bg-cyan-300/[0.04] p-10 md:p-16">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              Your future starts here
            </p>

            <h2 className="mt-5 text-4xl font-bold md:text-5xl">
              Stop guessing.
              <br />
              Start building.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-white/50">
              Complete your career assessment and discover what your next
              move could look like.
            </p>

            <Link
              href="/assessment"
              className="mt-8 inline-block rounded-full bg-cyan-300 px-8 py-4 font-bold text-black transition hover:bg-cyan-200"
            >
              Get started →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-white/35 md:flex-row md:items-center md:justify-between md:px-10">
          <div>© 2026 Aspire AI</div>

          <div>Career intelligence for your future.</div>
        </div>
      </footer>
    </main>
  );
}