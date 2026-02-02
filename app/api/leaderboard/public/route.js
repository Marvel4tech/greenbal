import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from("leaderboard")
        .select(`
            user_id,
            points_total,
            updated_at,
            profiles:profiles (
                username
            )
        `)
        .order("points_total", { ascending: false })
        .limit(50);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []).map((r) => ({
        id: r.user_id,
        name: r.profiles?.username || "Unknown",
        points: r.points_total ?? 0,
        // duration will come later once we implement timer logic
        duration: "—",
    }))

    return NextResponse.json(rows);
}