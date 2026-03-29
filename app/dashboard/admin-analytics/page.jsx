import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createServerClientWrapper } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"
import AdminAnalyticsClient from "@/components/AdminAnalyticsClient"

function startOfTodayIso() {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return d.toISOString()
}

function daysAgoIso(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function makeLastNDaysLabels(days = 7) {
  const out = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)

    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      timeZone: "Europe/London",
    })

    out.push({ key, label })
  }

  return out
}

async function getUsernamesMap(userIds = []) {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (!ids.length) return {}

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username")
    .in("id", ids)

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).reduce((acc, row) => {
    acc[row.id] = row.username
    return acc
  }, {})
}

function groupDailyCount(rows, field = "created_at") {
  const map = {}

  for (const row of rows || []) {
    const value = row?.[field]
    if (!value) continue
    const key = String(value).slice(0, 10)
    map[key] = (map[key] || 0) + 1
  }

  return map
}

function buildTrend(days, usersRows, predictionRows, referralRows) {
  const labels = makeLastNDaysLabels(days)
  const usersMap = groupDailyCount(usersRows, "created_at")
  const predictionsMap = groupDailyCount(predictionRows, "created_at")
  const referralsMap = groupDailyCount(referralRows, "created_at")

  let cumulativeUsers = 0

  return labels.map((day) => {
    const users = usersMap[day.key] || 0
    cumulativeUsers += users

    return {
      key: day.key,
      label: day.label,
      users,
      predictions: predictionsMap[day.key] || 0,
      referrals: referralsMap[day.key] || 0,
      cumulativeUsers,
    }
  })
}

