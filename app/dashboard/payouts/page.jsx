import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createServerClientWrapper } from "@/lib/supabase/server"
import AdminPayoutTable from "@/components/AdminPayoutTable"
import RunWeeklyPayoutsButton from "@/components/RunWeeklyPayoutsButton"

export default async function AdminPayoutsPage() {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: adminProfile, error: adminErr } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .single()

  if (adminErr) {
    console.error("Admin profile error:", adminErr.message)
  }

  if (adminProfile?.role !== "admin") {
    redirect("/")
  }

  const { data: txsRaw, error: txErr } = await supabase
    .from("wallet_transactions")
    .select(
      "id, user_id, week_start, week_end, amount_gbp, status, receipt_path, paid_at, created_at, type, note"
    )
    .eq("type", "weekly_top5_reward")
    .order("week_end", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500)

  if (txErr) {
    console.error("Transactions fetch error:", txErr.message)
  }

  const txs = txsRaw || []

  const userIds = Array.from(new Set(txs.map((t) => t.user_id).filter(Boolean)))

  let profilesMap = new Map()

  if (userIds.length) {
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds)

    if (profErr) {
      console.error("Profiles fetch error:", profErr.message)
    } else {
      profilesMap = new Map((profiles || []).map((p) => [p.id, p.username]))
    }
  }

  const txsWithProfiles = txs.map((t) => ({
    ...t,
    profiles: { username: profilesMap.get(t.user_id) || null },
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-0 py-10">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Admin Dashboard</span>
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Admin Payouts
      </h1>

      <p className="mt-2 text-gray-600 dark:text-white/70 max-w-3xl">
        Weekly Top 5 rewards. Generate the winners, approve rewards, upload proof,
        and mark payouts as paid.
      </p>

      <div className="mt-6">
        <RunWeeklyPayoutsButton />
      </div>

      <div className="mt-7">
        <AdminPayoutTable initialTxs={txsWithProfiles} />
      </div>
    </div>
  )
}