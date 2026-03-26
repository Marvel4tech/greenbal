import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createServerClientWrapper } from "@/lib/supabase/server"
import AdminReferralTable from "@/components/AdminReferralTable"

export default async function AdminReferralsPage() {
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

  const { data: referrals } = await supabase
    .from("referrals")
    .select(`
      id,
      referrer_id,
      referred_user_id,
      reward_amount_gbp,
      played_first_game,
      reached_top20,
      status,
      expires_at,
      unlocked_at,
      expired_at,
      voided_at,
      admin_note,
      created_at,
      referrer:profiles!referrals_referrer_id_fkey(username),
      referred:profiles!referrals_referred_user_id_fkey(username)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-0 py-10">
      {/* Back to Dashboard Button */}
      <div className="mb-6">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Admin Referrals
        </h1>
        <p className="mt-2 text-gray-600 dark:text-white/70 max-w-3xl">
          Monitor referral bonuses, review status, and void suspicious rewards.
        </p>
      </div>

      <div className="mt-7">
        <AdminReferralTable initialReferrals={referrals || []} />
      </div>
    </div>
  )
}