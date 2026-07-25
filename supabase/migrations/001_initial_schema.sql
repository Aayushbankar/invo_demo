-- =============================================================================
-- InvoDemo - Initial Database Schema
-- Run this migration to set up the application database
-- =============================================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp" with schema extensions;

-- =============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company_name text,
  company_address text,
  company_phone text,
  company_email text,
  company_logo_url text,
  default_currency text default 'INR',
  default_tax_rate numeric(5,2) default 18.00,
  upi_vpa text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================================================
-- INVOICES TABLE
-- =============================================================================
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  invoice_number text not null,
  status text default 'draft' check (status in ('draft','pending','paid','overdue','cancelled')),
  customer_name text not null,
  customer_email text,
  customer_phone text,
  customer_address text,
  currency text default 'INR',
  tax_rate numeric(5,2) default 0,
  discount numeric(10,2) default 0,
  notes text,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, invoice_number)
);

-- =============================================================================
-- INVOICE ITEMS TABLE
-- =============================================================================
create table public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  name text not null,
  description text,
  quantity numeric(10,2) default 1,
  unit_price numeric(12,2) not null,
  total numeric(12,2) generated always as (quantity * unit_price) stored,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- =============================================================================
-- AI REQUESTS LOG
-- =============================================================================
create table public.ai_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  model text not null,
  prompt text not null,
  response text,
  prompt_tokens integer default 0,
  completion_tokens integer default 0,
  total_tokens integer default 0,
  estimated_cost numeric(10,6) default 0,
  response_time_ms integer default 0,
  success boolean default true,
  error_message text,
  created_at timestamptz default now()
);

-- =============================================================================
-- SETTINGS TABLE
-- =============================================================================
create table public.settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  openai_model text default 'gpt-4o',
  invoice_prefix text default 'INV',
  next_invoice_number integer default 1,
  server_yearly_cost numeric(10,2) default 13000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz default now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
create index idx_invoices_user_id on public.invoices(user_id);
create index idx_invoices_status on public.invoices(status);
create index idx_invoices_created_at on public.invoices(created_at desc);
create index idx_invoices_customer_name on public.invoices(customer_name);
create index idx_invoice_items_invoice_id on public.invoice_items(invoice_id);
create index idx_ai_requests_user_id on public.ai_requests(user_id);
create index idx_ai_requests_created_at on public.ai_requests(created_at desc);
create index idx_audit_logs_user_id on public.audit_logs(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.users enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.ai_requests enable row level security;
alter table public.settings enable row level security;
alter table public.audit_logs enable row level security;

-- Users policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Invoices policies
create policy "Users can view own invoices" on public.invoices
  for select using (auth.uid() = user_id);
create policy "Users can create invoices" on public.invoices
  for insert with check (auth.uid() = user_id);
create policy "Users can update own invoices" on public.invoices
  for update using (auth.uid() = user_id);
create policy "Users can delete own invoices" on public.invoices
  for delete using (auth.uid() = user_id);

-- Invoice items policies (via invoice ownership)
create policy "Users can view own invoice items" on public.invoice_items
  for select using (
    exists (select 1 from public.invoices where id = invoice_id and user_id = auth.uid())
  );
create policy "Users can manage own invoice items" on public.invoice_items
  for all using (
    exists (select 1 from public.invoices where id = invoice_id and user_id = auth.uid())
  );

-- AI requests policies
create policy "Users can view own AI requests" on public.ai_requests
  for select using (auth.uid() = user_id);
create policy "Users can create AI requests" on public.ai_requests
  for insert with check (auth.uid() = user_id);

-- Settings policies
create policy "Users can manage own settings" on public.settings
  for all using (auth.uid() = user_id);

-- Audit logs policies
create policy "Users can view own audit logs" on public.audit_logs
  for select using (auth.uid() = user_id);
create policy "System can create audit logs" on public.audit_logs
  for insert with check (true);

-- =============================================================================
-- TRIGGER: Auto-create user profile on signup
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  insert into public.settings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- FUNCTION: Get next invoice number
-- =============================================================================
create or replace function public.get_next_invoice_number(p_user_id uuid)
returns text as $$
declare
  v_prefix text;
  v_next_num integer;
begin
  select invoice_prefix, next_invoice_number
  into v_prefix, v_next_num
  from public.settings where user_id = p_user_id;

  update public.settings
  set next_invoice_number = next_invoice_number + 1
  where user_id = p_user_id;

  return v_prefix || '-' || lpad(v_next_num::text, 5, '0');
end;
$$ language plpgsql security definer;

-- =============================================================================
-- STORAGE BUCKET: logos (for company logo uploads)
-- =============================================================================
-- Note: Run this after Supabase Storage is initialized
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
-- CREATE POLICY "Authenticated users can upload logos" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
-- CREATE POLICY "Anyone can view logos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'logos');
