import { supabaseAdmin } from "../supabase/supabaseAdmin";

export async function scoreGame(gameId) {
  const { data: game, error: gameError } = await supabaseAdmin
    .from("games")
    .select("id, status, result")
    .eq("id", gameId)
    .single();

  if (gameError) throw new Error(gameError.message);
  if (!game) throw new Error("Game not found");

  const allowedResults = new Set(["homeWin", "draw", "awayWin"]);
  if (game.status !== "finished" || !allowedResults.has(game.result)) {
    throw new Error("Game must be finished with a valid result before scoring");
  }

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
  const perUser = new Map();

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
      prediction: p.prediction,
      points: newPoints,
      scored_at: nowIso,
    };
  });
  

  const { error: updateError } = await supabaseAdmin
    .from("predictions")
    .upsert(updates, { onConflict: "id" });

  if (updateError) throw new Error(updateError.message);

  for (const [userId, agg] of perUser.entries()) {
    const { error: rpcErr } = await supabaseAdmin.rpc("leaderboard_apply_delta", {
      p_user_id: userId,
      p_delta_points: agg.deltaPoints,
      p_delta_correct: agg.deltaCorrect,
      p_delta_predictions: 0, // scoring doesn't change predictions_total
    });
  
    if (rpcErr) throw new Error(rpcErr.message);
  }

  return { scored: preds.length, usersUpdated: perUser.size };
}
