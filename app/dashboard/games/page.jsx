'use client'

import { CalendarDays, ChevronLeft, ChevronRight, Pencil, PlusCircle, Trash, X } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// functions begins
const TZ = 'Europe/London'

// Get YYYY-MM-DD for today in UK time
function todayYMD() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())
  
    const y = parts.find(p => p.type === 'year')?.value
    const m = parts.find(p => p.type === 'month')?.value
    const d = parts.find(p => p.type === 'day')?.value
    return `${y}-${m}-${d}`
}

function addDaysYMD(ymd, days) {
    const [y, m, d] = ymd.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + days)
    const yy = dt.getUTCFullYear()
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(dt.getUTCDate()).padStart(2, '0')
    return `${yy}-${mm}-${dd}`
}

function prettyDate(ymd) {
    const [y, m, d] = ymd.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(dt)
}
// function ends

const page = () => {
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [newGames, setNewGames] = useState({homeTeam: "", awayTeam: "", matchTime: ""})
    const [showModal, setShowModal] = useState(false)
    const [selectedGames, setSelectedGames] = useState(null)
    const [result, setResult] = useState("")

    // Date browsing (defaults to today in UK)
    const [selectedDate, setSelectedDate] = useState(() => todayYMD())
    const today = useMemo(() => todayYMD(), [])

    const isToday = selectedDate === today

    // Fetch games whenever date changes
    useEffect(() => {
        const fetchGames = async () => {
        setLoading(true)
        setError("")
            try {
                const url = selectedDate === today
                ? "/api/games"
                : `/api/games?date=${selectedDate}`

                const res = await fetch(url, { cache: "no-store" })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.error || "Failed to fetch games")
                setGames(data || [])
            } catch (err) {
                setError(err.message)
                setGames([])
            } finally {
                setLoading(false)
            }
        }

        fetchGames()
    }, [selectedDate, isToday])

    // Date controls
    const goPrevDay = () => setSelectedDate((d) => addDaysYMD(d, -1))
    const goNextDay = () => {
        // Don’t allow future browsing past today
        if (isToday) return
        setSelectedDate((d) => {
        const next = addDaysYMD(d, 1)
        return next > today ? today : next
        })
    }
    const goToday = () => setSelectedDate(today)

    // Add a new game via Next.js API
    const handleAddGame = async (e) => {
        e.preventDefault()
        if (!newGames.homeTeam || !newGames.awayTeam || !newGames.matchTime) {
        alert("Please fill in all fields")
        return
        }

        try {
            const res = await fetch("/api/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    homeTeam: newGames.homeTeam,
                    awayTeam: newGames.awayTeam,
                    matchTime: newGames.matchTime
            })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to add game")

        // ✅ If viewing today, append instantly
        if (isToday) {
            setGames((prev) => [...prev, data])
        }

        setNewGames({ homeTeam: "", awayTeam: "", matchTime: "" })
        } catch (err) {
            alert(`Error adding game: ${err.message}`)
        }
    }

    // Open modal to update result
    const openModal = (game) => {
        setSelectedGames(game)
        setResult("") // reset selection each time
        setShowModal(true)
    }

    // Save result
    const handleSaveResult = async () => {
        if (!result || !selectedGames) return

        const res = await fetch(`/api/games/${selectedGames.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            result,
            status: "finished"
        })
        })

        const data = await res.json()

        if (data.success) {
            setGames((prev) =>
                prev.map((g) => (g.id === selectedGames.id ? data.data : g))
            )
            setShowModal(false)
            setSelectedGames(null)
            setResult("")
        } else {
            alert(data?.message || "Failed to update game")
        }
    }

    // Delete game (calls API + updates UI)
    const handleDelete = async (id) => {
        const ok = confirm("Delete this game?")
        if (!ok) return

        try {
        const res = await fetch(`/api/games/${id}`, { method: "DELETE" })
        const data = await res.json()

        if (!res.ok || data?.success === false) {
            throw new Error(data?.message || "Failed to delete game")
        }

        setGames((prev) => prev.filter((g) => g.id !== id))
        } catch (err) {
        alert(err.message)
        }
    }

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto">
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Manage Games</h1>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <CalendarDays className="w-4 h-4" />
                        Showing: <span className="font-medium">{prettyDate(selectedDate)}</span> (UK)
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={goPrevDay} className="flex-1 sm:flex-none px-3 py-2 rounded-md border bg-white 
                    dark:bg-black/40 hover:bg-gray-50 dark:hover:bg-white/10 transition flex items-center justify-center gap-2">
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-sm">Prev</span>
                    </button>

                    <button onClick={goToday} disabled={isToday} className="flex-1 sm:flex-none px-3 py-2 rounded-md border 
                    bg-white dark:bg-black/40 hover:bg-gray-50 dark:hover:bg-white/10 transition disabled:opacity-50 
                    disabled:cursor-not-allowed">
                        <span className="text-sm">Today</span>
                    </button>

                    <button onClick={goNextDay} disabled={isToday} className="flex-1 sm:flex-none px-3 py-2 rounded-md border bg-white 
                    dark:bg-black/40 hover:bg-gray-50 dark:hover:bg-white/10 transition flex items-center justify-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-sm">Next</span>
                    </button>
                </div>
            </div>

            {/* Game Creation Form */}
            <form onSubmit={handleAddGame} className="bg-white dark:bg-black/50 p-6 rounded-xl shadow-md flex flex-col 
            md:flex-row gap-4 mb-8">
                <input
                    type='text'
                    placeholder='Home Team'
                    value={newGames.homeTeam}
                    onChange={(e) => setNewGames({ ...newGames, homeTeam: e.target.value })}
                    className='border rounded-md p-2 flex-1 bg-transparent'
                />
                <input
                    type='text'
                    placeholder='Away Team'
                    value={newGames.awayTeam}
                    onChange={(e) => setNewGames({ ...newGames, awayTeam: e.target.value })}
                    className='border rounded-md p-2 flex-1 bg-transparent'
                />
                <input
                    type='datetime-local'
                    value={newGames.matchTime}
                    onChange={(e) => setNewGames({ ...newGames, matchTime: e.target.value })}
                    className='border rounded-md p-2 flex-1 bg-transparent'
                />
                <button type='submit' className="bg-primary text-white px-4 py-2 rounded-md flex items-center justify-center 
                gap-2 hover:opacity-90">
                    <PlusCircle size={18} /> Add Game
                </button>
            </form>

            {loading && <p className="text-center text-gray-500">Loading games…</p>}
            {!loading && error && <p className="text-center text-red-500">{error}</p>}

            {!loading && !error && (games.length > 0 ? (
                <div className="bg-white dark:bg-black/50 rounded-xl shadow-md">
                    {/* Add horizontal scroll container with better padding for mobile */}
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[700px] md:min-w-full">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="p-4 text-left whitespace-nowrap">Match</th>
                                <th className="p-4 text-left whitespace-nowrap">Time</th>
                                <th className="p-4 text-left whitespace-nowrap">Status</th>
                                <th className="p-4 text-left whitespace-nowrap">Result</th>
                                <th className="p-4 text-center whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {games.map((game) => (
                            <tr 
                            key={game.id} 
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            >
                            <td className="p-4">
                                <div className="flex flex-col min-w-[180px]">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium truncate max-w-[100px]">{game.home_team}</span>
                                    <span className="text-xs font-bold text-gray-500">vs</span>
                                    <span className="font-medium truncate max-w-[100px]">{game.away_team}</span>
                                </div>
                                </div>
                            </td>
                            
                            <td className="p-4">
                                <div className="flex flex-col min-w-[140px]">
                                <span className="font-medium">
                                    {new Date(game.match_time).toLocaleString('en-GB', { 
                                    timeZone: TZ,
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                    })}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(game.match_time).toLocaleString('en-GB', { 
                                    timeZone: TZ,
                                    weekday: 'short'
                                    })}
                                </span>
                                </div>
                            </td>
                            
                            <td className="p-4">
                                <div className="min-w-[90px]">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize inline-block
                                    ${game.status === 'completed' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : game.status === 'live' 
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 animate-pulse'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    }`}
                                >
                                    {game.status}
                                </span>
                                </div>
                            </td>
                            
                            <td className="p-4">
                                <div className="min-w-[100px]">
                                {game.result ? (
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium inline-block ${
                                    game.result === 'homeWin'
                                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                        : game.result === "draw"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    }`}>
                                    {game.result === 'homeWin'
                                        ? "Home Win"
                                        : game.result === "draw"
                                        ? "Draw"
                                        : "Away Win"
                                    }
                                    </span>
                                ) : (
                                    <span className="text-gray-400 italic">Not played</span>
                                )}
                                </div>
                            </td>
                            
                            <td className="p-4">
                                <div className="flex items-center justify-center gap-3 min-w-[100px]">
                                <button 
                                    onClick={() => openModal(game)} 
                                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                    title="Edit match"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(game.id)} 
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                    title="Delete match"
                                >
                                    <Trash size={18} />
                                </button>
                                </div>
                            </td>
                            </tr>
                        ))}
                        
                        {games.length === 0 && (
                            <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                No matches found.
                            </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                    </div>
                    
                    {/* Scroll hint for mobile */}
                    <div className="mt-2 pb-2 text-xs text-gray-400 text-center md:hidden">
                    ← Swipe horizontally to see more →
                    </div>
                </div>
            ): (
                <p className="text-center text-gray-500 mt-10">
                    No games for this day.
                </p>
            ))}

            {/* Result Modal */}
            {showModal && selectedGames && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
                    <div className="bg-white dark:bg-black/90 p-6 rounded-lg shadow-xl w-[90%] max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">
                                Update Result: {selectedGames.home_team} vs {selectedGames.away_team}
                            </h2>
                            <button onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setResult("homeWin")}
                                className={`py-2 rounded-md font-medium ${
                                result === "homeWin"
                                    ? "bg-green-500 text-white"
                                    : "bg-green-100 text-green-700"
                                }`}
                            >
                                Home Win
                            </button>
                            <button
                                onClick={() => setResult("draw")}
                                className={`py-2 rounded-md font-medium ${
                                result === "draw"
                                    ? "bg-yellow-500 text-white"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                            >
                                Draw
                            </button>
                            <button
                                onClick={() => setResult("awayWin")}
                                className={`py-2 rounded-md font-medium ${
                                result === "awayWin"
                                    ? "bg-red-500 text-white"
                                    : "bg-red-100 text-red-700"
                                }`}
                            >
                                Away Win
                            </button>
                        </div>

                        <button onClick={handleSaveResult} className="mt-5 bg-primary text-white px-4 py-2 rounded-md w-full 
                        font-semibold hover:opacity-90">
                            Save Result
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default page