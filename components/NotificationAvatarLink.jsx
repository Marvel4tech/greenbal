"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserIcon } from "lucide-react";

const NotificationAvatarLink = ({
  href = "/profile/notifications",
  avatarUrl,
  username,
  initialUnreadCount = 0,
}) => {
  const [count, setCount] = useState(Number(initialUnreadCount) || 0);

  useEffect(() => {
    const storedCount = sessionStorage.getItem("notificationUnreadCount");
    if (storedCount !== null) {
      setCount(Number(storedCount));
    } else {
      sessionStorage.setItem(
        "notificationUnreadCount",
        String(Number(initialUnreadCount) || 0)
      );
    }

    const handleCountUpdate = (event) => {
      const nextCount = Number(event.detail?.count ?? 0);
      setCount(nextCount);
      sessionStorage.setItem("notificationUnreadCount", String(nextCount));
    };

    window.addEventListener("notifications:update-count", handleCountUpdate);

    return () => {
      window.removeEventListener(
        "notifications:update-count",
        handleCountUpdate
      );
    };
  }, [initialUnreadCount]);

  return (
    <Link href={href} className="relative block">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={username}
          width={40}
          height={40}
          className="rounded-full object-cover w-8 h-8 md:w-10 md:h-10 border border-primary"
        />
      ) : (
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-primary flex items-center justify-center">
          <UserIcon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      )}

      {count > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] md:text-xs flex items-center justify-center font-bold leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
};

export default NotificationAvatarLink;