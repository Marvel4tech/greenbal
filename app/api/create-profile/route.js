import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

function getReferralExpiryIso(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

export async function POST(request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "Supabase URL not configured" },
        { status: 500 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      )
    }

    const supabase = createAdminClient()

    const body = await request.json()
    const { userId, username, email } = body
    let referralCode = (body?.referralCode || "").trim().toUpperCase()

    if (!userId || !username || !email) {
      return NextResponse.json(
        { error: "userId, username and email are required" },
        { status: 400 }
      )
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        profile: existingProfile,
        alreadyExists: true,
      })
    }

    if (!referralCode) {
      const { data: authUserData, error: authUserError } =
        await supabase.auth.admin.getUserById(userId)

      if (!authUserError && authUserData?.user) {
        referralCode = String(
          authUserData.user.user_metadata?.referred_by_code || ""
        )
          .trim()
          .toUpperCase()
      }
    }

    let referredBy = null

    if (referralCode) {
      const { data: referrer, error: referrerError } = await supabase
        .from("profiles")
        .select("id, referral_code, is_banned")
        .eq("referral_code", referralCode)
        .maybeSingle()

      if (referrerError) {
        return NextResponse.json(
          { error: referrerError.message },
          { status: 500 }
        )
      }

      if (referrer && !referrer.is_banned && referrer.id !== userId) {
        referredBy = referrer.id
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: userId,
          username,
          email,
          role: "user",
          referred_by: referredBy,
        },
      ])
      .select()
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    if (referredBy) {
      const { data: existingReferral, error: existingReferralError } =
        await supabase
          .from("referrals")
          .select("id")
          .eq("referred_user_id", userId)
          .maybeSingle()

      if (existingReferralError) {
        return NextResponse.json(
          { error: existingReferralError.message },
          { status: 500 }
        )
      }

      if (!existingReferral) {
        const { error: referralInsertError } = await supabase
          .from("referrals")
          .insert({
            referrer_id: referredBy,
            referred_user_id: userId,
            reward_amount_gbp: 2.0,
            status: "pending",
            played_first_game: false,
            reached_top20: false,
            expires_at: getReferralExpiryIso(30),
          })

        if (referralInsertError) {
          return NextResponse.json(
            { error: referralInsertError.message },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}