-- Cida initial schema
-- Single-tenant: all business rows scoped to auth.users (physiotherapist)

create extension if not exists "pgcrypto";

-- Enums
create type public.clinic_base_mode as enum ('with_fee', 'without_fee');
create type public.patient_status as enum ('ativo', 'em_tratamento', 'alta', 'inativo');
create type public.patient_sex as enum ('feminino', 'masculino', 'outro', 'nao_informado');
create type public.treatment_kind as enum ('pacote', 'avulso');
create type public.treatment_status as enum ('ativo', 'concluido', 'cancelado');
create type public.installment_status as enum ('pendente', 'paga', 'atrasada');
create type public.payment_method as enum ('dinheiro', 'pix', 'debito', 'credito', 'outro');
create type public.device_access_route as enum (
  'sonda_vaginal',
  'sonda_anal',
  'eletrodo_superficie',
  'outro',
  'nao_aplicavel'
);

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Financial settings (one row per user)
create table public.financial_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  clinic_percent numeric(5, 2) not null default 30.00
    check (clinic_percent >= 0 and clinic_percent <= 100),
  card_fee_percent numeric(5, 2) not null default 3.50
    check (card_fee_percent >= 0 and card_fee_percent <= 100),
  default_clinic_base_mode public.clinic_base_mode not null default 'without_fee',
  default_clinic_shares_card_fee boolean not null default false,
  clinical_chance_indicator_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_settings_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  field_name text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);

create index financial_settings_history_user_idx
  on public.financial_settings_history (user_id, changed_at desc);

-- Clinical chance bands (literature ranges by complaint type)
create table public.clinical_chance_bands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  complaint_type text not null,
  cure_min_percent numeric(5, 2),
  cure_max_percent numeric(5, 2),
  cure_or_improve_min_percent numeric(5, 2),
  cure_or_improve_max_percent numeric(5, 2),
  control_min_percent numeric(5, 2),
  control_max_percent numeric(5, 2),
  source_text text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, complaint_type)
);

-- Report defaults (disclaimer + maintenance guidance)
create table public.report_defaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  disclaimer_text text not null default
    'Esta estimativa é baseada em faixas populacionais da literatura científica. Não constitui garantia de cura individual. Elaborado pela fisioterapeuta responsável.',
  maintenance_guidance_text text not null default
    'Continue os exercícios de assoalho pélvico em casa conforme orientação. Retorne se houver piora dos sintomas.',
  updated_at timestamptz not null default now()
);

-- Device catalog
create table public.device_catalog (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

-- Expense categories
create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Patients
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  birth_date date,
  age_years int,
  sex public.patient_sex not null default 'nao_informado',
  phone text,
  email text,
  complaint_focus text,
  notes text,
  status public.patient_status not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_user_idx on public.patients (user_id);
create index patients_status_idx on public.patients (user_id, status);

-- Treatments (package or ad-hoc plan)
create table public.treatments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  kind public.treatment_kind not null default 'pacote',
  protocol_name text not null,
  planned_sessions int not null default 1 check (planned_sessions > 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  installment_count int not null default 1 check (installment_count > 0),
  status public.treatment_status not null default 'ativo',
  started_at date not null default current_date,
  completed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index treatments_user_idx on public.treatments (user_id);
create index treatments_patient_idx on public.treatments (patient_id);

-- Installments (for packages)
create table public.installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  treatment_id uuid not null references public.treatments (id) on delete cascade,
  sequence_number int not null check (sequence_number > 0),
  amount numeric(12, 2) not null check (amount >= 0),
  due_date date,
  status public.installment_status not null default 'pendente',
  paid_at date,
  created_at timestamptz not null default now(),
  unique (treatment_id, sequence_number)
);

create index installments_treatment_idx on public.installments (treatment_id);

-- Clinical sessions / evolutions
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  treatment_id uuid references public.treatments (id) on delete set null,
  session_date date not null default current_date,
  daily_complaint text,
  procedures_done text,
  patient_response text,
  evolution_scale smallint check (evolution_scale is null or (evolution_scale between 1 and 5)),
  access_route public.device_access_route default 'nao_aplicavel',
  device_notes text,
  next_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_has_clinical_content check (
    evolution_scale is not null
    or (procedures_done is not null and length(trim(procedures_done)) > 0)
    or (patient_response is not null and length(trim(patient_response)) > 0)
  )
);

create index sessions_patient_idx on public.sessions (patient_id, session_date desc);
create index sessions_user_date_idx on public.sessions (user_id, session_date desc);

-- Session ↔ devices (N:N)
create table public.session_devices (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  device_id uuid not null references public.device_catalog (id) on delete restrict,
  notes text,
  unique (session_id, device_id)
);

