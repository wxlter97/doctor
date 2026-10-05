# Decisiones (ADR corto)

## 001 — Tailwind v4 con tokens en CSS
Tailwind v4 (`@tailwindcss/vite`), sin `tailwind.config`. Los tokens viven en `styles/tokens.css` y se mapean con `@theme inline` en `index.css`. Cambiar la marca = editar `tokens.css`.

## 002 — Radix directo, sin CLI de shadcn
Se usan primitivos de Radix (Dialog, Collapsible) re-estilizados con tokens; el CLI de shadcn trae el look por defecto que el plan prohíbe.

## 003 — Preferencias: localStorage + Dexie
Tema y densidad se escriben en Dexie (`settings`, fuente de verdad) y se espejan en `localStorage` solo para aplicarlos antes del primer render (sin parpadeo).

## 004 — Paso de catálogo en el primer uso
No hay catálogo publicado en la Fase 0; el paso 3 del primer uso es informativo y se puede saltar. Se conectará en la Fase 2.

## 005 — E2E offline (resuelto)
`apps/web/e2e/offline.spec.ts` cubre §10: primera visita con descarga del catálogo, recarga con el service worker activo, modo offline (con un control de que `fetch` falla) y uso de calculadoras, medicamentos y turnos. Local: `PW_CHANNEL=chrome pnpm e2e` (usa el Chrome instalado). En CI se instala Chromium. Corre contra el build de producción porque el service worker no existe en dev.

## 006 — Dev server de la PWA
`vite-plugin-pwa` con `devOptions.enabled = false`; el service worker solo se prueba con `build` + `preview`.

## 007 — Fechas de turnos sin date-fns
Como la zona es fija (UTC−6, sin DST), `lib/time.ts` resuelve todo con aritmética de `YYYY-MM-DD` y `Intl` (`es-SV`), sin `date-fns` ni `@date-fns/tz`. Los turnos se guardan como ISO con `-06:00` y se normalizan al importar.

## 008 — Post-guardia no participa en solapes ni descansos
Los tipos con `countsHours = false` (post-guardia) son marcadores de día libre: no bloquean, no generan avisos de descanso y no suman horas.

## 009 — Guardias nocturnas
Cuenta como guardia nocturna o de 24 h todo turno que cruza la medianoche local o dura ≥ 24 h, atribuido al período donde empieza.

## 010 — Alarmas del .ics
La librería `ics` emite `TRIGGER:-PT60M` (duración válida de RFC 5545). Pendiente: confirmar importación con alarmas en Google Calendar y Apple Calendar (criterio de la Fase 3).

## 011 — Catálogo de prueba (FIXTURE)
`data/fixtures/catalog.dev.json` tiene ~34 medicamentos reales por nombre pero con **instituciones, códigos y niveles inventados**; lleva `source: "FIXTURE"` y la UI muestra un aviso. `apps/web/public/catalog/` contiene hoy ese snapshot (v1) y debe reemplazarse por el real antes de publicar La CI lo valida y las previews lo aceptan, pero el build de **producción en Vercel falla** si el catálogo es `FIXTURE` (`validate:catalog --forbid-fixture` en `vercel.json`, solo con `VERCEL_ENV=production`).

## 012 — Actualización atómica del catálogo
El cliente valida hash SHA-256 y esquema zod *antes* de tocar IndexedDB y escribe en una sola transacción; cualquier fallo conserva la versión local. El manifiesto se sirve con `no-cache`.

## 013 — Python estándar en el pipeline
`normalize`/`match` usan solo la biblioteca estándar para poder probarse sin instalar pdfplumber/pandas (dependencias opcionales `extract`).

## 014 — Medición de peso del JS
El presupuesto de 200 KB gzip (§10) se mide sobre **todos** los scripts del arranque, no solo el chunk `index`. Ver `docs/rendimiento.md`.

## 015 — Dependencias pesadas bajo demanda
`zod`, el registro de calculadoras, `ics` y `minisearch` se cargan con `import()` (al actualizar, tras el primer pintado, al exportar y al cargar el catálogo). Lo que importa es no meterlas en el camino crítico del arranque; ver `docs/rendimiento.md`.

## 016 — E2E móvil
`e2e/mobile.spec.ts` (viewport 390×844, táctil) comprueba en 11 pantallas que no haya desborde horizontal ni objetivos interactivos < 44 px, que el resultado de la calculadora quede fijo sobre la barra inferior y que la barra navegue entre secciones. `SHOTS_DIR=<carpeta> pnpm e2e mobile` guarda capturas para revisión visual (lo que los asserts no ven: p. ej. la barra de resultado ocupaba ~40 % de la pantalla y se compactó).

