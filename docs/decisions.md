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

## 021 — Robustez de los e2e y Vitest
- Vitest solo corre `src/**/*.test.*`; los specs de Playwright (`e2e/`) los corre `pnpm e2e`. Antes Vitest los recogía y fallaba al importarlos (la CI de `pnpm test` habría fallado).
- Los e2e esperan estados explícitos (título visible, fuentes cargadas) en vez de `networkidle`, que con un service worker no es fiable. Tiempo límite de 120 s y 2 trabajadores.
- Con el equipo muy cargado (carga > 6; hubo ejecuciones 10× más lentas), alguna prueba puede pasarse de tiempo aunque pase sola en segundos. En ejecución limpia: 30/30 en Chromium, Firefox y WebKit. No se encontró una causa en la app: no se reprodujo el cuelgue al bajar la carga y las peticiones terminaban con normalidad.

## 022 — Listado vigente de MINSAL y condiciones de uso
El MINSAL ya no usa el LIME (2016): lo reemplazó el **LOM/MINSAL** (Acuerdo 800 de 2025; vigente el Acuerdo 1201 de 14/05/2026). La institución `minsal` pasa a llamarse `LOM/MINSAL` en migración y fixture. Sus tablas traen código SINAB (→ `institutional_code`), código ATC, prioridad (Vital / Esencial / No esencial), nivel de uso 1A–3 (→ `care_level`) y regulación de prescripción (→ `notes`); eso cubre el «nivel de atención» del plan mejor que el LIME. La licencia del documento exige citar la fuente y **prohíbe el uso comercial**: MedHelp debe seguir siendo gratuita y sin anuncios (ver `data/sources/fuentes.md`). El listado de la Superintendencia (LOM nacional) no se ingiere como institución: no es un listado institucional.

## 023 — Catálogo parcial de MINSAL publicado (v2)
`apps/web/public/catalog/` ya no contiene el fixture: tiene el LOM/MINSAL 2026 extraído del PDF (792 fichas, `source: "PARCIAL"`). El esquema ganó `notes` por institución (regulación de prescripción). La app muestra un aviso «Catálogo parcial… no se ha verificado a mano… faltan ISSS y FOSALUD» y la atribución a MINSAL en cada ficha. Decisiones del extractor: (1) nada se descarta ni se inventa: lo que no se puede separar con seguridad se publica con la descripción oficial completa en `presentation` y va a `data/review/minsal_revision.csv` (~9 % de las filas: vacunas, kits, mezclas); (2) varias presentaciones o códigos de la misma publicación (nombre + forma + concentración) se fusionan en una ficha con códigos separados por coma; (3) el grupo terapéutico es el oficial del listado («GRUPO NN …»), derivado del prefijo del SINAB, y no el ATC; (4) la coma de «1,000 mg» o «50,000 UI» es separador de miles y no se normaliza; (5) los ids son `minsal-<SINAB>` y, si el PDF repite un código, se añade sufijo. El guardia de producción solo bloquea `FIXTURE`; **un catálogo `PARCIAL` sí se puede desplegar**, con su aviso visible: decidir si se quiere bloquear hasta verificar la muestra de 50.

## 024 — ISSS en el catálogo (v3) y regla de cruce
Se añade el LOM/ISSS 19.ª edición (836 códigos). Columnas del PDF: código ISSS, DCI, concentración, forma, presentación, **N** (nivel de prescripción: G, GR, E, ER, HG, HE, HGR, HER, R, HR), **P** (1 vital / 2 esencial / 3 no esencial), C (cantidad a dispensar: no se publica) y **clave de despacho** (1A…3A; qué tipo de centro puede despachar). La ficha muestra `Despacho 2 C · Esencial · Prescripción: Especialista (restringido)`, y las filas «Regulación / Criterio de uso / Especialidad» van como notas. **Regla de cruce** (`combine.py`): dos filas son el mismo medicamento solo si coinciden ingredientes (sin tildes, palabras ordenadas, sin sales entre paréntesis), concentración normalizada y vía, con estados físicos compatibles (sólido/líquido/semisólido; «sólido o líquido» es comodín). Nunca se fusiona por parecido: lo parecido va a `data/review/cruce_posibles.csv`. Resultado: 298 fichas con ambas instituciones, 521 solo ISSS (puede haber duplicados aparentes, p. ej. «Mebendazole» vs «Mebendazol»), 1313 en total. La forma de la ficha fusionada es la de MINSAL (categoría amplia); la del ISSS queda en su presentación. Sigue `PARCIAL` (falta FOSALUD y nadie ha verificado a mano).

