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
