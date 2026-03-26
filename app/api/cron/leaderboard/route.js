import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

    // 1) Refresh latest leaderboard ranks
    const { error: rankError } = await supabase.rpc(
      "refresh_latest_leaderboard_weekly_ranks"
    )

    if (rankError) {
      return NextResponse.json({ error: rankError.message }, { status: 500 })
    }

    // 2) Process pending referrals
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
      let played = ref.played_first_game
      let top20 = ref.reached_top20

      const createdAt = new Date(ref.created_at)
      const expiresAt = new Date(ref.expires_at)

      const windowStart = createdAt.toISOString().slice(0, 10)
      const windowEnd = expiresAt.toISOString().slice(0, 10)

      // Check if referred user has played at least one game
      // Only count leaderboard rows inside the referral validity window
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
            .update({ played_first_game: true })
            .eq("id", ref.id)

          if (updatePlayedError) {
            return NextResponse.json(
              { error: updatePlayedError.message },
              { status: 500 }
            )
          }
        }
      }

      // Check if referred user reached Top 20
      // Only count weekly leaderboard rows inside the 30-day referral window
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
            .update({ reached_top20: true })
            .eq("id", ref.id)

          if (updateTop20Error) {
            return NextResponse.json(
              { error: updateTop20Error.message },
              { status: 500 }
            )
          }
        }
      }

      // Unlock referral reward
      if (played && top20) {
        const { error: unlockReferralError } = await supabase
          .from("referrals")
          .update({
            status: "unlocked",
            played_first_game: true,
            reached_top20: true,
            unlocked_at: nowIso,
          })
          .eq("id", ref.id)

        if (unlockReferralError) {
          return NextResponse.json(
            { error: unlockReferralError.message },
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
          const { error: txUpdateError } = await supabase
            .from("wallet_transactions")
            .update({
              status: "available",
              unlocked_at: nowIso,
            })
            .eq("id", tx.id)

          if (txUpdateError) {
            return NextResponse.json(
              { error: txUpdateError.message },
              { status: 500 }
            )
          }

          const { data: wallet, error: walletError } = await supabase
            .from("wallets")
            .select("id, available_balance_gbp, pending_balance_gbp")
            .eq("user_id", tx.user_id)
            .single()

          if (walletError) {
            return NextResponse.json({ error: walletError.message }, { status: 500 })
          }

          const { error: walletUpdateError } = await supabase
            .from("wallets")
            .update({
              available_balance_gbp:
                Number(wallet.available_balance_gbp || 0) + Number(tx.amount_gbp || 0),
              pending_balance_gbp:
                Number(wallet.pending_balance_gbp || 0) - Number(tx.amount_gbp || 0),
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

      // Expire referral if window has passed and it is still pending
      if (expiresAt < now) {
        const { error: expireReferralError } = await supabase
          .from("referrals")
          .update({
            status: "expired",
            expired_at: nowIso,
          })
          .eq("id", ref.id)

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

          if (txExpireError) {
            return NextResponse.json(
              { error: txExpireError.message },
              { status: 500 }
            )
          }

          const { data: wallet, error: walletError } = await supabase
            .from("wallets")
            .select("id, pending_balance_gbp")
            .eq("user_id", tx.user_id)
            .single()

          if (walletError) {
            return NextResponse.json({ error: walletError.message }, { status: 500 })
          }

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