-- Evita a mesma parcela ou a mesma sessão gerarem duas receitas na prestação.
create unique index if not exists revenues_installment_id_unique
  on public.revenues (installment_id)
  where installment_id is not null;

create unique index if not exists revenues_session_id_unique
  on public.revenues (session_id)
  where session_id is not null;
