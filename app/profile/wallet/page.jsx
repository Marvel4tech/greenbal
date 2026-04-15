import Link from "next/link"
import { redirect } from "next/navigation"
import { createServerClientWrapper } from "@/lib/supabase/server"
import { ArrowLeft, ChevronDown } from "lucide-react"

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
    return `Paid: ${new Date(tx.paid_at).toLocaleString("en-GB")}`
  }

  if (tx.expires_at && tx.status === "expired") {
    return `Expired: ${new Date(tx.expires_at).toLocaleString("en-GB")}`
  }

  return `Created: ${new Date(tx.created_at).toLocaleString("en-GB")}`
}

function buildHistoryRows(txs = []) {
  const groupedPaid = new Map()
  const normalRows = []

  for (const tx of txs) {
    // Group only paid transactions that were paid together
    if (tx.status === "paid" && tx.payout_batch_id) {
      const key = tx.payout_batch_id

      if (!groupedPaid.has(key)) {
        groupedPaid.set(key, {
          id: key,
          kind: "paid_group",
          status: "paid",
          payout_batch_id: tx.payout_batch_id,
          paid_at: tx.paid_at,
          created_at: tx.created_at,
          receipt_path: tx.receipt_path || null,
          amount_gbp: 0,
          items: [],
        })
      }

      const group = groupedPaid.get(key)
      group.amount_gbp += Number(tx.amount_gbp || 0)
      group.items.push(tx)

      // keep latest paid_at/created_at just in case
      if (tx.paid_at && (!group.paid_at || new Date(tx.paid_at) > new Date(group.paid_at))) {
        group.paid_at = tx.paid_at
      }
      if (tx.created_at && new Date(tx.created_at) > new Date(group.created_at)) {
        group.created_at = tx.created_at
      }
      if (!group.receipt_path && tx.receipt_path) {
        group.receipt_path = tx.receipt_path
      }
    } else {
      normalRows.push({
        ...tx,
        kind: "single",
      })
    }
  }

  const groupedRows = Array.from(groupedPaid.values())

  return [...normalRows, ...groupedRows].sort((a, b) => {
    const da = new Date(a.paid_at || a.created_at).getTime()
    const db = new Date(b.paid_at || b.created_at).getTime()
    return db - da
  })
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
      "id, type, week_start, week_end, amount_gbp, status, paid_at, created_at, expires_at, receipt_path, payout_batch_id"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const available = Number(wallet?.available_balance_gbp || 0)
  const pending = Number(wallet?.pending_balance_gbp || 0)

  const historyRows = buildHistoryRows(txs || [])

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-0 py-10">
      <div className="mb-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Dashboard</span>
        </Link>
      </div>

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
          {historyRows.map((row) => {
            const isPaidGroup = row.kind === "paid_group"

            return (
              <div
                key={isPaidGroup ? `paid-group-${row.id}` : row.id}
                className="px-5 py-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="min-w-0">
                    {isPaidGroup ? (
                      <>
                        <p className="text-sm text-gray-900 dark:text-white truncate">
                          Payout Received
                          <span className="text-gray-400 dark:text-white/50"> • </span>
                          <span className="text-gray-600 dark:text-white/70">
                            {row.items.length} reward{row.items.length > 1 ? "s" : ""}
                          </span>
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusPill status="paid" />
                          <p className="text-xs text-gray-500 dark:text-white/50">
                            Paid: {new Date(row.paid_at || row.created_at).toLocaleString("en-GB")}
                          </p>
                        </div>

                        <details className="mt-3 group">
                          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-gray-600 dark:text-white/60">
                            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                            Show breakdown
                          </summary>

                          <div className="mt-3 space-y-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3">
                            {row.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                              >
                                <div className="text-gray-700 dark:text-white/80">
                                  {transactionTitle(item)}
                                  {item.week_start && item.week_end
                                    ? ` • ${item.week_start} → ${item.week_end}`
                                    : ""}
                                </div>

                                <div className="font-semibold text-gray-900 dark:text-white">
                                  £{Number(item.amount_gbp).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900 dark:text-white truncate">
                          {transactionTitle(row)}
                          {transactionSubtitle(row) ? (
                            <>
                              <span className="text-gray-400 dark:text-white/50"> • </span>
                              <span className="text-gray-600 dark:text-white/70">
                                {transactionSubtitle(row)}
                              </span>
                            </>
                          ) : null}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusPill status={row.status} />
                          <p className="text-xs text-gray-500 dark:text-white/50">
                            {transactionDateLabel(row)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      £{Number(row.amount_gbp).toFixed(2)}
                    </span>

                    {isPaidGroup && row.items?.length ? (
                      <Link
                        href={`/profile/wallet/receipt/${row.items[0].id}`}
                        className="text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 transition"
                      >
                        View receipt
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}

          {!historyRows.length && (
            <div className="px-5 py-10 text-sm text-gray-500 dark:text-white/60">
              No wallet activity yet. Make predictions, climb the leaderboard, and invite friends.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}