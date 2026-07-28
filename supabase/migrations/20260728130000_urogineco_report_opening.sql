-- Texto editável da abertura do relatório fisioterapêutico

alter table public.urogineco_assessments
  add column if not exists report_opening_text text;
