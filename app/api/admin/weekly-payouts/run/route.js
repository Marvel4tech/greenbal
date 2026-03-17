import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/requireAdmin"
import { getClosedCompetitionWeek } from "@/lib/weeklyWindow"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

export async function POST() {
  const admin = await requireAdmin()

  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status }
    )
  }

  const { weekStart, weekEnd, resetAt } = getClosedCompetitionWeek()

  // Use SERVICE ROLE client here so RLS does not block admin backend work
  const { data: existingLeaderboardRows, error: existingError } =
    await supabaseAdmin
      .from("leaderboard_weekly")
      .select(
        "user_id, week_start, points_total, correct_total, predictions_total, updated_at"
      )
      .eq("week_start", weekStart)
      .order("points_total", { ascending: false })
      .order("correct_total", { ascending: false })
      .order("predictions_total", { ascending: false })
      .order("updated_at", { ascending: true })

  if (existingError) {
    return NextResponse.json(
      {
        error: "Failed to read leaderboard_weekly",
        details: existingError.message,
        weekStart,
        weekEnd,
      },
      { status: 500 }
    )
  }

  if (!existingLeaderboardRows || existingLeaderboardRows.length === 0) {
    return NextResponse.json(
      {
        error: "No leaderboard_weekly rows found for the closed week",
        weekStart,
        weekEnd,
        hint: "The rows may exist in SQL but be hidden from non-service-role clients by RLS.",
      },
      { status: 400 }
    )
  }

  const top5 = existingLeaderboardRows.slice(0, 5)

  const winnersPayload = top5.map((row, index) => ({
    week_start: weekStart,
    week_end: weekEnd,
    rank: index + 1,
    user_id: row.user_id,
    points: Number(row.points_total || 0),
  }))

  const { data: winners, error: winnersError } = await supabaseAdmin
    .from("weekly_winners")
    .upsert(winnersPayload, {
      onConflict: "week_start,week_end,user_id",
    })
    .select()

  if (winnersError) {
    return NextResponse.json(
      {
        error: "Failed to upsert weekly_winners",
        details: winnersError.message,
        weekStart,
        weekEnd,
        winnersPayload,
      },
      { status: 500 }
    )
  }

  const txPayload = winnersPayload.map((winner) => ({
    user_id: winner.user_id,
    week_start: winner.week_start,
    week_end: winner.week_end,
    amount_gbp: 10.0,
    type: "weekly_top5_reward",
    status: "pending",
    note: `Weekly Top 5 reward for rank ${winner.rank}. Reset processed at ${resetAt}`,
  }))

  const { data: transactions, error: txError } = await supabaseAdmin
    .from("wallet_transactions")
    .upsert(txPayload, {
      onConflict: "user_id,week_start,week_end,type",
    })
    .select()

  if (txError) {
    return NextResponse.json(
      {
        error: "Failed to upsert wallet_transactions",
        details: txError.message,
        weekStart,
        weekEnd,
        txPayload,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    weekStart,
    weekEnd,
    leaderboardRowsFound: existingLeaderboardRows.length,
    winnersCount: winners?.length || 0,
    transactionsCount: transactions?.length || 0,
    winners,
    transactions,
  })
}