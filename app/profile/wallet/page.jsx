import Link from "next/link"
import { redirect } from "next/navigation"
import { createServerClientWrapper } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"

function StatusPill({ status }) {
  const s = (status || "").toLowerCase()

  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border"

  const styles = {
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    available:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200",
    pending:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200",
    voided:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200",
    expired:
      "border-gray-300 bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-white/70",
    default:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80",
  }

  const dotStyles = {
    paid: "bg-emerald-500 dark:bg-emerald-300",
    available: "bg-blue-500 dark:bg-blue-300",
    pending: "bg-amber-500 dark:bg-amber-300",
    voided: "bg-rose-500 dark:bg-rose-300",
    expired: "bg-gray-500 dark:bg-white/50",
    default: "bg-gray-400 dark:bg-white/40",
  }

  const label =
    s === "paid"
      ? "PAID"
      : s === "available"
      ? "AVAILABLE"
      : s === "pending"
      ? "PENDING"
      : s === "voided"
      ? "VOIDED"
      : s === "expired"
      ? "EXPIRED"
      : (status || "UNKNOWN").toUpperCase()

  return (
    <span className={`${base} ${styles[s] || styles.default}`}>
      <span className={`h-2 w-2 rounded-full ${dotStyles[s] || dotStyles.default}`} />
      {label}
    </span>
  )
}

function transactionTitle(tx) {
  if (tx.type === "weekly_top5_reward") return "Weekly Top 5 Reward"
  if (tx.type === "referral_bonus") return "Referral Bonus"
  return "Wallet Reward"
}

function transactionSubtitle(tx) {
  if (tx.type === "weekly_top5_reward" && tx.week_start && tx.week_end) {
    return `${tx.week_start} → ${tx.week_end}`
  }

  if (tx.type === "referral_bonus") {
    return "Invite reward"
  }

  return null
}

function transactionDateLabel(tx) {
  if (tx.paid_at) {
    return `Paid: ${new Date(tx.paid_at).toLocaleString()}`
  }

  if (tx.expires_at && tx.status === "expired") {
    return `Expired: ${new Date(tx.expires_at).toLocaleString()}`
  }

  return `Created: ${new Date(tx.created_at).toLocaleString()}`
}

export default async function WalletPage() {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: wallet } = await supabase
    .from("wallets")
    .select("available_balance_gbp, pending_balance_gbp")
    .eq("user_id", user.id)
    .single()

  const { data: txs } = await supabase
    .from("wallet_transactions") 
    .select(
      "id, type, week_start, week_end, amount_gbp, status, paid_at, created_at, expires_at, payout_batch_id"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const available = Number(wallet?.available_balance_gbp || 0)
  const pending = Number(wallet?.pending_balance_gbp || 0)

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-0 py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Rewards Wallet
        </h1>

        <p className="text-gray-600 dark:text-white/70 max-w-3xl">
          greenball360 is{" "}
          <span className="text-primary font-semibold">free-to-play</span> — no
          wagers, no staking. Rewards are earned through skill, leaderboard
          performance, and referrals.
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            100% FREE TO PLAY
          </span>
          <Link
            href="/about"
            className="text-xs text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition underline underline-offset-4 decoration-primary/60"
          >
            See scoring & rules
          </Link>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm dark:shadow-none">
          <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-100">
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-white/60">
                Available
              </p>
              <StatusPill status="available" />
            </div>

            <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              £{available.toFixed(2)}
            </p>

            <p className="mt-2 text-xs text-gray-500 dark:text-white/50">
              Cleared wallet rewards waiting to be paid out.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm dark:shadow-none">
          <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-100">
            <div className="absolute -bottom-28 -left-28 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-white/60">Pending</p>
              <StatusPill status="pending" />
            </div>

            <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              £{pending.toFixed(2)}
            </p>

            <p className="mt-2 text-xs text-gray-500 dark:text-white/50">
              Locked bonuses waiting to qualify or clear.
            </p>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="mt-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            History
          </h2>
          <Link
            href="/profile/leaderboard"
            className="text-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition"
          >
            View leaderboard
          </Link>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-white/10">
          {(txs || []).map((tx) => {
            const subtitle = transactionSubtitle(tx)

            return (
              <div
                key={tx.id}
                className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">
                    {transactionTitle(tx)}
                    {subtitle ? (
                      <>
                        <span className="text-gray-400 dark:text-white/50"> • </span>
                        <span className="text-gray-600 dark:text-white/70">
                          {subtitle}
                        </span>
                      </>
                    ) : null}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusPill status={tx.status} />
                    <p className="text-xs text-gray-500 dark:text-white/50">
                      {transactionDateLabel(tx)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    £{Number(tx.amount_gbp).toFixed(2)}
                  </span>

                  {tx.status === "paid" && tx.payout_batch_id ? (
                    <Link
                      href={`/profile/wallet/receipt/${tx.id}`}
                      className="text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 transition"
                    >
                      View receipt
                    </Link>
                  ) : null}
                </div>
              </div>
            )
          })}

          {!txs?.length && (
            <div className="px-5 py-10 text-sm text-gray-500 dark:text-white/60">
              No wallet activity yet. Make predictions, climb the leaderboard, and invite friends.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}