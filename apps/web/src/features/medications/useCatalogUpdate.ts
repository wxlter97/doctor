import { useCallback, useState } from 'react';
import { updateCatalog, type UpdateStatus } from '../../lib/catalogUpdate';
import { useCatalog } from '../../stores/catalog';

export type UpdateState = { phase: 'idle' } | { phase: 'working'; progress: number } | { phase: 'done'; result: UpdateStatus };

export function useCatalogUpdate() {
  const [state, setState] = useState<UpdateState>({ phase: 'idle' });
  const run = useCallback(async () => {
    setState({ phase: 'working', progress: 0 });
    const result = await updateCatalog({ onProgress: (p) => setState({ phase: 'working', progress: p }) });
    if (result.status === 'updated') await useCatalog.getState().load();
    setState({ phase: 'done', result });
  }, []);
  return { state, run };
}
