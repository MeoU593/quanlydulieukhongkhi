import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { MainLayout } from './layout/MainLayout'
import { AirExplorerPage } from './pages/AirExplorerPage'
import { DataStationPage } from './pages/DataStationPage'
import { LoginPage } from './pages/LoginPage'

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route path="/map" element={<AirExplorerPage />} />
                        <Route path="/data" element={<DataStationPage />} />
                        <Route path="/" element={<Navigate to="/map" replace />} />
                        <Route path="*" element={<Navigate to="/map" replace />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App
