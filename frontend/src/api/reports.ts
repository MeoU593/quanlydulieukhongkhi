import axios from 'axios'

const API_URL = 'http://localhost:8000/api/v1'

export interface StatPoint {
    label: string
    value: number
    year: number
    period: string
}

export interface ReportStats {
    trend_data: StatPoint[]
    summary: {
        count: number
        min: number
        max: number
        avg: number
        pollutant: string
        year: number
        error?: string
    }
}

export const reportsApi = {
    getStats: async (regionId: number, pollutantCode: string, year: number): Promise<ReportStats> => {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_URL}/reports/stats`, {
            params: { region_id: regionId, pollutant_code: pollutantCode, year },
            headers: { Authorization: `Bearer ${token}` }
        })
        return response.data
    }
}
