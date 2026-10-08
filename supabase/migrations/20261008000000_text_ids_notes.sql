-- Los ids de medicamento pasan a ser texto estable (p. ej. «minsal-00202005»): la app los usa en las URL y en los
-- favoritos, así que no pueden cambiar entre publicaciones. Se agrega `notes` por institución y `source` por versión.
-- Las tablas estaban vacías cuando se aplicó esta migración.

drop table if exists clinical_info;
drop table if exists medication_institutions;
drop table if exists medications;

create table medications (
  id text primary key default gen_random_uuid()::text,
  generic_name text not null,
  active_ingredients text[] not null,
  pharmaceutical_form text not null,
  strength text not null,
  route text,
  atc_code text,
  therapeutic_group text,
  search_terms text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table medication_institutions (
  medication_id text not null references medications on delete cascade,
  institution_id text not null references institutions,
  institutional_code text,
  care_level text,
  presentation text,
  notes text,
  primary key (medication_id, institution_id)
);

create table clinical_info (
  medication_id text primary key references medications on delete cascade,
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

alter table catalog_versions add column if not exists source text;

alter table medications enable row level security;
alter table medication_institutions enable row level security;
alter table clinical_info enable row level security;
create policy "lectura publica" on medications for select to anon using (true);
create policy "lectura publica" on medication_institutions for select to anon using (true);
create policy "lectura publica" on clinical_info for select to anon using (true);

-- Edición de los listados (ya cargada por el pipeline): se completan edición y fecha de cada fuente.
update institutions set list_edition = '2026 (Acuerdo n.º 1201, 14/05/2026)', source_date = '2026-05-14', source_url = 'https://asp.salud.gob.sv/regulacion/default.asp' where id = 'minsal';
update institutions set list_edition = '19.ª edición (29/10/2024)', source_date = '2024-10-29', source_url = 'https://www.transparencia.gob.sv/descarga_archivo.php?id=NjA2NTM4&inst=606538' where id = 'isss';
update institutions set list_edition = '2.ª edición (2019)', source_date = '2019-01-01', source_url = 'https://www.transparencia.gob.sv/descarga_archivo.php?id=MzQ3MDM4&inst=347038' where id = 'fosalud';

-- La copia del catálogo que viaja con la app es la versión 5: lo que se publique en Storage debe ser mayor.
insert into catalog_versions (version, published_at, notes, medication_count, source)
values (5, now(), 'Copia inicial incluida en la app (apps/web/public/catalog)', 1313, 'PARCIAL')
on conflict (version) do nothing;
