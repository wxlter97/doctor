# MedHelp

PWA gratuita en español para médicos de El Salvador: medicamentos por institución, calculadoras clínicas y turnos personales. Herramienta de apoyo; no sustituye el criterio médico. Plan completo: ver `PLAN.md` del proyecto.

```bash
pnpm install
pnpm dev        # http://localhost:5173  (tokens en /dev/tokens)
pnpm test && pnpm typecheck && pnpm lint && pnpm build
```

## Cargar y publicar datos (sin tocar código ni redesplegar)

Supabase es la fuente editorial; la app lee un archivo estático publicado en el bucket público `catalog`.

```bash
# 1) (una vez) carga el catálogo generado por el pipeline a las tablas
pnpm load:supabase data/processed/catalog.minsal-isss.json --dry-run   # revisa primero
pnpm load:supabase data/processed/catalog.minsal-isss.json
# 2) corregí o agregá filas en Supabase (Table Editor) cuando quieras
# 3) publicá: lee las tablas, valida, sube al bucket y verifica lo que ve el público
pnpm publish:catalog --dry-run
pnpm publish:catalog [--source PARCIAL|COMPLETO] [--write-local]
```
La app descarga la versión nueva la próxima vez que abre con conexión. `VITE_CATALOG_BASE_URL` (variable de Vercel, pública)
apunta al bucket: `https://<proyecto>.supabase.co/storage/v1/object/public/catalog`. Si el bucket no responde, la app usa la
copia incluida en el build (`apps/web/public/catalog`; `--write-local` la actualiza). Las claves van en `.env.local` (ver `.env.example`).

