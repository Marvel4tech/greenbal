import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClientWrapper } from "@/lib/supabase/server"

export async function POST(req) {
  try {
    const supabase = await createServerClientWrapper()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await req.json()
    const userId = body?.userId

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: txs, error: txsError } = await adminDb
      .from("wallet_transactions")
      .select("id, amount_gbp")
      .eq("user_id", userId)
      .eq("status", "pending")
      .eq("type", "weekly_top5_reward")

    if (txsError) {
      return NextResponse.json({ error: txsError.message }, { status: 500 })
    }

    if (!txs?.length) {
      return NextResponse.json(
        { error: "No pending weekly rewards to approve" },
        { status: 400 }
      )
    }

    const totalAmount = txs.reduce(
      (sum, tx) => sum + Number(tx.amount_gbp || 0),
      0
    )

    const txIds = txs.map((tx) => tx.id)

    const { error: txUpdateError } = await adminDb
      .from("wallet_transactions")
      .update({
        status: "available",
      })
      .in("id", txIds)

    if (txUpdateError) {
      return NextResponse.json({ error: txUpdateError.message }, { status: 500 })
    }

    const { data: wallet, error: walletError } = await adminDb
      .from("wallets")
      .select("user_id, available_balance_gbp, pending_balance_gbp")
      .eq("user_id", userId)
      .single()

    if (walletError) {
      return NextResponse.json({ error: walletError.message }, { status: 500 })
    }

    const newAvailable =
      Number(wallet.available_balance_gbp || 0) + Number(totalAmount)

    const newPending = Math.max(
      0,
      Number(wallet.pending_balance_gbp || 0) - Number(totalAmount)
    )

    const { error: walletUpdateError } = await adminDb
      .from("wallets")
      .update({
        available_balance_gbp: newAvailable,
        pending_balance_gbp: newPending,
      })
      .eq("user_id", userId)

    if (walletUpdateError) {
      return NextResponse.json({ error: walletUpdateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      approvedTransactionIds: txIds,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    )
  }
}