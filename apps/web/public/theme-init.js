// Aplica tema y densidad antes del primer render para evitar parpadeo.
// Es un archivo propio (no un <script> en línea) porque la CSP de producción solo permite script-src 'self'.
try {
  var s = JSON.parse(localStorage.getItem('medapoyo.prefs') || '{}');
  var d = document.documentElement;
  if (s.theme === 'light' || s.theme === 'dark') d.dataset.theme = s.theme;
  if (s.density === 'compact') d.dataset.density = 'compact';
} catch {
  // sin localStorage (modo privado, etc.): se usan los valores por omisión
}
