"use client"

import Link from "next/link"
import { FaFutbol } from "react-icons/fa"
import { siteConfig } from "@/lib/site"

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black/70 backdrop-blur-lg">
      {/* Subtle premium glow */}
      <div className="pointer-events-none absolute inset-0">
        {/* top gradient line */}
        <div className="absolute -top-24 left-1/2 h-48 w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 blur-3xl" />
        {/* soft corner glow */}
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-56 -left-56 h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 lg:px-0 py-14">
        {/* Top Section */}
        <div className="grid gap-12 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-2 group">
              <FaFutbol className="text-3xl text-primary group-hover:rotate-12 transition" />
              <span className="font-light py-1 px-3 rounded-3xl border border-primary text-white tracking-wide text-sm">
                {siteConfig.name}
              </span>
            </Link>

            <p className="mt-5 text-sm leading-6 text-white/70 max-w-sm">
              {siteConfig.name} is a free-to-play football prediction platform.
              Earn points for accurate score predictions and compete on the
              weekly leaderboard. The top player each week wins a £10 reward.
            </p>

            <div className="mt-4">
              <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
                100% Free To Play
              </span>
            </div>

            <p className="mt-4 text-xs text-white/50">
              Weekly leaderboard resets every Tuesday.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-5">
            <div className="grid gap-8 sm:grid-cols-3">
              <FooterCol title="Game">
                <FooterLink href="/">Home</FooterLink>
                <FooterLink href="/leaderboard">Leaderboard</FooterLink>
                <FooterLink href="/about">How It Works</FooterLink>
                <FooterLink href="/fixtures">Fixtures</FooterLink>
              </FooterCol>

              <FooterCol title="Account">
                <FooterLink href="/login">Login</FooterLink>
                <FooterLink href="/register">Register</FooterLink>
                <FooterLink href="/register">Profile</FooterLink>
              </FooterCol>

              <FooterCol title="Support">
                <FooterLink href="/about">About</FooterLink>
                <FooterLink href="/contact">Contact</FooterLink>
                <FooterLink href="/about">FAQ</FooterLink>
              </FooterCol>
            </div>
          </div>

          {/* CTA Card (animated) */}
          <div className="md:col-span-3">
            <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10">
              {/* glow ring on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-primary/0 via-primary/25 to-primary/0" />

              <h3 className="relative text-sm font-semibold text-white">
                Ready to compete?
              </h3>

              <p className="relative mt-2 text-sm text-white/70">
                Join for free, predict accurately, and you could be this week’s
                £10 winner.
              </p>

              <Link
                href="/register"
                className="relative mt-5 inline-flex w-full justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 active:scale-[0.99]"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <p className="text-xs text-white/50">
            © {year} {siteConfig.name}. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-5 text-xs text-white/50">
            <FooterLink href="/terms">Terms</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/rules">Game Rules</FooterLink>
          </div>

          <p className="text-xs text-white/40 max-w-md">
            {siteConfig.name} is a free-to-play football prediction game. No
            betting or wagering is involved. Rewards are based purely on weekly
            leaderboard performance and prediction accuracy.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

// Functions for this page
function FooterCol({ title, children }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </div>
  )
}

function FooterLink({ href, children }) {
  return (
    <Link
      href={href}
      className="text-sm text-white/70 hover:text-white hover:underline underline-offset-4 decoration-primary/70 transition"
    >
      {children}
    </Link>
  )
}