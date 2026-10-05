import { Info, OctagonAlert, TriangleAlert } from 'lucide-react';
import type { Severity } from '@medapoyo/calculators';

// Aviso de la marca: bloque lateral de 10 px del color del significado; el texto va siempre en tinta.
const kind: Record<Severity, string> = { info: 'aviso', warning: 'aviso aviso-warning', danger: 'aviso aviso-danger' };
const icons = { info: Info, warning: TriangleAlert, danger: OctagonAlert };

/** El color nunca es la única señal: siempre va con ícono y texto. */
export function SeverityBadge({ severity, label }: { severity: Severity; label: string }) {
  const Icon = icons[severity];
  return (
    <p className={`${kind[severity]} flex items-start gap-2 !py-1.5 text-sm font-bold lg:!py-2 lg:text-base`}>
      <Icon aria-hidden size={20} className="mt-0.5 shrink-0" /> <span>{label}</span>
    </p>
  );
}
