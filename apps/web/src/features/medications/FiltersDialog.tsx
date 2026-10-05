import * as Dialog from '@radix-ui/react-dialog';
import { t } from '../../i18n/es-SV';

export function FiltersDialog({ forms, groups, form, group, onChange, onClose }: {
  forms: string[]; groups: string[]; form?: string; group?: string;
  onChange: (next: { form?: string; group?: string }) => void; onClose: () => void;
}) {
  const m = t.medications;
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--on-overlay)]" />
        <Dialog.Content className="card fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-96">
          <Dialog.Title className="text-xl font-bold">{m.filters}</Dialog.Title>
          <Dialog.Description className="sr-only">{m.filtersDescription}</Dialog.Description>
          <div className="mt-3 flex flex-col gap-4">
            <label className="lbl flex flex-col gap-1">{m.form}
              <select className="field" value={form ?? ''} onChange={(e) => onChange({ form: e.target.value || undefined, group })}>
                <option value="">{m.all}</option>
                {forms.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <label className="lbl flex flex-col gap-1">{m.group}
              <select className="field" value={group ?? ''} onChange={(e) => onChange({ form, group: e.target.value || undefined })}>
                <option value="">{m.all}</option>
                {groups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <div className="flex gap-2">
              <button className="btn" onClick={() => onChange({})}>{m.clear}</button>
              <Dialog.Close className="btn btn-primary">{m.apply}</Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
