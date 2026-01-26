import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Air Quality Management System
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.username}</p>
                            <p className="text-xs text-gray-500">{user?.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Navigation Cards */}
                    <button
                        onClick={() => navigate('/map')}
                        className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
                    >
                        <div className="text-blue-600 text-3xl mb-2">🗺️</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Viewer</h3>
                        <p className="text-gray-600 text-sm">View and analyze air quality data on interactive maps</p>
                    </button>

                    <button
                        onClick={() => navigate('/upload')}
                        className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
                    >
                        <div className="text-green-600 text-3xl mb-2">📤</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Data</h3>
                        <p className="text-gray-600 text-sm">Upload GeoTIFF files for air quality analysis</p>
                    </button>

                    {user?.role === 'ADMIN' && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
                        >
                            <div className="text-purple-600 text-3xl mb-2">⚙️</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Panel</h3>
                            <p className="text-gray-600 text-sm">Manage users and view audit logs</p>
                        </button>
                    )}
                </div>

                {/* Welcome Message */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Welcome back, {user?.full_name || user?.username}! 👋
                    </h2>
                    <p className="text-gray-600">
                        Select an option above to get started with the Air Quality Management System.
                    </p>
                </div>
            </main>
        </div>
    )
}
