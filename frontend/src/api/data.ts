import { apiClient } from './client'

export interface Region {
    id: number
    code: string
    name: string
}

export interface Pollutant {
    id: number
    code: string
    name: string
    unit: string
}

export interface Layer {
    id: number
    product_id: string
    region_id: number
    pollutant_code: string
    pollutant_unit: string
    year: number
    period_type: string
    period_value: string
    cog_url: string
    file_size_bytes: number
    created_at: string
    min_value?: number
    max_value?: number
    mean_value?: number
    metadata?: any
}

export interface HistogramBin {
    bin_start: number
    bin_end: number
    count: number
    label: string
}

export interface LayerFilters {
    region_id?: number
    pollutant_code?: string
    year?: number
    period_type?: string
    period_value?: string
}

export interface LayerListResponse {
    items: Layer[]
    total: number
}

export const dataApi = {
    getRegions: async (): Promise<Region[]> => {
        const response = await apiClient.get<Region[]>('/api/v1/regions/')
        return response.data
    },

    getPollutants: async (): Promise<Pollutant[]> => {
        const response = await apiClient.get<Pollutant[]>('/api/v1/pollutants/')
        return response.data
    },

    getLayers: async (filters: LayerFilters = {}): Promise<Layer[]> => {
        const params = new URLSearchParams()
        if (filters.region_id) params.append('region_id', filters.region_id.toString())
        if (filters.pollutant_code) params.append('pollutant_code', filters.pollutant_code)
        if (filters.year) params.append('year', filters.year.toString())
        if (filters.period_type) params.append('period_type', filters.period_type)
        if (filters.period_value) params.append('period_value', filters.period_value)

        const response = await apiClient.get<LayerListResponse>('/api/v1/layers/', { params })
        return response.data.items
    },

    deleteLayer: async (layerId: number): Promise<void> => {
        await apiClient.delete(`/api/v1/layers/${layerId}`)
    },

    updateLayer: async (layerId: number, data: Partial<Layer>): Promise<Layer> => {
        const response = await apiClient.patch(`/api/v1/layers/${layerId}`, data)
        return response.data
    },

    getLayerHistogram: async (layerId: number): Promise<HistogramBin[]> => {
        const response = await apiClient.get<{ items: HistogramBin[] }>(`/api/v1/layers/${layerId}/histogram`)
        return response.data.items
    },
}
