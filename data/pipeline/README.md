# Pipeline de datos

`extract` (PDF → filas, **pendiente de parsers por institución**) → `normalize` → `match` (cruce; lo dudoso a `data/review/*.csv`) → `load` (Supabase, `service_role`).

```bash
cd data/pipeline
python3 -m venv .venv && .venv/bin/pip install -e '.[dev]'
.venv/bin/pytest
```

Lo que está hecho y probado: normalización (nombres, formas, concentraciones, sinónimos) y cruce con revisión humana.
Lo que falta: parsers de LIME/LOM/LIM (requieren los PDF reales, §14.3) y el filtro "solo publicar filas resueltas" en la carga.

## MINSAL (LOM/MINSAL 2026)

```bash
.venv/bin/pip install -e '.[extract]'
.venv/bin/python -m medapoyo_pipeline.minsal          # → data/processed/catalog.minsal.json + CSV de revisión
.venv/bin/python -m medapoyo_pipeline.combine         # MINSAL + ISSS → data/processed/catalog.minsal-isss.json + data/review/{cruce_posibles,isss_revision,isss_muestra_50}.csv
cd ../.. && pnpm export:catalog --from-json data/processed/catalog.minsal-isss.json --version 3   # publica en apps/web/public/catalog
```
