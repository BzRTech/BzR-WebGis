import { useNavigate, useParams } from "react-router-dom";
import { useBCI, useBCIFormSchema, useWorkflow } from "./api";
import { useAuthStore } from "@/stores/authStore";
import {
  BCI_STATUS_LABEL,
  BCI_STATUS_TONE,
  type BCIStatus,
} from "@/types/bci";
import type { CampoBCI, DadosBCI } from "@/types/bciForm";

function formatValor(campo: CampoBCI, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (campo.tipo === "booleano") return value === true ? "Sim" : "Não";
  if (campo.tipo === "data" && typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
  }
  return String(value);
}

export default function BCIDetailScene() {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ? Number(params.id) : null;
  const bciQ = useBCI(id);
  const schema = useBCIFormSchema();
  const workflow = useWorkflow();
  const role = useAuthStore((s) => s.user?.role);
  const canApprove = role === "admin" || role === "coordenador";

  if (bciQ.isLoading || schema.isLoading) {
    return (
      <div className="scene-pad">
        <div className="rkicker mono">COLETA · BCI</div>
        <p className="muted mono">carregando…</p>
      </div>
    );
  }
  if (bciQ.isError || !bciQ.data) {
    return (
      <div className="scene-pad">
        <div className="rkicker mono">COLETA · BCI</div>
        <h1>BCI não encontrado</h1>
        <button className="btn-ghost" onClick={() => navigate("/bci")}>
          ← Voltar à lista
        </button>
      </div>
    );
  }

  const bci = bciQ.data;
  const dados = (bci.dados ?? {}) as DadosBCI;
  const tone = BCI_STATUS_TONE[bci.status as BCIStatus];
  const fotosGerais = bci.fotos.filter((f) => f.tipo !== "croqui");
  const croquis = bci.fotos.filter((f) => f.tipo === "croqui");

  async function act(action: "enviar" | "aprovar" | "rejeitar") {
    if (id == null) return;
    let motivo: string | undefined;
    if (action === "rejeitar") {
      motivo = window.prompt("Motivo da rejeição:") ?? undefined;
      if (!motivo) return;
    }
    await workflow.mutateAsync({ id, action, motivo });
    navigate("/bci");
  }

  async function corrigir() {
    if (id == null) return;
    await workflow.mutateAsync({ id, action: "reabrir" });
    navigate(`/bci/${id}/editar`);
  }

  return (
    <div className="scene-pad">
      <div className="rkicker mono">COLETA · BCI #{bci.id}</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>{bci.imovel_inscricao}</h1>
        <span className={`status-pill ${tone}`}>
          {BCI_STATUS_LABEL[bci.status as BCIStatus]}
        </span>
      </div>
      <p className="lede" style={{ marginTop: 8 }}>
        Técnico: {bci.tecnico_nome || "—"} ·{" "}
        {new Date(bci.created_at).toLocaleString("pt-BR")}
      </p>

      {bci.status === "rejeitado" && bci.motivo_rejeicao && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          Motivo da rejeição: {bci.motivo_rejeicao}
        </div>
      )}

      <div
        className="admin-bar"
        style={{ marginBottom: 16, gap: 10, flexWrap: "wrap" }}
      >
        <button className="btn-ghost" onClick={() => navigate("/bci")}>
          ← Voltar
        </button>
        {bci.status === "rascunho" && (
          <>
            <button
              className="btn-ghost"
              onClick={() => navigate(`/bci/${bci.id}/editar`)}
            >
              Editar
            </button>
            <button
              className="btn-primary"
              onClick={() => void act("enviar")}
              disabled={workflow.isPending}
            >
              Enviar para aprovação
            </button>
          </>
        )}
        {bci.status === "enviado" && canApprove && (
          <>
            <button
              className="btn-primary"
              onClick={() => void act("aprovar")}
              disabled={workflow.isPending}
            >
              Aprovar
            </button>
            <button
              className="btn-ghost"
              onClick={() => void act("rejeitar")}
              disabled={workflow.isPending}
            >
              Rejeitar
            </button>
          </>
        )}
        {bci.status === "rejeitado" && (
          <button
            className="btn-primary"
            onClick={() => void corrigir()}
            disabled={workflow.isPending}
          >
            Corrigir →
          </button>
        )}
      </div>

      {schema.isError && (
        <div className="form-error" style={{ marginTop: 16 }}>
          Não foi possível carregar o formulário do município.
        </div>
      )}

      {schema.data?.definicao.secoes.map((sec) => (
        <section key={sec.id} style={{ marginTop: 32 }}>
          <div className="rkicker mono">
            {sec.id} · {sec.titulo.toUpperCase()}
          </div>
          <dl className="bci-readout">
            {sec.campos.map((campo) => (
              <div key={campo.key} className="bci-readout-row">
                <dt className="field-k">{campo.label}</dt>
                <dd>{formatValor(campo, dados[campo.key])}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section style={{ marginTop: 32 }}>
        <div className="rkicker mono">OBSERVAÇÕES</div>
        <p style={{ whiteSpace: "pre-wrap" }}>{bci.observacoes || "—"}</p>
      </section>

      {croquis.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <div className="rkicker mono">CROQUI</div>
          <div className="foto-grid">
            {croquis.map((f) => (
              <div key={f.id} className="foto-card">
                <a href={f.imagem} target="_blank" rel="noreferrer">
                  <img src={f.thumbnail || f.imagem} alt={f.legenda || "Croqui"} />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 32 }}>
        <div className="rkicker mono">
          FOTOS{fotosGerais.length > 0 ? ` (${fotosGerais.length})` : ""}
        </div>
        {fotosGerais.length === 0 ? (
          <p className="muted mono">sem fotos</p>
        ) : (
          <div className="foto-grid">
            {fotosGerais.map((f) => (
              <div key={f.id} className="foto-card">
                <a href={f.imagem} target="_blank" rel="noreferrer">
                  <img src={f.thumbnail || f.imagem} alt={f.legenda || ""} />
                </a>
                {f.legenda && (
                  <div className="foto-leg" style={{ padding: "4px 6px" }}>
                    {f.legenda}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
