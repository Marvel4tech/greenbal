import { NextResponse } from "next/server";
import { createServerClientWrapper } from "@/lib/supabase/server";

// GET: return current user's predictions (optionally filtered by game ids)
export async function GET(request) {
    const supabase = await createServerClientWrapper();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url);
    const gameIdsParam = url.searchParams.get("game_ids"); // comma-separated
    const gameIds = gameIdsParam ? gameIdsParam.split(",").filter(Boolean) : null;

    let query = supabase
        .from("predictions")
        .select("id, game_id, prediction, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (gameIds && gameIds.length > 0) {
        query = query.in("game_id", gameIds);
    }
    
    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
    
}

// POST: create a prediction for a game
export async function POST(request) {
    const supabase = await createServerClientWrapper();

    const { data: {user}, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { game_id, prediction } = body;

    const allowed = new Set(["homeWin", "draw", "awayWin"])
    if (!game_id || !prediction || !allowed.has(prediction)) {
        return NextResponse.json(
          { error: "game_id and valid prediction are required (homeWin/draw/awayWin)" },
          { status: 400 }
        );
    }

    // 1) Check game exists and hasn't started / finished
    const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id, match_time, status")
        .eq("id", game_id)
        .single();

    if (gameError || !game) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const matchTime = new Date(game.match_time);
    const now = new Date();

    if (game.status === "finished") {
        return NextResponse.json({ error: "Game already finished" }, { status: 400 });
    }

    if (now >= matchTime) {
        return NextResponse.json({ error: "Predictions are closed for this game" }, { status: 400 });
    }

    // 2) Insert prediction (user_id default auth.uid() is fine, but we set explicitly too)
    // NOTE: If you later create the UNIQUE index (user_id, game_id), duplicates will be blocked at DB level.
    const { data: inserted, error: insertError } = await supabase
        .from("predictions")
        .insert([{ user_id: user.id, game_id, prediction }])
        .select("id, game_id, prediction, created_at")
        .single();

    if (insertError) {
        // If unique index exists, duplicate insert typically throws 23505
        // Supabase error codes vary, so we also check message
        const msg = insertError.message?.toLowerCase?.() || "";
        if (msg.includes("duplicate") || msg.includes("unique")) {
            return NextResponse.json({ error: "You already predicted this game" }, { status: 409 });
        }
    
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(inserted, { status: 201 });
}