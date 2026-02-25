"use client"

import {
  Activity,
  Ban,
  Mail,
  MapPin,
  Shield,
  Trash2,
  Trophy,
  User,
  CheckCircle2,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import React, { useEffect, useMemo, useState } from "react"
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const labelPrediction = (p) => {
  if (p === "homeWin") return "Home Win"
  if (p === "draw") return "Draw"
  if (p === "awayWin") return "Away Win"
  return "—"
}

const formatDate = (iso) => {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

const formatDateTime = (iso) => {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const Page = () => {
  const params = useParams()
  const router = useRouter()
  const userId = params?.id

  const [user, setUser] = useState(null)
  const [preds, setPreds] = useState([])
  const [weeklyRank, setWeeklyRank] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [banLoading, setBanLoading] = useState(false)

  const load = async () => {
    try {
      setError("")
      setLoading(true)

      const res = await fetch(`/api/admin/users/${userId}?recent=10`, { cache: "no-store" })
      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error("Server did not return JSON")
      }

      if (!res.ok) throw new Error(data?.error || "Failed to load user")

      setUser(data?.user || null)
      setPreds(data?.recentPredictions || [])
      setWeeklyRank(data?.weekly_rank ?? null)
    } catch (e) {
      setError(e.message)
      setUser(null)
      setPreds([])
      setWeeklyRank(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const onDelete = async () => {
    const ok = confirm("Delete this user profile? This cannot be undone.")
    if (!ok) return

    try {
      setDeleting(true)
      setError("")

      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error("Server did not return JSON")
      }

      if (!res.ok) throw new Error(data?.error || "Failed to delete user")
      router.push("/dashboard/users")
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  const toggleBan = async () => {
    if (!user) return
    const next = !user.is_banned

    const ok = confirm(
      next
        ? "Ban this user? They will be blocked from predictions and gameplay."
        : "Unban this user? They can play again."
    )
    if (!ok) return

    try {
      setBanLoading(true)
      setError("")

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_banned: next }),
      })

      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error("Server did not return JSON")
      }

      if (!res.ok) throw new Error(data?.error || "Failed to update ban status")
      setUser((prev) => (prev ? { ...prev, is_banned: next } : prev))
    } catch (e) {
      setError(e.message)
    } finally {
      setBanLoading(false)
    }
  }

  const joined = useMemo(() => formatDate(user?.joined), [user?.joined])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back button - visible on all devices */}
      <div className="mb-2">
        <Link 
          href="/dashboard/users" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to All Users</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">User Details</h1>
          {loading ? (
            <p className="text-xs text-gray-500 mt-1">Loading…</p>
          ) : error ? (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              ID: <span className="font-medium">{userId}</span>
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleBan}
            disabled={banLoading || loading || !user}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-white transition disabled:opacity-60 ${
              user?.is_banned ? "bg-green-600 hover:bg-green-700" : "bg-yellow-500 hover:bg-yellow-600"
            }`}
          >
            {user?.is_banned ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> {banLoading ? "Working…" : "Unban"}
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" /> {banLoading ? "Working…" : "Ban"}
              </>
            )}
          </button>

          <button
            onClick={onDelete}
            disabled={deleting || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" /> {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-12 h-12 text-primary" />
        </div>

        {loading ? (
          <div className="w-full">
            <div className="h-5 w-56 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
            <div className="h-4 w-72 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
            <div className="h-4 w-52 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ) : user ? (
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h2 className="text-xl font-semibold">
                {user.full_name || user.username || "Unnamed user"}
              </h2>

              {user.is_banned ? (
                <span className="text-[11px] px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200">
                  BANNED
                </span>
              ) : (
                <span className="text-[11px] px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200">
                  ACTIVE
                </span>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>{user.email || "—"}</span>
              </div>

              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{user.country || "—"}</span>
              </div>

              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span className="capitalize">{user.role || "user"}</span>
              </div>
            </div>

            <p className="text-sm text-gray-500">Joined: {joined}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No user found.</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-gray-500 text-sm">Total Predictions</p>
            <h3 className="text-lg font-bold">{user?.totalPredictions ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <div>
            <p className="text-gray-500 text-sm">Total Points</p>
            <h3 className="text-lg font-bold">{user?.totalPoints ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-600" />
          <div>
            <p className="text-gray-500 text-sm">Weekly Rank</p>
            <h3 className="text-lg font-bold">{weeklyRank ? `#${weeklyRank}` : "—"}</h3>
          </div>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Predictions</h2>
          <button onClick={load} className="text-blue-600 text-sm hover:underline">
            Refresh
          </button>
        </div>

        <table className="w-full text-sm md:text-base">
          <thead className="bg-primary text-white">
            <tr>
              <th className="p-3 text-left">Game</th>
              <th className="p-3 text-left">Kickoff</th>
              <th className="p-3 text-left">Prediction</th>
              <th className="p-3 text-left">Result</th>
              <th className="p-3 text-left">Points</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              preds.map((p) => {
                const g = p.games
                const gameLabel = g ? `${g.home_team} vs ${g.away_team}` : "—"
                const kickoff = g?.match_time ? formatDateTime(g.match_time) : "—"

                const finished = g?.status === "finished"
                const correct = finished && g?.result && p?.prediction === g?.result

                return (
                  <tr
                    key={p.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <td className="p-3">{gameLabel}</td>
                    <td className="p-3">{kickoff}</td>
                    <td className="p-3">{labelPrediction(p.prediction)}</td>
                    <td className="p-3">
                      {!finished ? (
                        <span className="text-gray-500">Pending</span>
                      ) : correct ? (
                        <span className="text-green-600 font-medium">✅ Correct</span>
                      ) : (
                        <span className="text-red-500 font-medium">❌ Wrong</span>
                      )}
                    </td>
                    <td className="p-3 font-semibold">{Number(p.points ?? 0)}</td>
                  </tr>
                )
              })}

            {!loading && preds.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500">
                  No predictions yet.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500">
                  Loading predictions…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Page
