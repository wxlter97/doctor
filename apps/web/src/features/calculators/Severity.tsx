import { Info, OctagonAlert, TriangleAlert } from 'lucide-react';
import type { Severity } from '@medapoyo/calculators';

const styles: Record<Severity, string> = {
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
};
const icons = { info: Info, warning: TriangleAlert, danger: OctagonAlert };

/** El color nunca es la única señal: siempre va con ícono y texto. */
export function SeverityBadge({ severity, label }: { severity: Severity; label: string }) {
  const Icon = icons[severity];
  return (
    <p className={`flex items-start gap-2 border-2 border-current px-3 py-1.5 text-sm font-bold lg:py-2 lg:text-base ${styles[severity]}`}>
      <Icon aria-hidden size={20} className="mt-0.5 shrink-0" /> <span>{label}</span>
    </p>
  );
}
