import { GlobalExchangeRate } from '@/components/GlobalExchangeRate'
import DashStats from '@/components/DashStats'
import SeoTreeModal from '@/components/SeoTreeModal'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your system.
        </p>
      </div>

      {/* Quick Stats */}
      <DashStats />

      {/* SEO Modal Trigger */}
      <SeoTreeModal />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GlobalExchangeRate currencyTo="MXN" title="USD to MXN" />
        <GlobalExchangeRate currencyTo="EUR" title="USD to EUR" />
      </div>

      {/* SEO Tree View */}
    </div>
  )
}
