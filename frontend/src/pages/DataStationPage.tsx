import React, { useState, useEffect } from 'react'
import { Upload, Trash2, Clock, FileText, CheckCircle, Search, Filter, X, RefreshCw } from 'lucide-react'
import { dataApi, Layer, Pollutant, Region } from '../api/data'
import { UploadPage } from './UploadPage'
import axios from 'axios'

// --- Interfaces ---
interface AuditLog {
    id: number
    action: string
    resource_type: string
    resource_id: string
    username: string
    created_at: string
}

const API_URL = 'http://localhost:8000/api/v1'

const MONTHS = [
    { value: '', label: 'Tất cả' },
    { value: 'M1', label: 'T1' }, { value: 'M2', label: 'T2' }, { value: 'M3', label: 'T3' },
    { value: 'M4', label: 'T4' }, { value: 'M5', label: 'T5' }, { value: 'M6', label: 'T6' },
    { value: 'M7', label: 'T7' }, { value: 'M8', label: 'T8' }, { value: 'M9', label: 'T9' },
    { value: 'M10', label: 'T10' }, { value: 'M11', label: 'T11' }, { value: 'M12', label: 'T12' },
]

export const DataStationPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'inventory' | 'upload' | 'audit'>('upload')
    const [layers, setLayers] = useState<Layer[]>([])
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [regions, setRegions] = useState<Region[]>([])
    const [pollutants, setPollutants] = useState<Pollutant[]>([])
    const [loading, setLoading] = useState(false)

    // --- Filters ---
    const [filterRegion, setFilterRegion] = useState<number | ''>('')
    const [filterPollutant, setFilterPollutant] = useState<string>('')
    const [filterYear, setFilterYear] = useState<number | ''>('')
    const [filterMonth, setFilterMonth] = useState<string>('')
    const [searchText, setSearchText] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    const activeFilterCount = [filterRegion, filterPollutant, filterYear, filterMonth].filter(v => v !== '').length

    // --- Actions ---

    const loadMetadata = async () => {
        try {
            const [regionData, pollutantData] = await Promise.all([
                dataApi.getRegions(),
                dataApi.getPollutants(),
            ])
            setRegions(regionData)
            setPollutants(pollutantData)
        } catch (e) { console.error(e) }
    }

    const loadData = async () => {
        setLoading(true)
        try {
            const filters: any = {}
            if (filterRegion) filters.region_id = filterRegion
            if (filterPollutant) filters.pollutant_code = filterPollutant
            if (filterYear) filters.year = filterYear
            if (filterMonth) {
                filters.period_type = 'monthly'
                filters.period_value = filterMonth
            }

            const layerData = await dataApi.getLayers(filters)
            setLayers(layerData)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const loadAudit = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await axios.get(`${API_URL}/audit/`, { headers: { Authorization: `Bearer ${token}` } })
            setAuditLogs(res.data)
        } catch (e: any) {
            console.error(e)
            if (e.response && e.response.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/login';
            }
        }
        finally { setLoading(false) }
    }

    const handleDeleteLayer = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa lớp dữ liệu này?')) return
        try {
            const token = localStorage.getItem('access_token')
            await axios.delete(`${API_URL}/layers/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            loadData()
        } catch (e: any) {
            alert('Xóa thất bại')
            if (e.response && e.response.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/login';
            }
        }
    }

    const clearFilters = () => {
        setFilterRegion('')
        setFilterPollutant('')
        setFilterYear('')
        setFilterMonth('')
        setSearchText('')
    }

    // Load metadata once
    useEffect(() => { loadMetadata() }, [])

    // Load data on tab switch or filter change
    useEffect(() => {
        if (activeTab === 'inventory') loadData()
        if (activeTab === 'audit') loadAudit()
    }, [activeTab, filterRegion, filterPollutant, filterYear, filterMonth])

    // Client-side text search filter
    const filteredLayers = layers.filter(layer => {
        if (!searchText) return true
        const q = searchText.toLowerCase()
        const regionName = regions.find(r => r.id === layer.region_id)?.name || ''
        return (
            layer.product_id.toLowerCase().includes(q) ||
            layer.pollutant_code.toLowerCase().includes(q) ||
            regionName.toLowerCase().includes(q) ||
            String(layer.year).includes(q) ||
            layer.period_value.toLowerCase().includes(q)
        )
    })

    return (
        <div className="h-full bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-gray-900/50 backdrop-blur-lg">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-1">
                        Trạm Dữ Liệu
                    </h1>
                    <p className="text-gray-500 text-xs tracking-wider uppercase">Trung tâm Dữ liệu & Vận hành</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-800/50 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'upload' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Upload size={16} /> Nhập liệu
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <DatabaseIcon size={16} /> Kho dữ liệu
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'audit' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Clock size={16} /> Hoạt động
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                {loading && (
                    <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-4">
                        <div className="bg-blue-600/90 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-xl animate-pulse">
                            Đang xử lý dữ liệu...
                        </div>
                    </div>
                )}

                {/* 1. UPLOAD TAB */}
                {activeTab === 'upload' && (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-black/20 border border-white/10 rounded-2xl p-1 overflow-hidden">
                            <UploadPage />
                        </div>
                    </div>
                )}

                {/* 2. INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Toolbar: Search + Filter Toggle + Count */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type="text"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        placeholder="Tìm kiếm lớp dữ liệu..."
                                        className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition ${showFilters
                                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}
                                >
                                    <Filter size={14} />
                                    Bộ lọc
                                    {activeFilterCount > 0 && (
                                        <span className="bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-gray-500 hover:text-red-400 transition flex items-center gap-1"
                                    >
                                        <X size={12} /> Xóa lọc
                                    </button>
                                )}
                                <button
                                    onClick={loadData}
                                    className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
                                    title="Làm mới"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                            <div className="text-gray-400 text-sm">
                                {filteredLayers.length}{filteredLayers.length !== layers.length ? ` / ${layers.length}` : ''} Bộ dữ liệu
                            </div>
                        </div>

                        {/* Filter Bar */}
                        {showFilters && (
                            <div className="mb-6 bg-gray-800/40 border border-white/5 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-4 gap-4">
                                    {/* Region */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Khu vực</label>
                                        <select
                                            value={filterRegion}
                                            onChange={(e) => setFilterRegion(e.target.value ? Number(e.target.value) : '')}
                                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Tất cả khu vực</option>
                                            {regions.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Pollutant */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Chất ô nhiễm</label>
                                        <select
                                            value={filterPollutant}
                                            onChange={(e) => setFilterPollutant(e.target.value)}
                                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Tất cả</option>
                                            {pollutants.map(p => (
                                                <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Year */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Năm</label>
                                        <select
                                            value={filterYear}
                                            onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : '')}
                                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Tất cả năm</option>
                                            {[2019, 2020, 2021, 2022, 2023, 2024].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Month */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Tháng</label>
                                        <select
                                            value={filterMonth}
                                            onChange={(e) => setFilterMonth(e.target.value)}
                                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            {MONTHS.map(m => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Layer List */}
                        <div className="grid grid-cols-1 gap-4">
                            {filteredLayers.length === 0 && !loading && (
                                <div className="text-center text-gray-500 py-16 italic">
                                    Không tìm thấy dữ liệu phù hợp với bộ lọc.
                                </div>
                            )}
                            {filteredLayers.map(layer => (
                                <div key={layer.id} className="bg-gray-800/40 border border-white/5 hover:border-blue-500/30 rounded-xl p-4 flex items-center justify-between transition group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">
                                                {(() => {
                                                    const rName = regions.find(r => r.id === layer.region_id)?.name || 'Không xác định'
                                                    return `${rName} — ${layer.pollutant_code}`
                                                })()}
                                            </h3>
                                            <div className="text-xs text-gray-500 mb-1">{layer.product_id}</div>
                                            <div className="flex gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                                                <span className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded">{layer.year}</span>
                                                <span className="bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded">{layer.period_value}</span>
                                                <span className="bg-gray-700/50 px-2 py-0.5 rounded text-gray-300">{layer.period_type}</span>
                                                <span className="text-gray-500">{(layer.file_size_bytes ? layer.file_size_bytes / 1024 / 1024 : 0).toFixed(2)} MB</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right mr-4 hidden md:block">
                                            <div className="text-xs text-gray-500 uppercase">Trạng thái</div>
                                            <div className="text-sm text-green-400 flex items-center justify-end gap-1">
                                                <CheckCircle size={12} /> Hoạt động
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteLayer(layer.id)}
                                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                            title="Xóa dữ liệu"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. AUDIT TAB */}
                {activeTab === 'audit' && (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="relative border-l border-gray-800 ml-4 space-y-8">
                            {auditLogs.map((log) => (
                                <div key={log.id} className="relative pl-8">
                                    {/* Dot */}
                                    <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${log.action === 'CREATE' ? 'bg-green-500' :
                                        log.action === 'DELETE' ? 'bg-red-500' : 'bg-blue-500'
                                        }`}></div>

                                    <div className="bg-gray-800/40 p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${log.action === 'CREATE' ? 'bg-green-900/30 text-green-400' :
                                                log.action === 'DELETE' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'
                                                }`}>
                                                {log.action === 'CREATE' ? 'THÊM MỚI' : log.action === 'DELETE' ? 'XÓA' : log.action}
                                            </span>
                                            <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                                        </div>
                                        <p className="text-sm text-gray-300 mt-2">
                                            <span className="text-white font-medium">{log.username === 'System/Unknown' ? 'Hệ thống' : log.username}</span>
                                            <span className="mx-1">đã</span>
                                            <span className="lowercase">
                                                {log.action === 'CREATE' ? 'tạo' : log.action === 'DELETE' ? 'xóa' : 'cập nhật'}
                                            </span>
                                            <span className="mx-1">
                                                {log.resource_type === 'Layer' ? 'lớp dữ liệu' :
                                                    log.resource_type === 'upload' ? 'phiên tải lên' : log.resource_type}
                                            </span>
                                            {log.resource_id && <span className="text-gray-500 text-xs">#{log.resource_id}</span>}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {auditLogs.length === 0 && <div className="text-center text-gray-500 py-10">Chưa có hoạt động nào được ghi lại.</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function DatabaseIcon({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    )
}
