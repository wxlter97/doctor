/**
 * Genera el snapshot del catálogo (manifest + catalog-vN.json) en apps/web/public/catalog.
 *   tsx scripts/export-catalog.ts --fixture [--version N]   → desde data/fixtures/catalog.dev.json
 *   tsx scripts/export-catalog.ts --from-json <archivo>      → desde un catálogo ya armado (p. ej. data/processed/catalog.minsal.json)
 *   tsx scripts/export-catalog.ts                            → desde Supabase (SUPABASE_URL, SUPABASE_ANON_KEY)
 *   tsx scripts/export-catalog.ts --validate                 → valida lo publicado (esquema + hash); usado en CI
 *   ...  --validate --forbid-fixture                         → además rechaza datos de prueba (deploy de producción)
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildSnapshot, catalogSchema, manifestSchema, sha256Hex, type Catalog } from '@medapoyo/shared';

const OUT = join(import.meta.dirname, '..', 'apps/web/public/catalog');
const FIXTURE = join(import.meta.dirname, '..', 'data/fixtures/catalog.dev.json');
const arg = (name: string) => process.argv.includes(name);
const argVal = (name: string) => process.argv[process.argv.indexOf(name) + 1];

export async function validatePublished(dir = OUT, opts: { forbidFixture?: boolean } = {}): Promise<string> {
  const manifest = manifestSchema.parse(JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')));
  const raw = await readFile(join(dir, manifest.url.replace('/catalog/', '')), 'utf8');
  if ((await sha256Hex(raw)) !== manifest.sha256) throw new Error('El hash del catálogo no coincide con el manifiesto.');
  const catalog = catalogSchema.parse(JSON.parse(raw));
  if (opts.forbidFixture && catalog.source === 'FIXTURE') throw new Error('El catálogo publicado es de PRUEBA (source=FIXTURE): no se puede desplegar a producción.');
  if (catalog.version !== manifest.version) throw new Error('La versión del catálogo no coincide con el manifiesto.');
  if (catalog.medications.length !== manifest.count) throw new Error('El conteo del manifiesto no coincide.');
  return `Catálogo v${catalog.version} válido (${catalog.medications.length} medicamentos${catalog.source ? `, source=${catalog.source}` : ''}).`;
}

/** Lee las tablas con la clave pública (anon) y arma el catálogo. `version` y `source` los decide el publicador. */
export async function fromSupabase(opts: { version?: number; source?: string } = {}): Promise<Catalog> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Faltan SUPABASE_URL y SUPABASE_ANON_KEY.');
  const get = async <T>(path: string): Promise<T[]> => {
    const rows: T[] = [];
    for (let from = 0; ; from += 1000) {
      const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}`, 'Range-Unit': 'items' } });
      if (!res.ok) throw new Error(`Supabase ${path}: ${res.status} ${await res.text()}`);
      const page = (await res.json()) as T[];
      rows.push(...page);
      if (page.length < 1000) return rows;
    }
  };
  type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const [institutions, meds, synonyms, versions] = await Promise.all([
    get<Row>('institutions?select=*&order=id'),
    get<Row>('medications?select=*,medication_institutions(*),clinical_info(*)&order=generic_name,id'),
    get<Row>('synonyms?select=*'),
    get<Row>('catalog_versions?select=version,source&order=version.desc&limit=1'),
  ]);
  const opt = <T>(v: T | null | undefined) => v ?? undefined;
  // Orden de presentación (filtros y fichas): las listas conocidas primero, el resto alfabético.
  const ORDER = ['minsal', 'isss', 'fosalud', 'sanidad_militar', 'isbm'];
  const rank = (id: string) => (ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length);
  const byInstitution = (a: { id: string }, b: { id: string }) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id);
  const used = new Set(meds.flatMap((m) => m.medication_institutions.map((i: Row) => i.institution_id)));
  return {
    version: opts.version ?? (versions[0]?.version ?? 0) + 1,
    publishedAt: new Date().toISOString(),
    source: opts.source ?? opt(versions[0]?.source),
    // Solo las instituciones que tienen medicamentos (Sanidad Militar e ISBM no tienen listado todavía).
    institutions: institutions.filter((i) => used.has(i.id)).sort(byInstitution).map((i) => ({ id: i.id, name: i.name, listName: opt(i.list_name), listEdition: opt(i.list_edition), sourceUrl: opt(i.source_url), sourceDate: opt(i.source_date) })),
    synonyms: Object.fromEntries(synonyms.map((s) => [s.term, s.canonical])),
    medications: meds.map((m) => {
      const c = Array.isArray(m.clinical_info) ? m.clinical_info[0] : m.clinical_info;
      return {
        id: m.id, genericName: m.generic_name, activeIngredients: m.active_ingredients, form: m.pharmaceutical_form, strength: m.strength,
        route: opt(m.route), atcCode: opt(m.atc_code), therapeuticGroup: opt(m.therapeutic_group), searchTerms: m.search_terms ?? [],
        institutions: m.medication_institutions
          .map((i: Row) => ({ id: i.institution_id, code: opt(i.institutional_code), careLevel: opt(i.care_level), presentation: opt(i.presentation), notes: opt(i.notes) }))
          .sort(byInstitution),
        clinical: c ? {
          indications: opt(c.indications), dosage: opt(c.dosage), contraindications: opt(c.contraindications), interactions: opt(c.interactions),
          warnings: opt(c.warnings), pregnancyLactation: opt(c.pregnancy_lactation), source: c.source, sourceRef: opt(c.source_ref),
          retrievedAt: c.source_retrieved_at ?? '', reviewed: !!c.reviewed_at,
        } : undefined,
      };
    }),
  };
}

async function main() {
  if (arg('--validate')) { console.log(await validatePublished(OUT, { forbidFixture: arg('--forbid-fixture') })); return; }
  const catalog: Catalog = arg('--from-json')
    ? (JSON.parse(await readFile(argVal('--from-json') as string, 'utf8')) as Catalog)
    : arg('--fixture')
      ? { ...(JSON.parse(await readFile(FIXTURE, 'utf8')) as Catalog), ...(arg('--version') ? { version: Number(argVal('--version')) } : {}) }
      : await fromSupabase();
  const { json, manifest, filename } = await buildSnapshot(catalog);
  await mkdir(OUT, { recursive: true });
  for (const f of await readdir(OUT)) if (/^catalog-v\d+\.json$/.test(f) && f !== filename) await rm(join(OUT, f));
  await writeFile(join(OUT, filename), json);
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Publicado ${filename} (${manifest.count} medicamentos, sha256 ${manifest.sha256.slice(0, 12)}…)`);
  console.log(await validatePublished());
}

if (import.meta.filename === process.argv[1]) main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
