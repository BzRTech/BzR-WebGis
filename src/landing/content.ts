/* ==========================================================================
   Conteúdo da landing institucional.
   Copy em PT-BR vinda do artboard "BzR WebGIS - Landing" do Claude Design —
   é texto de marketing, por isso vive aqui e não em data/modules.ts (que
   guarda os dados operacionais do WebGIS).
   ========================================================================== */

export const CONTATO = {
  email: "contato.bzrtech@gmail.com",
  whatsappNumero: "+55 83 99345-4556",
  whatsapp: "https://wa.me/5583993454556",
  whatsappComTexto:
    "https://wa.me/5583993454556?text=Ol%C3%A1%2C%20quero%20conhecer%20o%20BzR%20WebGIS",
} as const;

/** Prova social do hero. */
export const PROVAS = [
  "Offline-first",
  "Dados georreferenciados",
  "Controle de acesso por papel",
] as const;

export interface Recurso {
  n: string;
  titulo: string;
  /** Trecho em negrito ao final da descrição (opcional). */
  texto: string;
  destaque?: string;
}

/** Os 8 módulos de sistema em produção. */
export const RECURSOS: Recurso[] = [
  {
    n: "01",
    titulo: "Mapa WebGIS",
    texto:
      "Camadas, lotes, ortofoto, heatmap e mapas-base; navegação e busca por inscrição.",
  },
  {
    n: "02",
    titulo: "Dashboard municipal",
    texto: "KPIs, gráficos, ranking por bairro e resumo de áreas.",
  },
  {
    n: "03",
    titulo: "Coleta em campo (BCI)",
    texto: "Cadastro imobiliário com fotos e GPS.",
    destaque: "Funciona offline.",
  },
  {
    n: "04",
    titulo: "Demandas",
    texto: "Calendário e lista, prioridades, responsáveis e workflow de status.",
  },
  {
    n: "05",
    titulo: "Relatórios",
    texto: "Relatórios de gestão e de técnicos, com gráficos exportáveis.",
  },
  {
    n: "06",
    titulo: "Auditoria",
    texto: "Trilha completa de acessos e ações dos usuários.",
  },
  {
    n: "07",
    titulo: "Importação de dados",
    texto: "Importar lotes e feições geográficas — polígonos, linhas e pontos.",
  },
  {
    n: "08",
    titulo: "Usuários e papéis",
    texto: "Admin, coordenador e técnico, com permissões por papel.",
  },
];

export interface ModuloVitrine {
  n: string;
  /** Espelha o catálogo em src/data/modules.ts. */
  id: string;
  nome: string;
  texto: string;
}

/** Os 5 módulos municipais — mesma ordem do catálogo do sistema. */
export const MODULOS_VITRINE: ModuloVitrine[] = [
  {
    n: "M1",
    id: "vias",
    nome: "Gestão de Vias",
    texto: "Pavimentação, sinalização, buracos e manutenção viária.",
  },
  {
    n: "M2",
    id: "iluminacao",
    nome: "Gestão de Iluminação",
    texto: "Parque de iluminação pública, troca de luminárias, LED.",
  },
  {
    n: "M3",
    id: "ambiental",
    nome: "Gestão Ambiental",
    texto: "Arborização, APPs, licenciamento e fiscalização.",
  },
  {
    n: "M4",
    id: "drenagem",
    nome: "Gestão de Drenagem",
    texto: "Bocas de lobo, galerias e pontos de alagamento.",
  },
  {
    n: "M5",
    id: "residuos",
    nome: "Gestão de Resíduos",
    texto: "Coleta seletiva, ecopontos e descarte irregular.",
  },
];

export interface Diferencial {
  n: string;
  titulo: string;
  partes: (string | { b: string })[];
}

export const DIFERENCIAIS: Diferencial[] = [
  {
    n: "01",
    titulo: "Offline-first",
    partes: [
      "Técnicos trabalham em campo ",
      { b: "sem internet" },
      "; a sincronização acontece quando a conexão volta. Nada de retrabalho no fim do dia.",
    ],
  },
  {
    n: "02",
    titulo: "Acesso por papel",
    partes: [
      "Admin, coordenador e técnico: ",
      { b: "cada equipe vê e faz apenas o que lhe cabe" },
      " — com trilha de auditoria de tudo.",
    ],
  },
  {
    n: "03",
    titulo: "Dados georreferenciados",
    partes: [
      "Tudo no mapa e integrável ao que a prefeitura já tem: ",
      { b: "GeoServer, PostGIS, WMS, WFS e GeoJSON" },
      ".",
    ],
  },
  {
    n: "04",
    titulo: "Identidade evolutiva",
    partes: [
      "Cores e tipografia centralizadas: a plataforma acompanha a ",
      { b: "identidade visual do município" },
      " sem reescrever o sistema.",
    ],
  },
];

export interface Passo {
  n: string;
  titulo: string;
  texto: string;
}

export const PASSOS: Passo[] = [
  {
    n: "1",
    titulo: "Importar a base",
    texto: "Lotes e feições geográficas do município entram no mapa.",
  },
  {
    n: "2",
    titulo: "Coletar em campo",
    texto: "Equipes cadastram e abrem demandas direto do celular, offline.",
  },
  {
    n: "3",
    titulo: "Acompanhar",
    texto: "Gestão vê dashboard, relatórios e ranking por bairro.",
  },
  {
    n: "4",
    titulo: "Auditar",
    texto: "Trilha de acessos e ações garante rastreabilidade.",
  },
];
