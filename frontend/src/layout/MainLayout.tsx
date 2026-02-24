import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Map, Database, LogOut, Hexagon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const MainLayout: React.FC = () => {
    const { logout, user } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
            {/* Sidebar (Slim) */}
            <div className="w-20 flex flex-col items-center py-6 border-r border-white/10 bg-black/40 backdrop-blur-xl z-50">
                {/* Brand */}
                <div className="mb-8 p-3 bg-blue-600/20 rounded-xl border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <Hexagon size={28} strokeWidth={2.5} />
                </div>

                {/* Nav Items */}
                <nav className="flex-1 flex flex-col gap-6 w-full px-2">
                    <NavLink
                        to="/map"
                        className={({ isActive }) => `flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 group
                        ${isActive ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`
                        }
                    >
                        <Map size={24} strokeWidth={2} />
                        <span className="text-[10px] font-medium tracking-wide">Map</span>
                    </NavLink>

                    <NavLink
                        to="/data"
                        className={({ isActive }) => `flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 group
                        ${isActive ? 'bg-purple-600/20 text-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`
                        }
                    >
                        <Database size={24} strokeWidth={2} />
                        <span className="text-[10px] font-medium tracking-wide">Data</span>
                    </NavLink>
                </nav>

                {/* User / Logout */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 border border-white/20 shadow-lg" title={user?.username}></div>
                    <button
                        onClick={handleLogout}
                        className="p-3 text-red-400 hover:bg-red-500/20 rounded-xl transition"
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden">
                <Outlet />
            </div>
        </div>
    )
}
