import { Calculator, Calendar, Home, Pill, type LucideIcon } from 'lucide-react';
import { t } from '../i18n/es-SV';

export const sections: { to: string; label: string; icon: LucideIcon; key: string; end?: boolean }[] = [
  { to: '/', label: t.nav.home, icon: Home, key: '1', end: true },
  { to: '/medicamentos', label: t.nav.medications, icon: Pill, key: '2' },
  { to: '/calculadoras', label: t.nav.calculators, icon: Calculator, key: '3' },
  { to: '/turnos', label: t.nav.shifts, icon: Calendar, key: '4' },
];
