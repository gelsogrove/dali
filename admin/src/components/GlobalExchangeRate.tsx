import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp, History, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ExchangeRate {
  id?: string;
  currency_from: string;
  currency_to: string;
  rate: string;
  date: string;
  is_active?: boolean;
  created_at?: string;
}

interface ExchangeRateHistory {
  history: ExchangeRate[];
  total: number;
}

export function GlobalExchangeRate() {
  const [isEditing, setIsEditing] = useState(false);
  const [newRate, setNewRate] = useState('');
  const queryClient = useQueryClient();

  // Get current exchange rate
  const { data: currentRate, isLoading } = useQuery<{ success: boolean; data: ExchangeRate }>({
    queryKey: ['exchange-rate-current'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/exchange-rate/current`);
      if (!response.ok) throw new Error('Failed to fetch exchange rate');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Get history
  const { data: historyData } = useQuery<{ success: boolean; data: ExchangeRateHistory }>({
    queryKey: ['exchange-rate-history'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/exchange-rate/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json();
    },
    enabled: false, // Only fetch when dialog is opened
  });

  // Update rate mutation
  const updateRateMutation = useMutation({
    mutationFn: async (rate: number) => {
      const response = await api.post('/exchange-rate', {
        rate,
        date: new Date().toISOString().split('T')[0],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rate-current'] });
      queryClient.invalidateQueries({ queryKey: ['exchange-rate-history'] });
      alert('Exchange rate updated successfully!');
      setIsEditing(false);
      setNewRate('');
    },
    onError: (error: Error) => {
      alert('Error: ' + error.message);
    },
  });

  const handleSave = () => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      alert('Please enter a valid positive number.');
      return;
    }
    updateRateMutation.mutate(rate);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const rate = currentRate?.data;
  const rateValue = parseFloat(rate?.rate || '0');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Global Exchange Rate</CardTitle>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Exchange Rate History</DialogTitle>
                <DialogDescription>
                  Last 30 days of exchange rate changes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {historyData?.data.history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <div className="font-medium">
                        {item.rate} {item.currency_to}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      {item.is_active && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          USD to MXN conversion rate • Updated {new Date(rate?.date || '').toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{rateValue.toFixed(2)}</span>
              <span className="text-muted-foreground">MXN</span>
            </div>
            <div className="text-sm text-muted-foreground">
              1 USD = {rateValue.toFixed(4)} MXN
            </div>
            <Button 
              onClick={() => {
                setIsEditing(true);
                setNewRate(rate?.rate || '');
              }}
              className="w-full"
            >
              Update Rate
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-rate">New Rate (MXN per USD)</Label>
              <Input
                id="new-rate"
                type="number"
                step="0.0001"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="17.5000"
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={updateRateMutation.isPending}
                className="flex-1"
              >
                {updateRateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setNewRate('');
                }}
                disabled={updateRateMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
