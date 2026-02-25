'use client'

import { PlusCircle, Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const page = () => {
    const [assistance, setAssistance] = useState([]);
    const [newAssist, setNewAssist] = useState({
        homeTeam: "",
        awayTeam: "",
        recentMeetings: Array.from({ length: 6 }, () => ({
            date: "",
            score: "",
            winner: "",
        }))
    });

    // Handle Match Updates
    const handleMeetingChange = (index, field, value) => {
        const updated = [...newAssist.recentMeetings];
        updated[index][field] = value;
        setNewAssist({...newAssist, recentMeetings: updated})
    }

    // Add Assistance
    const handleAdd = (e) => {
        e.preventDefault();
        if(!newAssist.homeTeam || !newAssist.awayTeam) return;

        const id = Date.now();
        setAssistance([...assistance, { id, ...newAssist }])
        setNewAssist({
            homeTeam: "",
            awayTeam: "",
            recentMeetings: Array.from({ length: 6 }, () => ({
                date: "",
                score: "",
                winner: "",
            })),
          });
    }

    // Handle Delete
    const handleDelete = (id) => {
        setAssistance(assistance.filter((a) => a.id !== id))
    }

  return (
    <div className="p-6 max-w-6xl mx-auto">
        {/* Desktop back button - only visible on desktop */}
        <div className=" mb-6">
            <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Dashboard</span>
            </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">Game Assistance (Head-to-Head)</h1>

        {/* Form */}
        <form onSubmit={handleAdd} className="bg-white dark:bg-black/50 p-6 rounded-xl shadow-md flex flex-col gap-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
                <input 
                    type="text"
                    placeholder="Home Team"
                    className="border rounded-md p-2 flex-1 bg-transparent"
                    value={newAssist.homeTeam}
                    onChange={(e) => setNewAssist({ ...newAssist, homeTeam: e.target.value })}
                />
                <input 
                    type="text"
                    placeholder="Away Team"
                    className="border rounded-md p-2 flex-1 bg-transparent"
                    value={newAssist.awayTeam}
                    onChange={(e) => setNewAssist({ ...newAssist, awayTeam: e.target.value })}
                />
            </div>

            <h3 className="font-semibold mt-2 mb-2">Last 6 Meetings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {newAssist.recentMeetings.map((meeting, index) => (
                    <div key={index} className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
                        <p className="text-sm font-medium mb-2">
                            Game {index + 1}
                        </p>
                        <input 
                            type="text" 
                            placeholder="Date (e.g. 2024-05-18)"
                            className="border rounded-md p-2 w-full mb-2 bg-transparent"
                            value={meeting.date}
                            onChange={(e) => handleMeetingChange(index, "date", e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="Score (e.g. 2-1)"
                            className="border rounded-md p-2 w-full mb-2 bg-transparent"
                            value={meeting.score}
                            onChange={(e) => handleMeetingChange(index, "score", e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="Winner (e.g. Chelsea)"
                            className="border rounded-md p-2 w-full mb-2 bg-transparent"
                            value={meeting.winner}
                            onChange={(e) => handleMeetingChange(index, "winner", e.target.value)}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-4">
                <h4 className="text-sm text-gray-600 mb-2">JSON Preview:</h4>
                <pre className="bg-gray-100 dark:bg-gray-900 text-sm p-3 rounded-md overflow-auto">
                    {JSON.stringify(newAssist.recentMeetings, null, 2)}
                </pre>
            </div>

            <button type='submit' className="mt-4 bg-primary text-white px-4 py-2 rounded-md flex items-center justify-center 
            gap-2 hover:opacity-90">
                <PlusCircle /> Add Assistance
            </button>
        </form>

        {/* Assistance List */}
        {assistance.length > 0 ? (
            <div className="space-y-6">
                {assistance.map((assist) => (
                    <div key={assist.id} className="bg-white dark:bg-black/50 p-5 rounded-xl shadow-md">
                        <div className="flex justify-between items-start mb-3">
                            <h2 className="text-lg font-semibold">
                                {assist.homeTeam} <span className="text-primary">vs</span>{" "}
                                {assist.awayTeam}
                            </h2>
                            <button onClick={() => handleDelete(assist.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            Recent Meetings:
                        </p>
                        <pre className="bg-gray-100 dark:bg-gray-900 text-sm p-3 rounded-md overflow-auto">
                            {JSON.stringify(assist.recentMeetings, null, 2)}
                        </pre>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-center text-gray-500 mt-10">
                No assistance data added yet.
            </p>
        )}
    </div>
  );
};

export default page