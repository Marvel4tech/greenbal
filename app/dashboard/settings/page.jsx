'use client'

import { Globe, Save, Settings, Shield, Trophy } from 'lucide-react'
import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const page = () => {
    const [settings, setSettings] = useState({
        appName: "greenball360",
        maintenanceMode: false,
        dailyPredictionLimit: 5,
        pointsForCorrect: 3,
        pointsForDraw: 1,
        pointsForWrong: 0,
    })

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings({
            ...settings, 
            [name]: type === "checkbox" ? checked : value
        })
    }

    const handleSave = (e) => {
        e.preventDefault();
    }
    

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Back button - visible on all devices */}
        <div className="mb-2">
            <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Dashboard</span>
            </Link>
        </div>

        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="w-6 h-6 text-primary" /> App Settings
            </h1>
            <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition">
                <Save size={18} /> Save Changes
            </button>
        </div>

        {/* General Settings */}
        <section className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 
        space-y-6">
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
                    />
                </div>
                <div className="flex items-center gap-3 mt-6">
                    <input
                        type="checkbox"
                        name="maintenanceMode"
                        checked={settings.maintenanceMode}
                        onChange={handleChange}
                        className="w-5 h-5 accent-primary"
                    />
                    <label className="text-sm font-medium">Maintenance Mode</label>
                </div>
            </div>
        </section>

        {/* Prediction Rules */}
        <section className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 
        space-y-6">
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
                    />
                </div>
            </div>
        </section>

        {/* Security & Access */}
        <section className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" /> Security & Access
            </h2>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span>Two-Factor Authentication (2FA)</span>
                    <button className="px-3 py-1 text-sm rounded-md bg-primary text-white hover:opacity-90">
                        Configure
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <span>Admin Access Control</span>
                    <button className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:opacity-90">
                        Manage Admins
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <span>Password Policy</span>
                    <button className="px-3 py-1 text-sm rounded-md bg-gray-600 text-white hover:opacity-90">
                        Edit Policy
                    </button>
                </div>
            </div>
        </section>
    </div>
  )
}

export default page