import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createServerClientWrapper } from "@/lib/supabase/server";
import NotificationsList from "@/components/NotificationsList";

const NotificationsPage = async () => {
  const supabase = await createServerClientWrapper();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "user") {
    redirect("/dashboard");
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Profile</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <p>Failed to load notifications.</p>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Profile</span>
        </Link>
      </div>

      <NotificationsList notifications={notifications || []} />
    </section>
  );
};

export default NotificationsPage;