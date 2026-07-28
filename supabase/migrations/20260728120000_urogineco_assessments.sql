-- Avaliação uroginecológica (anamnese + exame físico + textos do relatório narrativo)
-- 1 registro por paciente

create table public.urogineco_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  assessment_date date not null default current_date,
  anamnese jsonb not null default '{}'::jsonb,
  physical_exam jsonb not null default '{}'::jsonb,
  report_anamnese_text text,
  report_exam_text text,
  report_proposal_text text,
  report_guidance_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id)
);

create index urogineco_assessments_user_idx
  on public.urogineco_assessments (user_id);

create trigger urogineco_assessments_updated_at
  before update on public.urogineco_assessments
  for each row execute function public.set_updated_at();

alter table public.urogineco_assessments enable row level security;

create policy "urogineco_assessments_all_own" on public.urogineco_assessments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
