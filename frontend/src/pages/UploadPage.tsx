import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { uploadApi } from '../api/upload'
import { dataApi } from '../api/data'

export const UploadPage: React.FC = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

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
    const [periodType, setPeriodType] = useState('month')
    const [periodValue, setPeriodValue] = useState('1')

    // Load regions and pollutants
    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [regionsData, pollutantsData] = await Promise.all([
                    dataApi.getRegions(),
                    dataApi.getPollutants(),
                ])
                setRegions(regionsData)
                setPollutants(pollutantsData)
                if (regionsData.length > 0) setSelectedRegion(regionsData[0].id)
                if (pollutantsData.length > 0) setSelectedPollutant(pollutantsData[0].code)
            } catch (err) {
                console.error('Failed to load data:', err)
            }
        }
        loadData()
    }, [])

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
            // Find main TIF file for naming/init (just as a reference)
            const mainFile = Array.from(files).find(f => f.name.toLowerCase().endsWith('.tif') || f.name.toLowerCase().endsWith('.tiff'))
            if (!mainFile) {
                throw new Error('Selection must include at least one .tif or .tiff file')
            }

            // 1. Initialize upload
            const metadata = {
                region_id: selectedRegion,
                pollutant_code: selectedPollutant,
                year,
                period_type: periodType,
                period_value: periodValue,
            }

            // Total size of all files
            const totalSize = Array.from(files).reduce((acc, f) => acc + f.size, 0)

            const { upload_id, chunk_size } = await uploadApi.initUpload(mainFile.name, totalSize, metadata)

            // 2. Upload chunks for ALL files
            let uploadedBytes = 0

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const totalChunks = Math.ceil(file.size / chunk_size)

                for (let j = 0; j < totalChunks; j++) {
                    const start = j * chunk_size
                    const end = Math.min(start + chunk_size, file.size)
                    const chunk = file.slice(start, end)

                    await uploadApi.uploadChunk(upload_id, j, totalChunks, chunk, file.name)

                    uploadedBytes += chunk.size
                    setProgress(Math.round((uploadedBytes / totalSize) * 100))
                }
            }

            // 3. Complete upload
            const result = await uploadApi.completeUpload(upload_id)
            setSuccess(`Upload successful! Layer ID: ${result.layer_id}`)
            setFiles(null)
            setProgress(0)
        } catch (err: any) {
            console.error(err)
            setError(err.message || err.response?.data?.detail || 'Upload failed. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            ← Back
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Upload GeoTIFF Data</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{user?.username}</span>
                        <button
                            onClick={logout}
                            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow p-6">
                    {/* File Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Files (GeoTIFF + optional .tfw/.aux.xml)
                        </label>
                        <input
                            type="file"
                            multiple
                            accept=".tif,.tiff,.tfw,.xml,.prj"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                        />
                        {files && files.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                                <p className="font-medium">Selected {files.length} file(s):</p>
                                <ul className="list-disc pl-5 mt-1">
                                    {Array.from(files).map((f, i) => (
                                        <li key={i}>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Metadata Section */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(Number(e.target.value))}
                                disabled={uploading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            >
                                {regions.map((region) => (
                                    <option key={region.id} value={region.id}>
                                        {region.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pollutant</label>
                            <select
                                value={selectedPollutant}
                                onChange={(e) => setSelectedPollutant(e.target.value)}
                                disabled={uploading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            >
                                {pollutants.map((pollutant) => (
                                    <option key={pollutant.code} value={pollutant.code}>
                                        {pollutant.name} ({pollutant.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                disabled={uploading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Period Type</label>
                            <select
                                value={periodType}
                                onChange={(e) => setPeriodType(e.target.value)}
                                disabled={uploading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            >
                                <option value="month">Month</option>
                                <option value="quarter">Quarter</option>
                                <option value="year">Year</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Period Value</label>
                            <input
                                type="text"
                                value={periodValue}
                                onChange={(e) => setPeriodValue(e.target.value)}
                                placeholder="e.g., 1, Q1, 2024"
                                disabled={uploading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                            {success}
                        </div>
                    )}

                    {/* Progress Bar */}
                    {uploading && (
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!files || uploading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Uploading...' : 'Upload Files'}
                    </button>
                </div>
            </main>
        </div>
    )
}
