/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
// SPA: toda navegación sirve el shell precacheado (funciona sin conexión).
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

// Nunca se activa solo: la app avisa y el usuario decide (PLAN §10).
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});
