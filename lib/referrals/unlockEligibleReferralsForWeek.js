/* import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function unlockEligibleReferralsForWeek(weekStart) {
  // 1) Get Top 20 users for the completed week
  const { data: topUsers, error: topErr } = await supabaseAdmin
    .from("leaderboard_weekly")
    .select("user_id")
    .eq("week_start", weekStart)
    .lte("rank_position", 20);

  if (topErr) {
    throw new Error(topErr.message);
  }

  const userIds = [...new Set((topUsers || []).map((u) => u.user_id).filter(Boolean))];

  if (!userIds.length) {
    return {
      processed: 0,
      unlocked: 0,
      walletTxCreated: 0,
    };
  }

  // 2) Get referrals for those users
  // include pending + unlocked so old missed bonuses get repaired
  const { data: referrals, error: refErr } = await supabaseAdmin
    .from("referrals")
    .select(`
      id,
      referrer_id,
      referred_user_id,
      reward_amount_gbp,
      played_first_game,
      reached_top20,
      status,
      expires_at,
      unlocked_at
    `)
    .in("referred_user_id", userIds)
    .eq("played_first_game", true)
    .in("status", ["pending", "unlocked"]);

  if (refErr) {
    throw new Error(refErr.message);
  }

  let processed = 0;
  let unlocked = 0;
  let walletTxCreated = 0;

  for (const referral of referrals || []) {
    processed += 1;

    const nowIso = new Date().toISOString();
    const amount = Number(referral.reward_amount_gbp || 0);

    // skip expired referrals
    if (
      referral.expires_at &&
      new Date(referral.expires_at).getTime() < Date.now()
    ) {
      continue;
    }

    // 3) Unlock pending referrals
    if (referral.status === "pending") {
      const { error: unlockErr } = await supabaseAdmin
        .from("referrals")
        .update({
          reached_top20: true,
          status: "unlocked",
          unlocked_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", referral.id);

      if (unlockErr) {
        throw new Error(unlockErr.message);
      }

      unlocked += 1;
    }

    // 4) Ensure wallet exists
    let { data: wallet, error: walletErr } = await supabaseAdmin
      .from("wallets")
      .select("user_id, available_balance_gbp, pending_balance_gbp")
      .eq("user_id", referral.referrer_id)
      .maybeSingle();

    if (walletErr) {
      throw new Error(walletErr.message);
    }

    if (!wallet) {
      const { data: newWallet, error: createWalletErr } = await supabaseAdmin
        .from("wallets")
        .insert({
          user_id: referral.referrer_id,
          available_balance_gbp: 0,
          pending_balance_gbp: 0,
        })
        .select()
        .single();

      if (createWalletErr) {
        throw new Error(createWalletErr.message);
      }

      wallet = newWallet;
    }

    // 5) Check for existing referral transaction
    const { data: existingTx, error: txErr } = await supabaseAdmin
      .from("wallet_transactions")
      .select("id, status")
      .eq("referral_id", referral.id)
      .eq("type", "referral_bonus")
      .maybeSingle();

    if (txErr) {
      throw new Error(txErr.message);
    }

    // 6) Create missing transaction
    if (!existingTx) {
      const { error: insertTxErr } = await supabaseAdmin
        .from("wallet_transactions")
        .insert({
          user_id: referral.referrer_id,
          week_start: null,
          week_end: null,
          amount_gbp: amount,
          type: "referral_bonus",
          status: "available",
          referral_id: referral.id,
          unlocked_at: referral.unlocked_at || nowIso,
          created_at: nowIso,
          updated_at: nowIso,
        });

      if (insertTxErr) {
        throw new Error(insertTxErr.message);
      }

      const { error: walletUpdateErr } = await supabaseAdmin
        .from("wallets")
        .update({
          available_balance_gbp:
            Number(wallet.available_balance_gbp || 0) + amount,
        })
        .eq("user_id", referral.referrer_id);

      if (walletUpdateErr) {
        throw new Error(walletUpdateErr.message);
      }

      walletTxCreated += 1;
      continue;
    }

    // 7) Existing pending tx -> move to available
    if (existingTx.status === "pending") {
      const { error: updateTxErr } = await supabaseAdmin
        .from("wallet_transactions")
        .update({
          status: "available",
          unlocked_at: referral.unlocked_at || nowIso,
          updated_at: nowIso,
        })
        .eq("id", existingTx.id);

      if (updateTxErr) {
        throw new Error(updateTxErr.message);
      }

      const { error: walletUpdateErr } = await supabaseAdmin
        .from("wallets")
        .update({
          available_balance_gbp:
            Number(wallet.available_balance_gbp || 0) + amount,
          pending_balance_gbp: Math.max(
            0,
            Number(wallet.pending_balance_gbp || 0) - amount
          ),
        })
        .eq("user_id", referral.referrer_id);

      if (walletUpdateErr) {
        throw new Error(walletUpdateErr.message);
      }
    }

    // if already available -> do nothing
  }

  return {
    processed,
    unlocked,
    walletTxCreated,
  };
} */

