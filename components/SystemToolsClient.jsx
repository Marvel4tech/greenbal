"use client"

import { Database, RefreshCw, Trash2, Users, Shield, Activity } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

function formatDateTime(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-md">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 dark:bg-white/10 p-2">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function SystemToolsClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    try {
      setError("")
      const res = await fetch("/api/admin/system-tools", { cache: "no-store" })
      const json = await res.json()

      if (!res.ok) throw new Error(json?.error || "Failed to load system tools")
      setData(json)
    } catch (e) {
      setError(e.message || "Failed to load system tools")
    }
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      await load()
      setLoading(false)
    }

    run()
  }, [])

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  const handleClearLogs = async () => {
    const ok = confirm("Are you sure you want to clear all logs?")
    if (!ok) return

    try {
      setClearing(true)
      const res = await fetch("/api/admin/system-tools/clear-logs", {
        method: "POST",
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to clear logs")

      await load()
    } catch (e) {
      alert(e.message || "Failed to clear logs")
    } finally {
      setClearing(false)
    }
  }

  const logs = data?.logs || []
  const onlineUsers = data?.onlineUsers || []
  const onlineAdmins = data?.onlineAdmins || []
  const recentUsers = data?.recentUsers || []
  const recentAdmins = data?.recentAdmins || []

  const systemStatus = useMemo(() => {
    return {
      database: data?.status?.database || "Unknown",
      lastBackup: data?.status?.lastBackup ? formatDateTime(data.status.lastBackup) : "Not configured",
      logsStored: data?.status?.logsStored || 0,
      totalUsers: data?.counts?.totalUsers || 0,
      onlineUsers: data?.counts?.onlineUsers || 0,
      onlineAdmins: data?.counts?.onlineAdmins || 0,
    }
  }, [data])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 mb-10">
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">System Tools</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor online users, admin activity, sign-ins, and recent system actions.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className="w-5 h-5" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60"
            onClick={handleClearLogs}
            disabled={clearing}
          >
            <Trash2 className="w-5 h-5" />
            {clearing ? "Clearing..." : "Clear Logs"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatusCard icon={Database} label="Database" value={systemStatus.database} />
        <StatusCard icon={Users} label="Total users" value={systemStatus.totalUsers} />
        <StatusCard icon={Activity} label="Online users" value={systemStatus.onlineUsers} />
        <StatusCard icon={Shield} label="Online admins" value={systemStatus.onlineAdmins} />
        <StatusCard icon={RefreshCw} label="Logs stored" value={systemStatus.logsStored} />
        <StatusCard icon={Database} label="Last backup" value={systemStatus.lastBackup} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-3">Currently Online Users</h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : onlineUsers.length ? (
            <div className="space-y-3">
              {onlineUsers.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    @{u.username || "unknown"} <span className="text-sm text-gray-500">({u.role || "user"})</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {u.email || "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last seen: {formatDateTime(u.last_seen_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last sign-in: {formatDateTime(u.last_sign_in_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last page: {u.last_path || "—"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No users currently online.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-3">Currently Online Admins</h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : onlineAdmins.length ? (
            <div className="space-y-3">
              {onlineAdmins.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    @{u.username || "unknown"} <span className="text-sm text-blue-600">(admin)</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {u.email || "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last seen: {formatDateTime(u.last_seen_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last sign-in: {formatDateTime(u.last_sign_in_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last page: {u.last_path || "—"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No admins currently online.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-3">Latest User Activity</h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : recentUsers.length ? (
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    @{u.username || "unknown"} <span className="text-sm text-gray-500">({u.role || "user"})</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {u.email || "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last seen: {formatDateTime(u.last_seen_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last sign-in: {formatDateTime(u.last_sign_in_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last page: {u.last_path || "—"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No user activity found.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-3">Latest Admin Activity</h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : recentAdmins.length ? (
            <div className="space-y-3">
              {recentAdmins.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    @{u.username || "unknown"} <span className="text-sm text-blue-600">(admin)</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {u.email || "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last seen: {formatDateTime(u.last_seen_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last sign-in: {formatDateTime(u.last_sign_in_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last page: {u.last_path || "—"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No admin activity found.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" /> System Logs
        </h2>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : logs.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log) => (
              <li key={log.id} className="py-3 flex justify-between items-start gap-4">
                <div>
                  <p className="font-medium text-blue-600">
                    [{String(log.action || "").toUpperCase()}]
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{log.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    User: @{log.username || "unknown"} • {log.email || "—"} • {log.role || "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Path: {log.path || "—"}
                  </p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDateTime(log.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm italic text-center py-6">
            No system logs available.
          </p>
        )}
      </div>
    </div>
  )
}