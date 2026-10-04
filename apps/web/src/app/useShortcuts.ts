import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { sections } from './nav';

export function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export function useShortcuts(onHelp: () => void) {
  const navigate = useNavigate();
  useEffect(() => {
    const focusSearch = () => {
      void navigate('/');
      // La navegación es asíncrona: reintentar hasta que el campo exista.
      let tries = 0;
      const tick = () => {
        const el = document.getElementById('global-search');
        if (el) el.focus();
        else if (tries++ < 30) setTimeout(tick, 20);
      };
      tick();
    };
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusSearch();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (e.key === '/') {
        e.preventDefault();
        focusSearch();
        return;
      }
      const section = sections.find((s) => s.key === e.key);
      if (section) {
        e.preventDefault();
        void navigate(section.to);
      } else if (e.key === '?') {
        e.preventDefault();
        onHelp();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, onHelp]);
}