export default async function AdminAnalyticsPage() {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) redirect("/login")

  const { data: adminProfile, error: adminProfileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (adminProfileError || adminProfile?.role !== "admin") {
    redirect("/")
  }

  const todayIso = startOfTodayIso()
  const sevenDaysAgoIso = daysAgoIso(7)
  const thirtyDaysAgoIso = daysAgoIso(30)

  const { data: weekStart, error: weekErr } = await supabaseAdmin.rpc(
    "week_start_tuesday",
    { ts: new Date().toISOString() }
  )

  if (weekErr) {
    throw new Error(weekErr.message)
  }

  const [
    totalUsersRes,
    newUsers7dRes,
    bannedUsersRes,
    deletedUsersRes,
    users7dRowsRes,
    users30dRowsRes,
    predictionsTodayRes,
    predictions7dRes,
    recentPredictionsRes,
    predictions7dRowsRes,
    predictions30dRowsRes,
    gamesPendingRes,
    gamesFinishedRes,
    totalReferralsRes,
    pendingReferralsRes,
    unlockedReferralsRes,
    expiredReferralsRes,
    playedFirstGameRes,
    referralsForAmountsRes,
    recentReferralsBaseRes,
    referrals7dRowsRes,
    referrals30dRowsRes,
    walletsRes,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgoIso),
    supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_banned", true),
    supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", true),
    supabaseAdmin
      .from("profiles")
      .select("created_at")
      .gte("created_at", sevenDaysAgoIso)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgoIso)
      .order("created_at", { ascending: true }),

    supabaseAdmin
      .from("predictions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayIso),
    supabaseAdmin
      .from("predictions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgoIso),
    supabaseAdmin
      .from("predictions")
      .select("user_id")
      .gte("created_at", sevenDaysAgoIso),
    supabaseAdmin
      .from("predictions")
      .select("created_at")
      .gte("created_at", sevenDaysAgoIso)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("predictions")
      .select("created_at")
      .gte("created_at", thirtyDaysAgoIso)
      .order("created_at", { ascending: true }),

    supabaseAdmin
      .from("games")
      .select("id", { count: "exact", head: true })
      .neq("status", "finished"),
    supabaseAdmin
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("status", "finished"),

    supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("status", "unlocked"),
    supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("status", "expired"),
    supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("played_first_game", true),
    supabaseAdmin
      .from("referrals")
      .select("id, reward_amount_gbp, status, played_first_game"),
    supabaseAdmin
      .from("referrals")
      .select(`
        id,
        referrer_id,
        referred_user_id,
        reward_amount_gbp,
        status,
        played_first_game,
        reached_top20,
        created_at,
        expires_at
      `)
      .order("created_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("referrals")
      .select("created_at")
      .gte("created_at", sevenDaysAgoIso)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("referrals")
      .select("created_at")
      .gte("created_at", thirtyDaysAgoIso)
      .order("created_at", { ascending: true }),

    supabaseAdmin
      .from("wallets")
      .select("user_id, available_balance_gbp, pending_balance_gbp"),
  ])

  if (walletsRes.error) {
    throw new Error(walletsRes.error.message)
  }

  const activePlayers7d = new Set(
    (recentPredictionsRes.data || []).map((p) => p.user_id).filter(Boolean)
  ).size

  const lockedReferralAmount = (referralsForAmountsRes.data || [])
    .filter((r) => r.status === "pending" && r.played_first_game)
    .reduce((sum, r) => sum + Number(r.reward_amount_gbp || 0), 0)

  const unlockedReferralAmount = (referralsForAmountsRes.data || [])
    .filter((r) => r.status === "unlocked")
    .reduce((sum, r) => sum + Number(r.reward_amount_gbp || 0), 0)

  const referralConversionRate =
    (totalReferralsRes.count || 0) > 0
      ? ((playedFirstGameRes.count || 0) / (totalReferralsRes.count || 1)) * 100
      : 0

  const referralUserIds = [
    ...(recentReferralsBaseRes.data || []).map((r) => r.referrer_id),
    ...(recentReferralsBaseRes.data || []).map((r) => r.referred_user_id),
  ]

  const referralUsernames = await getUsernamesMap(referralUserIds)

  const recentReferrals = (recentReferralsBaseRes.data || []).map((r) => ({
    ...r,
    referrer: { username: referralUsernames[r.referrer_id] || null },
    referred: { username: referralUsernames[r.referred_user_id] || null },
  }))

  const walletsData = walletsRes.data || []

  const walletPendingTotal = walletsData.reduce(
    (sum, w) => sum + Number(w.pending_balance_gbp || 0),
    0
  )

  const walletAvailableTotal = walletsData.reduce(
    (sum, w) => sum + Number(w.available_balance_gbp || 0),
    0
  )

  const usersAwaitingPayout = new Set(
    walletsData
      .filter((w) => Number(w.available_balance_gbp || 0) > 0)
      .map((w) => w.user_id)
      .filter(Boolean)
  ).size

  const availablePayoutTotal = walletAvailableTotal

  let topWeeklyUsers = []

  if (weekStart) {
    const { data: topWeeklyBase, error: topWeeklyError } = await supabaseAdmin
      .from("leaderboard_weekly")
      .select(`
        user_id,
        points_total,
        correct_total,
        predictions_total,
        rank_position
      `)
      .eq("week_start", weekStart)
      .order("rank_position", { ascending: true })
      .limit(10)

    if (topWeeklyError) {
      throw new Error(topWeeklyError.message)
    }

    const topWeeklyUsernames = await getUsernamesMap(
      (topWeeklyBase || []).map((u) => u.user_id)
    )

    topWeeklyUsers = (topWeeklyBase || []).map((u) => ({
      ...u,
      profiles: { username: topWeeklyUsernames[u.user_id] || null },
    }))
  }

  const trends7d = buildTrend(
    7,
    users7dRowsRes.data || [],
    predictions7dRowsRes.data || [],
    referrals7dRowsRes.data || []
  )

  const trends30d = buildTrend(
    30,
    users30dRowsRes.data || [],
    predictions30dRowsRes.data || [],
    referrals30dRowsRes.data || []
  )

  const referralFunnel = [
    { label: "Total", value: totalReferralsRes.count || 0 },
    { label: "First Game", value: playedFirstGameRes.count || 0 },
    { label: "Unlocked", value: unlockedReferralsRes.count || 0 },
    { label: "Expired", value: expiredReferralsRes.count || 0 },
  ]

  const analytics = {
    users: {
      total: totalUsersRes.count || 0,
      new7d: newUsers7dRes.count || 0,
      banned: bannedUsersRes.count || 0,
      deleted: deletedUsersRes.count || 0,
    },
    gameplay: {
      predictionsToday: predictionsTodayRes.count || 0,
      predictions7d: predictions7dRes.count || 0,
      activePlayers7d,
      gamesPending: gamesPendingRes.count || 0,
      gamesFinished: gamesFinishedRes.count || 0,
    },
    referrals: {
      total: totalReferralsRes.count || 0,
      pending: pendingReferralsRes.count || 0,
      unlocked: unlockedReferralsRes.count || 0,
      expired: expiredReferralsRes.count || 0,
      playedFirstGame: playedFirstGameRes.count || 0,
      lockedAmount: lockedReferralAmount,
      unlockedAmount: unlockedReferralAmount,
      conversionRate: referralConversionRate,
    },
    money: {
      walletPendingTotal,
      walletAvailableTotal,
      availablePayoutTotal,
      usersAwaitingPayout,
    },
    topWeeklyUsers,
    recentReferrals,
    trends7d,
    trends30d,
    referralFunnel,
    weekStart: weekStart || null,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-0 py-10">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Admin Analytics
        </h1>
        <p className="mt-2 text-gray-600 dark:text-white/70 max-w-3xl">
          Track user growth, gameplay activity, referrals, wallet balances, and payout readiness.
        </p>
      </div>

      <div className="mt-7">
        <AdminAnalyticsClient initialData={analytics} />
      </div>
    </div>
  )
}