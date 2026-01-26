import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi, User } from '../api/auth'

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (username: string, password: string) => Promise<void>
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if user is already logged in
        const checkAuth = async () => {
            const token = localStorage.getItem('access_token')
            if (token) {
                try {
                    const userData = await authApi.getCurrentUser()
                    setUser(userData)
                } catch (error) {
                    console.error('Failed to get user:', error)
                    localStorage.removeItem('access_token')
                }
            }
            setLoading(false)
        }

        checkAuth()
    }, [])

    const login = async (username: string, password: string) => {
        const response = await authApi.login({ username, password })
        localStorage.setItem('access_token', response.access_token)

        const userData = await authApi.getCurrentUser()
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        setUser(null)
        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
