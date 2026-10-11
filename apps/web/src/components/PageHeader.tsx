import type { ReactNode } from 'react';

/** Encabezado de pantalla: etiqueta (mono) + título + una línea de contexto. Mismo ritmo en todas las pantallas. */
export function PageHeader({ eyebrow, title, children, aside }: { eyebrow?: string; title: string; children?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {children && <p className="text-muted">{children}</p>}
      </div>
      {aside}
    </header>
  );
}

/** Estado vacío amable: ícono en bloque + frase + (opcional) acción. */
export function EmptyState({ icon, children, action }: { icon: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 border-2 border-dashed border-line-soft bg-surface p-5 sm:flex-row sm:items-center">
      <span className="icon-block shrink-0" aria-hidden>{icon}</span>
      <div className="flex flex-col items-start gap-2 text-muted">{children}{action}</div>
    </div>
  );
}