-- Revenues (snapshot of financial choices at launch time)
create table public.revenues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete set null,
  treatment_id uuid references public.treatments (id) on delete set null,
  installment_id uuid references public.installments (id) on delete set null,
  session_id uuid references public.sessions (id) on delete set null,
  revenue_date date not null default current_date,
  description text,
  gross_amount numeric(12, 2) not null check (gross_amount >= 0),
  payment_method public.payment_method not null default 'pix',
  -- Snapshots (never auto-recalculated)
  clinic_percent numeric(5, 2) not null,
  card_fee_percent numeric(5, 2) not null,
  clinic_base_mode public.clinic_base_mode not null,
  clinic_shares_card_fee boolean not null,
  -- Calculated values persisted
  card_fee_amount numeric(12, 2) not null default 0,
  clinic_base_amount numeric(12, 2) not null default 0,
  clinic_gross_share numeric(12, 2) not null default 0,
  professional_gross_share numeric(12, 2) not null default 0,
  clinic_fee_share numeric(12, 2) not null default 0,
  professional_fee_share numeric(12, 2) not null default 0,
  clinic_net_amount numeric(12, 2) not null default 0,
  professional_net_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index revenues_user_date_idx on public.revenues (user_id, revenue_date desc);
create index revenues_patient_idx on public.revenues (patient_id);

-- Expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.expense_categories (id) on delete set null,
  patient_id uuid references public.patients (id) on delete set null,
  expense_date date not null default current_date,
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_user_date_idx on public.expenses (user_id, expense_date desc);

-- Clinical reports (patient PDF draft — no financial data)
create table public.clinical_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  treatment_id uuid not null unique references public.treatments (id) on delete cascade,
  synthesis_text text,
  maintenance_guidance text,
  adherence_percent numeric(5, 2),
  sessions_planned int,
  sessions_done int,
  scale_start smallint,
  scale_end smallint,
  devices_summary text,
  chance_summary text,
  complaint_focus text,
  treatment_period_start date,
  treatment_period_end date,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger financial_settings_updated_at
  before update on public.financial_settings
  for each row execute function public.set_updated_at();

create trigger patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

create trigger treatments_updated_at
  before update on public.treatments
  for each row execute function public.set_updated_at();

create trigger sessions_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

create trigger revenues_updated_at
  before update on public.revenues
  for each row execute function public.set_updated_at();

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

create trigger clinical_reports_updated_at
  before update on public.clinical_reports
  for each row execute function public.set_updated_at();

-- Bootstrap profile + defaults on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );

  insert into public.financial_settings (user_id)
  values (new.id);

  insert into public.report_defaults (user_id)
  values (new.id);

  -- Default device catalog
  insert into public.device_catalog (user_id, slug, name, description, sort_order) values
    (new.id, 'biofeedback_emg', 'Biofeedback EMG', 'Eletromiográfico — captura da atividade muscular', 1),
    (new.id, 'biofeedback_manometrico', 'Biofeedback manométrico', 'Pressão perineal via sonda', 2),
    (new.id, 'eletroestimulacao', 'Eletroestimulação', 'TENS, FES/EMS, Aussie, etc.', 3),
    (new.id, 'combinado', 'Combinado', 'Biofeedback + eletroestimulação na mesma sessão', 4),
    (new.id, 'sem_aparelho', 'Sem aparelho eletrônico', 'Exercício / terapia manual / educação', 5),
    (new.id, 'outro', 'Outro', 'Laser, radiofrequência ou outro recurso', 6);

  -- Default expense categories
  insert into public.expense_categories (user_id, name) values
    (new.id, 'Materiais descartáveis'),
    (new.id, 'Taxas da clínica'),
    (new.id, 'Material de consumo'),
    (new.id, 'Outros');

  -- Default clinical chance bands (IUE literature ranges)
  insert into public.clinical_chance_bands (
    user_id, complaint_type,
    cure_min_percent, cure_max_percent,
    cure_or_improve_min_percent, cure_or_improve_max_percent,
    control_min_percent, control_max_percent,
    source_text
  ) values
    (
      new.id, 'IUE',
      46, 56, 55, 74, 3, 11,
      'Cochrane CD005654 / revisões PFMT — IUE protocolo supervisionado'
    ),
    (
      new.id, 'Mista',
      40, 55, 50, 70, 3, 11,
      'Faixa adaptada de revisões de fisioterapia pélvica'
    ),
    (
      new.id, 'Urgência',
      35, 50, 45, 65, 3, 11,
      'Faixa adaptada — urgência / bexiga hiperativa com TMAP'
    );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mark installment as paid when revenue linked
create or replace function public.sync_installment_on_revenue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.installment_id is not null then
    update public.installments
    set status = 'paga', paid_at = coalesce(new.revenue_date, current_date)
    where id = new.installment_id
      and user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger revenues_sync_installment
  after insert on public.revenues
  for each row execute function public.sync_installment_on_revenue();
