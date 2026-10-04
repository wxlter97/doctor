# Rendimiento (Lighthouse, 2026-10-03)

Medido con Lighthouse sobre el build de producción (`vite preview`), primera visita (perfil limpio), emulación móvil por defecto (4G lenta simulada). Es una referencia de laboratorio, no un Moto G Power real.

| Métrica | Resultado | Meta del plan |
|---|---|---|
| Performance | 96–97 | ≥ 90 ✔ |
| Accesibilidad | 100 | ≥ 90 ✔ |
| Mejores prácticas / SEO | 100 / 100 | — |
| LCP | 2.2–2.3 s | ≤ 2.5 s ✔ (con throttling más duro que 4G) |
| TBT / CLS | 0–10 ms / 0 | — |
| JS inicial (transferido) | ~181 KB | ≤ 200 KB ✔ |

Antes de optimizar: performance 94–95, LCP 2.5–2.6 s y ~224 KB de JS.

## Qué pesaba en el arranque y qué se hizo

Análisis con `ANALYZE=1 pnpm build` (genera `dist/stats.json` con `rollup-plugin-visualizer`; gzip por módulo, aproximado):

| Dependencia | ~gzip | Antes | Ahora |
|---|---|---|---|
| react-dom | 99 | arranque | arranque (imprescindible) |
| react-router | 51 | arranque | arranque (imprescindible) |
| dexie | 35 | arranque | arranque (imprescindible) |
| zod | 38 | arranque (vía calculadoras y actualizador de catálogo) | bajo demanda |
| calculadoras + registro | 24 | arranque (vía Inicio) | tras el primer pintado (`requestIdleCallback`) |
| `ics` + `yup` (que `ics` arrastra) | ~30 | arranque (vía Ajustes → respaldo) | solo al exportar `.ics` |
| minisearch | 8 | arranque (vía store del catálogo) | al cargar el catálogo |

Los números por módulo son estimaciones del visualizador; la cifra de arriba es la transferencia real medida con Lighthouse.

**Corrección:** informes anteriores citaban solo el chunk `index`; el arranque incluye también el chunk de React/router/Dexie.

Lighthouse ya no incluye la categoría PWA (se retiró en la v12): la instalabilidad se verifica a mano en Android e iOS (pendiente).

Cuidado al añadir dependencias: importarlas con `import()` si no hacen falta para el primer pintado.
