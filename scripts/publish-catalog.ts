/**
 * Publica el catálogo: lee las tablas de Supabase (clave pública), arma el snapshot, lo valida y lo sube al bucket
 * público `catalog` de Supabase Storage. La app lo descarga desde ahí: no hace falta tocar código ni redesplegar.
 *   pnpm publish:catalog [--source PARCIAL|COMPLETO] [--dry-run] [--write-local]
 * Requiere SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY (solo en tu máquina, .env.local).
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildSnapshot, catalogSchema, sha256Hex } from '@medapoyo/shared';
import { fromSupabase } from './export-catalog';

const url = process.env.SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET ?? 'catalog';
const dry = process.argv.includes('--dry-run');
const writeLocal = process.argv.includes('--write-local');
const srcIdx = process.argv.indexOf('--source');
const source = srcIdx > 0 ? process.argv[srcIdx + 1] : undefined;
if (!url || !service) throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (en .env.local).');

const catalog = await fromSupabase({ source });
if (catalog.medications.length === 0) throw new Error('La base no tiene medicamentos: nada que publicar. ¿Corriste pnpm load:supabase?');
if (catalog.source === 'FIXTURE') throw new Error('Los datos están marcados como FIXTURE (prueba).');
const { json, manifest, filename } = await buildSnapshot(catalog, { urlPrefix: '' }); // url relativa al manifiesto
catalogSchema.parse(JSON.parse(json));
if ((await sha256Hex(json)) !== manifest.sha256) throw new Error('El hash no coincide.');
console.log(`Catálogo v${catalog.version}: ${manifest.count} medicamentos, ${(json.length / 1024).toFixed(0)} KB, source=${catalog.source ?? '—'}, sha256 ${manifest.sha256.slice(0, 12)}…`);
if (dry) { console.log('--dry-run: no se subió nada.'); process.exit(0); }

const auth = { apikey: service, Authorization: `Bearer ${service}` };
async function upload(name: string, body: string, cache: string) {
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${name}`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json', 'x-upsert': 'true', 'cache-control': cache }, body });
  if (!res.ok) throw new Error(`Storage ${name}: ${res.status} ${await res.text()}`);
}
await upload(filename, json, 'max-age=31536000'); // el archivo versionado nunca cambia
await upload('manifest.json', JSON.stringify(manifest, null, 2) + '\n', 'max-age=60');
const reg = await fetch(`${url}/rest/v1/catalog_versions`, {
  method: 'POST', headers: { ...auth, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  body: JSON.stringify({ version: catalog.version, published_at: catalog.publishedAt, medication_count: manifest.count, source: catalog.source ?? null }),
});
if (!reg.ok) throw new Error(`catalog_versions: ${reg.status} ${await reg.text()}`);

// Comprobación de extremo a extremo: lo que ve el público es lo que se subió.
const pub = `${url}/storage/v1/object/public/${BUCKET}`;
// El manifiesto se sirve con caché de 60 s en el CDN: se consulta con un parámetro único para saltarla y ver lo recién subido.
const bust = `?cb=${Date.now()}`;
const m = (await (await fetch(`${pub}/manifest.json${bust}`, { cache: 'no-store' })).json()) as { version: number; sha256: string };
const got = await (await fetch(`${pub}/${filename}${bust}`)).text();
if (m.version !== catalog.version || (await sha256Hex(got)) !== manifest.sha256) throw new Error('Lo publicado no coincide con lo subido.');
if (writeLocal) { // la copia de respaldo que viaja con la app en el próximo despliegue
  const out = join(import.meta.dirname, '..', 'apps/web/public/catalog');
  const local = await buildSnapshot(catalog);
  await mkdir(out, { recursive: true });
  for (const f of await readdir(out)) if (/^catalog-v\d+\.json$/.test(f)) await rm(join(out, f));
  await writeFile(join(out, local.filename), local.json);
  await writeFile(join(out, 'manifest.json'), JSON.stringify(local.manifest, null, 2) + '\n');
  console.log(`Copia local actualizada en apps/web/public/catalog (v${catalog.version}).`);
}
console.log(`Publicado y verificado: ${pub}/manifest.json (v${m.version})`);
