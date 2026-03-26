import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerClientWrapper } from "@/lib/supabase/server"
import ReferralClient from "@/components/ReferralClient"
import { ArrowLeft } from "lucide-react"

export default async function ReferralsPage() {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, referral_code")
    .eq("id", user.id)
    .single()

  const { data: referrals } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${profile?.referral_code}`

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-0 py-10">
      {/* Back to Home Button */}
      <div className="mb-6">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <ReferralClient
        referralCode={profile?.referral_code || ""}
        referralLink={referralLink}
        referrals={referrals || []}
      />
    </div>
  )
}