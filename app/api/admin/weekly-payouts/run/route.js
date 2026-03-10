import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/requireAdmin"
import { getClosedCompetitionWeek } from "@/lib/weeklyWindow"

export async function POST() {
  const admin = await requireAdmin()

  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status }
    )
  }

  const { supabase } = admin
  const { weekStart, weekEnd, resetAt } = getClosedCompetitionWeek()

  // 1) Fetch the final top 5 for the closed week
  // Ranking order:
  // - highest points_total
  // - highest correct_total
  // - highest predictions_total
  // - oldest updated_at first as final tie-breaker
  const { data: top5, error: leaderboardError } = await supabase
    .from("leaderboard_weekly")
    .select("user_id, week_start, points_total, correct_total, predictions_total, updated_at")
    .eq("week_start", weekStart)
    .order("points_total", { ascending: false })
    .order("correct_total", { ascending: false })
    .order("predictions_total", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(5)

  if (leaderboardError) {
    return NextResponse.json(
      { error: leaderboardError.message },
      { status: 500 }
    )
  }

  if (!top5 || top5.length === 0) {
    return NextResponse.json(
      {
        error: `No leaderboard_weekly rows found for closed week starting ${weekStart}`,
      },
      { status: 400 }
    )
  }

  // 2) Build weekly_winners rows
  const winnersPayload = top5.map((row, index) => ({
    week_start: weekStart,
    week_end: weekEnd,
    rank: index + 1,
    user_id: row.user_id,
    points: Number(row.points_total || 0),
  }))

  // Upsert makes it retry-safe
  const { data: winners, error: winnersError } = await supabase
    .from("weekly_winners")
    .upsert(winnersPayload, {
      onConflict: "week_start,week_end,user_id",
    })
    .select()

  if (winnersError) {
    return NextResponse.json(
      { error: winnersError.message },
      { status: 500 }
    )
  }

  // 3) Build wallet transaction rows
  const txPayload = winnersPayload.map((winner) => ({
    user_id: winner.user_id,
    week_start: winner.week_start,
    week_end: winner.week_end,
    amount_gbp: 10.0,
    type: "weekly_top5_reward",
    status: "pending",
    note: `Weekly Top 5 reward for rank ${winner.rank}. Reset processed at ${resetAt}`,
  }))

  const { data: transactions, error: txError } = await supabase
    .from("wallet_transactions")
    .upsert(txPayload, {
      onConflict: "user_id,week_start,week_end,type",
    })
    .select()

  if (txError) {
    return NextResponse.json(
      { error: txError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: "Weekly winners and pending wallet rewards created successfully",
    weekStart,
    weekEnd,
    winnersCount: winners?.length || 0,
    transactionsCount: transactions?.length || 0,
    winners,
    transactions,
  })
}