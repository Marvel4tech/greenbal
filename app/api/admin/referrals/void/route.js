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

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const referralId = body?.referralId
    const adminNote = (body?.adminNote || "").trim() || null

    if (!referralId) {
      return NextResponse.json({ error: "Referral ID is required" }, { status: 400 })
    }

    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select("*")
      .eq("id", referralId)
      .single()

    if (referralError || !referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    if (referral.status === "voided") {
      return NextResponse.json({ error: "Referral already voided" }, { status: 400 })
    }

    if (referral.status === "unlocked") {
      return NextResponse.json(
        { error: "Unlocked referrals cannot be voided from this action" },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const { data: updatedReferral, error: updateReferralError } = await supabase
      .from("referrals")
      .update({
        status: "voided",
        voided_at: now,
        voided_by: user.id,
        admin_note: adminNote,
      })
      .eq("id", referralId)
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
      .single()

    if (updateReferralError) {
      return NextResponse.json({ error: updateReferralError.message }, { status: 500 })
    }

    const { data: tx } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("referral_id", referralId)
      .eq("type", "referral_bonus")
      .eq("status", "pending")
      .maybeSingle()

    if (tx) {
      const { error: txUpdateError } = await supabase
        .from("wallet_transactions")
        .update({
          status: "voided",
          voided_at: now,
          voided_by: user.id,
          admin_note: adminNote,
        })
        .eq("id", tx.id)

      if (txUpdateError) {
        return NextResponse.json({ error: txUpdateError.message }, { status: 500 })
      }

      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, pending_balance_gbp")
        .eq("user_id", tx.user_id)
        .single()

      if (wallet?.id) {
        const newPending = Math.max(
          0,
          Number(wallet.pending_balance_gbp || 0) - Number(tx.amount_gbp || 0)
        )

        const { error: walletError } = await supabase
          .from("wallets")
          .update({
            pending_balance_gbp: newPending,
          })
          .eq("id", wallet.id)

        if (walletError) {
          return NextResponse.json({ error: walletError.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true, referral: updatedReferral })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    )
  }
}