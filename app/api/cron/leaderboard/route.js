import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

async function ensureWallet(supabase, userId) {
  let { data: wallet, error: walletFetchError } = await supabase
    .from("wallets")
    .select("id, user_id, available_balance_gbp, pending_balance_gbp")
    .eq("user_id", userId)
    .maybeSingle()

  if (walletFetchError) {
    throw new Error(walletFetchError.message)
  }

  if (!wallet) {
    const { data: newWallet, error: walletCreateError } = await supabase
      .from("wallets")
      .insert({
        user_id: userId,
        available_balance_gbp: 0,
        pending_balance_gbp: 0,
      })
      .select()
      .single()

    if (walletCreateError) {
      throw new Error(walletCreateError.message)
    }

    wallet = newWallet
  }

  return wallet
}

async function createPendingReferralBonusIfMissing(supabase, referral) {
  const { data: existingTx, error: txCheckError } = await supabase
    .from("wallet_transactions")
    .select("id, amount_gbp, status")
    .eq("referral_id", referral.id)
    .eq("type", "referral_bonus")
    .maybeSingle()

  if (txCheckError) {
    throw new Error(txCheckError.message)
  }

  if (existingTx) {
    return existingTx
  }

  const wallet = await ensureWallet(supabase, referral.referrer_id)
  const rewardAmount = Number(referral.reward_amount_gbp || 2)

  const { data: newTx, error: txInsertError } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: referral.referrer_id,
      amount_gbp: rewardAmount,
      status: "pending",
      type: "referral_bonus",
      referral_id: referral.id,
      expires_at: referral.expires_at,
    })
    .select()
    .single()

  if (txInsertError) {
    throw new Error(txInsertError.message)
  }

  const { error: walletUpdateError } = await supabase
    .from("wallets")
    .update({
      pending_balance_gbp: Number(wallet.pending_balance_gbp || 0) + rewardAmount,
    })
    .eq("id", wallet.id)

  if (walletUpdateError) {
    throw new Error(walletUpdateError.message)
  }

  return newTx
}

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization")

    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: "CRON_SECRET is missing" }, { status: 500 })
    }

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing" },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { error: rankError } = await supabase.rpc(
      "refresh_latest_leaderboard_weekly_ranks"
    )

    if (rankError) {
      return NextResponse.json({ error: rankError.message }, { status: 500 })
    }

    const now = new Date()
    const nowIso = now.toISOString()

    const { data: referrals, error: refError } = await supabase
      .from("referrals")
      .select("*")
      .eq("status", "pending")

    if (refError) {
      return NextResponse.json({ error: refError.message }, { status: 500 })
    }

    for (const ref of referrals || []) {
      let played = Boolean(ref.played_first_game)
      let top20 = Boolean(ref.reached_top20)

      const createdAt = ref.created_at ? new Date(ref.created_at) : null
      const expiresAt = ref.expires_at ? new Date(ref.expires_at) : null

      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        return NextResponse.json(
          { error: `Invalid created_at for referral ${ref.id}` },
          { status: 500 }
        )
      }

      if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
        return NextResponse.json(
          { error: `Invalid expires_at for referral ${ref.id}` },
          { status: 500 }
        )
      }

      const windowStart = createdAt.toISOString().slice(0, 10)
      const windowEnd = expiresAt.toISOString().slice(0, 10)

      if (!played) {
        const { data: playedRow, error: playedError } = await supabase
          .from("leaderboard_weekly")
          .select("id, predictions_total, week_start")
          .eq("user_id", ref.referred_user_id)
          .gte("week_start", windowStart)
          .lte("week_start", windowEnd)
          .gt("predictions_total", 0)
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (playedError) {
          return NextResponse.json({ error: playedError.message }, { status: 500 })
        }

        if (playedRow) {
          played = true

          const { error: updatePlayedError } = await supabase
            .from("referrals")
            .update({
              played_first_game: true,
              updated_at: nowIso,
            })
            .eq("id", ref.id)

          if (updatePlayedError) {
            return NextResponse.json(
              { error: updatePlayedError.message },
              { status: 500 }
            )
          }

          await createPendingReferralBonusIfMissing(supabase, ref)
        }
      }

      if (!top20) {
        const { data: rankRow, error: rankCheckError } = await supabase
          .from("leaderboard_weekly")
          .select("id, rank_position, week_start")
          .eq("user_id", ref.referred_user_id)
          .gte("week_start", windowStart)
          .lte("week_start", windowEnd)
          .lte("rank_position", 20)
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (rankCheckError) {
          return NextResponse.json({ error: rankCheckError.message }, { status: 500 })
        }

        if (rankRow) {
          top20 = true

          const { error: updateTop20Error } = await supabase
            .from("referrals")
            .update({
              reached_top20: true,
              updated_at: nowIso,
            })
            .eq("id", ref.id)

          if (updateTop20Error) {
            return NextResponse.json(
              { error: updateTop20Error.message },
              { status: 500 }
            )
          }
        }
      }

      if (played && top20) {
        const tx = await createPendingReferralBonusIfMissing(supabase, ref)

        const { error: unlockReferralError } = await supabase
          .from("referrals")
          .update({
            status: "unlocked",
            played_first_game: true,
            reached_top20: true,
            unlocked_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", ref.id)
          .eq("status", "pending")

        if (unlockReferralError) {
          return NextResponse.json(
            { error: unlockReferralError.message },
            { status: 500 }
          )
        }

        const { data: freshTx, error: txError } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("id", tx.id)
          .maybeSingle()

        if (txError) {
          return NextResponse.json({ error: txError.message }, { status: 500 })
        }

        if (freshTx && freshTx.status === "pending") {
          const { error: txUpdateError } = await supabase
            .from("wallet_transactions")
            .update({
              status: "available",
              unlocked_at: nowIso,
            })
            .eq("id", freshTx.id)
            .eq("status", "pending")

          if (txUpdateError) {
            return NextResponse.json(
              { error: txUpdateError.message },
              { status: 500 }
            )
          }

          const wallet = await ensureWallet(supabase, freshTx.user_id)

          const newPending = Math.max(
            0,
            Number(wallet.pending_balance_gbp || 0) - Number(freshTx.amount_gbp || 0)
          )

          const { error: walletUpdateError } = await supabase
            .from("wallets")
            .update({
              available_balance_gbp:
                Number(wallet.available_balance_gbp || 0) + Number(freshTx.amount_gbp || 0),
              pending_balance_gbp: newPending,
            })
            .eq("id", wallet.id)

          if (walletUpdateError) {
            return NextResponse.json(
              { error: walletUpdateError.message },
              { status: 500 }
            )
          }
        }

        continue
      }

      if (expiresAt < now) {
        const { error: expireReferralError } = await supabase
          .from("referrals")
          .update({
            status: "expired",
            expired_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", ref.id)
          .eq("status", "pending")

        if (expireReferralError) {
          return NextResponse.json(
            { error: expireReferralError.message },
            { status: 500 }
          )
        }

        const { data: tx, error: txError } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("referral_id", ref.id)
          .eq("type", "referral_bonus")
          .eq("status", "pending")
          .maybeSingle()

        if (txError) {
          return NextResponse.json({ error: txError.message }, { status: 500 })
        }

        if (tx) {
          const { error: txExpireError } = await supabase
            .from("wallet_transactions")
            .update({
              status: "expired",
            })
            .eq("id", tx.id)
            .eq("status", "pending")

          if (txExpireError) {
            return NextResponse.json(
              { error: txExpireError.message },
              { status: 500 }
            )
          }

          const wallet = await ensureWallet(supabase, tx.user_id)

          const newPending = Math.max(
            0,
            Number(wallet.pending_balance_gbp || 0) - Number(tx.amount_gbp || 0)
          )

          const { error: walletUpdateError } = await supabase
            .from("wallets")
            .update({
              pending_balance_gbp: newPending,
            })
            .eq("id", wallet.id)

          if (walletUpdateError) {
            return NextResponse.json(
              { error: walletUpdateError.message },
              { status: 500 }
            )
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    )
  }
}