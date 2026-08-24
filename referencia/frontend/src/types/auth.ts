export type Role = "admin" | "coordenador" | "tecnico" | "visualizador";

export interface Me {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  municipio: number | null;
  municipio_nome: string | null;
  telefone: string;
  ativo_campo: boolean;
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  coordenador: "Coordenador",
  tecnico: "Técnico de campo",
  visualizador: "Visualizador",
};
