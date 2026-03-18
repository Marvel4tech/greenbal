import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

const TZ = "Europe/London"

// Parse "GMT+1" / "GMT-0" into minutes
function parseGmtOffsetToMinutes(gmt) {
  if (!gmt || gmt === "GMT") return 0

  const m = gmt.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/)
  if (!m) return 0

  const sign = m[1] === "-" ? -1 : 1
  const hours = Number(m[2] || 0)
  const mins = Number(m[3] || 0)
  return sign * (hours * 60 + mins)
}

function tzOffsetMinutesAt(utcMs, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(utcMs))

  const tzName = parts.find((p) => p.type === "timeZoneName")?.value
  return parseGmtOffsetToMinutes(tzName)
}

// Convert local midnight in TZ to UTC ms
function localMidnightToUtcMs(ymd, timeZone) {
  const [y, m, d] = ymd.split("-").map(Number)

  let guess = Date.UTC(y, m - 1, d, 0, 0, 0)

  let offset1 = tzOffsetMinutesAt(guess, timeZone)
  let utc = guess - offset1 * 60_000

  let offset2 = tzOffsetMinutesAt(utc, timeZone)
  if (offset2 !== offset1) {
    utc = guess - offset2 * 60_000
  }

  return utc
}

function addDaysYMD(ymd, daysToAdd) {
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + daysToAdd)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(dt.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

function todayYMDInTZ(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  const y = parts.find((p) => p.type === "year")?.value
  const m = parts.find((p) => p.type === "month")?.value
  const d = parts.find((p) => p.type === "day")?.value

  return `${y}-${m}-${d}`
}

// Tuesday-start week
function getCurrentWeekStartYMD(timeZone) {
  const todayYMD = todayYMDInTZ(timeZone)
  const today = new Date(`${todayYMD}T00:00:00Z`)
  const day = today.getUTCDay() // Sun=0 Mon=1 Tue=2

  const daysSinceTuesday = (day - 2 + 7) % 7
  return addDaysYMD(todayYMD, -daysSinceTuesday)
}

export async function GET() {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const currentWeekStart = getCurrentWeekStartYMD(TZ)
  const currentWeekEnd = addDaysYMD(currentWeekStart, 6)

  // 1) User weekly row for CURRENT week only
  const { data: row, error: leaderboardError } = await supabase
    .from("leaderboard_weekly")
    .select("user_id, week_start, points_total, correct_total, predictions_total")
    .eq("user_id", user.id)
    .eq("week_start", currentWeekStart)
    .maybeSingle()

  if (leaderboardError) {
    return NextResponse.json({ error: leaderboardError.message }, { status: 500 })
  }

  const predictions = Number(row?.predictions_total || 0)
  const correct = Number(row?.correct_total || 0)
  const points = Number(row?.points_total || 0)

  const winRate =
    predictions > 0 ? Math.round((correct / predictions) * 100) : 0

  // 2) Total games posted for CURRENT week (Tuesday -> Monday)
  const startISO = new Date(localMidnightToUtcMs(currentWeekStart, TZ)).toISOString()
  const endISO = new Date(
    localMidnightToUtcMs(addDaysYMD(currentWeekEnd, 1), TZ)
  ).toISOString()

  const { count: totalGamesThisWeek, error: gamesError } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .gte("match_time", startISO)
    .lt("match_time", endISO)

  if (gamesError) {
    return NextResponse.json({ error: gamesError.message }, { status: 500 })
  }

  return NextResponse.json({
    predictions,
    totalGamesThisWeek: Number(totalGamesThisWeek || 0),
    correct,
    points,
    winRate,
    weekStart: currentWeekStart,
    weekEnd: currentWeekEnd,
    lastLogin: user.last_sign_in_at,
  })
}