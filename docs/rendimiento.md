# Rendimiento (Lighthouse, 2026-10-03)

Medido con Lighthouse sobre el build de producción (`vite preview`), primera visita (perfil limpio), emulación móvil por defecto (4G lenta simulada). Es una referencia de laboratorio, no un Moto G Power real.

| Métrica | Resultado | Meta del plan |
|---|---|---|
| Performance | 95 | ≥ 90 ✔ |
| Accesibilidad | 100 | ≥ 90 ✔ |
| Mejores prácticas / SEO | 100 / 100 | — |
| LCP | 2.6 s | ≤ 2.5 s ✘ (por 0.1 s, con throttling más duro que 4G) |
| TBT / CLS | 0–10 ms / 0 | — |
| JS inicial (transferido) | ~182 KB | ≤ 200 KB ✔ |

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

## Efecto de aplicar la marca (Fase 0.5)

Las tres tipografías autoalojadas (Archivo 400/700, Archivo Black, JetBrains Mono) suman ~48 KB de fuentes en la primera visita y subieron el LCP de 2.2–2.3 s a 2.6 s (el elemento del LCP es un párrafo en Archivo 400). Se precargan las tres del primer pintado (FCP 2.0 s). Precargar solo una empeoró el FCP; no mejoró el LCP.

Opción descartada por ahora: `font-display: optional`, que recuperaría ~0.3 s pero mostraría Helvetica en la primera visita (después las fuentes quedan en el precaché del service worker). Se priorizó la marca; si se quiere cumplir los 2.5 s en laboratorio, es la palanca.
