import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const url = new URL(request.url);

    // Optional: allow fetching a specific week
    // e.g. /api/leaderboard?week_start=2026-02-04
    let weekStart = url.searchParams.get("week_start") || null;

    // Default: current week (Tue -> Mon) in UTC
    if (!weekStart) {
      const { data, error: weekErr } = await supabaseAdmin.rpc("week_start_tuesday", {
        ts: new Date().toISOString(),
      });

      if (weekErr) {
        return NextResponse.json({ error: weekErr.message }, { status: 500 });
      }

      // Supabase returns the function result in `data`
      weekStart = data;
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

    const rows = (data || []).map((r) => ({
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
