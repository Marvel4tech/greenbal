'use client'

import { Pencil, PlusCircle, Trash, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const page = () => {
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(false)
    const [newGames, setNewGames] = useState({homeTeam: "", awayTeam: "", matchTime: ""})
    const [showModal, setShowModal] = useState(false)
    const [selectedGames, setSelectedGames] = useState(null)
    const [result, setResult] = useState("")

    // fetch all games on load
    useEffect(() => {
        const fetchGames = async () => {
            setLoading(true)
            try {
                const res = await fetch("/api/games", { cache: "no-store" })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error)
                setGames(data)
            } catch (err) {
                console.error("Error fetching games:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchGames()
    }, []);

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
            if (!res.ok) throw new Error(data.error)

            setGames((prev) => [...prev, data])
            setNewGames({ homeTeam: "", awayTeam: "", matchTime: "" })
        } catch (err) {
            alert(`Error adding game: ${err.message}`)
        }
    }

    // Open modal to update result
    const openModal = (games) => {
        setSelectedGames(games);
        setShowModal(true);
    };



    // Save result
    const handleSaveResult = async () => {
        if (!result) return;

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
            // Refresh the list
            setGames((prev) => 
                prev.map((g) => 
                    g.id === selectedGames.id ? data.data : g
                )
            );

            setShowModal(false);
        } else {
            alert("Failed to update game");
        }
    }

    // Delete game
    const handleDelete = (id) => {
        setGames(games.filter((game) => game.id !== id))
    };

  return (
    <div className=' p-6 max-w-5xl mx-auto'>
        <h1 className="text-2xl font-bold mb-6">Manage Games</h1>

        {/* Game Creation Form */}
        <form onSubmit={handleAddGame} className="bg-white dark:bg-black/50 p-6 rounded-xl shadow-md flex flex-col md:flex-row gap-4 
        mb-8">
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
            <button type='submit' className="bg-primary text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 
            hover:opacity-90">
                <PlusCircle size={18} /> Add Game
            </button>
        </form>

        {/* Games Table */}
        {games.length > 0 ? (
            <div className="bg-white dark:bg-black/50 rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-primary text-white">
                        <tr>
                            <th className="p-3 text-left">Match</th>
                            <th className="p-3 text-left">Time</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Result</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {games.map((game) => (
                            <tr key={game.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 
                            dark:hover:bg-gray-800 transition">
                                <td className=' p-3'>
                                    {game.home_team} <span className="font-bold">vs</span>{" "} {game.away_team}
                                </td>
                                <td className="p-3">
                                    {new Date(game.match_time).toLocaleString()}
                                </td>
                                <td className="p-3 capitalize">{game.status}</td>
                                <td className="p-3 capitalize">
                                    {game.result ? (
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${game.result === 'homeWin' ? 
                                        "bg-green-200 text-green-700" : game.result === "draw" ? "bg-yellow-200 text-yellow-700"
                                        : "bg-red-200 text-red-700"}`}>
                                            {game.result === 'homeWin'
                                                ? "Home Win"
                                                : game.result === "draw"
                                                ? "Draw"
                                                : "Away Win"}
                                        </span>
                                    ) : (
                                        ""
                                    )}
                                </td>
                                <td className="p-3 flex items-center justify-center gap-3">
                                    <button onClick={() => openModal(game)} className="text-blue-500 hover:text-blue-700">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(game.id)} className="text-red-500 hover:text-red-700">
                                        <Trash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <p className="text-center text-gray-500 mt-10">
                No games created yet. Add one above.
            </p>
        )}

        {/* Result Modal */}
        {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
                <div className="bg-white dark:bg-black/90 p-6 rounded-lg shadow-xl w-[90%] max-w-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">
                            Update Result: {selectedGames.homeTeam} vs {selectedGames.awayTeam}
                        </h2>
                        <button onClick={() => setShowModal(false)}>
                            <X size={20}/>
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={() => setResult("homeWin")} className={`py-2 rounded-md font-medium ${result === "homeWin" ?
                        "bg-green-500 text-white" : "bg-green-100 text-green-700"}`}>
                            Home Win
                        </button>
                        <button onClick={() => setResult("draw")} className={`py-2 rounded-md font-medium ${result === "draw" ?
                        "bg-yellow-500 text-white" : "bg-yellow-100 text-yellow-700"}`}>
                            Draw
                        </button>
                        <button onClick={() => setResult("awayWin")} className={`py-2 rounded-md font-medium ${result === "awayWin" ?
                        "bg-red-500 text-white" : "bg-red-100 text-red-700"}`}>
                            Away Win
                        </button>
                    </div>

                    <button onClick={handleSaveResult} className="mt-5 bg-primary text-white px-4 py-2 rounded-md w-full font-semibold hover:opacity-90">
                        Save Result
                    </button>
                </div>
            </div>
        )}
    </div>
  )
}

export default page