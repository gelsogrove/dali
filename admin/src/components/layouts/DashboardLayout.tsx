import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { FileText, LogOut, Menu, BookOpen, Video, MessageSquare, MapPin, Repeat, Mail, Shield, DollarSign, ListChecks } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'

export default function DashboardLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Fetch unviewed access requests count for badge
  const { data: countData } = useQuery({
    queryKey: ['access-requests-count'],
    queryFn: async () => {
      const res = await api.get('/access-requests/unviewed-count')
      return res.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })
  const unviewedCount = countData?.data?.count || 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigation = [
    { name: 'Properties', href: '/properties', icon: FileText },
    { name: 'Blogs', href: '/blogs', icon: BookOpen },
    { name: 'Videos', href: '/videos', icon: Video },
    { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
    { name: 'Landing Page', href: '/landing-pages', icon: MapPin },
    { name: 'Cities', href: '/cities', icon: MapPin, nested: true },
  ]

  const utilityNav = [
    { name: 'TODO', href: '/todo', icon: ListChecks },
    { name: 'Access Requests', href: '/access-requests', icon: Mail, badge: unviewedCount },
    { name: 'Off Market Invites', href: '/off-market-invites', icon: Shield },
    { name: 'Redirects', href: '/redirects', icon: Repeat },
    { name: 'Exchange Rates', href: '/', icon: DollarSign },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold text-primary">Dalila Admin</h1>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => navigate(item.href)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors ${item.nested ? 'pl-8 text-sm' : ''}`}
            >
              <item.icon className="h-5 w-5" />
              {sidebarOpen && <span>{item.name}</span>}
            </button>
          ))}

          <div className="border-t border-gray-200 my-6 pt-2"></div>

          {utilityNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors relative"
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {'badge' in item && (item as any).badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                    {(item as any).badge > 9 ? '9+' : (item as any).badge}
                  </span>
                )}
              </div>
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className={`${sidebarOpen ? 'flex items-center gap-3' : 'text-center'} mb-3`}>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
