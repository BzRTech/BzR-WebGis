import { useNavigate, useParams } from "react-router-dom";
import { useImovel } from "@/features/mapa/api";

export default function FichaScene() {
  const { id } = useParams();
  const navigate = useNavigate();
  const imovelId = id ? Number(id) : null;
  const { data, isLoading, isError } = useImovel(imovelId);

  if (isLoading) {
    return (
      <div className="scene-pad">
        <p className="muted mono">carregando ficha…</p>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="scene-pad">
        <div className="form-error">Imóvel não encontrado.</div>
      </div>
    );
  }

  const bci = data.ultimo_bci;

  return (
    <div className="scene-pad">
      <button
        className="back-link"
        onClick={() => navigate(-1)}
        type="button"
      >
        ← Voltar
      </button>
      <div className="rkicker mono">FICHA DO IMÓVEL</div>
      <h1>{data.inscricao_cadastral}</h1>

      <span
        className={`status-pill ${
          data.status_atual === "aprovado"
            ? "ok"
            : data.status_atual === "rejeitado"
              ? "err"
              : data.status_atual === "sem_coleta"
                ? ""
                : "warn"
        }`}
      >
        {bci ? `BCI #${bci.id} · ${bci.status}` : "Sem BCI"}
      </span>

      <dl className="kv ficha-grid" style={{ marginTop: 16 }}>
        <div>
          <dt>Inscrição cadastral</dt>
          <dd className="mono">{data.inscricao_cadastral}</dd>
        </div>
        <div>
          <dt>Número</dt>
          <dd>{data.numero || "—"}</dd>
        </div>
        <div>
          <dt>Complemento</dt>
          <dd>{data.complemento || "—"}</dd>
        </div>
        <div>
          <dt>Uso</dt>
          <dd>{data.uso || "—"}</dd>
        </div>
        <div>
          <dt>Área do terreno</dt>
          <dd className="num mono">{data.area_terreno_m2 ?? "—"} m²</dd>
        </div>
        <div>
          <dt>Área construída</dt>
          <dd className="num mono">{data.area_construida_m2 ?? "—"} m²</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{data.status_atual}</dd>
        </div>
      </dl>

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        {bci ? (
          <button className="btn-primary" onClick={() => navigate("/bci")}>
            Ver BCIs
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={() => navigate(`/bci/novo?imovel=${data.id}`)}
          >
            Preencher BCI deste lote
          </button>
        )}
        <button className="btn-ghost" onClick={() => navigate("/")}>
          Ver no mapa
        </button>
      </div>
    </div>
  );
}
