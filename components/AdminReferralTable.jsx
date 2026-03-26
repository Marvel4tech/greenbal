"use client"

import { useMemo, useState } from "react"

function StatusPill({ status }) {
  const s = (status || "").toLowerCase()

  const styles = {
    pending:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200",
    unlocked:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    expired:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200",
    voided:
      "border-gray-300 bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-white/70",
    default:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[s] || styles.default
      }`}
    >
      {(status || "unknown").toUpperCase()}
    </span>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-4">
      <p className="text-xs text-gray-500 dark:text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

export default function AdminReferralTable({ initialReferrals }) {
  const [referrals, setReferrals] = useState(initialReferrals)
  const [busyId, setBusyId] = useState(null)
  const [filter, setFilter] = useState("all")
  const [noteMap, setNoteMap] = useState({})

  const stats = useMemo(() => {
    const total = referrals.length
    const pending = referrals.filter((r) => r.status === "pending").length
    const unlocked = referrals.filter((r) => r.status === "unlocked").length
    const expired = referrals.filter((r) => r.status === "expired").length
    const voided = referrals.filter((r) => r.status === "voided").length

    const lockedAmount = referrals
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + Number(r.reward_amount_gbp || 0), 0)

    const unlockedAmount = referrals
      .filter((r) => r.status === "unlocked")
      .reduce((sum, r) => sum + Number(r.reward_amount_gbp || 0), 0)

    return {
      total,
      pending,
      unlocked,
      expired,
      voided,
      lockedAmount,
      unlockedAmount,
    }
  }, [referrals])

  const filtered = useMemo(() => {
    if (filter === "all") return referrals
    return referrals.filter((r) => r.status === filter)
  }, [referrals, filter])

  const onVoid = async (referralId) => {
    setBusyId(referralId)

    try {
      const res = await fetch("/api/admin/referrals/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralId,
          adminNote: noteMap[referralId] || "",
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        alert(json?.error || "Failed to void referral")
        return
      }

      setReferrals((prev) =>
        prev.map((r) => (r.id === referralId ? json.referral : r))
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total referrals" value={stats.total} />
        <StatCard label="Pending bonuses" value={stats.pending} />
        <StatCard label="Unlocked bonuses" value={stats.unlocked} />
        <StatCard label="Expired bonuses" value={stats.expired} />
        <StatCard label="Voided bonuses" value={stats.voided} />
        <StatCard label="Locked £ / Unlocked £" value={`£${stats.lockedAmount.toFixed(2)} / £${stats.unlockedAmount.toFixed(2)}`} />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden shadow-sm">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Referral Records
              </h2>
              <p className="text-sm text-gray-600 dark:text-white/60">
                Review, monitor, and void suspicious referral bonuses.
              </p>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="unlocked">Unlocked</option>
              <option value="expired">Expired</option>
              <option value="voided">Voided</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-white/10">
          {filtered.map((r) => (
            <div key={r.id} className="px-5 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    @{r?.referrer?.username || r.referrer_id}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-white/70">
                    referred @{r?.referred?.username || r.referred_user_id}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusPill status={r.status} />
                    <span className="text-xs text-gray-500 dark:text-white/50">
                      £{Number(r.reward_amount_gbp).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full px-3 py-1 border ${
                        r.played_first_game
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {r.played_first_game ? "Played first game" : "No first game"}
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

                  <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-white/50">
                    <p>Created: {new Date(r.created_at).toLocaleString()}</p>
                    <p>Expires: {new Date(r.expires_at).toLocaleString()}</p>
                    {r.unlocked_at ? <p>Unlocked: {new Date(r.unlocked_at).toLocaleString()}</p> : null}
                    {r.expired_at ? <p>Expired: {new Date(r.expired_at).toLocaleString()}</p> : null}
                    {r.voided_at ? <p>Voided: {new Date(r.voided_at).toLocaleString()}</p> : null}
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <textarea
                    rows={3}
                    placeholder="Admin note (optional)"
                    value={noteMap[r.id] ?? r.admin_note ?? ""}
                    onChange={(e) =>
                      setNoteMap((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
                    disabled={r.status === "voided"}
                  />
                </div>

                <div className="lg:col-span-2 flex items-start lg:justify-end">
                  <button
                    onClick={() => onVoid(r.id)}
                    disabled={busyId === r.id || r.status === "voided" || r.status === "unlocked"}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
                  >
                    {r.status === "voided"
                      ? "Voided"
                      : busyId === r.id
                      ? "Voiding..."
                      : "Void"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!filtered.length && (
            <div className="px-5 py-10 text-sm text-gray-500 dark:text-white/60">
              No referral records found for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}