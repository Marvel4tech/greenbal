'use client'

import { Database, FileDown, RefreshCw, Trash2 } from 'lucide-react';
import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const page = () => {
    const [logs, setLogs] = useState([
        { id: 1, type: "info", message: "Database backup completed successfully.", time: "2025-10-13 22:15" },
        { id: 2, type: "warning", message: "High server load detected.", time: "2025-10-13 21:40" },
        { id: 3, type: "error", message: "Failed login attempt detected from IP 192.168.1.12", time: "2025-10-13 20:10" },
    ]);

    const handleBackup = () => {
        alert("Backup started...");
        // later: trigger Supabase storage export or scheduled backup
    };
    
    const handleClearLogs = () => {
        if (confirm("Are you sure you want to clear all logs?")) {
            setLogs([]);
        }
    };
    

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
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

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">System Tools</h1>
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                transition" onClick={handleBackup}>
                    <FileDown className="w-5 h-5" /> Backup Now
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                transition" onClick={handleClearLogs}>
                    <Trash2 className="w-5 h-5" />
                    Clear Logs
                </button>
            </div>
        </div>

        {/* System Info Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-md">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" /> System Status
            </h2>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <li>Database Status: ✅ Connected</li>
                <li>Last Backup: 2025-10-13 22:15</li>
                <li>Server Load: Normal</li>
                <li>Logs Stored: {logs.length}</li>
            </ul>
        </div>

        {/* Logs Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-md">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" /> System Logs
            </h2>

            {logs.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {logs.map((log) => (
                        <li key={log.id} className="py-3 flex justify-between items-start">
                            <div>
                                <p className={`font-medium ${log.type === "error"? "text-red-600": log.type === "warning"? "text-yellow-600": "text-green-600"}`}>
                                    [{log.type.toUpperCase()}]
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">{log.message}</p>
                            </div>
                            <span className="text-xs text-gray-500">{log.time}</span>
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

export default page