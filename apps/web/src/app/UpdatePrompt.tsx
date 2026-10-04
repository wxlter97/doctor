import { t } from '../i18n/es-SV';
import { applyUpdate, useSwUpdate } from './sw-register';

export function UpdatePrompt() {
  const needRefresh = useSwUpdate((s) => s.needRefresh);
  if (!needRefresh) return null;
  return (
    <div role="status" className="card fixed right-4 bottom-20 left-4 z-50 flex items-center justify-between gap-3 lg:left-auto lg:bottom-4 lg:w-96">
      <span>{t.update.available}</span>
      <button className="btn btn-primary" onClick={() => void applyUpdate()}>{t.update.action}</button>
    </div>
  );
}
