import HeroShot from "./HeroShot";
import {
  CONTATO,
  DIFERENCIAIS,
  MODULOS_VITRINE,
  PASSOS,
  PROVAS,
  RECURSOS,
} from "./content";
import "./landing.css";

interface LandingProps {
  /** Abre a plataforma (painel/mapa) a partir da landing. */
  onEntrar: () => void;
}

/** Assinatura "BzR ▮ <etiqueta>" — o Bloco é a bandeira do R. */
function Marca({ etiqueta }: { etiqueta: string }) {
  return (
    <div className="mark">
      <span className="bz">BzR</span>
      <span className="flag" aria-hidden="true" />
      <span className="tag">{etiqueta}</span>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="kick">
      <span className="mk" aria-hidden="true" />
      {children}
    </div>
  );
}

export default function Landing({ onEntrar }: LandingProps) {
  return (
    <div className="landing">
      <header className="lp-header">
        <div className="in">
          <Marca etiqueta="WebGIS" />
          <nav aria-label="Navegação da página">
            <a href="#recursos">Recursos</a>
            <a href="#modulos">Módulos</a>
            <a href="#diferenciais">Diferenciais</a>
            <a href="#contato">Contato</a>
            <button type="button" onClick={onEntrar}>
              Acessar plataforma
            </button>
          </nav>
          <a className="btn solid" href="#contato">
            Solicitar demonstração
          </a>
        </div>
      </header>

      {/* ---- Hero ---- */}
      <div className="hero wrap">
        <Kicker>Plataforma WebGIS para gestão pública</Kicker>
        <h1>
          O território da sua cidade, <span className="g">sob controle.</span>
          <span className="cur" aria-hidden="true" />
        </h1>
        <p className="sub">
          WebGIS da BzR para gestão de projetos de geoprocessamento e das
          demandas municipais — mapa, campo e gestão, num só lugar.
        </p>
        <div className="acts">
          <a className="btn solid" href="#contato">
            Solicitar demonstração
          </a>
          <a className="btn ghost" href="#modulos">
            Conhecer os módulos
          </a>
        </div>
        <div className="proof">
          {PROVAS.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
        <HeroShot />
      </div>

      {/* ---- Recursos ---- */}
      <section id="recursos" className="wrap">
        <div className="sechead">
          <div>
            <Kicker>Recursos da plataforma</Kicker>
            <h2>Uma plataforma, todo o ciclo de gestão territorial.</h2>
          </div>
          <div className="note">
            Oito módulos de sistema
            <br />
            em produção
          </div>
        </div>
        <div className="grid8">
          {RECURSOS.map((r) => (
            <div className="feat" key={r.n}>
              <div className="n">{r.n}</div>
              <h3>{r.titulo}</h3>
              <p>
                {r.texto}
                {r.destaque ? (
                  <>
                    {" "}
                    <b>{r.destaque}</b>
                  </>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Módulos municipais ---- */}
      <section id="modulos" className="mods">
        <div className="wrap">
          <div className="sechead">
            <div>
              <Kicker>Módulos municipais</Kicker>
              <h2>Dividido em módulos, do jeito que a prefeitura trabalha.</h2>
            </div>
            <div className="note">
              Cada módulo com
              <br />
              situação das demandas
            </div>
          </div>
          <div className="modlist">
            {MODULOS_VITRINE.map((m) => (
              <div className="mod" key={m.id}>
                <div className="n">{m.n}</div>
                <h3>{m.nome}</h3>
                <p>{m.texto}</p>
                <div className="states">
                  <span className="st p">Pendente</span>
                  <span className="st a">Em andamento</span>
                  <span className="st c">Concluído</span>
                </div>
              </div>
            ))}
          </div>
          <div className="extend">
            <span className="mk" aria-hidden="true" />
            Novos módulos sob demanda da prefeitura
          </div>
        </div>
      </section>

      {/* ---- Diferenciais ---- */}
      <section id="diferenciais" className="wrap">
        <div className="sechead">
          <div>
            <Kicker>Diferenciais</Kicker>
            <h2>Feito para o campo e para a gestão.</h2>
          </div>
          <div className="note">
            Do técnico na rua
            <br />
            ao gabinete
          </div>
        </div>
        <div className="diff">
          {DIFERENCIAIS.map((d) => (
            <div className="dcard" key={d.n}>
              <div className="n">{d.n}</div>
              <h3>{d.titulo}</h3>
              <p>
                {d.partes.map((parte, i) =>
                  typeof parte === "string" ? (
                    <span key={i}>{parte}</span>
                  ) : (
                    <b key={i}>{parte.b}</b>
                  ),
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Como funciona ---- */}
      <section className="wrap" style={{ paddingTop: 0 }}>
        <div className="sechead">
          <div>
            <Kicker>Como funciona</Kicker>
            <h2>Quatro passos, do dado bruto à decisão.</h2>
          </div>
        </div>
        <div className="flow">
          {PASSOS.map((p) => (
            <div className="step" key={p.n}>
              <div className="n">{p.n}</div>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- CTA final ---- */}
      <section className="cta" id="contato">
        <div className="wrap in">
          <div>
            <Kicker>Próximo passo</Kicker>
            <h2>
              Leve o WebGIS para a sua cidade.
              <span className="cur" aria-hidden="true" />
            </h2>
          </div>
          <div className="ctaacts">
            <a className="btn onink" href={`mailto:${CONTATO.email}`}>
              Solicitar demonstração
            </a>
            <a
              className="btn onwhite"
              href={CONTATO.whatsappComTexto}
              target="_blank"
              rel="noopener"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ---- Rodapé ---- */}
      <footer className="lp-footer">
        <div className="wrap">
          <div className="top">
            <div>
              <Marca etiqueta="Technology" />
              <p>
                Gestão geoespacial para prefeituras — projetos de
                geoprocessamento e demandas municipais em módulos.
              </p>
            </div>
            <div>
              <h4>Plataforma</h4>
              <div className="col">
                <a href="#recursos">Recursos</a>
                <a href="#modulos">Módulos</a>
                <a href="#diferenciais">Diferenciais</a>
                <button type="button" onClick={onEntrar}>
                  Acessar plataforma
                </button>
              </div>
            </div>
            <div>
              <h4>Contato</h4>
              <div className="col">
                <a href={CONTATO.whatsapp} target="_blank" rel="noopener">
                  WhatsApp {CONTATO.whatsappNumero}
                </a>
                <a href={`mailto:${CONTATO.email}`}>{CONTATO.email}</a>
                <a href="#contato">Solicitar demonstração</a>
              </div>
            </div>
          </div>
          <div className="bot">
            <span>© 2026 BzR Technology</span>
            <span>Gestão Geoespacial</span>
          </div>
        </div>
      </footer>

      <a
        className="wa"
        href={CONTATO.whatsappComTexto}
        target="_blank"
        rel="noopener"
        aria-label={`Falar no WhatsApp ${CONTATO.whatsappNumero}`}
      >
        <span className="d" aria-hidden="true" />
        WhatsApp
        <span className="num">{CONTATO.whatsappNumero}</span>
      </a>
    </div>
  );
}
