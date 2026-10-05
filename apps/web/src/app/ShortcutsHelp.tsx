import * as Dialog from '@radix-ui/react-dialog';
import { t } from '../i18n/es-SV';

const rows: [string, string][] = [
  ['?', t.shortcuts.help],
  ['1 – 4', t.shortcuts.goto],
  ['Ctrl/⌘ + K  ·  /', t.shortcuts.search],
  ['Esc', t.shortcuts.close],
];

export function ShortcutsHelp({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[var(--on-overlay)]" />
        <Dialog.Content className="card fixed top-1/2 left-1/2 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2">
          <Dialog.Title className="mb-3 text-xl font-bold">{t.shortcuts.title}</Dialog.Title>
          <Dialog.Description className="mb-3 text-sm text-muted">{t.shortcuts.typing}</Dialog.Description>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            {rows.map(([k, d]) => (
              <div key={k} className="contents">
                <dt><kbd className="border-2 border-line px-2 font-mono">{k}</kbd></dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
          <Dialog.Close className="btn mt-4">{t.shortcuts.closeBtn}</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
