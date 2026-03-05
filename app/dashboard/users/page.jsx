"use client"

import { Mail, Search, User } from "lucide-react"
import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"
import { ArrowLeft } from 'lucide-react'

const emptyToDash = (v) => (v ? v : "—")
const PAGE_SIZE = 50

export default function Page() {
  const [users, setUsers] = useState([])
  const [count, setCount] = useState(0)
  const [offset, setOffset] = useState(0)

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")

  const [hasMore, setHasMore] = useState(false)

  // debounce typing (keeps search snappy)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm.trim()), 250)
    return () => clearTimeout(t)
  }, [searchTerm])

  const fetchUsers = async ({ q, offsetParam, append }) => {
    const isLoadMore = append === true
    try {
      setError("")
      if (isLoadMore) setLoadingMore(true)
      else setLoading(true)

      const res = await fetch(
        `/api/admin/users?q=${encodeURIComponent(q || "")}&limit=${PAGE_SIZE}&offset=${offsetParam}`,
        { cache: "no-store" }
      )

      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error("Server did not return JSON")
      }

      if (!res.ok) throw new Error(data?.error || "Failed to load users")

      const nextUsers = data?.users || []
      setCount(data?.count || 0)
      setHasMore(Boolean(data?.hasMore))

      if (isLoadMore) {
        setUsers((prev) => [...prev, ...nextUsers])
      } else {
        setUsers(nextUsers)
      }
    } catch (e) {
      setError(e.message)
      if (!isLoadMore) setUsers([])
    } finally {
      if (isLoadMore) setLoadingMore(false)
      else setLoading(false)
    }
  }

  // When search changes: reset list + offset
  useEffect(() => {
    setOffset(0)
    fetchUsers({ q: debounced, offsetParam: 0, append: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const onLoadMore = async () => {
    const nextOffset = offset + PAGE_SIZE
    setOffset(nextOffset)
    await fetchUsers({ q: debounced, offsetParam: nextOffset, append: true })
  }

  const subtitle = useMemo(() => {
    if (loading) return "Loading…"
    if (error) return "Could not load users"
    if (debounced) return `Search: “${debounced}” • ${count} total`
    return `${count} total users`
  }, [loading, error, debounced, count])

  return (
    <div className="p-6 max-w-7xl mx-auto mb-10">
      {/* Back button - visible on all devices */}
      <div className="mb-4">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">All Users</h1>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>

        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full bg-white dark:bg-gray-900 dark:border-gray-700
            outline-none focus:ring-2 focus:ring-primary transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
        {/* Add horizontal scroll container for mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm md:text-base min-w-[640px] md:min-w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Country</th>
                <th className="p-3 text-left">Role</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-gray-500">
                    Loading users…
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <td className="p-3">
                    <Link
                      href={`/dashboard/users/${u.id}`}
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <span className="font-medium truncate max-w-[150px]">
                        {u.full_name || u.username || "Unnamed user"}
                      </span>
                    </Link>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[150px]">{emptyToDash(u.email)}</span>
                    </div>
                  </td>

                  <td className="p-3">
                    <span className="truncate max-w-[100px] inline-block">
                      {emptyToDash(u.country)}
                    </span>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs whitespace-nowrap">
                      {u.role || "User"}
                    </span>
                  </td>
                </tr>
              ))}

              {!loading && !error && users.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional: Add scroll hint for mobile */}
      <div className="mt-2 text-xs text-gray-500 text-center md:hidden">
        ← Swipe to see more →
      </div>

      {/* Load More */}
      {!loading && !error && users.length > 0 && (
        <div className="mt-6 flex items-center justify-center">
          {hasMore ? (
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="px-5 py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90 disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          ) : (
            <p className="text-xs text-gray-500">You’ve reached the end.</p>
          )}
        </div>
      )}
    </div>
  )
}
