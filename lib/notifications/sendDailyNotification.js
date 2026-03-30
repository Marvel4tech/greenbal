import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

const TIME_ZONE = "Europe/London";

function parseGmtOffsetToMinutes(gmt) {
  if (!gmt || gmt === "GMT") return 0;

  const match = gmt.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return 0;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);

  return sign * (hours * 60 + minutes);
}

function tzOffsetMinutesAt(utcMs, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(utcMs));

  const tzName = parts.find((part) => part.type === "timeZoneName")?.value;
  return parseGmtOffsetToMinutes(tzName);
}

function getYmdInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function localMidnightToUtcIso(ymd, timeZone) {
  const [year, month, day] = ymd.split("-").map(Number);

  let guessUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0);

  let offset1 = tzOffsetMinutesAt(guessUtcMs, timeZone);
  let utcMs = guessUtcMs - offset1 * 60_000;

  let offset2 = tzOffsetMinutesAt(utcMs, timeZone);
  if (offset2 !== offset1) {
    utcMs = guessUtcMs - offset2 * 60_000;
  }

  return new Date(utcMs).toISOString();
}

export async function sendDailyNotificationToAllUsers({
  type,
  title,
  message,
  link = "/notifications",
}) {
  const { data: users, error: usersError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "user");

  if (usersError) {
    throw new Error(usersError.message);
  }

  if (!users?.length) {
    return { success: true, inserted: 0 };
  }

  const todayYmdInLondon = getYmdInTimeZone(new Date(), TIME_ZONE);
  const startOfTodayInLondonUtcIso = localMidnightToUtcIso(
    todayYmdInLondon,
    TIME_ZONE
  );

  const userIds = users.map((user) => user.id);

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("notifications")
    .select("user_id")
    .in("user_id", userIds)
    .eq("type", type)
    .gte("created_at", startOfTodayInLondonUtcIso);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingUserIds = new Set((existing || []).map((row) => row.user_id));

  const payload = users
    .filter((user) => !existingUserIds.has(user.id))
    .map((user) => ({
      user_id: user.id,
      type,
      title,
      message,
      link,
    }));

  if (!payload.length) {
    return { success: true, inserted: 0 };
  }

  const { error: insertError } = await supabaseAdmin
    .from("notifications")
    .insert(payload);

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { success: true, inserted: payload.length };
}