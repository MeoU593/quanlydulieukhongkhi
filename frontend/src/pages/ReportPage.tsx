import React, { useEffect, useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts'
import { dataApi, Region, Pollutant } from '../api/data'
import { reportsApi, ReportStats } from '../api/reports'
import { useNavigate } from 'react-router-dom'

export const ReportPage: React.FC = () => {
    const navigate = useNavigate()

    // Data State
    const [regions, setRegions] = useState<Region[]>([])
    const [pollutants, setPollutants] = useState<Pollutant[]>([])
    const [stats, setStats] = useState<ReportStats | null>(null)
    const [loading, setLoading] = useState(true)

    // Filter State
    const [selectedRegion, setSelectedRegion] = useState<number>(1)
    const [selectedPollutant, setSelectedPollutant] = useState<string>('CO')
    const [selectedYear, setSelectedYear] = useState<number>(2024)

    // Load Initial Data (Regions, Pollutants)
    useEffect(() => {
        const loadInitData = async () => {
            try {
                const [r, p] = await Promise.all([
                    dataApi.getRegions(),
                    dataApi.getPollutants()
                ])
                setRegions(r)
                setPollutants(p)
                if (r.length > 0) setSelectedRegion(r[0].id)
                if (p.length > 0) setSelectedPollutant(p[0].code)
            } catch (error) {
                console.error("Init failed", error)
            }
        }
        loadInitData()
    }, [])

    // Load Statistics when filters change
    useEffect(() => {
        const loadStats = async () => {
            setLoading(true)
            try {
                const data = await reportsApi.getStats(selectedRegion, selectedPollutant, selectedYear)
                setStats(data)
            } catch (error) {
                console.error("Stats load failed", error)
            } finally {
                setLoading(false)
            }
        }
        if (selectedRegion && selectedPollutant) {
            loadStats()
        }
    }, [selectedRegion, selectedPollutant, selectedYear])

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-800 rounded-full">
                        ←
                    </button>
                    <h1 className="text-2xl font-bold tracking-wide">Air Quality Analytics</h1>
                </div>
                <div className="flex gap-4">
                    {/* Filters */}
                    <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(Number(e.target.value))}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
                    >
                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>

                    <select
                        value={selectedPollutant}
                        onChange={(e) => setSelectedPollutant(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
                    >
                        {pollutants.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
                    </select>

                    <input
                        type="number"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-2 w-24"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 animate-pulse">Loading Analytics Data...</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 1. Main Chart (Line) */}
                    <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
                        <h2 className="text-lg font-semibold mb-4 text-blue-300">Trend Analysis ({selectedYear})</h2>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats?.trend_data || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis dataKey="label" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ fill: '#3b82f6' }}
                                        activeDot={{ r: 8 }}
                                        name={`${selectedPollutant} Concentration`}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Summary Text & Key Metrics */}
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
                            <h2 className="text-lg font-semibold mb-4 text-green-300">Executive Summary</h2>
                            <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
                                <p>
                                    Based on the data for <strong>{selectedYear}</strong>, the average concentration of{' '}
                                    <strong className="text-white">{selectedPollutant}</strong> in{' '}
                                    <strong className="text-white">
                                        {regions.find(r => r.id === selectedRegion)?.name}
                                    </strong>{' '}
                                    was <strong className="text-blue-400">{stats?.summary.avg.toFixed(2)}</strong> mg/m³.
                                </p>
                                <p>
                                    The highest recorded value was{' '}
                                    <strong className="text-red-400">{stats?.summary.max.toFixed(2)}</strong> during the monitoring period.
                                </p>
                                {stats?.summary.count === 0 && (
                                    <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-200 rounded">
                                        No data available for this selection.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-widest">Average</div>
                                <div className="text-2xl font-bold text-white mt-1">{stats?.summary.avg.toFixed(2)}</div>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-widest">Peak</div>
                                <div className="text-2xl font-bold text-yellow-400 mt-1">{stats?.summary.max.toFixed(2)}</div>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center col-span-2">
                                <div className="text-xs text-gray-500 uppercase tracking-widest">Data Points</div>
                                <div className="text-xl font-bold text-gray-300 mt-1">{stats?.summary.count} Samples</div>
                            </div>
                        </div>

                        {/* Download Report Button (Placeholder) */}
                        <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition shadow-lg shadow-blue-900/20">
                            Export PDF Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
