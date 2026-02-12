import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const url = new URL(request.url);

    // Optional: allow fetching a specific week
    let weekStart = url.searchParams.get("week_start") || null;

    // Default: current week (Tue -> Mon) in UTC
    if (!weekStart) {
      const { data, error: weekErr } = await supabaseAdmin.rpc("week_start_tuesday", {
        ts: new Date().toISOString(),
      });

      if (weekErr) {
        return NextResponse.json({ error: weekErr.message }, { status: 500 });
      }

      weekStart = data;
    }

    const { data, error } = await supabaseAdmin
      .from("leaderboard_weekly")
      .select(`
        user_id,
        week_start,
        points_total,
        updated_at,
        profiles:profiles (
          username
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
      points: r.points_total ?? 0,
      duration: "—", // later
    }));

    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
