import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClientWrapper()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, referral_code")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select(`
        id,
        reward_amount_gbp,
        played_first_game,
        reached_top20,
        status,
        expires_at,
        created_at,
        referred_user_id
      `)
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })

    if (referralsError) {
      return NextResponse.json({ error: referralsError.message }, { status: 500 })
    }

    return NextResponse.json({
      profile,
      referrals: referrals || [],
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${profile.referral_code}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    )
  }
}