import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { NextResponse } from "next/server";

const TZ = "Europe/London";

//functions begin
// Parse "GMT+1" / "GMT-0" into minutes
function parseGmtOffsetToMinutes(gmt) {
    if (!gmt || gmt === "GMT") return 0;
  
    const m = gmt.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
    if (!m) return 0;
  
    const sign = m[1] === "-" ? -1 : 1;
    const hours = Number(m[2] || 0);
    const mins = Number(m[3] || 0);
    return sign * (hours * 60 + mins);
}

function tzOffsetMinutesAt(utcMs, timeZone) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date(utcMs));
  
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value; // "GMT+1"
    return parseGmtOffsetToMinutes(tzName);
}

// Convert a local day (YYYY-MM-DD at 00:00 in TZ) -> UTC ms, DST-safe
function localMidnightToUtcMs(ymd, timeZone) {
    const [y, m, d] = ymd.split("-").map(Number);
  
    // initial guess: midnight UTC same date
    let guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  
    // adjust by timezone offset at guess
    let offset1 = tzOffsetMinutesAt(guess, timeZone);
    let utc = guess - offset1 * 60_000;
  
    // re-check offset at computed utc (handles DST switches)
    let offset2 = tzOffsetMinutesAt(utc, timeZone);
    if (offset2 !== offset1) {
      utc = guess - offset2 * 60_000;
    }
  
    return utc;
}

function addOneDayYMD(ymd) {
    const [y, m, d] = ymd.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + 1);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
}

// Get today's YYYY-MM-DD in UK time
function todayYMDInTZ(timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
  
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
  
    return `${y}-${m}-${d}`;
}
//functions ends

//API AND ENDPOINT BEGINS
export async function GET(request) {
    const url = new URL(request.url);

    // If date not provided, default to TODAY (UK)
    const date = url.searchParams.get("date") || todayYMDInTZ(TZ);

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
        );
    }

    // Build UK-day boundaries in UTC
    const startUtcMs = localMidnightToUtcMs(date, TZ);
    const nextDay = addOneDayYMD(date);
    const endUtcMs = localMidnightToUtcMs(nextDay, TZ);

    const startISO = new Date(startUtcMs).toISOString();
    const endISO = new Date(endUtcMs).toISOString();

    const { data, error } = await supabaseAdmin
        .from("games")
        .select("*")
        .gte("match_time", startISO)
        .lt("match_time", endISO)
        .order("match_time", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { homeTeam, awayTeam, matchTime } = body;

        if ( !homeTeam || !awayTeam || !matchTime ) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from("games")
            .insert([
                {
                    home_team: homeTeam,
                    away_team: awayTeam,
                    match_time: matchTime,
                    status: "upcoming"
                }
            ])
            .select();

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });

            return NextResponse.json(data[0]);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}