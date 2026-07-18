-- Credenciais profissionais nos documentos + data de liquidação financeira

alter table public.report_defaults
  add column if not exists professional_name text not null
    default 'Maria Apárecida S. Leite',
  add column if not exists crefito text not null
    default '82810F';

update public.report_defaults
set
  professional_name = coalesce(nullif(trim(professional_name), ''), 'Maria Apárecida S. Leite'),
  crefito = coalesce(nullif(trim(crefito), ''), '82810F');

alter table public.financial_settings
  add column if not exists card_credit_settlement_days integer not null
    default 30
    check (card_credit_settlement_days >= 0 and card_credit_settlement_days <= 120);

alter table public.revenues
  add column if not exists settled_at date;

-- Backfill: crédito ~30 dias; demais na data da venda
update public.revenues r
set settled_at = case
  when r.payment_method = 'credito' then r.revenue_date + 30
  else r.revenue_date
end
where r.settled_at is null;

alter table public.revenues
  alter column settled_at set not null;

create index if not exists revenues_settled_at_idx
  on public.revenues (user_id, settled_at);
