-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- EDI Files table - stores uploaded/fetched raw EDI files
CREATE TABLE public.edi_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('834', '820', '837', '835', '270', '271', '278', '999', '850', '855', '856', '810')),
  file_size BIGINT,
  file_content TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('upload', 'sftp', 'api', 'cms_test')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- EDI Transactions table - parsed transaction sets
CREATE TABLE public.edi_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.edi_files(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  control_number TEXT,
  sender_id TEXT,
  receiver_id TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE,
  segment_count INTEGER,
  raw_segments JSONB,
  parsed_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- EDI Members table - enrollment data from 834 files
CREATE TABLE public.edi_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.edi_transactions(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  ssn TEXT,
  date_of_birth DATE,
  gender TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  effective_date DATE,
  termination_date DATE,
  plan_code TEXT,
  coverage_level TEXT,
  status TEXT CHECK (status IN ('active', 'terminated', 'pending')),
  employer_name TEXT,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- EDI Payments table - payment data from 820 files
CREATE TABLE public.edi_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.edi_transactions(id) ON DELETE CASCADE,
  payment_amount DECIMAL(15, 2) NOT NULL,
  payment_method TEXT,
  payment_date DATE NOT NULL,
  posting_date DATE,
  payer_name TEXT,
  payee_name TEXT,
  reference_number TEXT,
  invoice_number TEXT,
  account_number TEXT,
  routing_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'reconciled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- EDI Errors table - validation and processing errors
CREATE TABLE public.edi_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.edi_files(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.edi_transactions(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL CHECK (error_type IN ('validation', 'parsing', 'compliance', 'business_rule', 'fraud')),
  error_code TEXT,
  error_message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  segment_id TEXT,
  element_path TEXT,
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Metrics Cache table - pre-computed metrics for dashboard performance
CREATE TABLE public.metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(metric_type, metric_key)
);

-- Indexes for performance
CREATE INDEX idx_edi_files_status ON public.edi_files(status);
CREATE INDEX idx_edi_files_type ON public.edi_files(file_type);
CREATE INDEX idx_edi_files_created ON public.edi_files(created_at DESC);
CREATE INDEX idx_edi_transactions_file ON public.edi_transactions(file_id);
CREATE INDEX idx_edi_transactions_type ON public.edi_transactions(transaction_type);
CREATE INDEX idx_edi_members_member_id ON public.edi_members(member_id);
CREATE INDEX idx_edi_members_status ON public.edi_members(status);
CREATE INDEX idx_edi_payments_date ON public.edi_payments(payment_date DESC);
CREATE INDEX idx_edi_payments_status ON public.edi_payments(status);
CREATE INDEX idx_edi_errors_file ON public.edi_errors(file_id);
CREATE INDEX idx_edi_errors_type ON public.edi_errors(error_type);
CREATE INDEX idx_edi_errors_resolved ON public.edi_errors(resolved);
CREATE INDEX idx_metrics_cache_type_key ON public.metrics_cache(metric_type, metric_key);

-- Enable Row Level Security
ALTER TABLE public.edi_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edi_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edi_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edi_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edi_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all operations for now (public app without auth)
CREATE POLICY "Allow all access to edi_files" ON public.edi_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to edi_transactions" ON public.edi_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to edi_members" ON public.edi_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to edi_payments" ON public.edi_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to edi_errors" ON public.edi_errors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to metrics_cache" ON public.metrics_cache FOR ALL USING (true) WITH CHECK (true);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for edi_members updated_at
CREATE TRIGGER update_edi_members_updated_at
BEFORE UPDATE ON public.edi_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();