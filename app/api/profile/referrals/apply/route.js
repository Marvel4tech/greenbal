import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

export async function POST(request) {
  try {
    const supabase = await createServerClientWrapper()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const referralCode = (body?.referralCode || "").trim().toUpperCase()

    if (!referralCode) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      )
    }

    // Get current user profile
    const { data: myProfile, error: myProfileError } = await supabase
      .from("profiles")
      .select("id, referred_by, is_banned")
      .eq("id", user.id)
      .single()

    if (myProfileError || !myProfile) {
      return NextResponse.json(
        { error: myProfileError?.message || "Profile not found" },
        { status: 404 }
      )
    }

    if (myProfile.is_banned) {
      return NextResponse.json(
        { error: "You are banned. Contact support." },
        { status: 403 }
      )
    }

    if (myProfile.referred_by) {
      return NextResponse.json(
        { error: "Referral already applied" },
        { status: 400 }
      )
    }

    // Find referrer by code
    const { data: referrer, error: referrerError } = await supabase
      .from("profiles")
      .select("id, referral_code, is_banned")
      .eq("referral_code", referralCode)
      .single()

    if (referrerError || !referrer) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      )
    }

    if (referrer.is_banned) {
      return NextResponse.json(
        { error: "This referral code is not valid" },
        { status: 400 }
      )
    }

    if (referrer.id === user.id) {
      return NextResponse.json(
        { error: "You cannot refer yourself" },
        { status: 400 }
      )
    }

    // Prevent duplicate referral row
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", user.id)
      .maybeSingle()

    if (existingReferral) {
      return NextResponse.json(
        { error: "Referral already exists" },
        { status: 400 }
      )
    }

    // Update referred_by on profile
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        referred_by: referrer.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateProfileError) {
      return NextResponse.json(
        { error: updateProfileError.message },
        { status: 500 }
      )
    }

    // Create referral record
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrer.id,
        referred_user_id: user.id,
        reward_amount_gbp: 2.0,
        status: "pending",
      })
      .select()
      .single()

    if (referralError) {
      return NextResponse.json(
        { error: referralError.message },
        { status: 500 }
      )
    }

    // Ensure referrer has wallet
    let { data: wallet, error: walletFetchError } = await supabase
      .from("wallets")
      .select("id, user_id, available_balance_gbp, pending_balance_gbp")
      .eq("user_id", referrer.id)
      .maybeSingle()

    if (walletFetchError) {
      return NextResponse.json(
        { error: walletFetchError.message },
        { status: 500 }
      )
    }

    if (!wallet) {
      const { data: newWallet, error: walletCreateError } = await supabase
        .from("wallets")
        .insert({
          user_id: referrer.id,
          available_balance_gbp: 0,
          pending_balance_gbp: 0,
        })
        .select()
        .single()

      if (walletCreateError) {
        return NextResponse.json(
          { error: walletCreateError.message },
          { status: 500 }
        )
      }

      wallet = newWallet
    }

    // Create pending wallet transaction
    const { error: txError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: referrer.id,
        amount_gbp: 2.0,
        status: "pending",
        type: "referral_bonus",
        referral_id: referral.id,
        expires_at: referral.expires_at,
      })

    if (txError) {
      return NextResponse.json(
        { error: txError.message },
        { status: 500 }
      )
    }

    // Increase pending wallet balance
    const currentPending = Number(wallet.pending_balance_gbp || 0)

    const { error: walletUpdateError } = await supabase
      .from("wallets")
      .update({
        pending_balance_gbp: currentPending + 2,
      })
      .eq("id", wallet.id)

    if (walletUpdateError) {
      return NextResponse.json(
        { error: walletUpdateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Referral applied successfully",
      referral,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    )
  }
}