import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { t } from '../../i18n/es-SV';
import { countdown, dayLabel, datePart, isoToMs, timePart } from '../../lib/time';
import { nextShift } from './logic';
import { ensureDefaultTypes, useShiftTypes, useShifts } from './store';

export function NextShiftCard() {
  const s = t.shifts;
  const types = useShiftTypes();
  const shifts = useShifts();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { void ensureDefaultTypes(); const id = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(id); }, []);
  if (!types || !shifts) return null;
  const next = nextShift(shifts, types, now);

  return (
    <section className="card flex flex-col gap-2" aria-label={s.next_}>
      <h2 className="font-bold">{s.next_}</h2>
      {next ? (
        <>
          <p className="flex items-center gap-2 text-lg font-bold">
            <span aria-hidden className="inline-block size-4 border-2 border-line" style={{ background: next.type?.color }} />
            {next.type?.name} · <span className="inline-block first-letter:uppercase">{dayLabel(datePart(next.shift.start))}</span>
          </p>
          <p>{timePart(next.shift.start)}–{timePart(next.shift.end)}</p>
          <p className="display text-xl">
            {next.inProgress ? s.inShift(timePart(next.shift.end)) : s.inCountdown(countdown(isoToMs(next.shift.start) - now))}
          </p>
        </>
      ) : (
        <>
          <p>{s.noUpcoming}</p>
          <Link to="/turnos" className="btn btn-primary self-start">{s.addShiftBtn}</Link>
        </>
      )}
    </section>
  );
}
