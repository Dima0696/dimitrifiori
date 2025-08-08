-- ============================================================================
-- Aggiunge la colonna IVA alle righe DDT per supportare la fatturazione differita
-- Data: 2025-08-08
-- ============================================================================

BEGIN;

ALTER TABLE public.ddt_vendita_righe
  ADD COLUMN IF NOT EXISTS iva_percentuale numeric DEFAULT 0 NOT NULL;

-- Allinea eventuali funzioni/vista che la leggono (già compatibili)

-- Ricarica cache schema (PostgREST)
-- Nota: eseguire manualmente sul progetto Supabase se necessario:
-- select pg_notify('pgrst', 'reload schema');

COMMIT;


