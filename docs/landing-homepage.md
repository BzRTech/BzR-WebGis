# Plano — Landing institucional do BzR WebGIS

## Context

A BzR Tech está montando o `bzr-webgis`, o WebGIS da empresa para gestão de projetos
de geoprocessamento e das demandas municipais em módulos (vias, iluminação, ambiental
etc.). O sistema real (baseado no app de referência `eixo-webgis`, hoje em
`referencia/frontend` no git) já tem um conjunto rico de recursos. Falta uma **página
institucional pública** (landing) que apresente a plataforma para prefeituras/clientes.

Este documento **não é código** — é o **plano de conteúdo e estrutura** (seções,
hierarquia, copy PT-BR, tokens de marca) para você montar a landing no **Claude Design**.
Direção de marca já definida: **cor principal verde** + **tipografia serif** (rebrand
final virá do Claude Design).

Fonte de verdade dos recursos: `referencia/frontend/src/router.tsx`,
`referencia/frontend/src/components/layout/AppShell.tsx` (nav) e as cenas em
`referencia/frontend/src/features/*`.

---

## Tokens de marca (aplicar no Claude Design)

**Cores — verde institucional BzR (principal) + neutros "paper":**
- Verde: `#0d3b25` (900) · `#0f4d31` (800) · `#156540` (700 · principal) · `#1b7a4b` (600) · `#259862` (500) · `#4fa877` (400) · `#c2e3d2` (200) · `#e7f3ec` (100)
- Destaque/terra (opcional, p/ realces): `#c9a227`
- Papel/fundo: `#FAFAF7` (paper) · `#F3F1EA` (paper-2) · linhas `#e5e1d6`
- Tinta/texto: `#14211b` (ink) · `#5c6b63` (muted)
- Status: aprovado `#168821` · pendente `#c5a000` · rejeitado `#e52207`

> No app de referência o realce é amarelo (`#FFD500`) e cantos retos (border-radius 0),
> visual editorial. Na landing, **trocar o amarelo pelo verde** como cor de ação/realce.
> Manter ou suavizar os cantos retos fica a seu critério no Claude Design.

**Tipografia — serif:**
- Títulos/display: serif de peso (ex.: **Fraunces**, "Playfair Display" ou similar).
- Corpo: serif legível (ex.: **Lora**, "Source Serif").
- Micro-rótulos/kickers: manter caixa-alta + tracking largo (podem ficar em sans/mono
  discreto p/ contraste com a serif — decisão de design).

---

## Estrutura da página (seções, na ordem)

### 1. Header / nav (fixo)
- Marca **BzR WebGIS** (placeholder de logo — rebrand virá) + tagline "Gestão Geoespacial".
- Links âncora: Recursos · Módulos · Diferenciais · Contato.
- CTA primário (verde): **"Solicitar demonstração"**.

### 2. Hero
- Kicker: `PLATAFORMA WEBGIS PARA GESTÃO PÚBLICA`
- Título (display serif, grande): **"O território da sua cidade, sob controle."**
- Subtítulo: "WebGIS da BzR para gestão de projetos de geoprocessamento e das demandas
  municipais — mapa, campo e gestão, num só lugar."
- 2 CTAs: **Solicitar demonstração** (verde, sólido) · **Conhecer os módulos** (contorno).
- Visual: mockup do mapa/dashboard (pode ser um artboard-imagem do próprio sistema).
- Faixa de prova: "Offline-first · Dados georreferenciados · Controle de acesso por papel".

### 3. Recursos da plataforma  (pilar 1 — "tudo que tem no sistema")
Grid de cards, um por recurso real do sistema. Ícone + nome + 1 linha:
1. **Mapa WebGIS** — camadas, lotes, ortofoto, heatmap e mapas-base; navegação e busca por inscrição.
2. **Dashboard municipal** — KPIs, gráficos (donut/barras), ranking por bairro e resumo de áreas.
3. **Coleta em campo (BCI)** — formulário de cadastro imobiliário com fotos e GPS, **funciona offline**.
4. **Demandas** — calendário + lista, prioridades, responsáveis e workflow de status.
5. **Relatórios** — relatórios de gestão e de técnicos, com gráficos exportáveis.
6. **Auditoria** — trilha de acessos e ações dos usuários.
7. **Importação de dados** — importar lotes e feições geográficas (polígonos/linhas/pontos).
8. **Usuários e papéis** — admin, coordenador e técnico, com permissões por papel.

