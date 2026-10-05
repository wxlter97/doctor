import { useState } from 'react';
import { setMeta } from '../../db';
import { t } from '../../i18n/es-SV';
import { CatalogDownload } from '../medications/CatalogDownload';
import { avisoLegal } from '../settings/legal/aviso-legal';

export function Onboarding() {
  const [step, setStep] = useState(0);
  const o = t.onboarding;
  const acceptLegal = () => setStep(1);
  const finish = () => setMeta('disclaimerAcceptedAt', new Date().toISOString());

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col justify-center gap-4 p-4">
      <h1 className="display text-2xl">{t.app.name}</h1>
      {step === 0 && (
        <section className="card flex flex-col gap-3">
          <h2 className="text-xl font-bold">{o.legalTitle}</h2>
          <ul className="list-disc space-y-2 pl-5">{avisoLegal.map((p) => <li key={p}>{p}</li>)}</ul>
          <button className="btn btn-primary" onClick={acceptLegal}>{o.legalAccept}</button>
        </section>
      )}
      {step === 1 && (
        <section className="card flex flex-col gap-3">
          <h2 className="text-xl font-bold">{o.installTitle}</h2>
          <p>{o.installAndroid}</p>
          <p>{o.installIos}</p>
          <button className="btn btn-primary" onClick={() => setStep(2)}>{o.next}</button>
        </section>
      )}
      {step === 2 && (
        <section className="card flex flex-col gap-3">
          <h2 className="text-xl font-bold">{o.catalogTitle}</h2>
          <p>{o.catalogBody}</p>
          <CatalogDownload />
          <div className="flex gap-2">
            <button className="btn" onClick={() => void finish()}>{o.skip}</button>
            <button className="btn btn-primary" onClick={() => void finish()}>{o.finish}</button>
          </div>
        </section>
      )}
    </main>
  );
}
