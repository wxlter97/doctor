import { z } from 'zod';

export interface ShiftType {
  id: string;
  name: string;
  /** Abreviatura visible en el calendario (el color nunca es la única señal). */
  short: string;
  color: string;
  startTime: string; // HH:mm
  durationH: number;
  countsHours: boolean;
}
export interface Shift { id: string; start: string; end: string; typeId: string }

export const DEFAULT_TYPES: ShiftType[] = [
  { id: 'diurno', name: 'Diurno', short: 'D', color: '#d4a017', startTime: '07:00', durationH: 12, countsHours: true },
  { id: 'nocturno', name: 'Nocturno', short: 'N', color: '#4263eb', startTime: '19:00', durationH: 12, countsHours: true },
  { id: '24h', name: '24 h', short: '24', color: '#d6336c', startTime: '07:00', durationH: 24, countsHours: true },
  { id: 'post-guardia', name: 'Post-guardia', short: 'PG', color: '#868e96', startTime: '00:00', durationH: 24, countsHours: false },
];

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const isoDateTime = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'Fecha y hora inválidas');

export const shiftTypeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(40),
  short: z.string().min(1).max(3),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  startTime: time,
  durationH: z.number().positive().max(48),
  countsHours: z.boolean(),
});
export const shiftSchema = z.object({ id: z.string().min(1), start: isoDateTime, end: isoDateTime, typeId: z.string().min(1) })
  .refine((s) => Date.parse(s.end) > Date.parse(s.start), 'El fin debe ser posterior al inicio');

export const backupSchema = z.object({
  app: z.literal('medapoyo'),
  version: z.literal(1),
  exportedAt: z.string(),
  types: z.array(shiftTypeSchema),
  shifts: z.array(shiftSchema),
});
export type Backup = z.infer<typeof backupSchema>;
