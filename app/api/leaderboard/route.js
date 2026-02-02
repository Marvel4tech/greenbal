import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from("leaderboard")
        .select(`
            user_id,
            points_total,
            correct_total,
            predictions_total,
            updated_at,
            profiles:profiles (
                username,
                email
            )
        `)
        .order("points_total", { ascending: false })
        .limit(50);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Flatten into what your UI expects
    const rows = (data || []).map((r) => ({
        id: r.user_id,
        name: r.profiles?.username || "Unknown",
        email: r.profiles?.email || "",
        points: r.points_total ?? 0,
        correct_total: r.correct_total ?? 0,
        predictions_total: r.predictions_total ?? 0,
        updated_at: r.updated_at,
    }));

    return NextResponse.json(rows);
}