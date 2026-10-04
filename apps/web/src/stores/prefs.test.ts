import { beforeEach, describe, expect, it } from 'vitest';
import { applyPrefs, usePrefs } from './prefs';

describe('prefs', () => {
  beforeEach(() => { document.documentElement.removeAttribute('data-theme'); });

  it('aplica tema y densidad sin recargar', () => {
    usePrefs.getState().setTheme('dark');
    usePrefs.getState().setDensity('compact');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.density).toBe('compact');
  });

  it('tema "system" quita el atributo', () => {
    applyPrefs({ theme: 'system', density: 'comfortable' });
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
