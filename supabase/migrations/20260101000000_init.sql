-- MedApoyo SV: esquema editorial (fuente de verdad). Los clientes NO leen esto en tiempo de ejecución:
-- scripts/export-catalog.ts genera el snapshot estático. Sin escrituras desde el cliente.

create table institutions (
  id text primary key,
  name text not null,
  list_name text,
  list_edition text,
  source_url text,
  source_date date
);

create table medications (
  id uuid primary key default gen_random_uuid(),
  generic_name text not null,
  active_ingredients text[] not null,
  pharmaceutical_form text not null,
  strength text not null,
  route text,
  atc_code text,
  therapeutic_group text,
  search_terms text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (generic_name, pharmaceutical_form, strength)
);

create table medication_institutions (
  medication_id uuid not null references medications on delete cascade,
  institution_id text not null references institutions,
  institutional_code text,
  care_level text,
  presentation text,
  notes text,
  primary key (medication_id, institution_id)
);

create table clinical_info (
  medication_id uuid primary key references medications on delete cascade,
  indications text,
  dosage text,
  contraindications text,
  interactions text,
  warnings text,
  pregnancy_lactation text,
  source text not null,
  source_ref text,
  source_retrieved_at date,
  reviewed_by text,
  reviewed_at date
);

create table synonyms (term text primary key, canonical text not null);

create table catalog_versions (
  version int primary key,
  published_at timestamptz,
  notes text,
  medication_count int
);

-- RLS: lectura pública (clave anon, solo la usa el export); sin políticas de escritura,
-- por lo que solo service_role (pipeline, local/CI) puede escribir.
alter table institutions enable row level security;
alter table medications enable row level security;
alter table medication_institutions enable row level security;
alter table clinical_info enable row level security;
alter table synonyms enable row level security;
alter table catalog_versions enable row level security;

create policy "lectura publica" on institutions for select to anon using (true);
create policy "lectura publica" on medications for select to anon using (true);
create policy "lectura publica" on medication_institutions for select to anon using (true);
-- La información clínica solo se expone cuando ya fue cruzada con fuente; el export filtra el resto.
create policy "lectura publica" on clinical_info for select to anon using (true);
create policy "lectura publica" on synonyms for select to anon using (true);
create policy "lectura publica" on catalog_versions for select to anon using (true);

insert into institutions (id, name, list_name) values
  ('minsal', 'Ministerio de Salud (MINSAL)', 'LOM/MINSAL'),
  ('isss', 'Instituto Salvadoreño del Seguro Social (ISSS)', 'LOM'),
  ('fosalud', 'Fondo Solidario para la Salud (FOSALUD)', 'LIM'),
  ('sanidad_militar', 'Sanidad Militar', null),
  ('isbm', 'Instituto Salvadoreño de Bienestar Magisterial (ISBM)', null);
-- TODO(fuente): list_edition y source_date de cada listado (§14.3).
