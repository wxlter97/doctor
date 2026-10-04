import { useCallback, useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Settings } from 'lucide-react';
import { db } from '../db';
import { t } from '../i18n/es-SV';
import { sections } from './nav';
import { ShortcutsHelp } from './ShortcutsHelp';
import { UpdatePrompt } from './UpdatePrompt';
import { useShortcuts } from './useShortcuts';
import { Onboarding } from '../features/onboarding/Onboarding';

const linkBase = 'flex items-center gap-3 border-line font-bold';

export function Layout() {
  const [help, setHelp] = useState(false);
  const openHelp = useCallback(() => setHelp(true), []);
  useShortcuts(openHelp);

  // undefined = cargando; null = aún no aceptó el aviso legal
  const accepted = useLiveQuery(async () => (await db.meta.get('disclaimerAcceptedAt'))?.value ?? null, []);
  if (accepted === undefined) return null;
  if (accepted === null) return <Onboarding />;

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col gap-2 border-r-2 border-line bg-surface p-4 lg:flex">
        <div className="mb-4 text-xl font-black">{t.app.name}</div>
        <nav aria-label={t.nav.main} className="flex flex-col gap-2">
          {sections.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `${linkBase} min-h-11 border-2 px-3 ${isActive ? 'bg-accent text-accent-fg' : ''}`}>
              <Icon aria-hidden size={20} /> {label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/ajustes" className={({ isActive }) => `${linkBase} mt-auto min-h-11 border-2 px-3 ${isActive ? 'bg-accent text-accent-fg' : ''}`}>
          <Settings aria-hidden size={20} /> {t.nav.settings}
        </NavLink>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b-2 border-line bg-surface px-4 py-2 lg:hidden">
          <span className="text-lg font-black">{t.app.name}</span>
          <NavLink to="/ajustes" aria-label={t.nav.settings} className="btn">
            <Settings aria-hidden size={22} />
          </NavLink>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
        <nav aria-label={t.nav.main} className="grid grid-cols-4 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
          {sections.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-bold ${isActive ? 'bg-accent text-accent-fg' : ''}`}>
              <Icon aria-hidden size={22} /> {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <ShortcutsHelp open={help} onOpenChange={setHelp} />
      <UpdatePrompt />
    </div>
  );
}
