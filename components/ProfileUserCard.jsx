"use client"

import Image from "next/image"
import React, { useEffect, useMemo, useState } from "react"
import { Button } from "./ui/button"
import { Edit2Icon, Mail, MapPin, Phone, Landmark, User2 } from "lucide-react"

const emptyToDash = (v) => (v ? v : "—")

const ProfileUserCard = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // form state (editable)
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    country: "",
    phone: "",
    gender: "",
    bank_name: "",
    bank_account: "",
    cover_url: "",
    avatar_url: "",
  })

  const initials = useMemo(() => {
    const name = profile?.full_name || profile?.username || profile?.email || "U"
    return name?.[0]?.toUpperCase?.() || "U"
  }, [profile])

  const fetchProfile = async () => {
    try {
      setError("")
      setLoading(true)
      const res = await fetch("/api/profile", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load profile")
      setProfile(data)

      // preload form
      setForm({
        full_name: data?.full_name || "",
        username: data?.username || "",
        country: data?.country || "",
        phone: data?.phone || "",
        gender: data?.gender || "",
        bank_name: data?.bank_name || "",
        bank_account: data?.bank_account || "",
        cover_url: data?.cover_url || "",
        avatar_url: data?.avatar_url || "",
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const saveProfile = async () => {
    try {
      setSaving(true)
      setError("")
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to save profile")

      setProfile(data)
      setOpen(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const coverSrc = profile?.cover_url || "/images/greenbul1.jpg"

  return (
    <div className="flex flex-col">
      {/* Cover */}
      <div className="relative h-40 md:h-48 overflow-hidden rounded-sm">
        <Image src={coverSrc} fill alt="Cover" className="object-cover" priority />
        <div className="absolute inset-0 bg-black/25" />

        {/* Avatar bubble */}
        <div className="absolute -bottom-8 left-5">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-black shadow-lg border border-white/60 dark:border-white/10 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              <span className="text-lg font-bold text-primary">{initials}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-12">
        {loading && <p className="text-sm text-gray-500">Loading profile...</p>}
        {!loading && error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && profile && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">My profile</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  @{profile.username || "username-not-set"}
                </p>
              </div>

              <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
                <Edit2Icon className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>

            {/* Contact row */}
            <div className="mt-5 grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-200">{emptyToDash(profile.email)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-200">{emptyToDash(profile.phone)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-200">{emptyToDash(profile.country)}</span>
              </div>
            </div>

            {/* Details grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-white/5">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <User2 className="w-4 h-4" /> Full Name
                </p>
                <p className="text-sm font-semibold">{emptyToDash(profile.full_name)}</p>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-white/5">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Gender</p>
                <p className="text-sm font-semibold">{emptyToDash(profile.gender)}</p>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-white/5">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Landmark className="w-4 h-4" /> Bank
                </p>
                <p className="text-sm font-semibold">{emptyToDash(profile.bank_name)}</p>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-white/5">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Account No</p>
                <p className="text-sm font-semibold">{emptyToDash(profile.bank_account)}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold">Edit profile</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fill what you want — you can update anytime.
              </p>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Full name" value={form.full_name} onChange={(v) => setForm((s) => ({ ...s, full_name: v }))} />
              <Input label="Username" value={form.username} onChange={(v) => setForm((s) => ({ ...s, username: v }))} />
              <Input label="Country" value={form.country} onChange={(v) => setForm((s) => ({ ...s, country: v }))} />
              <Input label="Phone" value={form.phone} onChange={(v) => setForm((s) => ({ ...s, phone: v }))} />
              <Input label="Gender" value={form.gender} onChange={(v) => setForm((s) => ({ ...s, gender: v }))} />
              <Input label="Bank name" value={form.bank_name} onChange={(v) => setForm((s) => ({ ...s, bank_name: v }))} />
              <Input label="Bank account" value={form.bank_account} onChange={(v) => setForm((s) => ({ ...s, bank_account: v }))} />
              <Input label="Cover URL (optional)" value={form.cover_url} onChange={(v) => setForm((s) => ({ ...s, cover_url: v }))} />
              <Input label="Avatar URL (optional)" value={form.avatar_url} onChange={(v) => setForm((s) => ({ ...s, avatar_url: v }))} />
            </div>

            {error && <p className="px-5 pb-2 text-sm text-red-500">{error}</p>}

            <div className="p-5 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Input({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  )
}

export default ProfileUserCard
