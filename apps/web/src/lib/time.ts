// Zona fija America/El_Salvador (UTC−6, sin horario de verano). Los turnos se guardan como ISO con -06:00.
const OFFSET_MS = 6 * 3_600_000;
export const SV_TZ = 'America/El_Salvador';
export const MIN = 60_000;
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

const p2 = (n: number) => String(n).padStart(2, '0');

/** ms epoch → ISO local de El Salvador (`YYYY-MM-DDTHH:mm:00-06:00`). */
export function msToIso(ms: number): string {
  const d = new Date(ms - OFFSET_MS);
  return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}T${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:00-06:00`;
}
export const isoToMs = (iso: string) => Date.parse(iso);
export const localIso = (date: string, time: string) => `${date}T${time}:00-06:00`;
export const datePart = (iso: string) => msToIso(isoToMs(iso)).slice(0, 10);
export const timePart = (iso: string) => msToIso(isoToMs(iso)).slice(11, 16);
export const todayInSv = (now = Date.now()) => msToIso(now).slice(0, 10);

/** Aritmética de fechas `YYYY-MM-DD` sin depender de la zona del dispositivo. */
const dateMs = (date: string) => Date.parse(`${date}T00:00:00Z`);
const fromDateMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (date: string, n: number) => fromDateMs(dateMs(date) + n * DAY);
export const diffDays = (a: string, b: string) => Math.round((dateMs(b) - dateMs(a)) / DAY);
/** 0 = domingo … 6 = sábado */
export const weekday = (date: string) => new Date(dateMs(date)).getUTCDay();
export const startOfMonth = (date: string) => `${date.slice(0, 7)}-01`;
export const addMonths = (date: string, n: number) => {
  const d = new Date(dateMs(startOfMonth(date)));
  d.setUTCMonth(d.getUTCMonth() + n);
  return fromDateMs(d.getTime());
};
export const startOfWeek = (date: string) => addDays(date, -weekday(date));
/** Rango [inicio, fin) en ms de un día local. */
export const dayRangeMs = (date: string): [number, number] => {
  const s = isoToMs(localIso(date, '00:00'));
  return [s, s + DAY];
};

export const monthLabel = (date: string) =>
  new Intl.DateTimeFormat('es-SV', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(dateMs(date)));
export const dayLabel = (date: string) =>
  new Intl.DateTimeFormat('es-SV', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(dateMs(date)));

export function countdown(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / MIN));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}
