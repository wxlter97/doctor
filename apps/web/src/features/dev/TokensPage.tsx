const palette = [
  ['faro', 'Faro · acento (≤ 10 %)'], ['tinta', 'Tinta · texto, bordes'], ['papel', 'Papel · fondo claro'],
  ['humo', 'Humo · texto secundario'], ['ceniza', 'Ceniza · bordes suaves'], ['alerta', 'Alerta · error/destructivo'], ['listo', 'Listo · confirmación'],
];
const roles = ['bg', 'surface', 'surface-2', 'fg', 'fg-soft', 'muted', 'border-color', 'border-soft', 'selected-bg', 'selected-fg', 'primary-bg', 'focus'];

export function TokensPage() {
  return (
    <section className="flex flex-col gap-6">
      <h1>Tokens (solo desarrollo)</h1>
      <h2>Paleta de marca</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {palette.map(([c, d]) => (
          <div key={c} className="card p-2">
            <div className="h-10 border-2 border-line" style={{ background: `var(--${c})` }} />
            <p className="lbl mt-1">{c}</p>
            <p className="text-sm text-muted">{d}</p>
          </div>
        ))}
      </div>
      <h2>Roles (cambian con el tema)</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {roles.map((c) => (
          <div key={c} className="card p-2">
            <div className="h-8 border-2 border-line" style={{ background: `var(--${c})` }} />
            <code className="text-xs">--{c}</code>
          </div>
        ))}
      </div>
      <h2>Tipografía</h2>
      <div className="card flex flex-col gap-2">
        <p className="display text-4xl">Aa Bb Cc 0123</p>
        <p>Archivo 400/600/700 para texto e interfaz: un párrafo normal a 16 px, interlineado 1.55.</p>
        <p className="lbl">JetBrains Mono · etiqueta · 12 px</p>
        <p className="text-sm text-muted">Escala ×1.25: 11 · 13 · 16 · 20 · 25 · 31 · 39 · 49 · 61</p>
      </div>
      <h2>Botones y campos</h2>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary">Acción principal</button>
        <button className="btn">Secundaria</button>
        <button className="btn btn-selected">Elegida</button>
        <button className="btn" disabled>Inactivo</button>
        <input className="field max-w-xs" placeholder="Campo de texto" aria-label="Ejemplo" />
        <span className="tag">Etiqueta</span>
      </div>
      <h2>Avisos</h2>
      <div className="flex flex-col gap-3">
        <p className="aviso">ℹ Información: bloque lateral Humo.</p>
        <p className="aviso aviso-warning">⚠ Advertencia: bloque lateral Faro.</p>
        <p className="aviso aviso-danger">✖ Peligro: borde y bloque Alerta.</p>
        <p className="aviso aviso-success">✔ Listo: bloque lateral Listo.</p>
        <p className="err">Error de campo: el rojo marca, el texto va en tinta.</p>
      </div>
    </section>
  );
}
