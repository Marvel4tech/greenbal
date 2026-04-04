import { scoreGame } from "@/lib/scoring/scoreGame";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { withAdminLog } from "@/lib/withAdminLog";
import { NextResponse } from "next/server";
import { sendNotificationToAllUsers } from "@/lib/notifications/sendNotification";

const TZ = "Europe/London";

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

function londonLocalDateTimeToUtcIso(localDateTime) {
  const match = String(localDateTime).match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );

  if (!match) {
    throw new Error("Invalid match_time format. Use YYYY-MM-DDTHH:mm");
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

function normalizeMatchTime(matchTime) {
  const value = String(matchTime).trim();

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return londonLocalDateTimeToUtcIso(value);
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  throw new Error("Invalid match_time value");
}

function buildSafeGameUpdate(body) {
  const updateData = {};

  if (typeof body.home_team === "string") {
    updateData.home_team = body.home_team.trim();
  }

  if (typeof body.away_team === "string") {
    updateData.away_team = body.away_team.trim();
  }

  if (typeof body.match_time === "string" && body.match_time.trim()) {
    updateData.match_time = normalizeMatchTime(body.match_time);
  }

  if (typeof body.status === "string") {
    const allowedStatuses = new Set(["upcoming", "live", "finished"]);
    if (!allowedStatuses.has(body.status)) {
      throw new Error("Invalid status value");
    }
    updateData.status = body.status;
  }

  if (body.result !== undefined) {
    const allowedResults = new Set(["homeWin", "draw", "awayWin", null, ""]);
    if (!allowedResults.has(body.result)) {
      throw new Error("Invalid result value");
    }
    updateData.result = body.result === "" ? null : body.result;
  }

  return updateData;
}

// UPDATE game result / details
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const action =
      body?.status === "finished" && body?.result
        ? "game_scored"
        : "game_updated";

    return await withAdminLog(
      request,
      async () => {
        const safeUpdate = buildSafeGameUpdate(body);

        if (Object.keys(safeUpdate).length === 0) {
          throw new Error("No valid fields provided for update");
        }

        const { data, error } = await supabaseAdmin
          .from("games")
          .update(safeUpdate)
          .eq("id", id)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        const allowedResults = new Set(["homeWin", "draw", "awayWin"]);

        if (
          data.status === "finished" &&
          data.result &&
          allowedResults.has(data.result)
        ) {
          try {
            await sendNotificationToAllUsers({
              type: "game_finished",
              title: "Game result updated",
              message: `${data.home_team} vs ${data.away_team} has been completed and scored.`,
              link: "/profile/play",
            });
          } catch (notificationError) {
            console.error(
              "Game finished notification error:",
              notificationError
            );
          }

          const scoring = await scoreGame(id);

          return NextResponse.json({
            success: true,
            data,
            scoring,
          });
        }

        try {
          await sendNotificationToAllUsers({
            type: "game_updated",
            title: "Game updated",
            message: `${data.home_team} vs ${data.away_team} has been updated.`,
            link: "/profile/play",
          });
        } catch (notificationError) {
          console.error("Game update notification error:", notificationError);
        }

        return NextResponse.json({
          success: true,
          data,
        });
      },
      {
        action,
        message: (admin) =>
          body?.status === "finished" && body?.result
            ? `${admin.username || admin.email || admin.id} scored game: ${id}`
            : `${admin.username || admin.email || admin.id} updated game: ${id}`,
        path: "/dashboard/games",
        metadata: {
          gameId: id,
          updateBody: body,
        },
      }
    );
  } catch (error) {
    const status =
      error.message === "Unauthorized"
        ? 401
        : error.message === "Forbidden"
          ? 403
          : error.message?.startsWith("Invalid") ||
              error.message === "No valid fields provided for update"
            ? 400
            : 500;

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update game",
      },
      { status }
    );
  }
}

// DELETE a game
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    return await withAdminLog(
      request,
      async () => {
        const { data: existingGame, error: fetchError } = await supabaseAdmin
          .from("games")
          .select("id, home_team, away_team, match_time, status, result")
          .eq("id", id)
          .single();

        if (fetchError || !existingGame) {
          throw new Error(fetchError?.message || "Game not found");
        }

        const { error } = await supabaseAdmin
          .from("games")
          .delete()
          .eq("id", id);

        if (error) {
          throw error;
        }

        return NextResponse.json({
          success: true,
          message: "Game deleted",
        });
      },
      {
        action: "game_deleted",
        message: (admin) =>
          `${admin.username || admin.email || admin.id} deleted game: ${id}`,
        path: "/dashboard/games",
        metadata: {
          gameId: id,
        },
      }
    );
  } catch (error) {
    const status =
      error.message === "Unauthorized"
        ? 401
        : error.message === "Forbidden"
          ? 403
          : error.message === "Game not found"
            ? 404
            : 500;

    console.error("Error deleting game:", error.message);

    return NextResponse.json(
      { success: false, message: error.message },
      { status }
    );
  }
}