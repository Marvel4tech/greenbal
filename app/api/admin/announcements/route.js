import { NextResponse } from "next/server";
import { sendNotificationToAllUsers } from "@/lib/notifications/sendNotification";
import { withAdminLog } from "@/lib/withAdminLog";

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, link } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    return await withAdminLog(
      request,
      async ({ admin }) => {
        await sendNotificationToAllUsers({
          type: "admin_announcement",
          title,
          message,
          link: link || "/notifications",
        });

        return NextResponse.json({
          success: true,
          message: "Announcement sent successfully",
        });
      },
      {
        action: "admin_announcement_sent",
        message: (admin) =>
          `${admin.username || admin.email || admin.id} sent an admin announcement`,
        path: "/dashboard",
        metadata: {
          title,
          message,
          link: link || "/notifications",
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
      { success: false, error: error.message || "Server error" },
      { status }
    );
  }
}