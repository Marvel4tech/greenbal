"use client"

import { useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts"

function money(n) {
  return `£${Number(n || 0).toFixed(2)}`
}

function formatDate(value) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-5">
      <p className="text-xs text-gray-500 dark:text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtext ? (
        <p className="mt-1 text-xs text-gray-500 dark:text-white/50">{subtext}</p>
      ) : null}
    </div>
  )
}

function SectionCard({ title, children, subtitle }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden">
      <div className="border-b border-gray-200 dark:border-white/10 px-5 py-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-600 dark:text-white/60">{subtitle}</p>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function AdminAnalyticsClient({ initialData }) {
  const data = initialData
  const [range, setRange] = useState("7d")

  const trendData = range === "30d" ? data.trends30d : data.trends7d

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Users</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total users" value={data.users.total} />
          <StatCard label="New users (7 days)" value={data.users.new7d} />
          <StatCard label="Banned users" value={data.users.banned} />
          <StatCard label="Deleted users" value={data.users.deleted} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gameplay</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Predictions today" value={data.gameplay.predictionsToday} />
          <StatCard label="Predictions (7 days)" value={data.gameplay.predictions7d} />
          <StatCard label="Active players (7 days)" value={data.gameplay.activePlayers7d} />
          <StatCard label="Games awaiting scoring" value={data.gameplay.gamesPending} />
          <StatCard label="Finished games" value={data.gameplay.gamesFinished} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trends</h2>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Growth Trend"
            subtitle="Daily users, predictions, and referrals."
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="predictions" stroke="#16a34a" strokeWidth={2} />
                  <Line type="monotone" dataKey="referrals" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Cumulative User Growth"
            subtitle="Running total of newly created users in the selected range."
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cumulativeUsers" stroke="#7c3aed" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Daily Activity Bars"
            subtitle="Visual comparison across the same metrics."
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="predictions" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="referrals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Referral Funnel"
            subtitle="How referrals are progressing through the reward flow."
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.referralFunnel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Referral Performance"
          subtitle="Overview of referral progress and reward status."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Total referrals" value={data.referrals.total} />
            <StatCard label="Pending referrals" value={data.referrals.pending} />
            <StatCard label="Played first game" value={data.referrals.playedFirstGame} />
            <StatCard
              label="Conversion rate"
              value={`${Number(data.referrals.conversionRate || 0).toFixed(1)}%`}
            />
            <StatCard label="Unlocked referrals" value={data.referrals.unlocked} />
            <StatCard label="Expired referrals" value={data.referrals.expired} />
            <StatCard label="Locked referral £" value={money(data.referrals.lockedAmount)} />
            <StatCard label="Unlocked referral £" value={money(data.referrals.unlockedAmount)} />
          </div>
        </SectionCard>

        <SectionCard
          title="Wallet & Payout Health"
          subtitle="Current money state across wallets."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Wallet pending total" value={money(data.money.walletPendingTotal)} />
            <StatCard label="Wallet available total" value={money(data.money.walletAvailableTotal)} />
            <StatCard label="Estimated payout total" value={money(data.money.availablePayoutTotal)} />
            <StatCard label="Users awaiting payout" value={data.money.usersAwaitingPayout} />
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Top Users This Week"
          subtitle={`Week start: ${data.weekStart || "—"}`}
        >
          <div className="space-y-3">
            {data.topWeeklyUsers.length ? (
              data.topWeeklyUsers.map((u, idx) => (
                <div
                  key={`${u.user_id}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      #{u.rank_position || idx + 1} @{u?.profiles?.username || "unknown"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-white/50">
                      Predictions: {Number(u.predictions_total || 0)} • Correct: {Number(u.correct_total || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {Number(u.points_total || 0)} pts
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-white/60">No weekly leaderboard data yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Referrals"
          subtitle="Latest referral records and progress."
        >
          <div className="space-y-3">
            {data.recentReferrals.length ? (
              data.recentReferrals.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    @{r?.referrer?.username || "unknown"} → @{r?.referred?.username || "unknown"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                    {money(r.reward_amount_gbp)} • {String(r.status || "").toUpperCase()}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                    First game: {r.played_first_game ? "Yes" : "No"} • Top 20: {r.reached_top20 ? "Yes" : "No"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                    Created: {formatDate(r.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-white/60">No referrals yet.</p>
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  )
}