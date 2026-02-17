"use client"

import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ShieldCheck, Trophy, Zap, Timer, ArrowRight } from "lucide-react"

const images = [
  "/images/greenbul1.jpg",
  "/images/greenbul2.jpg",
  "/images/greenbul3.jpg",
  "/images/greenbul4.jpg",
  "/images/greenbul5.jpg",
  "/images/greenbul6.jpg",
]

const previewShots = [
  { src: "/images/preview-leaderboard.jpeg", label: "Weekly Leaderboard" },
  { src: "/images/preview-play.png", label: "Predict Today’s Games" },
  { src: "/images/preview-news.png", label: "News + Updates" },
  { src: "/images/preview-assistance.png", label: "Your Assistance" },
  { src: "/images/preview-dashboard.png", label: "Player Dashboard" },
]

const Page = () => {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)

  // Auth redirect
  useEffect(() => {
    let isMounted = true

    const redirectUser = async (u) => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", u.id)
        .single()

      const role = error ? null : profile?.role
      const redirectPath = role === "admin" ? "/dashboard" : "/profile"
      router.push(redirectPath)
    }

    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      const u = data?.user

      if (u) {
        await redirectUser(u)
        return
      }

      if (isMounted) setLoading(false)
    }

    checkAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user
      if (u) {
        await redirectUser(u)
      } else {
        if (isMounted) setLoading(false)
      }
    })

    return () => {
      isMounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [supabase, router])

  // Background slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <section className="relative h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-primary text-sm">Checking authentication…</p>
        </div>
      </section>
    )
  }

  return (
    <main className="flex flex-col min-h-screen antialiased">
      <Navbar />

      <section className="relative flex-1 overflow-hidden">
        {/* Background images */}
        {images.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image src={img} alt={`Background ${i + 1}`} fill priority={i === 0} className="object-cover" />
          </div>
        ))}

        {/* overlay */}
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black/90" />

        <div className="relative z-10">
          {/* HERO */}
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 md:pt-20">
            <div className="grid gap-10 md:grid-cols-2 items-center">
              {/* ✅ HERO VISUAL FIRST ON MOBILE */}
              <div className="order-1 md:order-2">
                <HeroVisual />
              </div>

              {/* TEXT + CTA */}
              <div className="order-2 md:order-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90">
                  <Zap className="w-4 h-4" />
                  Weekly rewards • Free to play • Tue → Mon leaderboard
                </div>

                <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  Predict. Score Points.{" "}
                  <span className="text-primary">Top 5 win cash weekly.</span>
                </h1>

                <p className="mt-4 text-white/80 text-sm md:text-base leading-relaxed">
                  greenbal is a free prediction game. Pick match outcomes daily, climb the weekly leaderboard,
                  and compete for rewards. Fast, fair, and built for serious predictors.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button className="gap-2" asChild>
                    <Link href="/register">
                      Create free account <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="bg-transparent text-white border-white/30 hover:bg-white/10"
                    asChild
                  >
                    <Link href="/login">I already have an account</Link>
                  </Button>
                </div>

                <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/70">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-white/70" /> One prediction per match
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-white/70" /> Top 5 win weekly
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Timer className="w-4 h-4 text-white/70" /> Locked at kickoff
                  </span>
                </div>
              </div>
            </div>

            {/* SCORING CARD */}
            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl">
                <p className="text-white font-semibold text-sm">How scoring works</p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white/10 border border-white/10 p-4 text-center">
                    <p className="text-2xl font-extrabold text-white">3 points</p>
                    <p className="text-[11px] text-white/70 mt-1">Correct win</p>
                  </div>
                  <div className="rounded-xl bg-white/10 border border-white/10 p-4 text-center">
                    <p className="text-2xl font-extrabold text-white">1 point</p>
                    <p className="text-[11px] text-white/70 mt-1">Correct draw</p>
                  </div>
                  <div className="rounded-xl bg-white/10 border border-white/10 p-4 text-center">
                    <p className="text-2xl font-extrabold text-white">0</p>
                    <p className="text-[11px] text-white/70 mt-1">Wrong pick</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-white/80">
                    Weekly leaderboard resets every <span className="font-semibold">Tuesday</span> and runs to{" "}
                    <span className="font-semibold">Monday</span> (UTC). Predict early to stay ahead.
                  </p>
                </div>
              </div>

              {/* FEATURES */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FeatureCard
                  title="Daily Matches"
                  desc="Fresh games every day — only today shows by default."
                  icon={<GameIcon />}
                />
                <FeatureCard
                  title="Real-time Leaderboard"
                  desc="Watch ranks move live when results are updated."
                  icon={<Trophy className="w-5 h-5" />}
                />
                <FeatureCard
                  title="Fair Lock System"
                  desc="Predictions lock at kickoff — no late edits."
                  icon={<ShieldCheck className="w-5 h-5" />}
                />
                <FeatureCard
                  title="Fast + Simple"
                  desc="Pick Home / Draw / Away and you’re done."
                  icon={<Zap className="w-5 h-5" />}
                />
              </div>
            </div>
          </div>

          {/* SOCIAL PROOF STRIP */}
          <div className="mx-auto max-w-6xl px-4 pb-10">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <p className="text-sm text-white/80">
                “Simple to use, addictive to play — and the leaderboard feels alive.”
              </p>
              <p className="text-xs text-white/60">— greenbal early testers</p>
            </div>
          </div>

          {/* PREVIEW MARQUEE */}
          <div className="mx-auto max-w-6xl px-4 pb-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-white font-semibold text-lg">See what you’re joining</h2>
                <p className="text-white/70 text-sm">
                  Live leaderboard, predictions, and your dashboard — in one place.
                </p>
              </div>
              <Button variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10" asChild>
                <Link href="/register">Start now</Link>
              </Button>
            </div>

            <div className="mt-5 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <div className="flex gap-4 py-4 px-4 marquee">
                {[...previewShots, ...previewShots].map((s, idx) => (
                  <div
                    key={idx}
                    className="min-w-[240px] md:min-w-[320px] rounded-xl overflow-hidden border border-white/10 bg-black/30"
                  >
                    <div className="relative h-36 md:h-44">
                      <Image src={s.src} alt={s.label} fill className="object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-white/80 font-medium">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/60 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/60 to-transparent" />
            </div>

            <style jsx>{`
              .marquee {
                width: max-content;
                animation: marquee 28s linear infinite;
              }
              @keyframes marquee {
                0% {
                  transform: translateX(0);
                }
                100% {
                  transform: translateX(-50%);
                }
              }
              @media (prefers-reduced-motion: reduce) {
                .marquee {
                  animation: none;
                }
              }
            `}</style>
          </div>
        </div>
      </section>
    </main>
  )
}

function HeroVisual() {
  // Put this file in /public/images/hero-sports.jpg
  // Fallback is a greenbul image so it never breaks
  const heroSrc = "/images/heroVisual.jpeg"

  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
      <div className="relative h-[260px] sm:h-[320px] md:h-[420px]">
        <Image
          src={heroSrc}
          alt="Sporty hero"
          fill
          className="object-cover"
          onError={(e) => {
            // Fallback (safe): swap src if hero image isn't available yet
            e.currentTarget.src = "/images/greenbul2.jpg"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* Overlay content */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-4 py-3">
            <p className="text-white text-sm font-semibold">Top 5 win cash weekly</p>
            <p className="text-white/70 text-xs">Live leaderboard • Tue → Mon</p>
          </div>

          <div className="hidden sm:flex rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-4 py-3">
            <p className="text-white text-xs">
              Scoring: <span className="font-semibold">3</span> win •{" "}
              <span className="font-semibold">1</span> draw •{" "}
              <span className="font-semibold">0</span> loss
            </p>
          </div>
        </div>
      </div>

      {/* Glow */}
      <div className="absolute -z-10 -inset-6 rounded-3xl bg-primary/20 blur-3xl" />
    </div>
  )
}

function FeatureCard({ title, desc, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
        {icon}
      </div>
      <h3 className="mt-3 text-white font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-white/70 leading-relaxed">{desc}</p>
    </div>
  )
}

function GameIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
      <path
        d="M8 12h4M10 10v4M16 11h.01M18 13h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 7h11A3.5 3.5 0 0 1 21 10.5v5A3.5 3.5 0 0 1 17.5 19h-11A3.5 3.5 0 0 1 3 15.5v-5A3.5 3.5 0 0 1 6.5 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Page
