import { create } from 'zustand';
import { db } from '../db';

export type Theme = 'system' | 'light' | 'dark';
export type Density = 'comfortable' | 'compact';
interface Prefs { theme: Theme; density: Density }

const LS_KEY = 'medapoyo.prefs';
const defaults: Prefs = { theme: 'system', density: 'comfortable' };

function readLocal(): Prefs {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') };
  } catch {
    return defaults;
  }
}

export function applyPrefs(p: Prefs, root: HTMLElement = document.documentElement) {
  if (p.theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = p.theme;
  root.dataset.density = p.density;
}

interface PrefsState extends Prefs {
  setTheme: (t: Theme) => void;
  setDensity: (d: Density) => void;
}

export const usePrefs = create<PrefsState>((set, get) => {
  const persist = () => {
    const { theme, density } = get();
    applyPrefs({ theme, density });
    try { localStorage.setItem(LS_KEY, JSON.stringify({ theme, density })); } catch { /* sin almacenamiento */ }
    void db.settings.bulkPut([{ key: 'theme', value: theme }, { key: 'density', value: density }]);
  };
  return {
    ...readLocal(),
    setTheme: (theme) => { set({ theme }); persist(); },
    setDensity: (density) => { set({ density }); persist(); },
  };
});
