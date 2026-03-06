import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: row, error } = await supabase
    .from("leaderboard_weekly")
    .select("user_id, week_start, points_total, correct_total, predictions_total")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const predictions = Number(row?.predictions_total || 0)
  const correct = Number(row?.correct_total || 0)
  const points = Number(row?.points_total || 0)

  const winRate =
    predictions > 0 ? Math.round((correct / predictions) * 100) : 0

  return NextResponse.json({
    predictions,
    correct,
    points,
    winRate,
    weekStart: row?.week_start || null,
    lastLogin: user.last_sign_in_at,
  })
}