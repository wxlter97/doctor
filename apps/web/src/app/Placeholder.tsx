export function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      <p className="card text-muted">{body}</p>
    </section>
  );
}
