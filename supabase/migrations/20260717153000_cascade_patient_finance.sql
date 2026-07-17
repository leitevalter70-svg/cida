-- Ao apagar paciente, receitas/despesas vinculadas somem (não ficam órfãs no dashboard).

-- Limpa receitas já órfãs de exclusões anteriores (ON DELETE SET NULL).
-- Despesas sem paciente são legítimas (custo geral da clínica) — não apagar.
delete from public.revenues where patient_id is null;

alter table public.revenues
  drop constraint if exists revenues_patient_id_fkey;

alter table public.revenues
  add constraint revenues_patient_id_fkey
  foreign key (patient_id)
  references public.patients (id)
  on delete cascade;

alter table public.expenses
  drop constraint if exists expenses_patient_id_fkey;

alter table public.expenses
  add constraint expenses_patient_id_fkey
  foreign key (patient_id)
  references public.patients (id)
  on delete cascade;
