import { registerSW } from 'virtual:pwa-register';
import { create } from 'zustand';

// Se registra al arrancar (no tras el onboarding) para que la primera visita ya quede disponible offline.
export const useSwUpdate = create<{ needRefresh: boolean }>(() => ({ needRefresh: false }));

const updateSW = registerSW({ onNeedRefresh: () => useSwUpdate.setState({ needRefresh: true }) });
export const applyUpdate = () => updateSW(true);
