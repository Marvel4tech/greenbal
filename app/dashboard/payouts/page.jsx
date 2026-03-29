/* import { redirect } from "next/navigation"
import { createServerClientWrapper } from "@/lib/supabase/server"
import AdminWalletPayoutTable from "@/components/AdminWalletPayoutTable"
import AdminWeeklySettlementButton from "@/components/AdminWeeklySettlementButton"

export default async function AdminPayoutsPage() {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (adminProfile?.role !== "admin") redirect("/")

  const { data: availableTxs } = await supabase
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
      payout_batch_id,
      profiles:profiles(username)
    `)
    .eq("status", "available")
    .is("payout_batch_id", null)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-0 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Admin Wallet Payouts
        </h1>
        <p className="mt-2 text-gray-600 dark:text-white/70 max-w-3xl">
          Pay users from their available wallet balance. One payout can cover weekly rewards, referral bonuses, and future bonus types.
        </p>
      </div>

      <AdminWeeklySettlementButton />

      <AdminWalletPayoutTable initialTxs={availableTxs || []} />
    </div>
  )
} */

import { redirect } from "next/navigation"
import { createServerClientWrapper } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"
import AdminWalletPayoutTable from "@/components/AdminWalletPayoutTable"
import AdminWeeklySettlementButton from "@/components/AdminWeeklySettlementButton"

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

  const { data: availableTxsBase, error: txError } = await supabaseAdmin
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

  if (txError) {
    console.error("admin payouts fetch error:", txError)
  }

  const usernameMap = await getUsernamesMap(
    (availableTxsBase || []).map((tx) => tx.user_id)
  )

  const availableTxs = (availableTxsBase || []).map((tx) => ({
    ...tx,
    profiles: {
      username: usernameMap[tx.user_id] || null,
    },
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-0 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Admin Wallet Payouts
        </h1>
        <p className="mt-2 text-gray-600 dark:text-white/70 max-w-3xl">
          Pay users from their available wallet balance. One payout can cover weekly rewards, referral bonuses, and future bonus types.
        </p>
      </div>

      <AdminWeeklySettlementButton />

      <AdminWalletPayoutTable initialTxs={availableTxs} />
    </div>
  )
}