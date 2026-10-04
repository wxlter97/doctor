const colors = ['bg', 'surface', 'surface-2', 'fg', 'fg-muted', 'border-color', 'accent', 'accent-fg', 'focus',
  'info', 'info-bg', 'warning', 'warning-bg', 'danger', 'danger-bg', 'success', 'success-bg'];

export function TokensPage() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Tokens (solo desarrollo)</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {colors.map((c) => (
          <div key={c} className="card p-2">
            <div className="h-10 border-2 border-line" style={{ background: `var(--${c})` }} />
            <code className="text-xs">--{c}</code>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn">Botón</button>
        <button className="btn btn-primary">Primario</button>
        <input className="field max-w-xs" placeholder="Campo de texto" aria-label="Ejemplo" />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="bg-info-bg p-3 text-info">ℹ Información</div>
        <div className="bg-warning-bg p-3 text-warning">⚠ Advertencia</div>
        <div className="bg-danger-bg p-3 text-danger">✖ Peligro</div>
        <div className="bg-success-bg p-3 text-success">✔ Éxito</div>
      </div>
      <p className="text-sm text-muted">Tamaños: base / sm / lg / xl vía tokens de densidad.</p>
    </section>
  );
}
