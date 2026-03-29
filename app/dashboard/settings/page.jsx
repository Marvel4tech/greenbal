"use client";

import { Globe, Save, Search, Settings, Shield, Trophy, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PROTECTED_SUPER_ADMIN_EMAIL = "marvel4tech@gmail.com";
const SEARCH_LIMIT = 50;

const Page = () => {
  const [settings, setSettings] = useState({
    appName: "greenball360",
    maintenanceMode: false,
    dailyPredictionLimit: 5,
    pointsForCorrect: 3,
    pointsForDraw: 1,
    pointsForWrong: 0,
  });

  const [admins, setAdmins] = useState([]);
  const [nonAdmins, setNonAdmins] = useState([]);
  const [adminTotal, setAdminTotal] = useState(0);
  const [nonAdminTotal, setNonAdminTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleBusyId, setRoleBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [adminSearch, setAdminSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [adminSearchLoading, setAdminSearchLoading] = useState(false);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  const loadSettings = async () => {
    const res = await fetch("/api/admin/settings", { cache: "no-store" });
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json?.error || "Failed to load settings");
    }

    const dbSettings = json?.settings || {};

    setSettings({
      appName: dbSettings.app_name ?? "greenball360",
      maintenanceMode: Boolean(dbSettings.maintenance_mode),
      dailyPredictionLimit: Number(dbSettings.daily_prediction_limit ?? 5),
      pointsForCorrect: Number(dbSettings.points_for_correct ?? 3),
      pointsForDraw: Number(dbSettings.points_for_draw ?? 1),
      pointsForWrong: Number(dbSettings.points_for_wrong ?? 0),
    });
  };

  const fetchUsers = async (role, q) => {
    const url = new URL(
      role === "admin"
        ? "/api/admin/settings/users?role=admin"
        : "/api/admin/settings/users?role=user",
      window.location.origin
    );

    if (q?.trim()) {
      url.searchParams.set("q", q.trim());
    }

    url.searchParams.set("limit", String(SEARCH_LIMIT));

    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json?.error || "Failed to load users");
    }

    return {
      users: json?.users || [],
      total: Number(json?.total || 0),
    };
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await loadSettings();

      const [adminsData, nonAdminsData] = await Promise.all([
        fetchUsers("admin", ""),
        fetchUsers("user", ""),
      ]);

      setAdmins(adminsData.users);
      setAdminTotal(adminsData.total);

      setNonAdmins(nonAdminsData.users);
      setNonAdminTotal(nonAdminsData.total);
    } catch (e) {
      setError(e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setAdminSearchLoading(true);
        const result = await fetchUsers("admin", adminSearch);
        setAdmins(result.users);
        setAdminTotal(result.total);
      } catch (e) {
        setError(e.message || "Failed to search admins");
      } finally {
        setAdminSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [adminSearch]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setUserSearchLoading(true);
        const result = await fetchUsers("user", userSearch);
        setNonAdmins(result.users);
        setNonAdminTotal(result.total);
      } catch (e) {
        setError(e.message || "Failed to search users");
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to save settings");
      }

      setMessage("Settings saved successfully.");
    } catch (e) {
      setError(e.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId, nextRole) => {
    try {
      setRoleBusyId(userId);
      setError("");
      setMessage("");

      const res = await fetch("/api/admin/settings/role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: nextRole,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to update role");
      }

      if (nextRole === "admin") {
        setNonAdmins((prev) => prev.filter((u) => u.id !== userId));
        setNonAdminTotal((prev) => Math.max(0, prev - 1));
        setAdmins((prev) => [json.user, ...prev.filter((u) => u.id !== userId)]);
        setAdminTotal((prev) => prev + 1);
      } else {
        setAdmins((prev) => prev.filter((u) => u.id !== userId));
        setAdminTotal((prev) => Math.max(0, prev - 1));
        setNonAdmins((prev) => [json.user, ...prev.filter((u) => u.id !== userId)]);
        setNonAdminTotal((prev) => prev + 1);
      }

      setMessage("User role updated successfully.");
    } catch (e) {
      setError(e.message || "Failed to update role");
    } finally {
      setRoleBusyId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 mb-10">
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> App Settings
        </h1>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition disabled:opacity-60"
        >
          <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {message}
        </div>
      ) : null}

      <section className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" /> General
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">App Name</label>
            <input
              type="text"
              name="appName"
              value={settings.appName}
              onChange={handleChange}
              className="border rounded-md p-2 w-full bg-transparent"
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-3 mt-6">
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={handleChange}
              className="w-5 h-5 accent-primary"
              disabled={loading}
            />
            <label className="text-sm font-medium">Maintenance Mode</label>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> Prediction Rules
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Daily Prediction Limit</label>
            <input
              type="number"
              name="dailyPredictionLimit"
              value={settings.dailyPredictionLimit}
              onChange={handleChange}
              className="border rounded-md p-2 w-full bg-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Points for Correct Prediction</label>
            <input
              type="number"
              name="pointsForCorrect"
              value={settings.pointsForCorrect}
              onChange={handleChange}
              className="border rounded-md p-2 w-full bg-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Points for Draw Prediction</label>
            <input
              type="number"
              name="pointsForDraw"
              value={settings.pointsForDraw}
              onChange={handleChange}
              className="border rounded-md p-2 w-full bg-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Points for Wrong Prediction</label>
            <input
              type="number"
              name="pointsForWrong"
              value={settings.pointsForWrong}
              onChange={handleChange}
              className="border rounded-md p-2 w-full bg-transparent"
              disabled={loading}
            />
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-500" /> Security & Access
        </h2>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500">
                Current Admins
              </h3>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search admins by name, username or email"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full border rounded-lg py-2.5 pl-10 pr-10 bg-transparent outline-none"
                />
                {adminSearch ? (
                  <button
                    type="button"
                    onClick={() => setAdminSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              <p className="text-xs text-gray-500">
                {adminSearchLoading
                  ? "Searching..."
                  : `Showing ${admins.length} of ${adminTotal}`}
              </p>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-auto pr-1">
              {admins.map((user) => {
                const isProtected =
                  (user.email || "").toLowerCase() === PROTECTED_SUPER_ADMIN_EMAIL;

                return (
                  <div
                    key={user.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.full_name || user.username || "Unnamed user"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 break-all">
                          {user.email || "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Role: {user.role} • Joined: {formatDate(user.created_at)}
                        </p>
                        {isProtected ? (
                          <p className="text-xs text-red-500 mt-1">
                            Protected super admin. Cannot be changed to user.
                          </p>
                        ) : null}
                      </div>

                      <button
                        onClick={() => handleRoleChange(user.id, "user")}
                        disabled={roleBusyId === user.id || isProtected}
                        className="shrink-0 px-3 py-1 text-sm rounded-md bg-red-600 text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {roleBusyId === user.id ? "Working..." : "Make User"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {!admins.length && (
                <p className="text-sm text-gray-500">
                  {adminSearch ? "No admins match your search." : "No admins found."}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500">
                Promote Users to Admin
              </h3>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, username or email"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full border rounded-lg py-2.5 pl-10 pr-10 bg-transparent outline-none"
                />
                {userSearch ? (
                  <button
                    type="button"
                    onClick={() => setUserSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              <p className="text-xs text-gray-500">
                {userSearchLoading
                  ? "Searching..."
                  : `Showing ${nonAdmins.length} of ${nonAdminTotal}`}
              </p>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-auto pr-1">
              {nonAdmins.map((user) => (
                <div
                  key={user.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.full_name || user.username || "Unnamed user"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 break-all">
                        {user.email || "—"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Role: {user.role} • Joined: {formatDate(user.created_at)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRoleChange(user.id, "admin")}
                      disabled={roleBusyId === user.id}
                      className="shrink-0 px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {roleBusyId === user.id ? "Working..." : "Make Admin"}
                    </button>
                  </div>
                </div>
              ))}

              {!nonAdmins.length && (
                <p className="text-sm text-gray-500">
                  {userSearch ? "No users match your search." : "No non-admin users found."}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;