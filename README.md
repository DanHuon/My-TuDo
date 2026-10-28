# MyTuDo — Super-App Pessoal Local-First

Gerenciador pessoal moderno, elegante e Local-First, projetado como uma alternativa soberana e de alto desempenho para organização de rotina, conhecimento e entretenimento. A aplicação opera com latência de 0ms diretamente no navegador via IndexedDB (Dexie.js), instala como Progressive Web App (PWA) em dispositivos móveis e desktop, e sincroniza os dados via Google Drive API v3 e Google Calendar API v3, contando com um Backend-for-Frontend (BFF) Serverless minimalista em Next.js 14 para proteção de credenciais e roteamento de Inteligência Artificial.

---

## Módulos da Aplicação

### 1. Gestão de Tarefas e Quadros Kanban
- Lista de tarefas com priorização, subtarefas, prazos e categorias dinâmicas.
- Kanban Temporal e Kanban Categórico com suporte a Drag & Drop via `@dnd-kit/core` (sensores adaptados para mouse e telas touch).
- Preparação para classificação automática via Inteligência Artificial (v9.3).

### 2. Calendário Híbrido (Google Calendar)
- Sincronização bidirecional direta via Google Calendar API v3 com suporte a múltiplos calendários e cores personalizadas.
- Expansão de eventos e tarefas recorrentes através do motor `rrule.js`.
- Isolamento de cache local na tabela `gc_cache` do IndexedDB, prevenindo inchaço no payload de sincronização do Drive.

### 3. Conhecimento e Estudos (Workspace Split-Pane)
- Workspace integrado em desktop com editor rico TipTap no painel esquerdo e galeria de documentos/scans do Google Drive no painel direito, com suporte a subpastas e navegação por breadcrumbs.
- Editor acadêmico com tabelas com seletor de grade visual, imagens flutuantes com quebra de texto (Text-Wrap) e cartões de anexos com leitor de PDF embutido (Lightbox in-loco), mantendo zero arquivos binários no banco local.

### 4. Estante de Entretenimento e Metadados Culturais
- Catálogo de filmes, séries, animes, mangás, jogos eletrônicos e livros com três modos de exibição intercambiáveis: Cards Grandes, Ícones Compactos e Lista Detalhada (estilo Windows Explorer), persistidos no armazenamento local.
- Consulta unificada de metadados via TMDB, RAWG (com arquitetura Lazy Fetching para preservação de cota), AniList GraphQL e Google Books / Open Library.
- Modal de visualização detalhada com dados específicos por categoria (Metacritic com coloração dinâmica, estúdios, diretores, plataformas, ISBN) e botão de sincronização de tetos de episódios/capítulos em 1 clique.

### 5. Memórias
- Registro rápido de notas e pensamentos em grade masonry responsiva com suporte a Markdown e sistema de importação/exportação em texto simples.

---

## Metodologia de Engenharia Assistida por IA e Governança

O desenvolvimento do MyTuDo segue práticas estruturadas de engenharia de software assistida por inteligência artificial, orientadas pelo padrão de documentação e memória de contexto `ai-memory` (Fábio Akita) e executadas através de Agent Skills especializadas na IDE Google Antigravity.

### Linha do Tempo de Agentes de Desenvolvimento

| Período | Papel de Arquitetura e Liderança | Camada de Execução Tática | Marcos Entregues |
| :--- | :--- | :--- | :--- |
| **Fases Iniciais (1 a 7)** | Gemini 3.1 Pro | Gemini 3.5 Flash | Fundação Local-First (Dexie.js), sincronização LWW no Google Drive (`useSync.ts`), PWA (`@serwist/next`), Kanbans (`@dnd-kit`) e Calendário Híbrido (Google Calendar API v3 e `rrule.js`). |
| **Fase Intermediária (8 a v9.2.3)** | Gemini 3.1 Pro | Gemini 3.8 Flash | Transição para o Gemini 3.8 Flash na execução de código. Entrega do Workspace de Estudos Split-Pane (TipTap e Google Drive Readonly) e integração inicial de metadados culturais (TMDB, RAWG, AniList GraphQL, Google Books). |
| **Marco de 28/10/2026 (Auditoria e Governança)** | Gemini 4 Argon | Gemini 3.8 Flash | Auditoria profunda de 7 Pilares (Segurança de Aplicação, LGPD/ToS, prontidão para compilação nativa no APK da Fase 12 e concorrência de sincronização). Implantação do padrão `ai-memory` e esquadrão de 6 Agent Skills em `.agents/skills/`, operando em conjunto com o Gemini 3.8 Flash para refinamentos de código e hotfixes da sub-etapa v9.2.4. |

