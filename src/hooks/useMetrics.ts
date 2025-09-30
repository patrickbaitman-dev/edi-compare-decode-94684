import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Metrics {
  financial: {
    totalPremium: number;
    paymentProcessing: number;
    avgPaymentDelay: number;
    targetDelay: number;
    netCostSavings: number;
    automationSavings: number;
    complianceSavings: number;
    revenueRecovery: number;
    roi: number;
    paybackMonths: number;
  };
  members: {
    active: number;
    total: number;
    churnRate: number;
  };
  errors: {
    critical: number;
    total: number;
    resolved: number;
  };
  processing: {
    filesProcessed: number;
    totalFiles: number;
    avgProcessingTime: number;
    successRate: number;
  };
  payments: {
    count: number;
    pending: number;
    posted: number;
  };
}

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-metrics');
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch metrics');
      
      return data.metrics as Metrics;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export async function fetchCMSData() {
  const { data, error } = await supabase.functions.invoke('fetch-cms-data');
  
  if (error) throw error;
  if (!data.success) throw new Error(data.error || 'Failed to fetch CMS data');
  
  return data;
}
