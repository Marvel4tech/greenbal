import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from("games")
        .select("*")
        .order("match_time", { ascending:false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data)
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { homeTeam, awayTeam, matchTime } = body;

        if ( !homeTeam || !awayTeam || !matchTime ) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from("games")
            .insert([
                {
                    home_team: homeTeam,
                    away_team: awayTeam,
                    match_time: matchTime,
                    status: "upcoming"
                }
            ])
            .select();

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });

            return NextResponse.json(data[0]);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}