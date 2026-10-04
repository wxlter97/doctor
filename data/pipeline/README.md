# Pipeline de datos

`extract` (PDF → filas, **pendiente de parsers por institución**) → `normalize` → `match` (cruce; lo dudoso a `data/review/*.csv`) → `load` (Supabase, `service_role`).

```bash
cd data/pipeline
python3 -m venv .venv && .venv/bin/pip install -e '.[dev]'
.venv/bin/pytest
```

Lo que está hecho y probado: normalización (nombres, formas, concentraciones, sinónimos) y cruce con revisión humana.
Lo que falta: parsers de LIME/LOM/LIM (requieren los PDF reales, §14.3) y el filtro "solo publicar filas resueltas" en la carga.
