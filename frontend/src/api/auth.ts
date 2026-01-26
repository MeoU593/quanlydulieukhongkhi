import { apiClient } from './client'

export interface LoginRequest {
    username: string
    password: string
}

export interface LoginResponse {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
}

export interface User {
    id: number
    username: string
    role: string
    full_name?: string
    email?: string
}

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', credentials)
        return response.data
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await apiClient.get<User>('/api/v1/auth/me')
        return response.data
    },
}
