# MyTuDo 🧠✨ — Super-App Pessoal Local-First ("Segundo Cérebro")

Um Super-App pessoal moderno, elegante e **Local-First**, projetado como uma alternativa soberana e de altíssima performance ao *Notion*, *Anytype* e *Google Keep*. Funciona com latência de `0ms` diretamente no navegador (via **IndexedDB / Dexie.js**), instala como aplicativo nativo (**PWA**) em celulares e PCs, e sincroniza seus dados de forma invisível e segura através da sua própria conta **Google (Google Drive API v3 & Google Calendar API v3)**, contando com um *Backend-for-Frontend (BFF)* Serverless minimalista no **Next.js 14** exclusivamente para proteger chaves de APIs culturais e do **Triunvirato de Inteligência Artificial**.

---

## ✨ Ecossistema de Módulos do Super-App

### 1. ✅ Gestão de Tarefas & Quadros Kanban (`@dnd-kit`)
- **Lista de Tarefas & Filtros Inteligentes:** Gestão rápida com prioridades, subtarefas, prazos e tags coloridas personalizadas.
- **Kanban Temporal & Kanban Categórico:** Organização visual fluida com suporte completo a *Drag & Drop* tanto no Desktop (mouse `8px`) quanto no Mobile (*Touch Long-Press* `300ms` sem travar o scroll).
- **Auto-Tagging Inteligente (Fase 9.3):** Classificação automática de tarefas em milissegundos via Triunvirato de IA.

### 2. 📅 Calendário Híbrido (Google Calendar Clone)
- **Sincronização Bidirecional Real (Google Calendar API v3):** Suporte a múltiplos calendários da conta Google do usuário (Pessoal, Faculdade, Feriados) preservando as cores originais.
- **Motor de Recorrências (`rrule.js`):** Expansão precisa de eventos e tarefas repetitivas (diárias, semanais, mensais, anuais) e lembretes customizados.
- **Isolamento de Cache (`gc_cache`):** Eventos externos do Google Calendar residem em uma tabela local dedicada no IndexedDB para jamais inchar o arquivo `sync.json` do Drive.

### 3. 🎓 Conhecimento & Estudos (Workspace Split-Pane + Google Drive)
- **Workspace Lado a Lado (`100vh`):** No Desktop, exibe o editor rico **TipTap** na esquerda (`paneLeft`) e a galeria de **Scans/PDFs do Google Drive** na direita (`paneRight`) com navegação em subpastas, *breadcrumbs* e cache em memória de `0ms`. No Mobile, adapta-se em abas dedicadas (`📝 Anotações` / `☁️ Scans`).
- **Editor Acadêmico Avançado (TipTap):** Suporte a tabelas com seletor de grade visual `10x10`, fidelidade de colagem do Word/Google Docs, imagens com *Text-Wrap* (`float: left/right`) e cartões de anexo (`DriveAttachmentNode`) com leitor de PDF em **Lightbox in-loco** — mantendo **zero bytes de arquivos binários** no IndexedDB.

### 4. 🎬 Estante de Entretenimento & DNA Cultural
- **Catálogo Multimídia Completo:** Gestão de **Séries, Filmes, Animes, Mangás, Jogos e Livros** com avaliação por estrelas, controle de progresso rápido (`+1` episódio/capítulo/página) e tetos máximos por temporada (`seasonEpisodes`).
- **Busca Automática de Metadados da Web (`MetadataSearchModal`):** Autocompletar em 1 clique consultando **TMDB**, **RAWG**, **AniList GraphQL** e **Google Books / Open Library**, com proteção de Debounce (`850ms`) e cache em memória.
- **View Mode & Sincronização de Tetos (🔄):** Modal de detalhes com widgets específicos do DNA de cada mídia (Metacritic colorido dinamicamente, plataformas, diretores, estúdios, ISBN) e botão para atualizar episódios/capítulos de obras em lançamento com 1 clique.

### 5. 💡 Memórias (Estilo Google Keep)
- **Captura Rápida em Masonry Grid:** Anotações instantâneas com formatação Markdown, busca em tempo real e exportação/importação nativa em `.txt` (com evolução planejada na Fase 10 para Canvas livre integrado ao Google Drive).

---

## 🤖 Metodologia de Engenharia Assistida por IA, Agentes & Governança

O **MyTuDo** é desenvolvido sob uma metodologia rigorosa de **Engenharia de Software Assistida por IA (*AI-First Software Engineering*)**, combinando governança de memória estruturada (**Padrão `ai-memory` de Fábio Akita**) e um esquadrão de **Agent Skills** especializadas na IDE **Google Antigravity**.

### ⏳ Linha do Tempo de Agentes de Desenvolvimento (IDE & Arquitetura)

