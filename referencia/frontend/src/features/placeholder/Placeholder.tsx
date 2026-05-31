export default function Placeholder({
  kicker,
  title,
  sprint,
}: {
  kicker: string;
  title: string;
  sprint: string;
}) {
  return (
    <div className="scene-pad">
      <div className="rkicker mono">{kicker}</div>
      <h1>{title}</h1>
      <p className="lede">
        Esta tela entra no <strong>{sprint}</strong>. A infraestrutura (auth,
        API, permissões, modo offline) já está pronta para suportá-la.
      </p>
    </div>
  );
}
