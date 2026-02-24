import React, { useState, useEffect } from 'react'
import { MapComponent } from '../components/MapComponent'
import { HistogramChart } from '../components/HistogramChart'
import { dataApi, Layer, HistogramBin } from '../api/data'
import { Search, Sliders, X, BarChart2, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = [
    { value: 1, label: 'T1', full: 'Tháng 1' },
    { value: 2, label: 'T2', full: 'Tháng 2' },
    { value: 3, label: 'T3', full: 'Tháng 3' },
    { value: 4, label: 'T4', full: 'Tháng 4' },
    { value: 5, label: 'T5', full: 'Tháng 5' },
    { value: 6, label: 'T6', full: 'Tháng 6' },
    { value: 7, label: 'T7', full: 'Tháng 7' },
    { value: 8, label: 'T8', full: 'Tháng 8' },
    { value: 9, label: 'T9', full: 'Tháng 9' },
    { value: 10, label: 'T10', full: 'Tháng 10' },
    { value: 11, label: 'T11', full: 'Tháng 11' },
    { value: 12, label: 'T12', full: 'Tháng 12' },
]

export const AirExplorerPage: React.FC = () => {
    // Data
    const [layers, setLayers] = useState<Layer[]>([])
    const [selectedLayerId, setSelectedLayerId] = useState<number | undefined>()
    const [histogramData, setHistogramData] = useState<HistogramBin[]>([])
    const [loadingStats, setLoadingStats] = useState(false)
    const availableYears = [2019, 2020, 2021]

    // Filters
    const [regionId] = useState<number>(1)
    const [pollutant, setPollutant] = useState<string>('CO')
    const [year, setYear] = useState<number>(2021)
    const [month, setMonth] = useState<number>(1)

    // UI State
    const [showFilters, setShowFilters] = useState(false)
    const [showAnalytics, setShowAnalytics] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)

    // Load Layers — now queries by month too
    useEffect(() => {
        const fetchLayers = async () => {
            try {
                const periodValue = `M${month}`
                const res = await dataApi.getLayers({
                    region_id: regionId,
                    pollutant_code: pollutant,
                    year,
                    period_type: 'monthly',
                    period_value: periodValue,
                })
                setLayers(res)

                if (res.length > 0) {
                    setSelectedLayerId(res[0].id)
                } else {
                    setSelectedLayerId(undefined)
                }
            } catch (e) {
                console.error("Fetch layers error:", e)
                setLayers([])
                setSelectedLayerId(undefined)
            }
        }
        fetchLayers()
    }, [regionId, pollutant, year, month])

    // Load Histogram when selection changes or panel opens
    useEffect(() => {
        if (!selectedLayerId || !showAnalytics) return

        const fetchHistogram = async () => {
            setLoadingStats(true)
            try {
                const data = await dataApi.getLayerHistogram(selectedLayerId)
                setHistogramData(data)
            } catch (e) {
                console.error("Histogram error:", e)
                setHistogramData([])
            } finally {
                setLoadingStats(false)
            }
        }
        fetchHistogram()
    }, [selectedLayerId, showAnalytics])

    // Animation Effect — cycles through months within the current year
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isPlaying) {
            interval = setInterval(() => {
                setMonth(current => {
                    if (current >= 12) {
                        // Optionally advance year when wrapping
                        return 1;
                    }
                    return current + 1;
                });
            }, 2000); // 2 seconds per month
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setShowFilters(true)
    }

    const currentMonthLabel = MONTHS.find(m => m.value === month)?.full || `Tháng ${month}`

    return (
        <div className="relative w-full h-full bg-gray-900 border-l border-white/10">
            {/* 1. MAP LAYER */}
            <div className="absolute inset-0 z-0">
                <MapComponent layers={layers} selectedLayerId={selectedLayerId} />
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/30 pointer-events-none" />
            </div>

            {/* 2. TOP BAR (Search & Controls) */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">
                {/* Search Bar */}
                <div className="pointer-events-auto relative w-96 group">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <form onSubmit={handleSearch} className="relative flex items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <Search className="ml-4 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm khu vực hoặc chất ô nhiễm..."
                            className="w-full bg-transparent border-none px-4 py-3 text-white placeholder-gray-500 focus:ring-0 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-3 border-l border-white/10 hover:bg-white/10 transition ${showFilters ? 'text-blue-400 bg-white/5' : 'text-gray-400'}`}
                        >
                            <Sliders size={18} />
                        </button>
                    </form>
                </div>

                {/* Analytics Toggle */}
                <button
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="pointer-events-auto p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-blue-600/30 hover:border-blue-500/50 transition shadow-lg flex items-center gap-2"
                >
                    <BarChart2 size={20} />
                    <span className="font-semibold text-sm">Phân tích</span>
                </button>
            </div>

            {/* 3. FILTER PANEL (Floating) */}
            {showFilters && (
                <div className="absolute top-24 left-6 z-30 w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-left-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold uppercase tracking-wider text-xs">Bộ Lọc Dữ Liệu</h3>
                        <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                    </div>

                    <div className="space-y-4">
                        {/* Year Selector */}
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Năm</label>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setYear(y => y - 1)} className="px-3 py-1 bg-white/5 rounded text-sm hover:bg-white/10 transition">-</button>
                                <span className="flex-1 text-center font-mono text-blue-300">{year}</span>
                                <button onClick={() => setYear(y => y + 1)} className="px-3 py-1 bg-white/5 rounded text-sm hover:bg-white/10 transition">+</button>
                            </div>
                        </div>

                        {/* Month Selector */}
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Tháng</label>
                            <div className="grid grid-cols-6 gap-1">
                                {MONTHS.map(m => (
                                    <button
                                        key={m.value}
                                        onClick={() => setMonth(m.value)}
                                        className={`px-1 py-1.5 rounded text-xs font-medium transition ${month === m.value
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pollutant Selector */}
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Chất ô nhiễm</label>
                            <div className="flex gap-2 flex-wrap">
                                {['CO', 'NO2', 'SO2', 'O3'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPollutant(p)}
                                        className={`px-3 py-1 rounded text-xs border ${pollutant === p ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/10 text-gray-400'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. ANALYTICS OVERLAY (Drawer) */}
            {showAnalytics && (
                <div className="absolute inset-y-0 right-0 z-40 w-[600px] bg-gray-900/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl overflow-y-auto animate-in slide-in-from-right">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                                Phân Tích Chi Tiết
                            </h2>
                            <button onClick={() => setShowAnalytics(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
                        </div>

                        <div className="opacity-90 scale-95 origin-top space-y-4">
                            <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl text-sm text-blue-200">
                                Đang phân tích <strong>{pollutant}</strong> tại khu vực đã chọn — <strong>{currentMonthLabel}, {year}</strong>.
                            </div>

                            {/* Stats Display */}
                            {layers.length > 0 && selectedLayerId ? (
                                (() => {
                                    const layer = layers.find(l => l.id === selectedLayerId)
                                    if (!layer) return <div className="text-gray-500 text-center py-10 italic">Đang tải dữ liệu...</div>

                                    const hasStats = layer && layer.min_value !== null && layer.mean_value !== null

                                    return (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                                                    <div className="text-gray-400 text-xs uppercase mb-1">Thấp Nhất (Min)</div>
                                                    <div className="text-2xl font-mono font-bold text-cyan-400">
                                                        {hasStats ? layer.min_value?.toFixed(2) : '-'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 mt-1">{layer.pollutant_unit}</div>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                                                    <div className="text-gray-400 text-xs uppercase mb-1">Trung Bình (Mean)</div>
                                                    <div className="text-2xl font-mono font-bold text-blue-400">
                                                        {hasStats ? layer.mean_value?.toFixed(2) : '-'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 mt-1">{layer.pollutant_unit}</div>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                                                    <div className="text-gray-400 text-xs uppercase mb-1">Cao Nhất (Max)</div>
                                                    <div className="text-2xl font-mono font-bold text-purple-400">
                                                        {hasStats ? layer.max_value?.toFixed(2) : '-'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 mt-1">{layer.pollutant_unit}</div>
                                                </div>
                                            </div>

                                            {!hasStats && (
                                                <div className="text-center text-xs text-yellow-500 bg-yellow-900/20 p-2 rounded">
                                                    * Chưa có chuỗi thống kê cho lớp dữ liệu này.
                                                </div>
                                            )}

                                            {/* Histogram Chart */}
                                            <div className="mt-8">
                                                <h4 className="text-sm font-semibold text-gray-300 mb-4 px-1">Biểu đồ phân phối chất ô nhiễm</h4>
                                                <div className="h-[300px] bg-black/40 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/5 p-4 shadow-inner">
                                                    {loadingStats ? (
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                                            <span className="text-xs text-gray-500">Đang tính toán phân phối...</span>
                                                        </div>
                                                    ) : (
                                                        <HistogramChart
                                                            data={histogramData}
                                                            color={pollutant === 'CO' ? '#3b82f6' : pollutant === 'NO2' ? '#a855f7' : '#22c55e'}
                                                            unit={layer.pollutant_unit}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()
                            ) : (
                                <div className="text-gray-500 text-center py-10">Chưa có dữ liệu cho {currentMonthLabel}, {year}</div>
                            )}

                            <p className="mt-3 text-[10px] text-gray-500 text-center px-4">
                                * Trục ngang thể hiện dải nồng độ. Trục đứng thể hiện số lượng điểm ảnh (tần suất) tương ứng.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. TIMELINE CONTROL (Bottom) — Monthly */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 w-full max-w-3xl px-4">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-2xl w-full">
                    {/* Play/Pause */}
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
                    </button>

                    {/* Year Nav */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => setYear(y => y - 1)}
                            className="p-1 hover:bg-white/10 rounded transition text-gray-400 hover:text-white"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-mono font-bold text-blue-300 min-w-[40px] text-center">{year}</span>
                        <button
                            onClick={() => setYear(y => y + 1)}
                            className="p-1 hover:bg-white/10 rounded transition text-gray-400 hover:text-white"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Monthly Timeline */}
                    <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex justify-between text-[10px] font-mono text-gray-500 px-0.5">
                            {MONTHS.map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => setMonth(m.value)}
                                    className={`transition cursor-pointer hover:text-white ${month === m.value ? 'text-blue-400 font-bold' : ''}`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                        <div className="relative h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${((month - 1) / 11) * 100}%` }}
                            ></div>
                            {/* Dot indicator */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full border-2 border-gray-900 shadow-lg transition-all duration-500 ease-out"
                                style={{ left: `calc(${((month - 1) / 11) * 100}% - 6px)` }}
                            ></div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="text-xs font-mono text-gray-400 shrink-0 min-w-[80px] text-right">
                        {isPlaying ? 'ĐANG CHẠY...' : `${currentMonthLabel}`}
                    </div>
                </div>
            </div>
        </div>
    )
}
