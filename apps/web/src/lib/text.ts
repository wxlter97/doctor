/** Minúsculas y sin tildes, para búsquedas tolerantes. */
export const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
