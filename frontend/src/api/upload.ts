import { apiClient } from './client'

export interface UploadInitResponse {
    upload_id: string
    chunk_size: number
}

export interface UploadCompleteResponse {
    layer_id: number
    message: string
}

export const uploadApi = {
    initUpload: async (filename: string, fileSize: number, metadata: any): Promise<UploadInitResponse> => {
        const response = await apiClient.post<UploadInitResponse>('/api/v1/upload/init', {
            filename,
            file_size: fileSize,
            region_id: metadata.region_id,
            pollutant_code: metadata.pollutant_code,
            year: metadata.year,
            period_type: metadata.period_type,
            period_value: metadata.period_value,
        })
        return response.data
    },

    uploadChunk: async (uploadId: string, chunkIndex: number, totalChunks: number, chunk: Blob, filename: string): Promise<void> => {
        const formData = new FormData()
        formData.append('file', chunk)
        formData.append('filename', filename)
        formData.append('chunk_index', chunkIndex.toString())
        formData.append('total_chunks', totalChunks.toString())

        await apiClient.post(`/api/v1/upload/${uploadId}/chunk`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },

    completeUpload: async (uploadId: string): Promise<UploadCompleteResponse> => {
        const response = await apiClient.post<UploadCompleteResponse>(`/api/v1/upload/${uploadId}/complete`)
        return response.data
    },
}
