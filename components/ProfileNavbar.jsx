import Link from "next/link";
import React from "react";
import { FaFutbol } from "react-icons/fa";
import { ThemeToggle } from "./theme-toggle";
import { createServerClientWrapper } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotificationAvatarLink from "./NotificationAvatarLink";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const ProfileNavbar = async () => {
  const supabase = await createServerClientWrapper();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  if (profile.role !== "user") {
    redirect("/dashboard");
  }

  const { count: unreadCount, error: notificationError } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (notificationError) {
    console.error("Notification count fetch error:", notificationError.message);
  }

  const greeting = getGreeting();

  return (
    <header className="border-b border-primary px-4 lg:px-0">
      <div className="h-20 max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/">
          <FaFutbol className="text-5xl text-primary" />
        </Link>

        <div className="flex items-center gap-5 md:gap-10">
          <div className="flex items-center gap-2">
            <NotificationAvatarLink
              href="/profile/notifications"
              avatarUrl={profile.avatar_url}
              username={profile.username}
              initialUnreadCount={Number(unreadCount) || 0}
            />

            <h1 className="text-sm">
              {greeting},{" "}
              <span className="capitalize font-medium">{profile.username}</span>
            </h1>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default ProfileNavbar;