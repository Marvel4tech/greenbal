import { scoreGame } from "@/lib/scoring/scoreGame";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { withAdminLog } from "@/lib/withAdminLog";
import { NextResponse } from "next/server";
import { sendNotificationToAllUsers } from "@/lib/notifications/sendNotification";

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
        const allowedResults = new Set(["homeWin", "draw", "awayWin"]);

        const { data, error } = await supabaseAdmin
          .from("games")
          .update({
            ...body,
          })
          .eq("id", id)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

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
          : 500;

    return NextResponse.json(
      {
        success: false,
        message: `Game updated, but scoring failed: ${error.message}`,
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

        const { error } = await supabaseAdmin.from("games").delete().eq("id", id);

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
          : 500;

    console.error("Error deleting game:", error.message);

    return NextResponse.json(
      { success: false, message: error.message },
      { status }
    );
  }
}