export type CampoTipo =
  | "texto"
  | "inteiro"
  | "decimal"
  | "booleano"
  | "select"
  | "data";

export interface CampoBCI {
  key: string;
  label: string;
  tipo: CampoTipo;
  opcoes?: string[];
  obrigatorio?: boolean;
}

export interface SecaoBCI {
  id: string;
  titulo: string;
  campos: CampoBCI[];
}

export interface FormularioBCI {
  id: number;
  municipio: number | null;
  nome: string;
  versao: number;
  ativo: boolean;
  definicao: { nome?: string; versao?: number; secoes: SecaoBCI[] };
}

export type DadosBCI = Record<string, string | number | boolean>;