| Período / Fase | Arquiteto / Tech Lead | Agente de Execução Ágil | Marcos de Engenharia Entregues |
| :--- | :--- | :--- | :--- |
| **1. Fase Inicial (Fases 1 a 7)** | **Gemini 3.1 Pro** | **Gemini 3.5 Flash** | Fundação Local-First (`Dexie.js`), Sincronização LWW no Google Drive (`useSync.ts`), PWA (`@serwist/next`), Kanbans (`@dnd-kit`) e Calendário Híbrido (`Google Calendar API v3` + `rrule.js`). |
| **2. Evolução Intermediária (Fase 8 a v9.2.3)** | **Gemini 3.1 Pro** | **Gemini 3.8 Flash** | Transição da camada de execução rápida para o **Gemini 3.8 Flash**. Entrega do Workspace de Estudos Split-Pane (TipTap + Google Picker/Drive Readonly) e integração de APIs de Entretenimento (TMDB, RAWG, AniList GraphQL, Google Books). |
| **3. Marco de 28/10/2026 (Auditoria v9 & Governança)** | **Gemini 4 Argon** *(Tech Lead Externo & Agente Principal Antigravity)* | **Gemini 3.8 Flash** *(Codificação Direta & Refatoração)* | Introdução oficial do **Gemini 4 Argon** para auditorias profundas de repositório completo (7 Pilares: AppSec, LGPD/ToS, Prontidão APK Fase 12, Concorrência), implantação do padrão **`ai-memory` (Fábio Akita)** na pasta `Controle/` e criação das **6 Agent Skills** em `.agents/skills/`, operando em par com o **Gemini 3.8 Flash** na execução tática de código. |

