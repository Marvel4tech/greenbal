import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

const TZ = "Europe/London"

function getYMDInTZ(date = new Date(), tz = TZ) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const y = parts.find((p) => p.type === "year")?.value
  const m = parts.find((p) => p.type === "month")?.value
  const d = parts.find((p) => p.type === "day")?.value
  return `${y}-${m}-${d}`
}

function addDaysYMD(ymd, days) {
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(dt.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

/**
 * Find the UTC instant that corresponds to 00:00 local time in the given TZ.
 * Handles DST properly (incl. 23/25-hour days) by solving for local midnight.
 */
function utcForLocalMidnight(ymd, tz = TZ) {
  const [Y, M, D] = ymd.split("-").map(Number)

  // Start with a UTC guess at 00:00Z of that date
  let guess = new Date(Date.UTC(Y, M - 1, D, 0, 0, 0))

  // Convert guess -> parts in TZ (what local time is at that UTC guess)
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const partsToObj = (parts) =>
    parts.reduce((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value
      return acc
    }, {})

  // Two-pass correction is usually enough for TZ offsets + DST
  for (let i = 0; i < 2; i++) {
    const obj = partsToObj(dtf.formatToParts(guess))
    const localY = Number(obj.year)
    const localM = Number(obj.month)
    const localD = Number(obj.day)
    const localH = Number(obj.hour)
    const localMin = Number(obj.minute)
    const localSec = Number(obj.second)

    // We want local time 00:00:00 on Y-M-D
    // Compute how far off we are in minutes (including day drift)
    const desiredLocal = Date.UTC(Y, M - 1, D, 0, 0, 0)
    const currentLocalAsUTC = Date.UTC(localY, localM - 1, localD, localH, localMin, localSec)

    const diffMs = currentLocalAsUTC - desiredLocal
    guess = new Date(guess.getTime() - diffMs)
  }

  return guess
}

export async function GET() {
  try {
    const todayYMD = getYMDInTZ(new Date(), TZ)
    const tomorrowYMD = addDaysYMD(todayYMD, 1)

    const startUtc = utcForLocalMidnight(todayYMD, TZ).toISOString()
    const endUtc = utcForLocalMidnight(tomorrowYMD, TZ).toISOString()

    // 1) Total Users (profiles)
    const { count: totalUsers, error: usersErr } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })

    if (usersErr) throw usersErr

    // 2) Games Today (match_time within today's London day)
    const { count: gamesToday, error: gamesErr } = await supabaseAdmin
      .from("games")
      .select("id", { count: "exact", head: true })
      .gte("match_time", startUtc)
      .lt("match_time", endUtc)

    if (gamesErr) throw gamesErr

    // 3) Pending Updates:
    // games that have started/passed but not finished yet (no result or status != finished)
    const nowIso = new Date().toISOString()
    const { count: pendingUpdates, error: pendingErr } = await supabaseAdmin
      .from("games")
      .select("id", { count: "exact", head: true })
      .lt("match_time", nowIso)
      .neq("status", "finished")

    if (pendingErr) throw pendingErr

    // 4) Total Predictions
    const { count: totalPredictions, error: predsErr } = await supabaseAdmin
      .from("predictions")
      .select("id", { count: "exact", head: true })

    if (predsErr) throw predsErr

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      gamesToday: gamesToday ?? 0,
      pendingUpdates: pendingUpdates ?? 0,
      totalPredictions: totalPredictions ?? 0,
      meta: {
        tz: TZ,
        dayRangeUtc: { startUtc, endUtc },
        todayYMD,
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Failed to load admin stats" },
      { status: 500 }
    )
  }
}
