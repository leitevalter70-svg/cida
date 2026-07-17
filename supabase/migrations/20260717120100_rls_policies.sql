-- Row Level Security: each user only sees their own data

alter table public.profiles enable row level security;
alter table public.financial_settings enable row level security;
alter table public.financial_settings_history enable row level security;
alter table public.clinical_chance_bands enable row level security;
alter table public.report_defaults enable row level security;
alter table public.device_catalog enable row level security;
alter table public.expense_categories enable row level security;
alter table public.patients enable row level security;
alter table public.treatments enable row level security;
alter table public.installments enable row level security;
alter table public.sessions enable row level security;
alter table public.session_devices enable row level security;
alter table public.revenues enable row level security;
alter table public.expenses enable row level security;
alter table public.clinical_reports enable row level security;

-- Profiles
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Financial settings
create policy "financial_settings_all_own" on public.financial_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "financial_settings_history_select_own" on public.financial_settings_history
  for select using (auth.uid() = user_id);
create policy "financial_settings_history_insert_own" on public.financial_settings_history
  for insert with check (auth.uid() = user_id);

-- Clinical chance bands
create policy "clinical_chance_bands_all_own" on public.clinical_chance_bands
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Report defaults
create policy "report_defaults_all_own" on public.report_defaults
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Device catalog
create policy "device_catalog_all_own" on public.device_catalog
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Expense categories
create policy "expense_categories_all_own" on public.expense_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Patients
create policy "patients_all_own" on public.patients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Treatments
create policy "treatments_all_own" on public.treatments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Installments
create policy "installments_all_own" on public.installments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sessions
create policy "sessions_all_own" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Session devices: via session ownership
create policy "session_devices_select_own" on public.session_devices
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
create policy "session_devices_insert_own" on public.session_devices
  for insert with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
create policy "session_devices_update_own" on public.session_devices
  for update using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
create policy "session_devices_delete_own" on public.session_devices
  for delete using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- Revenues
create policy "revenues_all_own" on public.revenues
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Expenses
create policy "expenses_all_own" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Clinical reports
create policy "clinical_reports_all_own" on public.clinical_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
