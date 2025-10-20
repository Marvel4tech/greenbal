'use client'

import React, { useState } from 'react'

const page = () => {
    const [players] = useState([
        { id: 1, name: "Marvellous Ayomike", points: 1250, duration: "00:23:15" },
        { id: 2, name: "David John", points: 1180, duration: "00:24:32" },
        { id: 3, name: "Sophia West", points: 1125, duration: "00:26:41" },
        { id: 4, name: "Adebayo Femi", points: 980, duration: "00:27:15" },
        { id: 5, name: "Blessing Ojo", points: 920, duration: "00:28:03" },
    ]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center md:text-left">
            Leaderboard
        </h1>

        {/* Quick Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center shadow">
                <h3 className="text-sm text-gray-600 dark:text-gray-300">
                    Total Players
                </h3>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {players.length}
                </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-center shadow">
                <h3 className="text-sm text-gray-600 dark:text-gray-300">
                    Highest Points
                </h3>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {Math.max(...players.map((p) => p.points))}
                </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg text-center shadow">
                <h3 className="text-sm text-gray-600 dark:text-gray-300">
                    Top Player
                </h3>
                <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                    {players[0].name}
                </p>
            </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-black/50 rounded-xl shadow-lg overflow-x-auto border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm md:text-base">
                <thead className="bg-primary text-white">
                    <tr>
                        <th className="p-3 text-left">Rank</th>
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Points</th>
                        <th className="p-3 text-left">Duration</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((player, index) => (
                        <tr key={player.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 
                        dark:hover:bg-gray-800 transition">
                            <td className="p-3 font-semibold">
                                <span className={`px-2 py-1 rounded-md text-sm ${index === 0 ? "bg-yellow-300 text-yellow-900"
                                : index === 1 ? "bg-gray-300 text-gray-900" : index === 2 ? "bg-orange-300 text-orange-900"
                                : "bg-gray-100 dark:bg-gray-700"}`}>
                                    #{index + 1}
                                </span>
                            </td>
                            <td className="p-3">{player.name}</td>
                            <td className="p-3 font-bold text-primary">{player.points}</td>
                            <td className="p-3">{player.duration}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  )
}

export default page