## 025 — FOSALUD por OCR: solo se publica lo que se puede comprobar
El LIM-FOSALUD (2.ª edición, **2019**) es un escaneo. Se lee con tesseract celda por celda sobre la rejilla de la tabla (líneas horizontales → filas, verticales → columnas), lo que evita mezclar columnas; 101 filas en las págs. 22–38. FOSALUD usa **códigos SINAB, los mismos del LOM/MINSAL**, así que el código es la prueba principal de identidad. Reglas: (1) una fila se asocia a una ficha solo si el código coincide **y** el nombre se parece (≥ 0.55) **y** la concentración coincide por números (`strength_ok`; tolera UI/Ul, mcg/meg); (2) un dígito mal leído se corrige solo si hay un único código MINSAL a distancia 1 con nombre casi idéntico (≥ 0.8) y la misma concentración (4 casos, todos anotados en `data/review/fosalud_revision.csv`); (3) **lo que no tiene pareja segura no se publica** (23 filas: el OCR deja errores en los nombres y no se quiere mostrar «Neomicna» o «Llableta»); queda en el CSV para transcribirlo a mano; (4) de FOSALUD solo se publica el código, el nivel de uso y la regulación, esta última con el prefijo «Texto leído por OCR del escaneo, sin verificar»; no se publica su «presentación»; (5) del nivel de uso solo se aceptan `G` y `GR` (la leyenda de la edición solo define esos, más ODON y CPTA): las «E» que lee el OCR casi seguro son «G» mal leídas y se omiten. Resultado: 78 fichas con FOSALUD (55 con las tres instituciones). Dos hallazgos reales al cruzar: las dextrosas 5 % y 50 % (códigos 02800045/02800055) aparecen invertidas entre FOSALUD y MINSAL, y por eso no se asocian. También se dejó de publicar la nota al pie `*(n)` de MINSAL: el PDF no trae su leyenda y mostrarla sola confundía. Catálogo v5: 1313 fichas, `PARCIAL`.

## 026 — Página de fuentes y avisos legales
Nueva ruta `/fuentes` (estática, funciona sin catálogo ni conexión): por cada listado, institución, edición, fecha, condiciones de uso, cómo se procesó, advertencias de calidad y enlace al documento original; además calculadoras (sin revisión médica formal), lo que aún no se incluye y por qué la app es gratuita y sin anuncios (condición de las licencias de MINSAL y FOSALUD). Enlazada desde Ajustes, el aviso de catálogo parcial y cada ficha. El aviso legal (onboarding y Ajustes) suma tres puntos: no es publicación oficial ni cuenta con respaldo de las instituciones; los datos se extrajeron por software y no se han verificado a mano; las calculadoras no tienen revisión médica formal. **Estos dos últimos avisos deben quitarse o cambiarse cuando se cumpla lo que dicen** (muestras de 50 verificadas / revisión médica firmada). Un test comprueba que cada institución del catálogo tenga su fuente, fecha y enlace en `sources.ts`. El onboarding ahora se desplaza si el texto no cabe (antes se cortaba el título en pantallas bajas).

