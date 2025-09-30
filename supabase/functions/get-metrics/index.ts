import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get total premium from payments
    const { data: payments, error: payError } = await supabase
      .from('edi_payments')
      .select('payment_amount, payment_date, posting_date, status');
    
    if (payError) throw payError;

    const totalPremium = (payments || []).reduce((sum, p) => sum + (Number(p.payment_amount) || 0), 0);
    
    // Calculate payment delays
    const delays = (payments || [])
      .filter(p => p.payment_date && p.posting_date)
      .map(p => {
        const payDate = new Date(p.payment_date);
        const postDate = new Date(p.posting_date);
        return Math.abs((postDate.getTime() - payDate.getTime()) / (1000 * 60 * 60 * 24));
      });
    
    const avgDelay = delays.length > 0 
      ? delays.reduce((a, b) => a + b, 0) / delays.length 
      : 0;

    // Get member counts
    const { data: members, error: memError } = await supabase
      .from('edi_members')
      .select('status');
    
    if (memError) throw memError;

    const activeMembers = (members || []).filter(m => m.status === 'active').length;
    const totalMembers = (members || []).length;

    // Get error counts
    const { data: errors, error: errError } = await supabase
      .from('edi_errors')
      .select('severity, resolved');
    
    if (errError) throw errError;

    const criticalErrors = (errors || []).filter(e => e.severity === 'critical' && !e.resolved).length;
    const totalErrors = (errors || []).length;

    // Get file processing stats
    const { data: files, error: fileError } = await supabase
      .from('edi_files')
      .select('status, file_type, created_at, processed_at');
    
    if (fileError) throw fileError;

    const filesProcessed = (files || []).filter(f => f.status === 'processed').length;
    const totalFiles = (files || []).length;
    
    // Calculate processing time
    const processingTimes = (files || [])
      .filter(f => f.created_at && f.processed_at)
      .map(f => {
        const created = new Date(f.created_at);
        const processed = new Date(f.processed_at);
        return (processed.getTime() - created.getTime()) / 1000; // seconds
      });
    
    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    // Calculate cost savings (simple model)
    const manualCostPerFile = 45;
    const automatedCostPerFile = 5;
    const annualFiles = totalFiles * 12; // Project annually
    const manualCost = annualFiles * manualCostPerFile;
    const automatedCost = annualFiles * automatedCostPerFile;
    const annualSavings = manualCost - automatedCost;
    
    const roi = manualCost > 0 ? ((annualSavings / manualCost) * 100) : 0;

    const metrics = {
      financial: {
        totalPremium,
        paymentProcessing: totalPremium,
        avgPaymentDelay: avgDelay,
        targetDelay: 3.0,
        netCostSavings: annualSavings,
        automationSavings: annualSavings * 0.05,
        complianceSavings: Math.min(annualSavings * 0.1, 850),
        revenueRecovery: 0,
        roi,
        paybackMonths: roi > 0 ? (12 / (roi / 100)) : 0
      },
      members: {
        active: activeMembers,
        total: totalMembers,
        churnRate: totalMembers > 0 ? ((totalMembers - activeMembers) / totalMembers * 100) : 0
      },
      errors: {
        critical: criticalErrors,
        total: totalErrors,
        resolved: (errors || []).filter(e => e.resolved).length
      },
      processing: {
        filesProcessed,
        totalFiles,
        avgProcessingTime,
        successRate: totalFiles > 0 ? (filesProcessed / totalFiles * 100) : 0
      },
      payments: {
        count: payments?.length || 0,
        pending: (payments || []).filter(p => p.status === 'pending').length,
        posted: (payments || []).filter(p => p.status === 'posted').length
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error computing metrics:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
