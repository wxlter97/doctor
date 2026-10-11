/** Marca MedHelp: la H sobre Tinta (mismo arte que el ícono de la app). */
export function Logo({ size = 32 }: { size?: number }) {
  return <img src="/favicon.svg" alt="" width={size} height={size} className="shrink-0" />;
}
