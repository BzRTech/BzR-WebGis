# BzR WebGIS

WebGIS da **BzR Tech** para gestão de projetos de geoprocessamento e das
demandas municipais, organizado em módulos (gestão de vias, iluminação,
ambiental, drenagem, resíduos, etc.).

Inspirado no projeto interno [eixo-webgis](https://github.com/BzRTech/eixo-webgis),
com a identidade visual da **BzR Technology** entregue pelo Claude Design:
verde-sinal `#008037`, Space Grotesk + JetBrains Mono e "O Bloco" — o quadrado
com um único canto arredondado, sempre o superior-direito.

## Funcionalidades

- **Landing institucional** — página pública de apresentação da plataforma
  (recursos, módulos, diferenciais e contato). É a tela de entrada do app.
- **Painel de gestão** — KPIs de projetos, progresso e demandas por módulo.
- **Mapa operacional** — camadas por módulo municipal, com demandas
  georreferenciadas e situação (pendente / em andamento / concluído).
- **Módulos ativáveis** — ligue/desligue cada módulo no painel lateral.
- **Tema centralizado** — paleta e tipografia controladas por variáveis CSS
  em `src/index.css`, prontas para o rebranding com o Claude Design.

## Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/)
- Tipografia: **Space Grotesk** (display) e **JetBrains Mono** (etiquetas),
  com fallback para as fontes do sistema.

## Como rodar

```bash
npm install
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build de produção em dist/
npm run preview  # pré-visualização do build
```

## Estrutura

```
public/
├── favicon.svg, icon-*.png, site.webmanifest   # ícones da marca
└── marca/              # pacote de logo (bloco, wordmarks) + LEIA-ME
src/
├── App.tsx             # alterna Landing ↔ plataforma (Painel / Mapa)
├── index.css           # TEMA: tokens da marca BzR (variáveis CSS)
├── data/
│   └── modules.ts      # catálogo de módulos + demandas de exemplo
├── landing/
│   ├── Landing.tsx     # landing institucional (porte do artboard do Claude Design)
│   ├── HeroShot.tsx    # moldura com o print do sistema (slot de imagem)
│   ├── content.ts      # copy PT-BR da landing
│   └── landing.css     # estilos da landing (escopados em .landing)
└── components/
    ├── Topbar.tsx      # barra superior + navegação + marca
    ├── Sidebar.tsx     # lista de módulos municipais (toggle de camadas)
    ├── MapView.tsx     # mapa Leaflet com as demandas
    ├── Legend.tsx      # legenda de situação
    └── Dashboard.tsx   # painel de gestão (KPIs, projetos, módulos)
```

### Print do hero

O hero da landing tem um slot para uma imagem do sistema. Coloque um print em
`public/hero-webgis.png` e ele aparece automaticamente; sem o arquivo, o slot
mostra o estado vazio com a instrução.

## Identidade visual

A paleta institucional e a tipografia ficam em `:root` no início de
`src/index.css`. Para ajustar o branding basta editar as variáveis
`--green-*`, `--ink-*`, `--font-*` e `--radius-*` — todo o restante da
interface se adapta automaticamente.

```css
:root {
  --color-primary: var(--green-600); /* verde-sinal #008037 */
  --font-display: "Space Grotesk", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --radius: 0 12px 0 0; /* "O Bloco": canto arredondado no superior-direito */
}
```

Regras da marca (ver `public/marca/LEIA-ME.txt`): o canto arredondado fica
**sempre** no superior-direito, o verde é a **única** cor de ação, e a marca
não usa degradê, sombra ou contorno.

## Dados

Os dados em `src/data/modules.ts` são amostras de demonstração. Em produção,
as camadas devem ser servidas por uma API de geodados (GeoServer, PostGIS,
serviços WMS/WFS ou GeoJSON), mantendo a mesma estrutura de `ModuleDef` e
`Feature`.
