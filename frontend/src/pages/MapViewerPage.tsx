import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { dataApi, Region, Pollutant, Layer } from '../api/data'
import { MapComponent } from '../components/MapComponent'

export const MapViewerPage: React.FC = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [regions, setRegions] = useState<Region[]>([])
    const [pollutants, setPollutants] = useState<Pollutant[]>([])
    const [layers, setLayers] = useState<Layer[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [selectedRegion, setSelectedRegion] = useState<number | undefined>()
    const [selectedPollutant, setSelectedPollutant] = useState<string | undefined>()
    const [selectedYear, setSelectedYear] = useState<number>(2024)
    const [selectedLayerId, setSelectedLayerId] = useState<number | undefined>()

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [regionsData, pollutantsData] = await Promise.all([
                    dataApi.getRegions(),
                    dataApi.getPollutants(),
                ])
                setRegions(regionsData)
                setPollutants(pollutantsData)

                // Set defaults
                if (regionsData.length > 0) setSelectedRegion(regionsData[0].id)
                if (pollutantsData.length > 0) setSelectedPollutant(pollutantsData[0].code)
            } catch (error) {
                console.error('Failed to load data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    // Load layers when filters change
    useEffect(() => {
        const loadLayers = async () => {
            try {
                const layersData = await dataApi.getLayers({
                    region_id: selectedRegion,
                    pollutant_code: selectedPollutant,
                    year: selectedYear,
                })
                setLayers(layersData)

                // Auto-select first layer if available and none selected (or if list changed)
                // But specifically for timeline interaction, we might want to logic this better.
                // For now: Select the layer corresponding to "current time" if implemented.
                // Simple logic: Select first one.
                if (layersData.length > 0) {
                    // Try to keep selection if valid? 
                    // Usually reloading layers means context changed.
                    setSelectedLayerId(layersData[0].id)
                } else {
                    setSelectedLayerId(undefined)
                }
            } catch (error) {
                console.error('Failed to load layers:', error)
            }
        }

        if (selectedRegion && selectedPollutant) {
            loadLayers()
        }
    }, [selectedRegion, selectedPollutant, selectedYear])

    // Helper to get layer name (Period)
    const currentLayer = layers.find(l => l.id === selectedLayerId)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400 font-light tracking-widest">INITIALIZING SATELLITE DATA...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-gray-900 font-sans">
            {/* 1. MAP BACKGROUND (Full Screen) */}
            <div className="absolute inset-0 z-0">
                <MapComponent layers={layers} selectedLayerId={selectedLayerId} />
                {/* Vignette effect for cinematic look */}
                <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent to-black/20"></div>
            </div>

            {/* 2. TOP BAR (Glassmorphism) */}
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-4 pointer-events-none">
                {/* Brand / Back */}
                <div className="pointer-events-auto flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg text-white">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-1 hover:bg-white/10 rounded-full transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <span className="font-semibold tracking-wide text-sm">AIR QUALITY MAP</span>
                </div>

                {/* User Profile */}
                <div className="pointer-events-auto flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg text-white">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm font-medium">{user?.username}</span>
                    <button onClick={logout} className="ml-2 text-red-300 hover:text-red-400 text-xs font-bold uppercase tracking-wider">
                        Exit
                    </button>
                </div>
            </div>

            {/* 3. SIDEBAR CONTROLS (Floating Filter Panel) */}
            <div className={`absolute top-24 left-6 z-20 w-80 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 text-white space-y-6">
                    {/* Header with Collapse */}
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Control Station</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-white/50 hover:text-white">
                            -
                        </button>
                    </div>

                    {/* Region Selector */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-medium ml-1">REGION OF INTEREST</label>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition hover:bg-white/10"
                        >
                            {regions.map(r => <option key={r.id} value={r.id} className="text-black">{r.name}</option>)}
                        </select>
                    </div>

                    {/* Pollutant Selector */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-medium ml-1">POLLUTANT</label>
                        <div className="grid grid-cols-2 gap-2">
                            {pollutants.map(p => (
                                <button
                                    key={p.code}
                                    onClick={() => setSelectedPollutant(p.code)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${selectedPollutant === p.code
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {p.code}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Layer Quick List (Compact) */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-medium ml-1">AVAILABLE DATA ({layers.length})</label>
                        <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar pr-2">
                            {layers.map(l => (
                                <button
                                    key={l.id}
                                    onClick={() => setSelectedLayerId(l.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition border ${selectedLayerId === l.id
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                                            : 'hover:bg-white/5 border-transparent text-gray-400'
                                        }`}
                                >
                                    <span>{l.period_type.toUpperCase()} {l.period_value}</span>
                                    <span>{l.year}</span>
                                </button>
                            ))}
                            {layers.length === 0 && <div className="text-xs text-center text-gray-600 py-4">No data found</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Toggle Button (When Closed) */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-24 left-0 z-20 bg-blue-600 p-3 rounded-r-xl shadow-lg hover:bg-blue-500 transition text-white"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
            )}

            {/* 4. BOTTOM TIMELINE (The 'Playing' Bar) */}
            <div className="absolute bottom-10 left-6 right-6 z-20 flex flex-col items-center">
                <div className="w-full max-w-4xl bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                    <div className="flex items-center justify-between gap-6">
                        {/* Year Control (Left) */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedYear(y => y - 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                            >←</button>
                            <span className="text-2xl font-bold text-white tracking-widest">{selectedYear}</span>
                            <button
                                onClick={() => setSelectedYear(y => y + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                            >→</button>
                        </div>

                        {/* Slider / Steps (Center) */}
                        <div className="flex-1">
                            {/* Simple visual representation of months/periods */}
                            <div className="flex justify-between px-2">
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                                    <div key={m} className={`text-xs font-medium cursor-pointer transition hover:text-blue-400 ${
                                        // Highlight logic is tricky without explicit month data, 
                                        // but we can simulate active state if period matches
                                        currentLayer?.period_value === String(idx + 1) ? 'text-blue-400 scale-125 font-bold' : 'text-gray-500'
                                        }`}>
                                        {m}
                                    </div>
                                ))}
                            </div>
                            {/* Styling improvements for native ranges are hard, using custom track here */}
                            <div className="relative mt-2 h-2 bg-gray-700 rounded-full w-full overflow-hidden">
                                {/* Progress bar logic - mocked for visual */}
                                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-purple-600 w-1/2 opacity-50"></div>
                            </div>
                            <p className="text-center text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                                Timeline Navigation
                            </p>
                        </div>

                        {/* Info (Right) */}
                        <div className="text-right">
                            <div className="text-xs text-gray-400 uppercase">Selected Data</div>
                            <div className="text-sm font-bold text-blue-300">
                                {currentLayer ? `${currentLayer.period_type} ${currentLayer.period_value}` : 'None'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. LEGEND (Bottom Right) */}
            <div className="absolute bottom-36 right-6 z-20 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-xl pointer-events-auto">
                    <p className="text-[10px] text-gray-400 uppercase mb-2 text-center">Concentration (mg/m³)</p>
                    <div className="h-32 w-4 bg-gradient-to-t from-[#440154] via-[#21908d] to-[#fde725] rounded-full mx-auto border border-white/20"></div>
                    <div className="flex justify-between text-[10px] text-white mt-1 w-full gap-2">
                        <span>Low</span>
                        <span>High</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
