import { supabaseAdmin } from "../supabase/supabaseAdmin";

export async function scoreGame(gameId) {
  // 1) Get game
  const { data: game, error: gameError } = await supabaseAdmin
    .from("games")
    .select("id, status, result, match_time")
    .eq("id", gameId)
    .single();

  if (gameError) throw new Error(gameError.message);
  if (!game) throw new Error("Game not found");

  const allowedResults = new Set(["homeWin", "draw", "awayWin"]);
  if (game.status !== "finished" || !allowedResults.has(game.result)) {
    throw new Error("Game must be finished with a valid result before scoring");
  }

  // 2) Fetch predictions for this game (include old points for delta logic)
  const { data: preds, error: predsError } = await supabaseAdmin
    .from("predictions")
    .select("id, user_id, prediction, points")
    .eq("game_id", gameId);

  if (predsError) throw new Error(predsError.message);
  if (!preds || preds.length === 0) return { scored: 0, usersUpdated: 0 };

  const computePoints = (pred, result) => {
    if (pred !== result) return 0;
    if (result === "draw") return 1;
    return 3;
  };

  const nowIso = new Date().toISOString();

  // MUST exist before any usage
  const perUser = new Map(); // userId -> { deltaPoints, deltaCorrect }

  // 3) Build updates + deltas
  const updates = preds.map((p) => {
    const oldPoints = Number(p.points ?? 0);
    const newPoints = computePoints(p.prediction, game.result);

    const deltaPoints = newPoints - oldPoints;
    const deltaCorrect = (newPoints > 0 ? 1 : 0) - (oldPoints > 0 ? 1 : 0);

    if (deltaPoints !== 0 || deltaCorrect !== 0) {
      const cur = perUser.get(p.user_id) || { deltaPoints: 0, deltaCorrect: 0 };
      cur.deltaPoints += deltaPoints;
      cur.deltaCorrect += deltaCorrect;
      perUser.set(p.user_id, cur);
    }

    return {
      id: p.id,
      user_id: p.user_id,
      game_id: gameId,
      prediction: p.prediction, // keep for NOT NULL constraints
      points: newPoints,
      scored_at: nowIso,
    };
  });

  // 4) Update predictions (so points are correct in DB)
  const { error: updateError } = await supabaseAdmin
    .from("predictions")
    .upsert(updates, { onConflict: "id" });

  if (updateError) throw new Error(updateError.message);

  // If nothing changed, stop early
  if (perUser.size === 0) {
    return { scored: preds.length, usersUpdated: 0, note: "No deltas to apply" };
  }

  // 5) Compute the weekly bucket (Tuesday → Monday) based on the game time
  const { data: weekStart, error: weekErr } = await supabaseAdmin.rpc(
    "week_start_tuesday",
    { ts: game.match_time } // if your SQL expects timestamptz, this is fine
  );

  if (weekErr) throw new Error(weekErr.message);

  // 6) Apply deltas to WEEKLY leaderboard
  for (const [userId, agg] of perUser.entries()) {
    const { error: weeklyRpcErr } = await supabaseAdmin.rpc(
      "leaderboard_weekly_apply_delta",
      {
        p_user_id: userId,
        p_week_start: weekStart, // usually a date
        p_delta_points: agg.deltaPoints,
        p_delta_correct: agg.deltaCorrect,
        p_delta_predictions: 0,
      }
    );

    if (weeklyRpcErr) throw new Error(weeklyRpcErr.message);
  }

  // 7) Apply deltas to ALL-TIME leaderboard
  for (const [userId, agg] of perUser.entries()) {
    const { error: rpcErr } = await supabaseAdmin.rpc("leaderboard_apply_delta", {
      p_user_id: userId,
      p_delta_points: agg.deltaPoints,
      p_delta_correct: agg.deltaCorrect,
      p_delta_predictions: 0,
    });

    if (rpcErr) throw new Error(rpcErr.message);
  }

  return { scored: preds.length, usersUpdated: perUser.size, weekStart };
}
