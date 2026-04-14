import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerClientWrapper } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"
import AdminPayoutTable from "@/components/AdminPayoutTable"
import AdminAvailablePayoutsConsole from "@/components/AdminAvailablePayoutsConsole"
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

  const { data: weeklyTxsRaw, error: weeklyErr } = await supabaseAdmin
    .from("wallet_transactions")
    .select(`
      id,
      user_id,
      week_start,
      week_end,
      amount_gbp,
      status,
      receipt_path,
      paid_at,
      created_at,
      type
    `)
    .eq("type", "weekly_top5_reward")
    .neq("status", "voided")
    .order("week_end", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500)

  const { data: availableTxsRaw, error: availableErr } = await supabaseAdmin
    .from("wallet_transactions")
    .select(`
      id,
      user_id,
      week_start,
      week_end,
      amount_gbp,
      status,
      receipt_path,
      paid_at,
      created_at,
      type
    `)
    .eq("status", "available")
    .order("created_at", { ascending: false })

  if (weeklyErr) console.error("weekly tx fetch error:", weeklyErr.message)
  if (availableErr) console.error("available tx fetch error:", availableErr.message)

  const allUserIds = [
    ...((weeklyTxsRaw || []).map((tx) => tx.user_id)),
    ...((availableTxsRaw || []).map((tx) => tx.user_id)),
  ]

  const usernameMap = await getUsernamesMap(allUserIds)

  const weeklyTxs = (weeklyTxsRaw || []).map((tx) => ({
    ...tx,
    profiles: {
      username: usernameMap[tx.user_id] || null,
    },
  }))

  const availableTxs = (availableTxsRaw || []).map((tx) => ({
    ...tx,
    profiles: {
      username: usernameMap[tx.user_id] || null,
    },
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-0 py-10 space-y-6">
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
          Approve weekly rewards, then pay each user’s available balance including referral bonuses.
        </p>
      </div>

      <AdminWeeklySettlementButton />

      <AdminPayoutTable initialTxs={weeklyTxs} />

      <AdminAvailablePayoutsConsole initialTxs={availableTxs} />
    </div>
  )
}