### 4. Módulos municipais  (pilar 2)
Seção dedicada à divisão por módulos (o modelo de negócio da BzR). Cards/lista:
- **Gestão de Vias** — pavimentação, sinalização, buracos, manutenção viária.
- **Gestão de Iluminação** — parque de iluminação pública, troca de luminárias, LED.
- **Gestão Ambiental** — arborização, APPs, licenciamento, fiscalização.
- **Gestão de Drenagem** — bocas de lobo, galerias, pontos de alagamento.
- **Gestão de Resíduos** — coleta seletiva, ecopontos, descarte irregular.
- Nota de extensibilidade: "Novos módulos sob demanda da prefeitura."
- Cada módulo mostra situação das demandas (pendente / em andamento / concluído).

### 5. Diferenciais  (pilar 3)
Bloco de destaques (3–4 colunas ou lista com números):
- **Offline-first / PWA** — técnicos trabalham em campo sem internet; sincroniza depois.
- **Controle de acesso por papel** — cada equipe vê e faz apenas o que lhe cabe.
- **Dados georreferenciados** — tudo no mapa, integrável a GeoServer/PostGIS/WMS/WFS/GeoJSON.
- **Pronto para rebrand** — identidade (cores/tipografia) centralizada, evolutiva com o Claude Design.

### 6. Como funciona (fluxo em 3–4 passos)
1. Importar a base territorial (lotes/feições). 2. Equipes coletam e abrem demandas em
campo. 3. Gestão acompanha por dashboard e relatórios. 4. Auditoria garante rastreabilidade.

### 7. CTA final
- Faixa verde: **"Leve o WebGIS para a sua cidade."** + botão **Solicitar demonstração**.

### 8. Rodapé
- Marca BzR + tagline · links das seções · contato (`contato.bzrtech@gmail.com`) ·
  "© 2026 BzR Tech".

---

## Copy — banco de textos (PT-BR, prontos p/ colar)
- Kicker hero: `PLATAFORMA WEBGIS PARA GESTÃO PÚBLICA`
- H1: `O território da sua cidade, sob controle.`
- Sub: `Mapa, campo e gestão das demandas municipais — organizados por módulos, num só lugar.`
- Seção Recursos (título): `Uma plataforma, todo o ciclo de gestão territorial.`
- Seção Módulos (título): `Dividido em módulos, do jeito que a prefeitura trabalha.`
- Seção Diferenciais (título): `Feito para o campo e para a gestão.`
- CTA final: `Leve o WebGIS para a sua cidade.`

---

## Como usar no Claude Design
1. Criar um canvas multi-artboard: **1 artboard = 1 seção** (Hero, Recursos, Módulos,
   Diferenciais, Como funciona, CTA, Rodapé), mais um artboard "guia de marca" com os
   tokens acima (paleta verde + par de fontes serif).
2. Aplicar os tokens de cor/tipografia; usar o verde `#156540` como cor de ação (no lugar
   do amarelo do sistema de referência).
3. Preencher com a copy do banco acima; ícones consistentes para os 8 recursos e 5 módulos.
4. Exportar/compartilhar do próprio Claude Design.

## Verificação
- Conferir que os **8 recursos** e **5 módulos** batem com o sistema real
  (`router.tsx` + `AppShell.tsx` nav): Mapa, Dashboard, Coleta/BCI, Demandas, Relatórios,
  Auditoria, Importar, Usuários.
- Ler a landing em voz alta: hero → recursos → módulos → diferenciais → CTA deve contar a
  história "o que é, o que faz, por que a BzR, próximo passo".
- Checar contraste (verde sobre paper) e legibilidade da serif em tamanhos de corpo.

## Fora de escopo (deste plano)
- Não implementa código da landing (deliverable = plano/estrutura).
- Não altera o app em `referencia/` nem faz o merge/retheme do sistema (assunto separado,
  já em andamento no branch `claude/elegant-sagan-IZCJ3`).