### 🧠 Governança `ai-memory` (Pasta `Controle/`) e Agent Skills (`.agents/skills/`)
Para eliminar alucinações e poluição de janela de contexto em sessões longas, a documentação viva do projeto é particionada em:
- [`Controle/MEMORIA_IA.md`](file:///d:/Programacao/MyTuDo/Controle/MEMORIA_IA.md): Constituição enxuta de regras pétreas, invariantes Local-First e anti-patterns proibidos.
- [`Controle/DECISOES_ARQUITETURAIS.md`](file:///d:/Programacao/MyTuDo/Controle/DECISOES_ARQUITETURAIS.md): Catálogo histórico de *Architecture Decision Records* (`ADR-001` a `ADR-012`).
- [`Controle/ESTADO_ATUAL.md`](file:///d:/Programacao/MyTuDo/Controle/ESTADO_ATUAL.md): *Session Handoff* instantâneo com o estado da versão atual e a fila imediata de execução.
- [`Controle/AUDITORIA_E_EVOLUCAO_V9.md`](file:///d:/Programacao/MyTuDo/Controle/AUDITORIA_E_EVOLUCAO_V9.md): Relatório técnico de segurança, LGPD, concorrência e arquitetura híbrida Web + APK.
- **Esquadrão de 6 Agent Skills (`.agents/skills/`):** `grill-me-mytudo`, `plan-architect`, `local-first-guard`, `qa-stress-tester`, `security-apk-audit` e `phase-closeout`.

---

## 🔑 Ecossistema de Chaves e APIs Externas da Aplicação

> ⚠️ **Regra de Ouro de Segurança (`AppSec`):** Nenhuma chave privada é comitada no Git (`.env.local` é ignorado via `.gitignore`). Chaves sem o prefixo `NEXT_PUBLIC_` existem **exclusivamente** no ambiente seguro do servidor Next.js / Vercel Secrets e jamais são expostas ao navegador. Veja mais detalhes em [`Controle/SECURITY.md`](file:///d:/Programacao/MyTuDo/Controle/SECURITY.md).

### 1. Google Cloud Console (GCP — Autenticação, Sincronização & Estudos)
| Variável (`.env.local`) | Escopo de Exposição | Origem & Papel na Arquitetura |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Público (Client) | Identificador OAuth 2.0 Web para login Google e solicitação dos escopos `drive.appdata`, `drive.readonly` e `calendar.events`. |
| `GOOGLE_CLIENT_SECRET` | 🔒 Privado (Server) | Usado exclusivamente nas rotas `/api/auth/token` e `/api/auth/refresh` para troca de *Authorization Code* e renovação silenciosa do `refresh_token`. |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | Público Restrito | **Restrita no GCP exclusivamente à Google Picker API** (usada apenas em `useGooglePicker.ts` para seleção visual de pastas do Drive). |
| `NEXT_PUBLIC_SYNC_FILE_NAME` | Público (Client) | Define o arquivo de sincronização no `appDataFolder` (`sync_dev.json` em desenvolvimento local vs `sync.json` em produção). |

### 2. APIs de Metadados Culturais (Módulo de Entretenimento)
| Provedor / API | Variável (`.env.local`) | Modo de Acesso | Papel na Aplicação |
| :--- | :--- | :---: | :--- |
| **TMDB API** | `TMDB_API_KEY` | 🔒 Serverless (`/api/metadata/tmdb`) | Busca em português (`pt-BR` com fallback `en-US`) de **Filmes e Séries**, pôsteres, diretores, emissoras, duração e contagem de episódios por temporada (`seasonEpisodes`). |
| **RAWG API** | `RAWG_API_KEY` | 🔒 Serverless (`/api/metadata/games`) | Busca de **Jogos Eletrônicos** com arquitetura *Lazy Fetching* (plataformas, nota Metacritic, tempo de campanha e sinopse limpa). |
| **AniList GraphQL** | *(Pública / Sem chave)* | 🌐 Client-Side (`graphql.anilist.co`) | Busca ultra-rápida (~200ms) de **Animes e Mangás** com capítulos, volumes, estúdios, mangakás e status oficial de publicação. |
| **Google Books & Open Library** | *(Pública / Sem chave)* | 🌐 Client-Side (com Fallback) | Busca de **Livros** (autores, editora, número de páginas, capa e ISBN) com contingência automática na Open Library contra limites HTTP 429. |

### 3. Triunvirato de Inteligência Artificial (Runtime da Aplicação — `v9.3+`)
Para garantir velocidade instantânea, alta disponibilidade e baixo custo, as funcionalidades de IA do MyTuDo operam em arquitetura de **Triunvirato com JSON Schema Mode Obrigatório**:

| Papel no Triunvirato | Provedor | Variável (`.env.local`) | Modelo Canônico Estrito | Função Principal |
| :--- | :--- | :--- | :--- | :--- |
| **1. Primário (Velocidade Extrema)** | **Groq Cloud** | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | Inferência síncrona em **<250ms** para Auto-Tagging de tarefas e parsing de comandos rápidos em linguagem natural. |
| **2. Fallback & Multimodal** | **Google AI Studio** | `GEMINI_API_KEY` | `gemini-3.8-flash` | Contingência automática caso o Groq oscile/atinja rate-limit, além de tarefas de contexto amplo. |
| **3. Analítico & Insights** | **DeepSeek Platform** | `DEEPSEEK_API_KEY` | `deepseek-flash` | Raciocínio analítico profundo com custo irrisório por token para relatórios e insights de produtividade. |

---

## 🛠️ Stack Tecnológica Principal

- **Framework & BFF:** [Next.js 14](https://nextjs.org/) (App Router + Serverless API Routes) + React 18 + TypeScript Estrito.
- **Banco de Dados Local-First:** [Dexie.js](https://dexie.org/) (IndexedDB) + `dexie-react-hooks` (`useLiveQuery`).
- **Editor Acadêmico Rico:** [TipTap](https://tiptap.dev/) (ProseMirror) + Extensões customizadas (`DriveImageNode`, `DriveAttachmentNode`, Tabelas).
- **Calendário & Recorrências:** `react-big-calendar` + `rrule.js` + `date-fns`.
- **Drag and Drop Mobile/Desktop:** `@dnd-kit/core` + `@dnd-kit/sortable`.
- **PWA & Offline Caching:** `@serwist/next`.

---

## 🚀 Como Executar o Projeto Localmente

### 1. Instalar Dependências
```bash
git clone <URL_DO_REPOSITORIO>
cd MyTuDo
npm install
```

### 2. Configurar Variáveis de Ambiente (`.env.local`)
Crie um arquivo `.env.local` na raiz do projeto seguindo o modelo abaixo:
```env
# 1. Google Cloud OAuth & Picker
NEXT_PUBLIC_GOOGLE_CLIENT_ID="SEU_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="SEU_CLIENT_SECRET"
NEXT_PUBLIC_GOOGLE_API_KEY="SUA_API_KEY_RESTRITA_AO_GOOGLE_PICKER"
NEXT_PUBLIC_SYNC_FILE_NAME="sync_dev.json"

# 2. APIs de Metadados (Entretenimento)
TMDB_API_KEY="SUA_CHAVE_TMDB"
RAWG_API_KEY="SUA_CHAVE_RAWG"

# 3. Triunvirato de IA (Modelos Canônicos: llama-3.3-70b-versatile | gemini-3.8-flash | deepseek-flash)
GROQ_API_KEY="SUA_CHAVE_GROQ"
GEMINI_API_KEY="SUA_CHAVE_GEMINI"
DEEPSEEK_API_KEY="SUA_CHAVE_DEEPSEEK"
```

### 3. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse estritamente em [http://localhost:3000](http://localhost:3000) (porta fixa homologada no Google Cloud Console para o OAuth 2.0).
