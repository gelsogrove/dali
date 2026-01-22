import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import api from './lib/api'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import PropertiesPage from './pages/PropertiesPage'
import PropertyFormPage from './pages/PropertyFormPage'
import BlogsPage from './pages/BlogsPage'
import BlogFormPage from './pages/BlogFormPage'
import PhotoGalleryPage from './pages/PhotoGalleryPage'
import PhotoGalleryFormPage from './pages/PhotoGalleryFormPage'
import VideosPage from './pages/VideosPage'
import CommunitiesPage from './pages/CommunitiesPage'
import LinkGenerationPage from './pages/LinkGenerationPage'
import TestimonialsPage from './pages/TestimonialsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { isAuthenticated, token, expiresAt, logout, refreshSession } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    token: state.token,
    expiresAt: state.expiresAt,
    logout: state.logout,
    refreshSession: state.refreshSession,
  }))
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !token || !expiresAt) {
      logout()
      navigate('/login', { replace: true })
      return
    }

    const now = Date.now()
    if (expiresAt <= now) {
      logout()
      navigate('/login', { replace: true })
      return
    }

    let cancelled = false

    const validateSession = async () => {
      try {
        const response = await api.post('/auth/verify')
        const serverExpSeconds = response.data?.data?.user?.exp

        if (serverExpSeconds) {
          const serverExpiresAt = serverExpSeconds * 1000
          refreshSession(serverExpiresAt)
        }

        if (!cancelled) {
          setChecking(false)
        }
      } catch {
        if (!cancelled) {
          logout()
          navigate('/login', { replace: true })
        }
      }
    }

    validateSession()

    const timeoutId = window.setTimeout(() => {
      logout()
      navigate('/login', { replace: true })
    }, Math.max(0, expiresAt - now))

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [isAuthenticated, token, expiresAt, logout, navigate, refreshSession])

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />
  }

  if (checking) {
    return null
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="properties/new" element={<PropertyFormPage />} />
        <Route path="properties/:id/edit" element={<PropertyFormPage />} />
        <Route path="blogs" element={<BlogsPage />} />
        <Route path="blogs/new" element={<BlogFormPage />} />
        <Route path="blogs/:id/edit" element={<BlogFormPage />} />
        <Route path="photogallery" element={<PhotoGalleryPage />} />
        <Route path="photogallery/upload" element={<PhotoGalleryFormPage />} />
        <Route path="photogallery/:id/edit" element={<PhotoGalleryFormPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="testimonials" element={<TestimonialsPage />} />
        <Route path="feedbacks" element={<Navigate to="/testimonials" replace />} />
        <Route path="community" element={<CommunitiesPage />} />
        <Route path="link-generation" element={<LinkGenerationPage />} />
      </Route>
    </Routes>
  )
}

export default App