## 027 — Supabase como fuente editorial, publicación a Storage
Decisión de Walter: mantener Supabase para poder cargar y corregir datos sin tocar código ni redesplegar. La app sigue leyendo **un archivo** (offline-first, sin consultas en vivo): `pnpm publish:catalog` lee las tablas con la clave pública, valida el esquema, sube `catalog-vN.json` (inmutable) y `manifest.json` (cache corto) al bucket público `catalog` y verifica lo que ve el público. La app prueba primero `VITE_CATALOG_BASE_URL` y, si no responde, la copia incluida en el build. La `url` del manifiesto en el bucket es relativa al manifiesto. Los ids de medicamento son **texto estable** (`minsal-00202005`): se usan en URL y favoritos, así que no pueden cambiar entre publicaciones; por eso la migración `20261008…` reemplaza el uuid. La versión 5 queda registrada como la copia inicial de la app para que lo publicado sea > 5. `load.py` (cargador viejo) se eliminó: `scripts/load-supabase.ts` carga el catálogo ya armado por el pipeline. `service_role` solo en `.env.local` del mantenedor; la CSP de Vercel permite `connect-src` al proyecto de Supabase.

## 028 — Hoja de verificación, transcripción de FOSALUD y decisiones de cruce
(1) `python -m medapoyo_pipeline.review_sheet` genera `data/review/verificacion.html`, una hoja autocontenida (se abre sin servidor) con 130 fichas (50 MINSAL, 50 ISSS, 30 FOSALUD) junto a la **imagen recortada de su fila en el PDF original**: se marca Correcto/Error/Dudo, el avance queda en el navegador y se exporta a CSV. Es el criterio de aceptación de la Fase 2. No se versiona (se regenera; la muestra es reproducible). (2) Las 23 filas de FOSALUD que el OCR no leía con seguridad se transcribieron **mirando el escaneo** (`data/curated/fosalud_transcripcion.json`); la transcripción fue hecha por Claude y **no está verificada por una persona**, y la ficha lo dice («Texto transcrito del escaneo, sin verificar»). Aun así corrigió tres códigos que el OCR leía mal (p. ej. Clotrimazol 03200030, que el OCR leía como 03200031, el código de otro medicamento). Las transcritas que no tienen pareja en MINSAL/ISSS se publican como fichas propias de FOSALUD; las leídas solo por OCR siguen sin publicarse si no tienen pareja segura. (3) `data/curated/cruce_decisiones.csv` guarda decisiones humanas sobre posibles duplicados (`merge` fuerza la unión, `separate` documenta que no se unen); manda sobre la regla automática y esas filas salen de la lista de pendientes. 20 fichas del ISSS se unieron a su par de MINSAL (diferencias de ortografía como Mebendazole/Mebendazol, o formas escritas distinto). `cruce_posibles.csv` queda solo con lo accionable; el resto (misma molécula, otra concentración o vía: productos distintos a propósito) va a `cruce_misma_molecula.csv`, informativo. Para publicar estos cambios hay que cargar con `pnpm load:supabase … --prune`, porque las fichas del ISSS que se unieron dejan de existir como fichas propias.

## 029 — Verificación cruzada contra el LOM nacional
`python -m medapoyo_pipeline.crosscheck_national` compara el catálogo con el LOM nacional de la Superintendencia (285 filas con ATC completo) y escribe `data/review/cruce_nacional.csv`. Es una **segunda opinión independiente**, no una verificación: solo indica dónde mirar. Resultado: 247 coinciden en ATC, nombre y concentración; 11 difieren en concentración, 3 en nombre, 22 son fichas que existen pero sin ese ATC y 2 son posibles faltantes. Las diferencias de concentración que revisé contra el PDF de MINSAL (Ciclofosfamida, Ácido tranexámico, Amlodipino) **coinciden con el PDF de MINSAL**: el extractor es fiel y los dos documentos oficiales simplemente discrepan (p. ej. el nacional trae amlodipino de 10 mg y MINSAL de 5 mg). No encontró errores de extracción. También se corrigió el cargador a Supabase: PostgREST limita a 1000 filas por petición, así que la detección de filas obsoletas ahora pagina; antes `--prune` podía dejar fichas huérfanas.

