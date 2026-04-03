"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const NotificationsList = ({ notifications }) => {
  const router = useRouter();
  const [items, setItems] = useState(notifications || []);

  const unreadCount = useMemo(() => {
    return items.filter((item) => !item.is_read).length;
  }, [items]);

  const updateGlobalCount = (count) => {
    sessionStorage.setItem("notificationUnreadCount", String(count));
    window.dispatchEvent(
      new CustomEvent("notifications:update-count", {
        detail: { count },
      })
    );
  };

  const markItemLocallyAsRead = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    );
  };

  const markAllLocallyAsRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
  };

  const handleOpenNotification = async (item) => {
    if (!item.is_read) {
      const nextCount = Math.max(0, unreadCount - 1);
      markItemLocallyAsRead(item.id);
      updateGlobalCount(nextCount);
    }

    router.push(`/profile/notifications/${item.id}`);
  };

  const handleMarkAnnouncementAsRead = async (id) => {
    const target = items.find((item) => item.id === id);
    if (!target || target.is_read) return;

    const nextCount = Math.max(0, unreadCount - 1);
    markItemLocallyAsRead(id);
    updateGlobalCount(nextCount);

    try {
      await fetch(`/profile/notifications/${id}/mark-read`, {
        method: "POST",
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to mark announcement as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    markAllLocallyAsRead();
    updateGlobalCount(0);

    try {
      await fetch("/profile/notifications/mark-read", {
        method: "POST",
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>

        <button
          type="button"
          onClick={handleMarkAllAsRead}
          className="px-4 py-2 rounded-md border border-primary text-sm"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {items?.length ? (
          items.map((item) => {
            const isAnnouncement = item.type === "admin_announcement";

            if (isAnnouncement) {
              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 ${
                    item.is_read ? "opacity-70" : "border-primary"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] uppercase tracking-wide opacity-60">
                        Announcement
                      </span>

                      <h2 className="font-semibold">{item.title}</h2>
                      <p className="text-sm mt-1">{item.message}</p>
                      <p className="text-xs mt-2 opacity-70">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {!item.is_read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                      )}

                      {!item.is_read && (
                        <button
                          type="button"
                          onClick={() => handleMarkAnnouncementAsRead(item.id)}
                          className="text-xs border rounded-md px-3 py-1"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOpenNotification(item)}
                className={`w-full text-left rounded-lg border p-4 transition hover:bg-muted/40 cursor-pointer ${
                  item.is_read ? "opacity-70" : "border-primary"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{item.title}</h2>
                    <p className="text-sm mt-1">{item.message}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  {!item.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 mt-2 shrink-0" />
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <p>No notifications yet.</p>
        )}
      </div>
    </>
  );
};

export default NotificationsList;