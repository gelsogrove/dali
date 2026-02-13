import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, RefreshCw, Save } from 'lucide-react';

interface ExchangeRate {
  id?: string;
  currency_from: string;
  currency_to: string;
  rate: string;
  date: string;
  is_active?: boolean;
  created_at?: string;
}

type GlobalExchangeRateProps = {
  currencyTo?: 'MXN' | 'EUR';
  title?: string;
};

export function GlobalExchangeRate({ currencyTo = 'MXN', title }: GlobalExchangeRateProps) {
  const queryClient = useQueryClient();
  const displayTitle = title || `USD to ${currencyTo}`;

  // Get current exchange rate from DB
  const { data: currentRate, isLoading } = useQuery<{ success: boolean; data: ExchangeRate }>({
    queryKey: ['exchange-rate-current', currencyTo],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/exchange-rate/current?currency_from=USD&currency_to=${currencyTo}`);
      if (!response.ok) throw new Error('Failed to fetch exchange rate');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Auto-fetch rate from external API
  const fetchExternalRateMutation = useMutation({
    mutationFn: async () => {
      // Use free exchangerate-api.com
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!response.ok) throw new Error('Failed to fetch external rates');
      const data = await response.json();
      const rate = data.rates[currencyTo];
      if (!rate) throw new Error(`Rate not found for ${currencyTo}`);
      
      // Save to database
      const saveResponse = await api.post('/exchange-rate', {
        rate: rate.toString(),
        date: new Date().toISOString().split('T')[0],
        currency_from: 'USD',
        currency_to: currencyTo,
      });
      return saveResponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rate-current', currencyTo] });
      alert(`Exchange rate updated successfully from external API!`);
    },
    onError: (error: Error) => {
      alert('Error fetching rate: ' + error.message);
    },
  });

  const handleAutoUpdate = () => {
    if (confirm(`Fetch the latest USD to ${currencyTo} exchange rate from external API?`)) {
      fetchExternalRateMutation.mutate();
    }
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
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>{displayTitle}</CardTitle>
        </div>
        <CardDescription>
          USD to {currencyTo} conversion rate • Updated {new Date(rate?.date || '').toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{rateValue.toFixed(2)}</span>
            <span className="text-muted-foreground">{currencyTo}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            1 USD = {rateValue.toFixed(4)} {currencyTo}
          </div>
          <Button 
            onClick={handleAutoUpdate}
            disabled={fetchExternalRateMutation.isPending}
            className="w-full"
            variant="default"
          >
            {fetchExternalRateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update from DOF.gob.mx
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Automatically fetches the latest rate from external API
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
