import { useResponsaveisDisponiveis } from "./api";
import { ROLE_LABEL, type Me } from "@/types/auth";

function nomeUsuario(t: Me): string {
  const nome = `${t.first_name} ${t.last_name}`.trim();
  return nome || t.username;
}

export default function ResponsaveisField({
  value,
  onChange,
}: {
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const disponiveis = useResponsaveisDisponiveis();
  const lista = disponiveis.data?.results ?? [];

  function toggle(id: number) {
    onChange(
      value.includes(id) ? value.filter((x) => x !== id) : [...value, id],
    );
  }

  return (
    <div className="resp-picker">
      {lista.length === 0 ? (
        <p className="muted mono" style={{ margin: 0 }}>
          {disponiveis.isLoading
            ? "carregando…"
            : "nenhum técnico ou coordenador cadastrado"}
        </p>
      ) : (
        lista.map((t) => (
          <label key={t.id} className="resp-opt">
            <input
              type="checkbox"
              checked={value.includes(t.id)}
              onChange={() => toggle(t.id)}
            />
            <span>{nomeUsuario(t)}</span>
            <span className="resp-role mono">{ROLE_LABEL[t.role]}</span>
          </label>
        ))
      )}
    </div>
  );
}