## 017 — Accesibilidad automatizada
`e2e/a11y.spec.ts` corre axe-core (WCAG 2.0/2.1 A y AA) en 10 pantallas × {claro, oscuro} × {cómoda, compacta}, y prueba por separado que tema y densidad cambian sin recargar y que todo es operable con teclado (atajos, foco visible, flechas en el calendario, Esc en hojas). Detectó que el calendario usaba `role="grid"` sin `role="row"` (corregido). No cubre diálogos abiertos ni lo que axe no puede juzgar (orden de lectura, textos alternativos con sentido, lectores de pantalla reales).

## 018 — E2E de actualización del service worker
`e2e/sw-update.spec.ts` construye dos versiones (`VITE_APP_VERSION` 1.0.0 y 2.0.0), las sirve desde un servidor estático cuya carpeta cambia en caliente (`e2e/helpers/staticServer.ts`) y verifica: aparece "Nueva versión disponible" sin recargar ni perder lo escrito, el aviso persiste al navegar, la app sigue en 1.0.0 hasta que el usuario toca "Actualizar", y luego recarga en 2.0.0. Control negativo comprobado: si el SW llama `skipWaiting()` en `install`, el test falla. Tarda ~10 s porque compila dos veces.

## 019 — E2E en Chromium, Firefox y WebKit
`playwright.config.ts` define tres proyectos. La prueba móvil (`isMobile`) corre en Chromium y WebKit (Firefox no la soporta). El offline se prueba apagando un servidor propio sobre `dist/`, no con `context.setOffline`, que en WebKit falla al recargar páginas servidas por el service worker. Resultado: 30/30 en los tres motores (WebKit de Playwright, no Safari real en iOS).

## 020 — Aplicación de la marca wxlter (Fase 0.5)
Tokens en `styles/tokens.css` con la paleta del Manual de Marca v1.0 (Faro, Tinta, Papel, Humo, Ceniza; Alerta y Listo solo como semánticos), bordes de 2 px, radio 0, sin sombras, titulares en Archivo Black (tracking −0.02 a −0.04 em, interlineado ≤ 1.05, un solo peso), texto en Archivo, etiquetas y datos en JetBrains Mono (mayúsculas, tracking 0.12 em). Botón principal Faro con texto Tinta que se invierte al pasar el cursor; opción/pestaña activa Tinta + Faro. Íconos con la regla del §05 (`pnpm icons`).

Desviaciones deliberadas (cada una por una razón comprobable):
1. **Foco**: contorno de 3 px en Tinta (y Faro en oscuro), no Faro. Faro sobre Papel no llega a 3:1 (WCAG 1.4.11) y el plan exige AA.
2. **Campos a 16 px** (la marca pide 14 px): por debajo de 16 px, iOS Safari hace zoom al enfocar.
3. **Avisos clínicos** (información/advertencia/peligro): la marca solo define Alerta y Listo, así que se usa su componente "aviso" (bloque lateral de 10 px): Humo = información, Faro = advertencia, Alerta = peligro. El texto va siempre en Tinta y con ícono, porque Alerta (#D92B0C) da 4.4:1 sobre Papel y ~3.9:1 sobre Tinta, insuficiente como color de texto. Los mensajes de error usan `.err` (barra Alerta + texto en tinta).
4. **Tema oscuro**: la marca define Tinta como fondo y #EDEDE7 / #8A8A80 como texto sobre oscuro, pero no superficies. Se derivan #1B1B19 y #262624 (cards y filas) y #9A9A90 (texto secundario, para llegar a 4.5:1 sobre ambas). En oscuro la selección va en Papel (#EDEDE7) con texto Tinta y Faro queda para el botón principal y el foco: con Faro como selección, varias opciones marcadas pasaban del 10 % de la pantalla.
5. **Fuentes autoalojadas** (`@fontsource`, subconjunto latino) y no Google Fonts: funcionan sin conexión, entran en el precaché y no filtran la IP a terceros (CSP `default-src 'self'`).
6. **Voz**: la interfaz mantiene el voseo salvadoreño del plan (el design system escribe en «tú») y **no** aplica el remate humorístico: es una herramienta clínica y el tono bromista no corresponde. Sí aplica «preciso primero, frases cortas, nombres exactos».
7. **Regla del 10 %**: Faro aparece en el botón principal, el foco en oscuro, el borde lateral de las advertencias y el bloque «Hecho por wxlter.» (fondo completo de bloque de marca, permitido).

Decidido por Walter (2026-10-04): la app se llama **MedHelp**, su ícono usa la **H** y **sin banda** (altura 0; la banda de 20/40/68/88 es de la serie de apps y esta no la usa). El nombre comercial queda resuelto (§14.5). Los identificadores internos conservan el codename `medapoyo` (paquetes `@medapoyo/*`, base IndexedDB `medapoyo`, claves de localStorage, formato del respaldo JSON, UID del `.ics`): renombrarlos no aporta nada al usuario y cambiar el nombre de la base borraría los datos locales de quien ya use la app.
