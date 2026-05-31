# BzR WebGIS

WebGIS da **BzR Tech** para gestão de projetos de geoprocessamento e das
demandas municipais, organizado em módulos (gestão de vias, iluminação,
ambiental, drenagem, resíduos, etc.).

Inspirado no projeto interno [eixo-webgis](https://github.com/BzRTech/eixo-webgis),
com identidade visual própria da BzR: **cor principal verde** e **tipografia serif**.

## Funcionalidades

- **Painel de gestão** — KPIs de projetos, progresso e demandas por módulo.
- **Mapa operacional** — camadas por módulo municipal, com demandas
  georreferenciadas e situação (pendente / em andamento / concluído).
- **Módulos ativáveis** — ligue/desligue cada módulo no painel lateral.
- **Tema centralizado** — paleta e tipografia controladas por variáveis CSS
  em `src/index.css`, prontas para o rebranding com o Claude Design.

## Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/)
- Tipografia: **Fraunces** (títulos) e **Lora** (texto), com fallback serif do sistema.

## Como rodar

```bash
npm install
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build de produção em dist/
npm run preview  # pré-visualização do build
```

## Estrutura

```
src/
├── App.tsx              # orquestra navegação (Painel / Mapa) e estado dos módulos
├── index.css           # TEMA: paleta verde + tipografia serif (variáveis CSS)
├── data/
│   └── modules.ts      # catálogo de módulos + demandas de exemplo
└── components/
    ├── Topbar.tsx      # barra superior + navegação + marca
    ├── Sidebar.tsx     # lista de módulos municipais (toggle de camadas)
    ├── MapView.tsx     # mapa Leaflet com as demandas
    ├── Legend.tsx      # legenda de situação
    └── Dashboard.tsx   # painel de gestão (KPIs, projetos, módulos)
```

## Identidade visual

A paleta institucional e a tipografia ficam em `:root` no início de
`src/index.css`. Para ajustar o branding (ex.: novas cores vindas do Claude
Design), basta editar as variáveis `--green-*`, `--accent-*`,
`--font-display` e `--font-body` — todo o restante da interface se adapta
automaticamente.

```css
:root {
  --color-primary: var(--green-700); /* verde principal BzR */
  --font-display: "Fraunces", serif; /* títulos serif */
  --font-body: "Lora", serif; /* corpo de texto serif */
}
```

## Dados

Os dados em `src/data/modules.ts` são amostras de demonstração. Em produção,
as camadas devem ser servidas por uma API de geodados (GeoServer, PostGIS,
serviços WMS/WFS ou GeoJSON), mantendo a mesma estrutura de `ModuleDef` e
`Feature`.
