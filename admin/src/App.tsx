import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import PropertiesPage from './pages/PropertiesPage'
import PropertyFormPage from './pages/PropertyFormPage'
import BlogsPage from './pages/BlogsPage'
import BlogFormPage from './pages/BlogFormPage'
import PhotoGalleryPage from './pages/PhotoGalleryPage'
import PhotoGalleryFormPage from './pages/PhotoGalleryFormPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
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
      </Route>
    </Routes>
  )
}

export default App
