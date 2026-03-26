"use client"

import { useMemo, useState } from "react"
import { Share2, Copy, Check, Users, Gift, Clock, XCircle, MessageCircle, Twitter } from "lucide-react"

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    unlocked: "bg-emerald-50 text-emerald-700 border-emerald-200",
    expired: "bg-rose-50 text-rose-700 border-rose-200",
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-gray-50 text-gray-700 border-gray-200"
      }`}
    >
      {status?.toUpperCase()}
    </span>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 dark:bg-white/10 p-2">
          <Icon className="h-4 w-4 text-gray-700 dark:text-white/80" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-white/50">{label}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function ReferralClient({ referralCode, referralLink, referrals = [] }) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [sharing, setSharing] = useState(false)

  const stats = useMemo(() => {
    const total = referrals.length
    const unlocked = referrals.filter((r) => r.status === "unlocked").length
    const pending = referrals.filter((r) => r.status === "pending").length
    const expired = referrals.filter((r) => r.status === "expired").length

    const totalEarned = referrals
      .filter((r) => r.status === "unlocked")
      .reduce((sum, r) => sum + Number(r.reward_amount_gbp || 0), 0)

    return { total, unlocked, pending, expired, totalEarned }
  }, [referrals])

  const copyToClipboard = async (text, type = "link") => {
    try {
      await navigator.clipboard.writeText(text)

      if (type === "link") {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 1500)
      } else {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 1500)
      }
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  const shareReferral = async () => {
    const shareData = {
      title: "Join me on greenball360",
      text: `Use my referral code ${referralCode} and sign up here:`,
      url: referralLink,
    }

    try {
      setSharing(true)

      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(referralLink)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 1500)
      }
    } catch (error) {
      console.error("Share failed:", error)
    } finally {
      setSharing(false)
    }
  }

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(
    `Join me on greenball360. Use my referral code ${referralCode}. Sign up here: ${referralLink}`
  )}`

  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Join me on greenball360 with my referral code ${referralCode}! ${referralLink}`
  )}`

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Referral Bonus
        </h1>

        <p className="mt-2 max-w-2xl text-gray-600 dark:text-white/70">
          Invite a friend and immediately get a{" "}
          <span className="font-semibold text-primary">£2 locked bonus</span>.
          It unlocks after your friend plays their first game and reaches the Top 20
          within 30 days.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <p className="text-xs text-gray-500 dark:text-white/50">Your referral code</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {referralCode}
              </p>
              <button
                onClick={() => copyToClipboard(referralCode, "code")}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-medium text-gray-700 dark:text-white"
              >
                {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedCode ? "Copied" : "Copy code"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <p className="text-xs text-gray-500 dark:text-white/50">Referral link</p>
            <p className="mt-2 break-all text-sm text-gray-900 dark:text-white">
              {referralLink}
            </p>

            <div className="mt-3 flex flex-wrap gap-3">
              <button
                onClick={() => copyToClipboard(referralLink, "link")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedLink ? "Copied" : "Copy link"}
              </button>

              <button
                onClick={shareReferral}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-white"
              >
                <Share2 className="h-4 w-4" />
                {sharing ? "Sharing..." : "Share"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href={whatsappShare}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 dark:hover:bg-white/5 transition"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>

              <a
                href={twitterShare}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition"
              >
                <Twitter className="h-4 w-4" />
                X
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total referrals" value={stats.total} />
        <StatCard icon={Gift} label="Unlocked bonuses" value={stats.unlocked} />
        <StatCard icon={Clock} label="Pending bonuses" value={stats.pending} />
        <StatCard icon={XCircle} label="Expired bonuses" value={stats.expired} />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-5">
        <p className="text-sm text-gray-500 dark:text-white/50">Total earned</p>
        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
          £{stats.totalEarned.toFixed(2)}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <h2 className="font-semibold text-gray-900 dark:text-white">Referral Progress</h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-white/10">
          {referrals.map((r) => (
            <div key={r.id} className="px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    £{Number(r.reward_amount_gbp).toFixed(2)} Referral Bonus
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full px-3 py-1 border ${
                        r.played_first_game
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {r.played_first_game ? "First game done" : "First game pending"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 border ${
                        r.reached_top20
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {r.reached_top20 ? "Top 20 reached" : "Top 20 pending"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500 dark:text-white/50">
                    Expires: {new Date(r.expires_at).toLocaleString()}
                  </p>
                </div>

                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}

          {!referrals.length && (
            <div className="px-5 py-8 text-sm text-gray-500 dark:text-white/60">
              <p>No referrals yet.</p>
              <p className="mt-1">Share your referral link to invite your first friend.</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How it works</h3>
        <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-white/70">
          <p>1. Share your referral link or code with a friend.</p>
          <p>2. When they sign up, you receive a £2 locked referral bonus.</p>
          <p>3. The bonus unlocks only after they play their first game and reach the Top 20 within 30 days.</p>
          <p>4. If they do not complete the conditions before expiry, the reward becomes expired.</p>
        </div>
      </div>
    </div>
  )
}