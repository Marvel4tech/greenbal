import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerClientWrapper } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"
import AdminWalletPayoutsConsole from "@/components/AdminWalletPayoutsConsole"
import AdminWeeklySettlementButton from "@/components/AdminWeeklySettlementButton"
import { ArrowLeft } from "lucide-react"

async function getUsernamesMap(userIds = []) {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (!ids.length) return {}

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username")
    .in("id", ids)

  if (error || !data) {
    console.error("profiles username map error:", error)
    return {}
  }

  return data.reduce((acc, row) => {
    acc[row.id] = row.username
    return acc
  }, {})
}

export default async function AdminPayoutsPage() {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) redirect("/login")

  const { data: adminProfile, error: adminProfileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (adminProfileError || adminProfile?.role !== "admin") redirect("/")

  const { data: pendingTxsBase } = await supabaseAdmin
    .from("wallet_transactions")
    .select(`
      id,
      user_id,
      amount_gbp,
      type,
      status,
      created_at,
      week_start,
      week_end,
      payout_batch_id
    `)
    .eq("status", "pending")
    .eq("type", "weekly_top5_reward")
    .order("created_at", { ascending: false })

  const { data: availableTxsBase } = await supabaseAdmin
    .from("wallet_transactions")
    .select(`
      id,
      user_id,
      amount_gbp,
      type,
      status,
      created_at,
      week_start,
      week_end,
      payout_batch_id
    `)
    .eq("status", "available")
    .is("payout_batch_id", null)
    .order("created_at", { ascending: false })

  const { data: payoutBatchesBase } = await supabaseAdmin
    .from("payout_batches")
    .select(`
      id,
      user_id,
      total_amount_gbp,
      receipt_path,
      paid_at,
      created_at
    `)
    .order("paid_at", { ascending: false })

  const { data: paidTxsBase } = await supabaseAdmin
    .from("wallet_transactions")
    .select(`
      id,
      user_id,
      payout_batch_id,
      type,
      amount_gbp,
      week_start,
      week_end,
      paid_at
    `)
    .eq("status", "paid")
    .not("payout_batch_id", "is", null)
    .order("paid_at", { ascending: false })

  const weekRows = [
    ...(pendingTxsBase || []),
    ...(availableTxsBase || []),
    ...(paidTxsBase || []),
  ]
    .map((tx) => tx.week_start)
    .filter(Boolean)

  const weekOptions = [...new Set(weekRows)].sort((a, b) => (a < b ? 1 : -1))

  const usernameMap = await getUsernamesMap([
    ...(pendingTxsBase || []).map((tx) => tx.user_id),
    ...(availableTxsBase || []).map((tx) => tx.user_id),
    ...(payoutBatchesBase || []).map((b) => b.user_id),
    ...(paidTxsBase || []).map((tx) => tx.user_id),
  ])

  const pendingTxs = (pendingTxsBase || []).map((tx) => ({
    ...tx,
    profiles: {
      username: usernameMap[tx.user_id] || null,
    },
  }))

  const availableTxs = (availableTxsBase || []).map((tx) => ({
    ...tx,
    profiles: {
      username: usernameMap[tx.user_id] || null,
    },
  }))

  const paidTxsGrouped = (paidTxsBase || []).reduce((acc, tx) => {
    const key = tx.payout_batch_id
    if (!acc[key]) acc[key] = []
    acc[key].push(tx)
    return acc
  }, {})

  const payoutBatches = (payoutBatchesBase || []).map((batch) => ({
    ...batch,
    profiles: {
      username: usernameMap[batch.user_id] || null,
    },
    txs: paidTxsGrouped[batch.id] || [],
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-0 py-10 space-y-6">
      {/* Back Button */}
      <div className="mb-2">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Admin Wallet Payouts
        </h1>
        <p className="mt-2 text-gray-600 dark:text-white/70 max-w-3xl">
          Approve weekly rewards, pay available wallet balances, and review paid payout history.
        </p>
      </div>

      <AdminWeeklySettlementButton />

      <AdminWalletPayoutsConsole
        pendingTxs={pendingTxs}
        availableTxs={availableTxs}
        payoutBatches={payoutBatches}
        weekOptions={weekOptions}
      />
    </div>
  )
}