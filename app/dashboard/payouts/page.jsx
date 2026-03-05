import { redirect } from "next/navigation"
import { createServerClientWrapper } from "@/lib/supabase/server"
import AdminPayoutTable from "@/components/AdminPayoutTable"

export default async function AdminPayoutsPage() {
  const supabase = await createServerClientWrapper()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Verify admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .single()

  if (adminProfile?.role !== "admin") redirect("/")

  // Fetch ONLY weekly top5 reward transactions + usernames
  const { data: txs } = await supabase
    .from("wallet_transactions")
    .select(`
      id, user_id, week_start, week_end, amount_gbp, status, receipt_path, paid_at, created_at, type,
      profiles:profiles ( username )
    `)
    .eq("type", "weekly_top5_reward")
    .neq("status", "voided")
    .order("week_end", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500)

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-0 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Admin Payouts
      </h1>
      <p className="mt-2 text-gray-600 dark:text-white/70 max-w-3xl">
        Weekly Top 5 rewards. Upload proof and mark winners as{" "}
        <span className="text-primary font-semibold">Paid</span>.
      </p>

      <div className="mt-7">
        <AdminPayoutTable initialTxs={txs || []} />
      </div>
    </div>
  )
}