### Estrutura de Governança Técnica

- `Controle/MEMORIA_IA.md`: Regras pétreas, invariantes do Dexie e anti-patterns.
- `Controle/DECISOES_ARQUITETURAIS.md`: Registro formal de decisões técnicas (ADRs 001 a 012).
- `Controle/ESTADO_ATUAL.md`: Registro de handoff de sessão e fila de execução.
- `Controle/AUDITORIA_E_EVOLUCAO_V9.md`: Relatório completo de auditoria técnica.
- `Requisitos/BACKLOG_FUTURO_IDEIAS.md`: Banco de ideias congeladas para fases subsequentes.

---

## Ecossistema de Credenciais e APIs Externas

As chaves privadas sem o prefixo `NEXT_PUBLIC_` residem exclusivamente no servidor Next.js (`.env.local` / Vercel Secrets), nunca sendo expostas no client-side.

### 1. Google Cloud Platform (GCP)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Identificador OAuth 2.0 Web para autenticação dos escopos `drive.appdata`, `drive.readonly` e `calendar.events`.
- `GOOGLE_CLIENT_SECRET`: Segredo de servidor utilizado nas rotas `/api/auth/token` e `/api/auth/refresh` para troca de código e renovação de credenciais.
- `NEXT_PUBLIC_GOOGLE_API_KEY`: Chave com restrição exclusiva para a Google Picker API no console do GCP, utilizada no módulo de estudos (`useGooglePicker.ts`).
- `NEXT_PUBLIC_SYNC_FILE_NAME`: Nome do arquivo de sincronização na pasta de aplicativo do Drive (`sync_dev.json` localmente vs `sync.json` em produção).

### 2. APIs de Metadados Culturais
- `TMDB_API_KEY`: Utilizada na rota serverless `/api/metadata/tmdb` para consulta de filmes e séries com dados em português.
- `RAWG_API_KEY`: Utilizada na rota serverless `/api/metadata/games` sob demanda via Lazy Fetching (1 requisição na busca e 1 no carregamento de detalhes).
- AniList GraphQL: Consulta pública client-side direta para animes e mangás em `https://graphql.anilist.co`.
- Google Books e Open Library: Consulta pública client-side para catalogação de livros com contingência automática contra limites de requisição.

### 3. Triunvirato Canônico de IA (Runtime da Aplicação — v9.3+)

| Provedor | Variável | Modelo Canônico | Finalidade |
| :--- | :--- | :--- | :--- |
| **Groq Cloud** | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | Processamento primário síncrono (<250ms) para classificação e parsing de comandos. |
| **Google AI Studio** | `GEMINI_API_KEY` | `gemini-3.8-flash` | Fallback de alta disponibilidade e tarefas multimodais de contexto amplo. |
| **DeepSeek Platform** | `DEEPSEEK_API_KEY` | `deepseek-flash` | Relatórios consolidados e inferências analíticas de baixo custo por token. |

---

## Tecnologias Empregadas

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript.
- **Banco de Dados Local:** Dexie.js (IndexedDB) + `dexie-react-hooks`.
- **Editor de Texto:** TipTap (ProseMirror) com extensões customizadas.
- **Calendário e Recorrências:** `react-big-calendar` + `rrule.js` + `date-fns`.
- **Interação Drag and Drop:** `@dnd-kit/core` + `@dnd-kit/sortable`.
- **PWA e Cache Offline:** `@serwist/next`.

---

## Instalação e Execução Local

```bash
git clone <URL_DO_REPOSITORIO>
cd MyTuDo
npm install
npm run dev
```

Acesse o sistema localmente em [http://localhost:3000](http://localhost:3000).
