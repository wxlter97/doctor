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
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
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