import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function unlockEligibleReferralsForWeek(weekStart) {
  // 1) Get Top 20 users for this week
  const { data: topUsers, error: topErr } = await supabaseAdmin
    .from("leaderboard_weekly")
    .select("user_id")
    .eq("week_start", weekStart)
    .lte("rank_position", 20);

  if (topErr) throw new Error(topErr.message);

  const top20UserIds = [...new Set((topUsers || []).map((u) => u.user_id).filter(Boolean))];

  if (!top20UserIds.length) {
    return { processed: 0, unlocked: 0, walletTxCreated: 0 };
  }

  // 2) Find referrals for those users that are still pending or already unlocked
  const { data: referrals, error: refErr } = await supabaseAdmin
    .from("referrals")
    .select(`
      id,
      referrer_id,
      referred_user_id,
      reward_amount_gbp,
      status,
      created_at,
      expires_at,
      unlocked_at
    `)
    .in("referred_user_id", top20UserIds)
    .in("status", ["pending", "unlocked"]);

  if (refErr) throw new Error(refErr.message);

  let processed = 0;
  let unlocked = 0;
  let walletTxCreated = 0;

  for (const referral of referrals || []) {
    processed += 1;
    const nowIso = new Date().toISOString();
    const amount = Number(referral.reward_amount_gbp || 0);

    // skip expired
    if (referral.expires_at && new Date(referral.expires_at) < new Date()) {
      continue;
    }

    // 3) Played first game = has at least one prediction in referral window
    const { data: predictionRow, error: predErr } = await supabaseAdmin
      .from("predictions")
      .select("id")
      .eq("user_id", referral.referred_user_id)
      .gte("created_at", referral.created_at)
      .lte("created_at", referral.expires_at)
      .limit(1)
      .maybeSingle();

    if (predErr) throw new Error(predErr.message);

    const playedFirstGame = Boolean(predictionRow);

    if (!playedFirstGame) {
      continue;
    }

    // 4) Unlock referral if still pending
    if (referral.status === "pending") {
      const { error: unlockErr } = await supabaseAdmin
        .from("referrals")
        .update({
          played_first_game: true,
          reached_top20: true,
          status: "unlocked",
          unlocked_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", referral.id);

      if (unlockErr) throw new Error(unlockErr.message);

      unlocked += 1;
    } else {
      // keep unlocked rows in sync too
      const { error: syncErr } = await supabaseAdmin
        .from("referrals")
        .update({
          played_first_game: true,
          reached_top20: true,
          updated_at: nowIso,
        })
        .eq("id", referral.id);

      if (syncErr) throw new Error(syncErr.message);
    }

    // 5) Ensure wallet exists
    let { data: wallet, error: walletErr } = await supabaseAdmin
      .from("wallets")
      .select("user_id, available_balance_gbp, pending_balance_gbp")
      .eq("user_id", referral.referrer_id)
      .maybeSingle();

    if (walletErr) throw new Error(walletErr.message);

    if (!wallet) {
      const { data: newWallet, error: createWalletErr } = await supabaseAdmin
        .from("wallets")
        .insert({
          user_id: referral.referrer_id,
          available_balance_gbp: 0,
          pending_balance_gbp: 0,
        })
        .select()
        .single();

      if (createWalletErr) throw new Error(createWalletErr.message);
      wallet = newWallet;
    }

    // 6) Check existing referral transaction
    const { data: existingTx, error: txErr } = await supabaseAdmin
      .from("wallet_transactions")
      .select("id, status")
      .eq("referral_id", referral.id)
      .eq("type", "referral_bonus")
      .maybeSingle();

    if (txErr) throw new Error(txErr.message);

    // 7) If missing, create available tx and credit wallet
    if (!existingTx) {
      const { error: insertTxErr } = await supabaseAdmin
        .from("wallet_transactions")
        .insert({
          user_id: referral.referrer_id,
          week_start: null,
          week_end: null,
          amount_gbp: amount,
          type: "referral_bonus",
          status: "available",
          referral_id: referral.id,
          unlocked_at: referral.unlocked_at || nowIso,
          created_at: nowIso,
          updated_at: nowIso,
        });

      if (insertTxErr) throw new Error(insertTxErr.message);

      const { error: walletUpdateErr } = await supabaseAdmin
        .from("wallets")
        .update({
          available_balance_gbp: Number(wallet.available_balance_gbp || 0) + amount,
        })
        .eq("user_id", referral.referrer_id);

      if (walletUpdateErr) throw new Error(walletUpdateErr.message);

      walletTxCreated += 1;
      continue;
    }

    // 8) If existing tx is pending, move it to available and move balance
    if (existingTx.status === "pending") {
      const { error: updateTxErr } = await supabaseAdmin
        .from("wallet_transactions")
        .update({
          status: "available",
          unlocked_at: referral.unlocked_at || nowIso,
          updated_at: nowIso,
        })
        .eq("id", existingTx.id);

      if (updateTxErr) throw new Error(updateTxErr.message);

      const { error: walletUpdateErr } = await supabaseAdmin
        .from("wallets")
        .update({
          available_balance_gbp: Number(wallet.available_balance_gbp || 0) + amount,
          pending_balance_gbp: Math.max(
            0,
            Number(wallet.pending_balance_gbp || 0) - amount
          ),
        })
        .eq("user_id", referral.referrer_id);

      if (walletUpdateErr) throw new Error(walletUpdateErr.message);
    }
  }

  return {
    processed,
    unlocked,
    walletTxCreated,
  };
}