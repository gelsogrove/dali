import { GlobalExchangeRate } from '@/components/GlobalExchangeRate';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your system.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GlobalExchangeRate />
        
        {/* Add more widgets here */}
      </div>
    </div>
  );
}
