'use client'

import { Activity, Ban, Mail, MapPin, Pencil, Shield, Trash2, Trophy, User } from 'lucide-react';
import { useParams } from 'next/navigation'
import React from 'react'

const page = () => {
    const params = useParams();
    const userId = params.id

    // Dummy user data — later you’ll fetch this from Supabase
    const user = {
        id: userId,
        name: "Marvellous Ayomike",
        email: "marv@example.com",
        country: "Nigeria",
        role: "User",
        joined: "2025-01-14",
        totalPredictions: 128,
        totalPoints: 276,
        rank: 5,
    }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">User Details</h1>
            <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition">
                    <Ban className="w-4 h-4" /> Ban
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
                    <Trash2 className="w-4 h-4" /> Delete
                </button>
            </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 flex 
        flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
            </div>

            <div className="space-y-2 text-center md:text-left">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{user.country}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        <span className="capitalize">{user.role}</span>
                    </div>
                </div>
                <p className="text-sm text-gray-500">Joined: {user.joined}</p>
            </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-600" />
                <div>
                    <p className="text-gray-500 text-sm">Total Predictions</p>
                    <h3 className="text-lg font-bold">{user.totalPredictions}</h3>
                </div>
            </div>

            <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <div>
                    <p className="text-gray-500 text-sm">Total Points</p>
                    <h3 className="text-lg font-bold">{user.totalPoints}</h3>
                </div>
            </div>

            <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-600" />
                <div>
                    <p className="text-gray-500 text-sm">Rank</p>
                    <h3 className="text-lg font-bold">#{user.rank}</h3>
                </div>
            </div>
        </div>

        {/* Predictions Table */}
        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Recent Predictions</h2>
                <button className="text-blue-600 text-sm hover:underline">View all</button>
            </div>

            <table className="w-full text-sm md:text-base">
                <thead className="bg-primary text-white">
                    <tr>
                        <th className="p-3 text-left">Game</th>
                        <th className="p-3 text-left">Prediction</th>
                        <th className="p-3 text-left">Result</th>
                        <th className="p-3 text-left">Points</th>
                    </tr>
                </thead>

                <tbody>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <td className="p-3">Man United vs Chelsea</td>
                        <td className="p-3">Home Win</td>
                        <td className="p-3 text-green-600">✅ Correct</td>
                        <td className="p-3 font-semibold">5</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <td className="p-3">Arsenal vs Liverpool</td>
                        <td className="p-3">Draw</td>
                        <td className="p-3 text-red-500">❌ Wrong</td>
                        <td className="p-3 font-semibold">0</td>
                    </tr>
                    <tr>
                        <td className="p-3">Barcelona vs Real Madrid</td>
                        <td className="p-3">Away Win</td>
                        <td className="p-3 text-green-600">✅ Correct</td>
                        <td className="p-3 font-semibold">3</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  )
}

export default page