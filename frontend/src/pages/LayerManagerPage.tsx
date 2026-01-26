import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { dataApi, Layer, Region, Pollutant } from '../api/data'

export const LayerManagerPage: React.FC = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [layers, setLayers] = useState<Layer[]>([])
    const [loading, setLoading] = useState(true)
    const [regions, setRegions] = useState<Region[]>([])
    const [pollutants, setPollutants] = useState<Pollutant[]>([])

    // Load Data
    const loadData = async () => {
        setLoading(true)
        try {
            const [layersData, regionsData, pollutantsData] = await Promise.all([
                dataApi.getLayers(),
                dataApi.getRegions(),
                dataApi.getPollutants()
            ])
            setLayers(layersData)
            setRegions(regionsData)
            setPollutants(pollutantsData)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // Delete Handler
    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this layer? This action cannot be undone.')) {
            try {
                await dataApi.deleteLayer(id)
                setLayers(layers.filter(l => l.id !== id))
            } catch (error) {
                console.error('Failed to delete layer', error)
                alert('Failed to delete layer')
            }
        }
    }

    // Helper to get name
    const getRegionName = (id: number) => regions.find(r => r.id === id)?.name || id
    // const getPollutantName = (id: number) => pollutants.find(p => p.id === id)?.name || id

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">
                            ← Back
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Layer Management</h1>
                    </div>
                    <div>
                        <button
                            onClick={() => navigate('/upload')}
                            className="mr-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            + New Upload
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Size</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {layers.map((layer) => (
                                    <tr key={layer.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{layer.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {getRegionName(layer.region_id)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {layer.period_type} {layer.period_value} ({layer.year})
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {(layer.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(layer.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(layer.id)}
                                                className="text-red-600 hover:text-red-900 ml-4"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {layers.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            No layers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
