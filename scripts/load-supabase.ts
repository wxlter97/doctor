/**
 * Carga un catálogo ya armado (p. ej. data/processed/catalog.minsal-isss.json) a las tablas de Supabase.
 * Usa la clave service_role (SUPABASE_SERVICE_ROLE_KEY): solo en tu máquina, nunca en el frontend ni en Vercel.
 *   pnpm load:supabase <archivo.json> [--dry-run] [--prune]
 * Por defecto hace upsert (crea y actualiza, no borra). Con --prune borra los medicamentos que NO están en el archivo.
 */
import { readFile } from 'node:fs/promises';
import { catalogSchema } from '@medapoyo/shared';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const file = process.argv[2];
const dry = process.argv.includes('--dry-run');
const prune = process.argv.includes('--prune');
if (!file || file.startsWith('--')) throw new Error('Uso: pnpm load:supabase <archivo.json> [--dry-run] [--prune]');
if (!url || !key) throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (en .env.local).');

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
async function call(method: string, path: string, body?: unknown, prefer?: string): Promise<unknown> {
  const res = await fetch(`${url}/rest/v1/${path}`, { method, headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!res.ok) throw new Error(`${method} ${path.split('?')[0]}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
/** PostgREST devuelve como máximo 1000 filas por petición (límite del proyecto): se pagina con Range para no dejar fuera ninguna. */
async function getAll<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${url}/rest/v1/${path}`, { headers: { ...headers, Range: `${from}-${from + 999}`, 'Range-Unit': 'items' } });
    if (!res.ok) throw new Error(`GET ${path.split('?')[0]}: ${res.status} ${await res.text()}`);
    const page = (await res.json()) as T[];
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}
async function upsert(table: string, rows: unknown[], conflict: string) {
  for (let i = 0; i < rows.length; i += 400) await call('POST', `${table}?on_conflict=${conflict}`, rows.slice(i, i + 400), 'resolution=merge-duplicates,return=minimal');
}

const catalog = catalogSchema.parse(JSON.parse(await readFile(file, 'utf8')));
const nn = <T>(v: T | undefined) => v ?? null;
const meds = catalog.medications.map((m) => ({
  id: m.id, generic_name: m.genericName, active_ingredients: m.activeIngredients, pharmaceutical_form: m.form, strength: m.strength,
  route: nn(m.route), atc_code: nn(m.atcCode), therapeutic_group: nn(m.therapeuticGroup), search_terms: m.searchTerms,
}));
const links = catalog.medications.flatMap((m) => m.institutions.map((i) => ({
  medication_id: m.id, institution_id: i.id, institutional_code: nn(i.code), care_level: nn(i.careLevel), presentation: nn(i.presentation), notes: nn(i.notes),
})));
const insts = catalog.institutions.map((i) => ({ id: i.id, name: i.name, list_name: nn(i.listName), list_edition: nn(i.listEdition), source_url: nn(i.sourceUrl), source_date: nn(i.sourceDate) }));
const syns = Object.entries(catalog.synonyms).map(([term, canonical]) => ({ term, canonical }));

console.log(`${file}: ${insts.length} instituciones, ${meds.length} medicamentos, ${links.length} vínculos, ${syns.length} sinónimos (catálogo v${catalog.version}, source=${catalog.source ?? '—'})`);
if (dry) { console.log('--dry-run: no se escribió nada.'); process.exit(0); }

await upsert('institutions', insts, 'id');
await upsert('synonyms', syns, 'term');
await upsert('medications', meds, 'id');
await upsert('medication_institutions', links, 'medication_id,institution_id');
// Los vínculos que ya no existen (p. ej. un medicamento que dejó de estar en una institución) se quitan por medicamento.
const keep = new Set(links.map((l) => `${l.medication_id}|${l.institution_id}`));
const existing = await getAll<{ medication_id: string; institution_id: string }>('medication_institutions?select=medication_id,institution_id&order=medication_id,institution_id');
const stale = existing.filter((l) => !keep.has(`${l.medication_id}|${l.institution_id}`));
for (const l of stale) await call('DELETE', `medication_institutions?medication_id=eq.${encodeURIComponent(l.medication_id)}&institution_id=eq.${l.institution_id}`);
console.log(`Cargado. Vínculos obsoletos eliminados: ${stale.length}.`);
if (prune) {
  const ids = new Set(meds.map((m) => m.id));
  const all = await getAll<{ id: string }>('medications?select=id&order=id');
  const extra = all.filter((m) => !ids.has(m.id));
  for (const m of extra) await call('DELETE', `medications?id=eq.${encodeURIComponent(m.id)}`);
  console.log(`--prune: medicamentos eliminados que no estaban en el archivo: ${extra.length}.`);
}
