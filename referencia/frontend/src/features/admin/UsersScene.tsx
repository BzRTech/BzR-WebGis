import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { api } from "@/lib/api";
import { ROLE_LABEL, type Me, type Role } from "@/types/auth";

interface Paginated<T> {
  count: number;
  results: T[];
}

interface Municipio {
  id: number;
  nome: string;
  uf: string;
}

interface NewUser {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  municipio: number | null;
  password: string;
}

const EMPTY: NewUser = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  role: "tecnico",
  municipio: null,
  password: "",
};

export default function UsersScene() {
  const qc = useQueryClient();
  const [form, setForm] = useState<NewUser>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("users/").json<Paginated<Me>>(),
  });

  const municipios = useQuery({
    queryKey: ["municipios"],
    queryFn: () => api.get("municipios/").json<Paginated<Municipio>>(),
  });

  const create = useMutation({
    mutationFn: (payload: NewUser) =>
      api
        .post("users/", {
          json: { ...payload, municipio: payload.municipio || null },
        })
        .json<Me>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setForm(EMPTY);
      setFormError(null);
    },
    onError: async (err) => {
      if (err instanceof HTTPError) {
        const body = await err.response.json().catch(() => null);
        setFormError(
          body ? JSON.stringify(body) : "Não foi possível criar o usuário.",
        );
      } else {
        setFormError("Falha de conexão.");
      }
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    create.mutate(form);
  }

  function set<K extends keyof NewUser>(key: K, value: NewUser[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="scene-pad">
      <div className="rkicker mono">ADMINISTRAÇÃO · USUÁRIOS</div>
      <h1>Gestão de acesso</h1>
      <p className="lede">
        Crie e gerencie os usuários da plataforma e seus papéis.
      </p>

      <form className="users-form" onSubmit={onSubmit}>
        {formError && (
          <div className="form-error full" role="alert">
            {formError}
          </div>
        )}
        <label className="field">
          <span className="field-k">Usuário</span>
          <input
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field-k">E-mail</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-k">Nome</span>
          <input
            value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-k">Sobrenome</span>
          <input
            value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-k">Papel</span>
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value as Role)}
          >
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-k">Município</span>
          <select
            value={form.municipio ?? ""}
            onChange={(e) =>
              set("municipio", e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">— sem vínculo —</option>
            {municipios.data?.results.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}/{m.uf}
              </option>
            ))}
          </select>
        </label>
        <label className="field full">
          <span className="field-k">Senha inicial</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            minLength={8}
            required
          />
        </label>
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={create.isPending}
          >
            {create.isPending ? (
              <>
                Criando <span className="spinner" />
              </>
            ) : (
              "Criar usuário"
            )}
          </button>
        </div>
      </form>

      <div className="admin-bar">
        <div className="rkicker mono">
          {users.data ? `${users.data.count} USUÁRIO(S)` : "CARREGANDO…"}
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Papel</th>
            <th>Município</th>
          </tr>
        </thead>
        <tbody>
          {users.isError && (
            <tr>
              <td colSpan={5}>Erro ao carregar usuários.</td>
            </tr>
          )}
          {users.data?.results.map((u) => (
            <tr key={u.id}>
              <td className="mono small">{u.username}</td>
              <td>{`${u.first_name} ${u.last_name}`.trim() || "—"}</td>
              <td className="small">{u.email || "—"}</td>
              <td>
                <span className={`role-badge ${u.role}`}>
                  {ROLE_LABEL[u.role]}
                </span>
              </td>
              <td>{u.municipio_nome ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
