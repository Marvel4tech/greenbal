import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClientWrapper } from "@/lib/supabase/server"

function getPreviousCompletedWeekRange() {
  const now = new Date()
  const day = now.getDay()

  const currentWeekStart = new Date(now)
  const diffToTuesday = day >= 2 ? day - 2 : 7 - (2 - day)
  currentWeekStart.setDate(now.getDate() - diffToTuesday)
  currentWeekStart.setHours(0, 0, 0, 0)

  const prevWeekStart = new Date(currentWeekStart)
  prevWeekStart.setDate(currentWeekStart.getDate() - 7)

  const prevWeekEnd = new Date(prevWeekStart)
  prevWeekEnd.setDate(prevWeekStart.getDate() + 6)

  const toDate = (d) => d.toISOString().slice(0, 10)

  return {
    weekStart: toDate(prevWeekStart),
    weekEnd: toDate(prevWeekEnd),
  }
}

function getWeeklyRewardAmount(rank) {
  if ([1, 2, 3, 4, 5].includes(rank)) return 10
  return 0
}

async function runSettlement({ adminUserId = null }) {
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

  const { weekStart, weekEnd } = getPreviousCompletedWeekRange()

  const { data: existingRun, error: existingRunError } = await adminDb
    .from("weekly_reward_runs")
    .select("id, week_start")
    .eq("week_start", weekStart)
    .maybeSingle()

  if (existingRunError) {
    throw new Error(existingRunError.message)
  }

  if (existingRun) {
    return {
      success: true,
      alreadySettled: true,
      weekStart,
      weekEnd,
      winnersCreated: 0,
    }
  }

  const { error: rankError } = await adminDb.rpc(
    "refresh_leaderboard_weekly_ranks",
    { p_week_start: weekStart }
  )

  if (rankError) {
    throw new Error(rankError.message)
  }

  const { data: winners, error: winnersError } = await adminDb
    .from("leaderboard_weekly")
    .select("id, user_id, week_start, rank_position")
    .eq("week_start", weekStart)
    .in("rank_position", [1, 2, 3, 4, 5])
    .order("rank_position", { ascending: true })

  if (winnersError) {
    throw new Error(winnersError.message)
  }

  if (!winners?.length) {
    const { error: runInsertError } = await adminDb
      .from("weekly_reward_runs")
      .insert({
        week_start: weekStart,
        week_end: weekEnd,
        status: "completed",
        created_by: adminUserId,
      })

    if (runInsertError) {
      throw new Error(runInsertError.message)
    }

    return {
      success: true,
      alreadySettled: false,
      weekStart,
      weekEnd,
      winnersCreated: 0,
    }
  }

  let winnersCreated = 0

  for (const winner of winners) {
    const amount = getWeeklyRewardAmount(winner.rank_position)
    if (!amount) continue

    const { data: existingTx, error: existingTxError } = await adminDb
      .from("wallet_transactions")
      .select("id")
      .eq("user_id", winner.user_id)
      .eq("type", "weekly_top5_reward")
      .eq("week_start", weekStart)
      .eq("week_end", weekEnd)
      .maybeSingle()

    if (existingTxError) {
      throw new Error(existingTxError.message)
    }

    if (existingTx) {
      continue
    }

    let { data: wallet, error: walletFetchError } = await adminDb
      .from("wallets")
      .select("user_id, available_balance_gbp, pending_balance_gbp")
      .eq("user_id", winner.user_id)
      .maybeSingle()

    if (walletFetchError) {
      throw new Error(walletFetchError.message)
    }

    if (!wallet) {
      const { data: newWallet, error: walletCreateError } = await adminDb
        .from("wallets")
        .insert({
          user_id: winner.user_id,
          available_balance_gbp: 0,
          pending_balance_gbp: 0,
        })
        .select("user_id, available_balance_gbp, pending_balance_gbp")
        .single()

      if (walletCreateError) {
        throw new Error(walletCreateError.message)
      }

      wallet = newWallet
    }

    const { error: txInsertError } = await adminDb
      .from("wallet_transactions")
      .insert({
        user_id: winner.user_id,
        type: "weekly_top5_reward",
        amount_gbp: amount,
        status: "pending",
        week_start: weekStart,
        week_end: weekEnd,
      })

    if (txInsertError) {
      throw new Error(txInsertError.message)
    }

    const { error: walletUpdateError } = await adminDb
      .from("wallets")
      .update({
        pending_balance_gbp:
          Number(wallet.pending_balance_gbp || 0) + Number(amount),
      })
      .eq("user_id", winner.user_id)

    if (walletUpdateError) {
      throw new Error(walletUpdateError.message)
    }

    winnersCreated += 1
  }

  const { error: runInsertError } = await adminDb
    .from("weekly_reward_runs")
    .insert({
      week_start: weekStart,
      week_end: weekEnd,
      status: "completed",
      created_by: adminUserId,
    })

  if (runInsertError) {
    throw new Error(runInsertError.message)
  }

  return {
    success: true,
    alreadySettled: false,
    weekStart,
    weekEnd,
    winnersCreated,
  }
}

export async function POST() {
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

    const result = await runSettlement({ adminUserId: user.id })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    )
  }
}

export { runSettlement }