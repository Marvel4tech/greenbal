import { supabaseAdmin } from "../supabase/supabaseAdmin";

export async function scoreGame(gameId) {
    // 1) Get the game (result + status + time)
    const { data: game, error: gameError } = await supabaseAdmin
        .from("games")
        .select("id, status, result")
        .eq("id", gameId)
        .single();

    if (gameError) throw new Error(gameError.message);
    if (!game) throw new Error("Game not found");

    if (game.status !== "finished" || !game.result) {
        throw new Error("Game must be finished with a result before scoring");
    }

    // 2) Get unscored predictions for this game
    const { data: preds, error: predsError } = await supabaseAdmin
        .from("predictions")
        .select("id, user_id, prediction")
        .eq("game_id", gameId)
        .is("scored_at", null);
    
    if (predsError) throw new Error(predsError.message);
    if (!preds || preds.length === 0) return { scored: 0 };

    // 3) Compute points for each prediction (3/1/0)
    const computePoints = (pred, result) => {
        if (pred !== result) return 0;
        if (result === "draw") return 1;
        return 3; // homeWin or awayWin correct
    }

    const updates = preds.map((p) => ({
        id: p.id,
        points: computePoints(p.prediction, game.result),
        scored_at: new Date().toISOString(),
    }));

    // 4) Update predictions with points (bulk update via upsert)
    const { error: updateError } = supabaseAdmin
        .from("predictions")
        .upsert(updates, { onConflict: "id" });

    if (updateError) throw new Error(updateError.message);

    // 5) Update leaderboard totals per user
    // aggregate points/correct/total per user from what we scored now
    const perUser = new Map();
    for (let i = 0; i < preds.length; i++) {
        const p = preds[i];
        const pts = updates[i].points;

        const cur = perUser.get(p.user_id) || { addPoints: 0, addCorrect: 0, addTotal: 0 };
        cur.addPoints += pts;
        cur.addTotal += 1;
        if (pts > 0) cur.addCorrect += 1; // correct means they matched result (win or draw)
        perUser.set(p.user_id, cur);
    }

    // apply increments
    for (const [userId, agg] of perUser.entries()) {
        const { data: row, error: lbFetchErr } = await supabaseAdmin
            .from("leaderboard")
            .select("user_id, points_total, correct_total, predictions_total")
            .eq("user_id", userId)
            .single();
        
        if (lbFetchErr) throw new Error(lbFetchErr.message);

        const { error: lbUpdateErr } = await supabaseAdmin
            .from("leaderboard")
            .update({
                points_total: (row.points_total || 0) + agg.addPoints,
                correct_total: (row.correct_total || 0) + agg.addCorrect,
                predictions_total: (row.predictions_total || 0) + agg.addTotal,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        
        if (lbUpdateErr) throw new Error(lbUpdateErr.message);
    }

    return { scored: preds.length, usersUpdated: perUser.size };
}