import { type FormEvent, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { LoginError } from "@/lib/auth";
import { BrandHex } from "@/components/BrandMark";
import {
  IcoAlert,
  IcoArrow,
  IcoLock,
  IcoMoon,
  IcoSun,
  IcoUser,
} from "@/components/icons";

export default function LoginScene() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = useAuthStore((s) => s.signIn);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await signIn(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof LoginError
          ? err.message
          : "Falha de conexão com o servidor.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scene scene-login">
      <div className="login-left">
        <div className="brand-row">
          <BrandHex size={44} />
          <div className="brand-meta">
            <div className="brand-kicker">Eixo Soluções em Gestão Pública</div>
            <div className="brand-product">
              WebGIS · Cadastro Territorial Multifinalitário
            </div>
          </div>
        </div>

        <div className="login-hero">
          <div className="kicker">Cadastro de BCI</div>
          <h1 className="display">
            O território,
            <br />
            <span className="display-accent">em uma só visão.</span>
          </h1>
          <p className="lede">
            Plataforma de coleta e gestão de Boletins de Cadastro Imobiliário —
            trabalho de campo, aprovação e acompanhamento em um único mapa.
          </p>
        </div>

        <div className="login-foot">
          <div className="foot-col">
            <div className="foot-k">Produto</div>
            <div className="foot-v">WebGIS · CTM</div>
          </div>
          <div className="foot-col">
            <div className="foot-k">Exercício</div>
            <div className="foot-v">2026</div>
          </div>
          <div className="foot-col">
            <div className="foot-k">Build</div>
            <div className="foot-v mono">sprint-1 · api.eixo</div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Alternar tema"
          type="button"
        >
          {theme === "dark" ? <IcoSun size={16} /> : <IcoMoon size={16} />}
        </button>

        <form className="login-card" onSubmit={onSubmit}>
          <div className="login-card-head">
            <div className="chip">Acesso restrito</div>
            <h2>Entrar na plataforma</h2>
            <p>Use suas credenciais institucionais.</p>
          </div>

          {error && (
            <div className="form-error" role="alert">
              <IcoAlert size={14} />
              {error}
            </div>
          )}

          <label className="field">
            <span className="field-k">Usuário</span>
            <div className="field-wrap">
              <IcoUser size={16} />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="field">
            <span className="field-k">Senha</span>
            <div className="field-wrap">
              <IcoLock size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? (
              <>
                Entrando <span className="spinner" />
              </>
            ) : (
              <>
                Entrar no WebGIS <IcoArrow size={16} />
              </>
            )}
          </button>
        </form>

        <div className="login-side-foot mono">
          © 2026 Eixo · 45.871.209/0001-44
        </div>
      </div>
    </div>
  );
}
