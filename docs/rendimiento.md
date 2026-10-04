# Rendimiento (Lighthouse, 2026-10-03)

Medido con Lighthouse sobre el build de producción (`vite preview`), primera visita (perfil limpio), emulación móvil por defecto (4G lenta simulada). Es una referencia de laboratorio, no un Moto G Power real.

| Métrica | Resultado | Meta del plan |
|---|---|---|
| Performance | 94–95 | ≥ 90 ✔ |
| Accesibilidad | 100 | ≥ 90 ✔ |
| Mejores prácticas / SEO | 100 / 100 | — |
| LCP | 2.5–2.6 s | ≤ 2.5 s en 4G ✘ (al límite, con throttling más duro que 4G) |
| TBT / CLS | 0–30 ms / 0 | — |
| JS inicial (transferido) | ~224 KB | ≤ 200 KB gzip ✘ |

**Corrección:** informes anteriores citaban solo el chunk `index` (132 KB gzip). El arranque carga también el chunk de React/router/Dexie (~70 KB), por lo que el total real ronda 200–224 KB.

Lighthouse ya no incluye la categoría PWA (se retiró en la v12): la instalabilidad se verifica a mano en Android e iOS (pendiente).

Intentos sin efecto: hacer perezosa la pantalla de Inicio (empeoró el reparto de chunks) y diferir `zod` (ya no estaba en el arranque). Siguiente paso razonable: analizar el bundle con un visualizador para ver qué pesa en `index` y en el chunk compartido.
