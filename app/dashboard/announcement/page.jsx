import AnnouncementForm from "@/components/AnnouncementForm";
import { createServerClientWrapper } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const DashboardAnnouncementsPage = async () => {
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  // only admins can access this page
  if (profile.role !== "admin") {
    redirect("/profile");
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Send Announcement
        </h1>
        <p className="text-sm opacity-70 mt-2">
          Broadcast an important message to all greenball360 users.
        </p>
      </div>

      <div className="rounded-xl border border-primary/20 p-6 shadow-sm">
        <AnnouncementForm />
      </div>
    </section>
  );
};

export default DashboardAnnouncementsPage;