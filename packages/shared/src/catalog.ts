import { z } from 'zod';

export const institutionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  listName: z.string().optional(),
  listEdition: z.string().optional(),
  sourceUrl: z.string().optional(),
  sourceDate: z.string().optional(),
});

export const clinicalSchema = z.object({
  indications: z.string().optional(),
  dosage: z.string().optional(),
  contraindications: z.string().optional(),
  interactions: z.string().optional(),
  warnings: z.string().optional(),
  pregnancyLactation: z.string().optional(),
  source: z.string().min(1),
  sourceRef: z.string().optional(),
  retrievedAt: z.string(),
  reviewed: z.boolean(),
});

export const medicationSchema = z.object({
  id: z.string().min(1),
  genericName: z.string().min(1),
  activeIngredients: z.array(z.string().min(1)).min(1),
  form: z.string().min(1),
  strength: z.string().min(1),
  route: z.string().optional(),
  atcCode: z.string().optional(),
  therapeuticGroup: z.string().optional(),
  searchTerms: z.array(z.string()),
  institutions: z.array(z.object({
    id: z.string().min(1),
    code: z.string().optional(),
    careLevel: z.string().optional(),
    presentation: z.string().optional(),
  })).min(1),
  clinical: clinicalSchema.optional(),
});

export const catalogSchema = z.object({
  version: z.number().int().positive(),
  publishedAt: z.string(),
  /** 'FIXTURE' marca datos de prueba que no son reales. */
  source: z.string().optional(),
  institutions: z.array(institutionSchema).min(1),
  synonyms: z.record(z.string(), z.string()),
  medications: z.array(medicationSchema),
}).superRefine((c, ctx) => {
  const ids = new Set(c.institutions.map((i) => i.id));
  const seen = new Set<string>();
  c.medications.forEach((m, idx) => {
    if (seen.has(m.id)) ctx.addIssue({ code: 'custom', path: ['medications', idx, 'id'], message: `id duplicado: ${m.id}` });
    seen.add(m.id);
    m.institutions.forEach((i, j) => {
      if (!ids.has(i.id)) ctx.addIssue({ code: 'custom', path: ['medications', idx, 'institutions', j], message: `institución desconocida: ${i.id}` });
    });
  });
});

export const manifestSchema = z.object({
  version: z.number().int().positive(),
  publishedAt: z.string(),
  url: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  count: z.number().int().nonnegative(),
});

export type Institution = z.infer<typeof institutionSchema>;
export type CatalogMedication = z.infer<typeof medicationSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type CatalogManifest = z.infer<typeof manifestSchema>;

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Serializa el catálogo y arma su manifiesto (el JSON serializado es el que se hashea). */
export async function buildSnapshot(catalog: Catalog): Promise<{ json: string; manifest: CatalogManifest; filename: string }> {
  const parsed = catalogSchema.parse(catalog);
  const json = JSON.stringify(parsed);
  const filename = `catalog-v${parsed.version}.json`;
  return {
    json,
    filename,
    manifest: { version: parsed.version, publishedAt: parsed.publishedAt, url: `/catalog/${filename}`, sha256: await sha256Hex(json), count: parsed.medications.length },
  };
}
