import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { withAdminLog } from "@/lib/withAdminLog";
import { NextResponse } from "next/server";
import { sendNotificationToAllUsers } from "@/lib/notifications/sendNotification";
import { sendWebPush } from "@/lib/sendWebPush";

const TZ = "Europe/London";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUSH_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-game-push`;

// functions begin
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

  const tzName = parts.find((p) => p.type === "timeZoneName")?.value;
  return parseGmtOffsetToMinutes(tzName);
}

function localMidnightToUtcMs(ymd, timeZone) {
  const [y, m, d] = ymd.split("-").map(Number);

  let guess = Date.UTC(y, m - 1, d, 0, 0, 0);

  let offset1 = tzOffsetMinutesAt(guess, timeZone);
  let utc = guess - offset1 * 60_000;

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

// Converts a London local datetime like "2026-04-04T12:45"
// into the correct UTC ISO string for storage.
function londonLocalDateTimeToUtcIso(localDateTime) {
  const match = String(localDateTime).match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );

  if (!match) {
    throw new Error("Invalid matchTime format. Use YYYY-MM-DDTHH:mm");
  }

  const [, y, m, d, hh, mm] = match.map((v, i) => (i === 0 ? v : Number(v)));

  let guessUtcMs = Date.UTC(y, m - 1, d, hh, mm, 0);

  let offset1 = tzOffsetMinutesAt(guessUtcMs, TZ);
  let utcMs = guessUtcMs - offset1 * 60_000;

  let offset2 = tzOffsetMinutesAt(utcMs, TZ);
  if (offset2 !== offset1) {
    utcMs = guessUtcMs - offset2 * 60_000;
  }

  return new Date(utcMs).toISOString();
}

// Accept either:
// 1. local datetime from <input type="datetime-local"> => "2026-04-04T12:45"
// 2. already-UTC ISO => "2026-04-04T11:45:00.000Z"
function normalizeMatchTime(matchTime) {
  const value = String(matchTime).trim();

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return londonLocalDateTimeToUtcIso(value);
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  throw new Error("Invalid matchTime value");
}
// functions end

export async function GET(request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || todayYMDInTZ(TZ);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

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

export async function POST(request) {
  try {
    const body = await request.json();
    const { homeTeam, awayTeam, matchTime } = body;

    if (!homeTeam || !awayTeam || !matchTime) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const normalizedMatchTime = normalizeMatchTime(matchTime);

    return await withAdminLog(
      request,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("games")
          .insert([
            {
              home_team: homeTeam,
              away_team: awayTeam,
              match_time: normalizedMatchTime,
              status: "upcoming",
            },
          ])
          .select()
          .single();

        if (error) {
          throw error;
        }

        // 1) In-app notification
        try {
          await sendNotificationToAllUsers({
            type: "new_game",
            title: "New game posted",
            message: `${homeTeam} vs ${awayTeam} is now available for predictions.`,
            link: "/profile/play",
          });
        } catch (notificationError) {
          console.error("Database notification error:", notificationError);
        }

        // 2) FCM push for Android/Desktop
        try {
          const pushRes = await fetch(PUSH_FUNCTION_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              apikey: SUPABASE_SERVICE_ROLE_KEY,
            },
            body: JSON.stringify({
              title: "New game posted",
              message: `${homeTeam} vs ${awayTeam} is now live for predictions.`,
              link: "/profile/play",
            }),
          });

          const pushJson = await pushRes.json().catch(() => null);

          if (!pushRes.ok) {
            console.error(
              "Push notification failed:",
              pushJson || pushRes.statusText
            );
          }
        } catch (pushError) {
          console.error("Push notification error:", pushError);
        }

        // 3) Web Push for iPhone/iPad Home Screen
        try {
          const { data: webPushSubscriptions } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .not("endpoint", "is", null)
            .not("p256dh", "is", null)
            .not("auth", "is", null);

          if (subError) {
            console.error("Web push subscription fetch error:", subError);
          } else {
            for (const sub of webPushSubscriptions || []) {
              try {
                await sendWebPush(
                  {
                    endpoint: sub.endpoint,
                    keys: {
                      p256dh: sub.p256dh,
                      auth: sub.auth,
                    },
                  },
                  {
                    title: "New game posted",
                    body: `${homeTeam} vs ${awayTeam} is now live for predictions.`,
                    icon: "/icon-192.png",
                    badge: "/icon-192.png",
                    data: {
                      link: "/profile/play",
                    },
                  }
                );
              } catch (error) {
                const statusCode = error?.statusCode;

                if (statusCode === 404 || statusCode === 410) {
                  await supabaseAdmin
                    .from("push_subscriptions")
                    .delete()
                    .eq("endpoint", sub.endpoint);
                } else {
                  console.error("Web push send failed:", error);
                }
              }
            }
          }
        } catch (webPushError) {
          console.error("Web push notification error:", webPushError);
        }

        return NextResponse.json(data);
      },
      {
        action: "game_created",
        message: (admin) =>
          `${admin.username || admin.email || admin.id} created game: ${homeTeam} vs ${awayTeam}`,
        path: "/dashboard/games",
        metadata: {
          homeTeam,
          awayTeam,
          matchTime: normalizedMatchTime,
        },
      }
    );
  } catch (err) {
    const status =
      err.message === "Unauthorized"
        ? 401
        : err.message === "Forbidden"
          ? 403
          : 500;

    return NextResponse.json({ error: err.message }, { status });
  }
}