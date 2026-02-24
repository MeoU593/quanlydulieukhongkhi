import React, { useState, useEffect } from 'react'
import { uploadApi } from '../api/upload'
import { dataApi } from '../api/data'
import { Upload, File, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

export const UploadPage: React.FC = () => {

    const [files, setFiles] = useState<FileList | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Metadata
    const [regions, setRegions] = useState<any[]>([])
    const [pollutants, setPollutants] = useState<any[]>([])
    const [selectedRegion, setSelectedRegion] = useState<number>(0)
    const [selectedPollutant, setSelectedPollutant] = useState('')
    const [year, setYear] = useState(2024)
    const [periodType, setPeriodType] = useState('monthly')
    const [periodValue, setPeriodValue] = useState('')

    // Load regions and pollutants
    const loadData = async () => {
        try {
            console.log("Loading metadata...")
            const [regionsData, pollutantsData] = await Promise.all([
                dataApi.getRegions(),
                dataApi.getPollutants(),
            ])
            setRegions(regionsData)
            setPollutants(pollutantsData)

            // Set defaults if available and not already set
            if (regionsData.length > 0 && selectedRegion === 0) setSelectedRegion(regionsData[0].id)
            if (pollutantsData.length > 0 && !selectedPollutant) setSelectedPollutant(pollutantsData[0].code)
        } catch (err) {
            console.error('Failed to load data:', err)
            setError("Failed to load regions/pollutants. Backend might be offline.")
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // --- AUTO-FILL LOGIC ---
    useEffect(() => {
        if (files && files.length > 0) {
            const filename = files[0].name;
            // Expected format: CO_monthly_M1_Conc_LaoCai_2019_1000m.tif
            console.log("Parsing filename:", filename);

            const parts = filename.split('_');
            if (parts.length >= 5) {
                // 1. Pollutant
                const pCode = parts[0]; // CO
                const foundP = pollutants.find(p => p.code === pCode);
                if (foundP) setSelectedPollutant(foundP.code);

                // 2. Period Type
                const pType = parts[1]; // monthly
                if (['monthly', 'quarterly', 'yearly'].includes(pType)) {
                    setPeriodType(pType);
                }

                // 3. Period Value
                const pVal = parts[2]; // M1
                if (pVal) setPeriodValue(pVal);

                // 4. Region (LaoCai)
                // Need to match leniently? Or exact? 
                const rCodeInFile = parts[4]; // LaoCai
                // We have regions with code "LAO_CAI" or similar?
                // Let's look for partial match in code or name
                if (regions.length > 0) {
                    const foundR = regions.find(r =>
                        r.code.replace('_', '').toLowerCase() === rCodeInFile.toLowerCase() ||
                        r.code.toLowerCase().includes(rCodeInFile.toLowerCase())
                    );
                    if (foundR) setSelectedRegion(foundR.id);
                }

                // 5. Year (2019)
                const y = parseInt(parts[5]);
                if (!isNaN(y)) setYear(y);
            }
        }
    }, [files, regions, pollutants]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(e.target.files)
            setError('')
            setSuccess('')
        }
    }

    const handleUpload = async () => {
        if (!files || files.length === 0 || !selectedRegion || !selectedPollutant) {
            setError('Please select file(s) and fill in all metadata')
            return
        }

        setUploading(true)
        setProgress(0)
        setError('')
        setSuccess('')

        try {
            const mainFile = Array.from(files).find(f => f.name.toLowerCase().endsWith('.tif') || f.name.toLowerCase().endsWith('.tiff'))
            if (!mainFile) throw new Error('Selection must include at least one .tif or .tiff file')

            const metadata = {
                region_id: selectedRegion,
                pollutant_code: selectedPollutant,
                year,
                period_type: periodType,
                period_value: periodValue,
            }

            const totalSize = Array.from(files).reduce((acc, f) => acc + f.size, 0)
            const { upload_id, chunk_size } = await uploadApi.initUpload(mainFile.name, totalSize, metadata)

            let uploadedBytes = 0
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const totalChunks = Math.ceil(file.size / chunk_size)
                for (let j = 0; j < totalChunks; j++) {
                    const chunk = file.slice(j * chunk_size, Math.min((j + 1) * chunk_size, file.size))
                    await uploadApi.uploadChunk(upload_id, j, totalChunks, chunk, file.name)
                    uploadedBytes += chunk.size
                    setProgress(Math.round((uploadedBytes / totalSize) * 100))
                }
            }

            const result = await uploadApi.completeUpload(upload_id)
            setSuccess(`Upload successful! Layer ID: ${result.layer_id}`)
            setFiles(null)
            setProgress(0)
            // Optional: Notify parent to refresh inventory?
        } catch (err: any) {
            console.error(err)
            setError(err.message || String(err))
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="w-full h-full text-white">
            <div className="bg-gray-800/40 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Upload className="text-blue-400" size={20} />
                            Tải Lên Dữ Liệu
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">Hỗ trợ định dạng GeoTIFF (.tif) cùng với .tfw, .aux.xml</p>
                    </div>
                    <button onClick={loadData} className="p-2 hover:bg-white/10 rounded-full transition" title="Làm mới thông tin">
                        <RefreshCw size={16} className="text-gray-400" />
                    </button>
                </div>

                {/* File Drop Zone (Simulated) */}
                <div className="mb-6">
                    <label className="block w-full border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-8 transition-colors cursor-pointer bg-gray-900/50 group">
                        <input
                            type="file"
                            multiple
                            accept=".tif,.tiff,.tfw,.xml,.prj"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="hidden"
                        />
                        <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-400">
                            {files && files.length > 0 ? (
                                <>
                                    <CheckCircle size={32} className="mb-2 text-green-400" />
                                    <p className="font-medium text-white">{files.length} tệp đã chọn</p>
                                    <p className="text-xs text-gray-500 mt-1 text-center">{files[0].name}...</p>
                                </>
                            ) : (
                                <>
                                    <File size={32} className="mb-2" />
                                    <p className="font-medium">Nhấn để chọn tệp</p>
                                    <p className="text-xs text-gray-500 mt-1">hoặc kéo và thả vào đây</p>
                                </>
                            )}
                        </div>
                    </label>
                </div>

                {/* Metadata Form */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 ml-1">Khu vực</label>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(Number(e.target.value))}
                            disabled={uploading}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white"
                        >
                            {regions.length === 0 && <option value="0">Đang tải...</option>}
                            {regions.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 ml-1">Chất ô nhiễm</label>
                        <select
                            value={selectedPollutant}
                            onChange={(e) => setSelectedPollutant(e.target.value)}
                            disabled={uploading}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white"
                        >
                            {pollutants.length === 0 && <option value="">Đang tải...</option>}
                            {pollutants.map((p) => (
                                <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 ml-1">Năm</label>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            disabled={uploading}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 ml-1">Loại chu kỳ</label>
                        <select
                            value={periodType}
                            onChange={(e) => setPeriodType(e.target.value)}
                            disabled={uploading}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white"
                        >
                            <option value="monthly">Theo Tháng (Monthly)</option>
                            <option value="quarterly">Theo Quý (Quarterly)</option>
                            <option value="yearly">Theo Năm (Yearly)</option>
                        </select>
                    </div>

                    <div className="col-span-2 space-y-1">
                        <label className="text-xs font-medium text-gray-400 ml-1">Giá trị chu kỳ (ví dụ: M1, Q1, Y2021)</label>
                        <input
                            type="text"
                            value={periodValue}
                            onChange={(e) => setPeriodValue(e.target.value)}
                            placeholder="Tự động phát hiện từ tên tệp"
                            disabled={uploading}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-gray-600"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-4 bg-red-900/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 bg-green-900/20 border border-green-500/30 text-green-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                        <CheckCircle size={16} className="mt-0.5 shrink-0" />
                        {success}
                    </div>
                )}

                {/* Progress */}
                {uploading && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Đang tải lên...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!files || uploading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-xl transition shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {uploading ? 'Đang xử lý...' : 'Bắt Đầu Tải Lên'}
                </button>
            </div>
        </div>
    )
}

