import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BadgeCheck, Globe2, ShieldCheck, Trophy, Zap, MapPin, ArrowRight } from "lucide-react"
import Navbar from "@/components/Navbar"

const values = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Fair + transparent",
    desc: "Simple scoring that rewards accuracy — not luck.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Fast to play",
    desc: "One tap picks — Home / Draw / Away — and you’re done.",
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    title: "Competitive weekly",
    desc: "Leaderboards reset weekly (Tue → Mon) so everyone can win.",
  },
  {
    icon: <Globe2 className="w-5 h-5" />,
    title: "Built to grow",
    desc: "Designed to scale into a global sports community.",
  },
]

const steps = [
  { title: "Create a free account", desc: "Sign up in seconds and jump right in." },
  { title: "Predict today’s games", desc: "Pick the match outcome before kickoff." },
  { title: "Earn points from results", desc: "Correct win = 3, draw = 1, wrong = 0." },
  { title: "Climb the weekly leaderboard", desc: "Top performers take weekly cash rewards." },
]

// Optional screenshots strip (replace with your real images later)
const previewShots = [
  { src: "/images/preview-leaderboard.jpeg", label: "Weekly Leaderboard" },
  { src: "/images/preview-play.png", label: "Play / Predictions" },
  { src: "/images/preview-dashboard.png", label: "Dashboard" },
  { src: "/images/preview-assistance.png", label: "Results + Points" },
]

const Page = () => {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/greenbul3.jpg"
            alt="Sport background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black/95" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90">
            <BadgeCheck className="w-4 h-4" />
            Free to play • Weekly reset (Tue → Mon) • Top players win cash
          </div>

          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            About <span className="text-primary">greenball360</span>
          </h1>

          <p className="mt-4 max-w-2xl text-white/80 text-sm md:text-base leading-relaxed">
            greenball360 is a free sports prediction platform built for fans who love competition,
            strategy, and the thrill of a live leaderboard. We’re based in{" "}
            <span className="font-semibold text-white">South London</span> — and we’re building a
            community where accuracy gets rewarded.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button asChild className="gap-2">
              <Link href="/register">
                Create free account <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-transparent text-white border-white/25 hover:bg-white/10">
              <Link href="/table">View leaderboard</Link>
            </Button>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 text-xs text-white/70">
            <MapPin className="w-4 h-4" />
            South London, United Kingdom
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-start">
          {/* Mission */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/50 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Our mission</h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              We want sports fans to feel the excitement of competition every week — not by luck,
              but by skill. greenball360 rewards players who predict accurately and consistently,
              with top leaderboard performers winning cash rewards weekly.
            </p>

            <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5 p-4">
              <p className="text-xs text-gray-700 dark:text-gray-200">
                Scoring: <span className="font-semibold">Correct win = 3</span>,{" "}
                <span className="font-semibold">Correct draw = 1</span>,{" "}
                <span className="font-semibold">Wrong pick = 0</span>.
              </p>
            </div>
          </div>

          {/* What we’re building */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/50 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">What we’re building</h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              A simple, modern prediction experience: daily match picks, real-time rankings,
              and weekly cycles that give every player a fair shot at winning — no matter when they join.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5 p-4"
                >
                  <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <span className="text-primary">{v.icon}</span>
                    <p className="font-semibold text-sm">{v.title}</p>
                  </div>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-8 md:mt-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/50 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">How it works</h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5 p-4"
              >
                <p className="text-xs font-semibold text-primary">Step {i + 1}</p>
                <p className="mt-1 font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {s.title}
                </p>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Preview strip */}
        <div className="mt-8 md:mt-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">A quick look inside</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Replace these images with screenshots of your real pages (Leaderboard / Play / Dashboard).
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/register">Start playing</Link>
            </Button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/50">
            <div className="flex gap-4 whitespace-nowrap p-4 animate-[marquee_22s_linear_infinite]">
              {[...previewShots, ...previewShots].map((s, idx) => (
                <div
                  key={`${s.src}-${idx}`}
                  className="relative h-28 w-56 md:h-32 md:w-72 shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-black/10"
                >
                  <Image src={s.src} alt={s.label} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-2 left-2 text-[11px] text-white font-medium">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-primary/10 to-transparent p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Ready to compete?
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
            Create a free account, predict matches, and climb the leaderboard.
            Top performers win weekly cash rewards.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Button asChild className="gap-2">
              <Link href="/register">
                Create free account <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Page