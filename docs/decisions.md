# Decisiones (ADR corto)

## 001 — Tailwind v4 con tokens en CSS
Tailwind v4 (`@tailwindcss/vite`), sin `tailwind.config`. Los tokens viven en `styles/tokens.css` y se mapean con `@theme inline` en `index.css`. Cambiar la marca = editar `tokens.css`.

## 002 — Radix directo, sin CLI de shadcn
Se usan primitivos de Radix (Dialog, Collapsible) re-estilizados con tokens; el CLI de shadcn trae el look por defecto que el plan prohíbe.

## 003 — Preferencias: localStorage + Dexie
Tema y densidad se escriben en Dexie (`settings`, fuente de verdad) y se espejan en `localStorage` solo para aplicarlos antes del primer render (sin parpadeo).

## 004 — Paso de catálogo en el primer uso
No hay catálogo publicado en la Fase 0; el paso 3 del primer uso es informativo y se puede saltar. Se conectará en la Fase 2.

## 005 — E2E offline diferido
El test Playwright en modo offline (§10) se añade al cerrar la Fase 0 con el usuario; no está en CI todavía.

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
