/* ==========================================================================
   Catálogo de módulos do WebGIS e dados de demonstração.
   Em produção, estas camadas devem vir de uma API / serviço de geodados
   (GeoServer, PostGIS, etc.). Aqui usamos amostras georreferenciadas em
   torno de uma cidade fictícia para ilustrar cada módulo municipal.
   ========================================================================== */

export type DemandStatus = "pendente" | "andamento" | "concluido";

export interface Feature {
  id: string;
  title: string;
  description: string;
  status: DemandStatus;
  position: [number, number]; // [lat, lng]
}

export interface ModuleDef {
  id: string;
  name: string;
  short: string;
  icon: string;
  color: string;
  description: string;
  features: Feature[];
  /** Ativo por padrão no mapa */
  defaultActive?: boolean;
}

export const STATUS_LABEL: Record<DemandStatus, string> = {
  pendente: "Pendente",
  andamento: "Em andamento",
  concluido: "Concluído",
};

/** Centro padrão do mapa (cidade de exemplo). */
export const MAP_CENTER: [number, number] = [-22.9068, -43.1729];
export const MAP_ZOOM = 13;

export const MODULES: ModuleDef[] = [
  {
    id: "vias",
    name: "Gestão de Vias",
    short: "Vias",
    icon: "🛣️",
    color: "#156540",
    description:
      "Pavimentação, sinalização, buracos e manutenção do sistema viário.",
    defaultActive: true,
    features: [
      {
        id: "via-1",
        title: "Recapeamento Av. Central",
        description: "Trecho de 1,2 km com recapeamento asfáltico programado.",
        status: "andamento",
        position: [-22.9028, -43.1789],
      },
      {
        id: "via-2",
        title: "Buraco na Rua das Acácias",
        description: "Solicitação de tapa-buraco registrada pela ouvidoria.",
        status: "pendente",
        position: [-22.9135, -43.1655],
      },
      {
        id: "via-3",
        title: "Sinalização horizontal — Rotatória Norte",
        description: "Repintura de faixas e sinalização concluída.",
        status: "concluido",
        position: [-22.8975, -43.1702],
      },
    ],
  },
  {
    id: "iluminacao",
    name: "Gestão de Iluminação",
    short: "Iluminação",
    icon: "💡",
    color: "#c9a227",
    description:
      "Parque de iluminação pública, troca de luminárias e modernização LED.",
    defaultActive: true,
    features: [
      {
        id: "ilu-1",
        title: "Poste apagado — Praça Matriz",
        description: "Luminária sem funcionamento há 3 dias.",
        status: "pendente",
        position: [-22.9082, -43.1748],
      },
      {
        id: "ilu-2",
        title: "Modernização LED — Bairro Jardim",
        description: "Substituição de 84 luminárias por tecnologia LED.",
        status: "andamento",
        position: [-22.9201, -43.1812],
      },
      {
        id: "ilu-3",
        title: "Iluminação cênica — Orla",
        description: "Projeto de iluminação cênica entregue.",
        status: "concluido",
        position: [-22.8999, -43.1845],
      },
    ],
  },
  {
    id: "ambiental",
    name: "Gestão Ambiental",
    short: "Ambiental",
    icon: "🌳",
    color: "#259862",
    description:
      "Arborização urbana, áreas de preservação, licenciamento e fiscalização.",
    defaultActive: true,
    features: [
      {
        id: "amb-1",
        title: "Plantio de mudas — Parque Linear",
        description: "Meta de 500 mudas nativas em andamento.",
        status: "andamento",
        position: [-22.9155, -43.1758],
      },
      {
        id: "amb-2",
        title: "Poda de risco — Rua dos Ipês",
        description: "Árvore com galho comprometendo a fiação.",
        status: "pendente",
        position: [-22.9044, -43.1668],
      },
      {
        id: "amb-3",
        title: "Recuperação de APP — Córrego Verde",
        description: "Cercamento e revegetação da mata ciliar concluídos.",
        status: "concluido",
        position: [-22.9112, -43.188],
      },
    ],
  },
  {
    id: "drenagem",
    name: "Gestão de Drenagem",
    short: "Drenagem",
    icon: "💧",
    color: "#20507f",
    description:
      "Bocas de lobo, galerias, pontos de alagamento e microdrenagem.",
    features: [
      {
        id: "dre-1",
        title: "Ponto de alagamento — Baixada Sul",
        description: "Recorrência de alagamentos em chuvas fortes.",
        status: "pendente",
        position: [-22.922, -43.17],
      },
      {
        id: "dre-2",
        title: "Limpeza de galeria — Av. das Águas",
        description: "Desobstrução de 600 m de galeria em andamento.",
        status: "andamento",
        position: [-22.906, -43.162],
      },
    ],
  },
  {
    id: "residuos",
    name: "Gestão de Resíduos",
    short: "Resíduos",
    icon: "♻️",
    color: "#7a4b15",
    description:
      "Coleta seletiva, ecopontos, descarte irregular e roteirização.",
    features: [
      {
        id: "res-1",
        title: "Descarte irregular — Terreno Leste",
        description: "Acúmulo de entulho denunciado pela população.",
        status: "pendente",
        position: [-22.895, -43.179],
      },
      {
        id: "res-2",
        title: "Novo ecoponto — Bairro Operário",
        description: "Implantação de ecoponto em andamento.",
        status: "andamento",
        position: [-22.918, -43.165],
      },
    ],
  },
];

export interface ProjectSummary {
  name: string;
  client: string;
  progress: number;
  status: DemandStatus;
}

export const PROJECTS: ProjectSummary[] = [
  {
    name: "WebGIS Municipal — Pref. de Exemplo",
    client: "Prefeitura de Exemplo",
    progress: 72,
    status: "andamento",
  },
  {
    name: "Cadastro de Iluminação Pública",
    client: "Secretaria de Serviços Urbanos",
    progress: 45,
    status: "andamento",
  },
  {
    name: "Mapeamento Ambiental — APPs",
    client: "Secretaria de Meio Ambiente",
    progress: 100,
    status: "concluido",
  },
  {
    name: "Diagnóstico Viário Integrado",
    client: "Secretaria de Obras",
    progress: 18,
    status: "pendente",
  },
];
