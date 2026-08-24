import { HTTPError } from "ky";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  useBCI,
  useBCIAbertoDoImovel,
  useBCIFormSchema,
  useCreateBCI,
  useImovelSearch,
  useUpdateBCI,
  useUploadFoto,
  useWorkflow,
} from "./api";
import { useImovel } from "@/features/mapa/api";
import LoteMiniMap from "@/features/mapa/LoteMiniMap";
import { useAuthStore } from "@/stores/authStore";
import type { BCI, ImovelLite } from "@/types/bci";
import type { CampoBCI, DadosBCI } from "@/types/bciForm";

interface Gps {
  lat: number;
  lon: number;
  acc: number;
}

interface FotoItem {
  uid: string;
  file: File;
  url: string;
  lat?: number;
  lon?: number;
  capturada_em: string;
  legenda: string;
}

const RESP_KEY = "responsavel_preenchimento";

function Campo({
  campo,
  value,
  onChange,
  disabled,
}: {
  campo: CampoBCI;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean | undefined) => void;
  disabled?: boolean;
}) {
  const common = { id: campo.key, disabled };
  if (campo.tipo === "select") {
    return (
      <select
        {...common}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">—</option>
        {campo.opcoes?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (campo.tipo === "booleano") {
    return (
      <select
        {...common}
        value={value === true ? "s" : value === false ? "n" : ""}
        onChange={(e) =>
          onChange(
            e.target.value === "" ? undefined : e.target.value === "s",
          )
        }
      >
        <option value="">—</option>
        <option value="s">Sim</option>
        <option value="n">Não</option>
      </select>
    );
  }
  if (campo.tipo === "inteiro" || campo.tipo === "decimal") {
    return (
      <input
        {...common}
        type="number"
        step={campo.tipo === "inteiro" ? "1" : "0.01"}
        value={value === undefined ? "" : String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(undefined);
          const n =
            campo.tipo === "inteiro" ? parseInt(raw, 10) : parseFloat(raw);
          onChange(Number.isNaN(n) ? undefined : n);
        }}
      />
    );
  }
  return (
    <input
      {...common}
      type={campo.tipo === "data" ? "date" : "text"}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
    />
  );
}

export default function BCICreateScene() {
  const navigate = useNavigate();
  const routeParams = useParams();
  const editId = routeParams.id ? Number(routeParams.id) : null;
  const isEdit = editId != null;
  const schema = useBCIFormSchema();
  const create = useCreateBCI();
  const update = useUpdateBCI();
  const workflow = useWorkflow();
  const uploadFoto = useUploadFoto();
  const bciQ = useBCI(editId);

  const [term, setTerm] = useState("");
  const [imovel, setImovel] = useState<ImovelLite | null>(null);
  const [dados, setDados] = useState<DadosBCI>({});
  const [obs, setObs] = useState("");
  const [gps, setGps] = useState<Gps | null>(null);
  const [gpsErr, setGpsErr] = useState<string | null>(null);
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [croqui, setCroqui] = useState<{ file: File; url: string } | null>(
    null,
  );
  const [result, setResult] = useState<{ queued: boolean; bci?: BCI } | null>(
    null,
  );

  const search = useImovelSearch(term);

  // Pré-seleção vinda do mapa/ficha: /bci/novo?imovel=ID
  const [params] = useSearchParams();
  const preId = params.get("imovel");
  const pre = useImovel(preId ? Number(preId) : null);
  // Fixa o imóvel pelo id da URL (mostra a referência mesmo antes de o
  // detalhe carregar) e refina a inscrição quando ela chega. Lotes sem
  // inscrição textual caem para "Lote <id>". Trava após o detalhe chegar
  // para não desfazer um eventual "trocar".
  const preApplied = useRef(false);
  useEffect(() => {
    if (isEdit || !preId || preApplied.current) return;
    const id = Number(preId);
    const insc = pre.data?.inscricao_cadastral?.trim();
    setImovel({
      id,
      inscricao_cadastral: insc || `Lote ${id}`,
      numero: pre.data?.numero ?? "",
    });
    if (pre.data) preApplied.current = true;
  }, [isEdit, preId, pre.data]);

  // Já existe um BCI aberto (rascunho/enviado) para esse imóvel? Não
  // permitimos dois — direcionamos o técnico ao BCI existente.
  const bciAberto = useBCIAbertoDoImovel(
    !isEdit && imovel ? imovel.id : null,
  );
  useEffect(() => {
    const aberto = bciAberto.data;
    if (isEdit || !aberto) return;
    navigate(
      aberto.status === "rascunho"
        ? `/bci/${aberto.id}/editar`
        : `/bci/${aberto.id}`,
      { replace: true },
    );
  }, [isEdit, bciAberto.data, navigate]);

  // Pré-preenche proprietário a partir do cadastro do imóvel (criação).
  const prefilledOwner = useRef(false);
  useEffect(() => {
    if (isEdit || prefilledOwner.current) return;
    const p = pre.data?.proprietario_detalhe;
    if (!p) return;
    prefilledOwner.current = true;
    setDados((d) => ({
      ...d,
      ...(d.nome_proprietario ? {} : { nome_proprietario: p.nome }),
      ...(d.cpf_cnpj ? {} : { cpf_cnpj: p.cpf_cnpj }),
      ...(d.contato ? {} : { contato: p.telefone }),
      ...(d.endereco_correspondencia
        ? {}
        : { endereco_correspondencia: p.endereco_correspondencia }),
    }));
  }, [isEdit, pre.data]);

  // Modo edição (/bci/:id/editar): carrega o BCI e preenche o formulário.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!isEdit || prefilled.current || !bciQ.data) return;
    const b = bciQ.data;
    prefilled.current = true;
    setImovel({
      id: b.imovel,
      inscricao_cadastral: b.imovel_inscricao,
      numero: "",
    });
    setDados((b.dados ?? {}) as DadosBCI);
    setObs(b.observacoes ?? "");
  }, [isEdit, bciQ.data]);

  // Responsável pelo preenchimento = usuário logado (vinculado e travado).
  const user = useAuthStore((s) => s.user);
  const respNome = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.username
    : "";
  useEffect(() => {
    if (!respNome) return;
    setDados((d) =>
      d[RESP_KEY] === respNome ? d : { ...d, [RESP_KEY]: respNome },
    );
  }, [respNome]);

  function setCampo(key: string, v: string | number | boolean | undefined) {
    setDados((d) => {
      const next = { ...d };
      if (v === undefined) delete next[key];
      else next[key] = v;
      return next;
    });
  }

  function captureGps() {
    setGpsErr(null);
    if (!navigator.geolocation) {
      setGpsErr("Dispositivo sem GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGps({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          acc: Math.round(pos.coords.accuracy),
        }),
      () => setGpsErr("Não foi possível obter a localização."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function addFotos(list: FileList | null) {
    if (!list || list.length === 0) return;
    const arr = Array.from(list);
    const now = new Date().toISOString();
    const append = (lat?: number, lon?: number) =>
      setFotos((prev) => [
        ...prev,
        ...arr.map((file) => ({
          uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          url: URL.createObjectURL(file),
          lat,
          lon,
          capturada_em: now,
          legenda: "",
        })),
      ]);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => append(pos.coords.latitude, pos.coords.longitude),
        () => append(),
        { enableHighAccuracy: true, timeout: 12000 },
      );
    } else {
      append();
    }
  }

  function pickCroqui(file: File | null) {
    setCroqui((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return file ? { file, url: URL.createObjectURL(file) } : null;
    });
  }

  function removeFoto(uid: string) {
    setFotos((prev) => {
      const f = prev.find((x) => x.uid === uid);
      if (f) URL.revokeObjectURL(f.url);
      return prev.filter((x) => x.uid !== uid);
    });
  }

  function setLegenda(uid: string, v: string) {
    setFotos((prev) =>
      prev.map((f) => (f.uid === uid ? { ...f, legenda: v } : f)),
    );
  }

  function captureFotoGps(uid: string) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setFotos((prev) =>
          prev.map((f) =>
            f.uid === uid
              ? { ...f, lat: pos.coords.latitude, lon: pos.coords.longitude }
              : f,
          ),
        ),
      () => undefined,
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  const saving = create.isPending || update.isPending;
  const totalAnexos = fotos.length + (croqui ? 1 : 0);

  const [submitErr, setSubmitErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!imovel || saving) return;
    setSubmitErr(null);
    let res;
    try {
      res =
        isEdit && editId != null
          ? await update.mutateAsync({
              id: editId,
              dados,
              observacoes: obs || undefined,
            })
          : await create.mutateAsync({
              imovel: imovel.id,
              dados,
              observacoes: obs || undefined,
              ponto_coletado: gps
                ? { type: "Point", coordinates: [gps.lon, gps.lat] }
                : null,
              precisao_gps_m: gps ? gps.acc : null,
            });
    } catch (err) {
      if (err instanceof HTTPError) {
        const body = (await err.response
          .clone()
          .json()
          .catch(() => null)) as
          | { code?: string; bci_id?: number; status?: string; imovel?: string }
          | null;
        if (body?.code === "bci_aberto_existente" && body.bci_id) {
          navigate(
            body.status === "rascunho"
              ? `/bci/${body.bci_id}/editar`
              : `/bci/${body.bci_id}`,
            { replace: true },
          );
          return;
        }
        setSubmitErr(
          body?.imovel ?? "Não foi possível salvar o BCI. Verifique os campos.",
        );
        return;
      }
      throw err;
    }
    setResult({ queued: res.queued, bci: res.data });
    const bciId = res.data?.id ?? editId ?? undefined;
    if (!res.queued && bciId != null) {
      for (const f of fotos) {
        await uploadFoto.mutateAsync({
          id: bciId,
          file: f.file,
          lat: f.lat,
          lon: f.lon,
          capturada_em: f.capturada_em,
          legenda: f.legenda || undefined,
        });
      }
      if (croqui) {
        await uploadFoto.mutateAsync({
          id: bciId,
          file: croqui.file,
          tipo: "croqui",
          legenda: "Croqui",
        });
      }
    }
  }

  async function enviarAprovacao() {
    if (editId == null) return;
    await workflow.mutateAsync({ id: editId, action: "enviar" });
    navigate("/bci");
  }

  if (result) {
    return (
      <div className="scene-pad">
        <div className="rkicker mono">COLETA · BCI</div>
        <h1>
          {result.queued
            ? "Salvo no dispositivo"
            : isEdit
              ? "BCI atualizado"
              : "BCI registrado"}
        </h1>
        <p className="lede">
          {result.queued ? (
            <>
              Sem conexão agora — o BCI foi salvo e{" "}
              <strong>sobe automaticamente quando a internet voltar</strong>.
              {totalAnexos > 0 && (
                <>
                  {" "}
                  Os {totalAnexos} anexo(s) precisam de conexão: refaça quando
                  online.
                </>
              )}
            </>
          ) : isEdit ? (
            <>
              Correções salvas no rascunho
              {totalAnexos > 0 ? ` (+${totalAnexos} anexo(s))` : ""}. Reenvie
              para aprovação quando terminar.
            </>
          ) : (
            <>
              BCI criado como rascunho
              {totalAnexos > 0 ? ` com ${totalAnexos} anexo(s)` : ""}. Envie
              para aprovação quando terminar a coleta.
            </>
          )}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          {isEdit && !result.queued && (
            <button
              className="btn-primary"
              onClick={() => void enviarAprovacao()}
              disabled={workflow.isPending}
            >
              {workflow.isPending ? (
                <>
                  Enviando <span className="spinner" />
                </>
              ) : (
                "Reenviar para aprovação"
              )}
            </button>
          )}
          <button
            className={isEdit && !result.queued ? "btn-ghost" : "btn-primary"}
            onClick={() => navigate("/bci")}
          >
            Ver meus BCIs
          </button>
          {!isEdit && (
            <button
              className="btn-ghost"
              onClick={() => {
                setResult(null);
                setImovel(null);
                setTerm("");
                fotos.forEach((f) => URL.revokeObjectURL(f.url));
                setFotos([]);
                pickCroqui(null);
                setGps(null);
                setDados({});
              }}
            >
              Coletar outro
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="scene-pad">
      <div className="rkicker mono">
        COLETA · BCI{schema.data ? ` · ${schema.data.nome}` : ""}
      </div>
      <h1>{isEdit ? "Editar Boletim de Cadastro" : "Novo Boletim de Cadastro"}</h1>
      <p className="lede">
        Funciona offline: sem internet, o BCI fica salvo e sobe sozinho quando
        a conexão voltar.
      </p>

      {isEdit && bciQ.data?.motivo_rejeicao && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          Rejeitado anteriormente: {bciQ.data.motivo_rejeicao}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="users-form">
          <label className="field full">
            <span className="field-k">Imóvel (inscrição)</span>
            {imovel ? (
              <div
                className="field-wrap"
                style={{ justifyContent: "space-between" }}
              >
                <span className="mono">{imovel.inscricao_cadastral}</span>
                {!isEdit && (
                  <button
                    type="button"
                    className="row-link"
                    onClick={() => setImovel(null)}
                  >
                    trocar
                  </button>
                )}
              </div>
            ) : (
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Digite a inscrição cadastral…"
              />
            )}
          </label>
          {!isEdit && !imovel && term.length >= 2 && (
            <div className="full">
              {search.isLoading && <p className="muted mono">buscando…</p>}
              {search.data?.results.length === 0 && (
                <p className="muted mono">nenhum imóvel encontrado</p>
              )}
              {search.data?.results.map((im) => (
                <button
                  type="button"
                  key={im.id}
                  className="row-link"
                  style={{ display: "block", padding: "8px 0" }}
                  onClick={() => setImovel(im)}
                >
                  {im.inscricao_cadastral}
                </button>
              ))}
            </div>
          )}
        </div>

        {imovel && (
          <section style={{ marginTop: 24 }}>
            <div className="rkicker mono">LOCALIZAÇÃO DO LOTE</div>
            <LoteMiniMap imovelId={imovel.id} />
          </section>
        )}

        {schema.isLoading && (
          <p className="muted mono" style={{ marginTop: 24 }}>
            carregando formulário…
          </p>
        )}
        {schema.isError && (
          <div className="form-error" style={{ marginTop: 24 }}>
            Não foi possível carregar o formulário deste município.
          </div>
        )}

        {schema.data?.definicao.secoes.map((sec) => (
          <section key={sec.id} style={{ marginTop: 32 }}>
            <div className="rkicker mono">
              {sec.id} · {sec.titulo.toUpperCase()}
            </div>
            <div className="users-form">
              {sec.campos.map((campo) => (
                <label key={campo.key} className="field">
                  <span className="field-k">{campo.label}</span>
                  <Campo
                    campo={campo}
                    value={dados[campo.key]}
                    onChange={(v) => setCampo(campo.key, v)}
                    disabled={campo.key === RESP_KEY}
                  />
                </label>
              ))}
            </div>
          </section>
        ))}

        <section style={{ marginTop: 32 }}>
          <div className="rkicker mono">ANEXOS E LOCALIZAÇÃO</div>
          <div className="users-form">
            <div className="field full">
              <span className="field-k">Croqui do lote</span>
              <p className="muted mono" style={{ marginTop: 0 }}>
                Foto do croqui desenhado em papel (frente, fundos, edificações).
              </p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  pickCroqui(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
              {croqui && (
                <div className="foto-grid" style={{ marginTop: 8 }}>
                  <div className="foto-card">
                    <button
                      type="button"
                      className="foto-x"
                      onClick={() => pickCroqui(null)}
                      aria-label="Remover croqui"
                    >
                      ✕
                    </button>
                    <img src={croqui.url} alt="" />
                  </div>
                </div>
              )}
              {!croqui &&
                isEdit &&
                bciQ.data?.fotos.some((f) => f.tipo === "croqui") && (
                  <p className="muted mono" style={{ marginTop: 8 }}>
                    Croqui já anexado a este BCI. Selecione uma nova imagem
                    para adicionar outra versão.
                  </p>
                )}
            </div>
            <div className="field full">
              <span className="field-k">
                Fotos {fotos.length > 0 ? `(${fotos.length})` : ""}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(e) => {
                  addFotos(e.target.files);
                  e.target.value = "";
                }}
              />
              {fotos.length > 0 && (
                <div className="foto-grid">
                  {fotos.map((f) => (
                    <div key={f.uid} className="foto-card">
                      <button
                        type="button"
                        className="foto-x"
                        onClick={() => removeFoto(f.uid)}
                        aria-label="Remover foto"
                      >
                        ✕
                      </button>
                      <img src={f.url} alt="" />
                      <input
                        className="foto-leg"
                        placeholder="Legenda…"
                        value={f.legenda}
                        onChange={(e) => setLegenda(f.uid, e.target.value)}
                      />
                      <div className="foto-meta mono">
                        {f.lat != null && f.lon != null ? (
                          <>
                            📍 {f.lat.toFixed(5)}, {f.lon.toFixed(5)}
                          </>
                        ) : (
                          <button
                            type="button"
                            className="row-link"
                            onClick={() => captureFotoGps(f.uid)}
                          >
                            sem GPS · capturar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <label className="field full">
              <span className="field-k">Observações</span>
              <input value={obs} onChange={(e) => setObs(e.target.value)} />
            </label>
            <div className="field full">
              <span className="field-k">Localização (GPS)</span>
              <div
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={captureGps}
                >
                  Capturar GPS
                </button>
                {gps && (
                  <span className="mono" style={{ fontSize: 12 }}>
                    {gps.lat.toFixed(5)}, {gps.lon.toFixed(5)} · ±{gps.acc} m
                    {gps.acc > 20 && (
                      <span style={{ color: "var(--warn)" }}>
                        {" "}
                        (precisão baixa)
                      </span>
                    )}
                  </span>
                )}
                {gpsErr && (
                  <span className="mono" style={{ color: "var(--danger)" }}>
                    {gpsErr}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {submitErr && (
          <div className="form-error" style={{ marginTop: 16 }}>
            {submitErr}
          </div>
        )}
        <div style={{ marginTop: 24 }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={!imovel || saving}
          >
            {saving ? (
              <>
                Salvando <span className="spinner" />
              </>
            ) : isEdit ? (
              "Salvar correções"
            ) : (
              "Salvar BCI"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
