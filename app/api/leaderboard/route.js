import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const url = new URL(request.url);

    const weekQuery = url.searchParams.get("week"); // "current" | null
    let weekStart = url.searchParams.get("week_start") || null;

    // helper to get current week_start (Tue -> Mon UTC) from RPC
    const getCurrentWeekStart = async () => {
      const { data, error } = await supabaseAdmin.rpc("week_start_tuesday", {
        ts: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      return data; // "YYYY-MM-DD"
    };

    // ✅ Mode A: /api/leaderboard?week=current -> return { week_start }
    if (weekQuery === "current") {
      const current = await getCurrentWeekStart();
      return NextResponse.json({ week_start: current });
    }

    // ✅ Mode B: /api/leaderboard?week_start=YYYY-MM-DD -> fetch that week
    // ✅ Default: current week if not provided
    if (!weekStart) {
      weekStart = await getCurrentWeekStart();
    }

    const { data, error } = await supabaseAdmin
      .from("leaderboard_weekly")
      .select(`
        user_id,
        week_start,
        points_total,
        correct_total,
        predictions_total,
        updated_at,
        profiles:profiles (
          username,
          email
        )
      `)
      .eq("week_start", weekStart)
      .order("points_total", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []).map((r, i) => ({
      rank: i + 1,
      id: r.user_id,
      week_start: r.week_start,
      name: r.profiles?.username || "Unknown",
      email: r.profiles?.email || "",
      points: r.points_total ?? 0,
      correct_total: r.correct_total ?? 0,
      predictions_total: r.predictions_total ?? 0,
      updated_at: r.updated_at,
    }));

    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
