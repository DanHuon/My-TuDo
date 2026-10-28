---
name: local-first-guard
description: Use this skill whenever modifying src/app/lib/db.ts, src/app/lib/types.ts, src/app/lib/useSync.ts, src/app/lib/useCalendarSync.ts, or external API services in MyTuDo. Enforces Local-First invariants, zero binary blobs in IndexedDB, debounce/cache protection, and schema hygiene.
---

# 🛡️ Skill: `local-first-guard` (Guardião do Dexie, Sync & Cotas de API)

## Objetivo
Proteger a integridade do banco de dados local (**Dexie.js / IndexedDB**), do motor de sincronização em nuvem (**Google Drive `appDataFolder` & Google Calendar API v3**) e das cotas de APIs externas sempre que código de dados ou sincronização for modificado.

---

## Checklist Inegociável de Invariantes

### 1. Higiene do Schema no Dexie (`src/app/lib/db.ts` & `types.ts`)
- [ ] **Zero Blobs Binários:** Nenhuma imagem Base64, buffer de áudio ou arquivo PDF está sendo salvo dentro de `db.items` ou `db.gc_cache`. Apenas strings leves de referência (`driveFileId`, `posterUrl`, `thumbnailLink`) são permitidas.
- [ ] **Gaveta Híbrida (`metadataExtras`):** Campos específicos de nicho em `Entertainment` (como `runtime`, `director`, `metacritic`, `platforms`, `seasonEpisodes`, `authors`, `isbn`) estão sendo salvos dentro de `payload.metadataExtras` sem poluir os índices raízes da tabela `items`.
- [ ] **Desacoplamento de Datas:** `releaseDate` / `releaseYear` armazena exclusivamente a data oficial de lançamento da obra; `startDate` e `endDate` armazenam apenas o período em que o usuário consumiu a obra.
- [ ] **Retrocompatibilidade:** Todo acesso a novos campos em componentes React usa *Optional Chaining* (`item.metadataExtras?.seasonEpisodes?.[currentSeason] ?? item.maxEpisodes`) para não quebrar itens legados vindos do `sync.json`.

### 2. Integridade do Ciclo de Sincronização (`useSync.ts` & `useCalendarSync.ts`)
- [ ] **Tombstones Obrigatórios:** Exclusões em `db.items` **nunca** usam `.delete(id)` físico. Sempre atualizam `{ isDeleted: 1, updatedAt: new Date().toISOString() }`.
- [ ] **Gatilho de Auto-Sync:** Toda mutação local em `db.items` (`add`, `put`, `update`, `bulkPut` de ação do usuário) atualiza `updatedAt: new Date().toISOString()` e dispara `window.dispatchEvent(new Event('dexie-local-change'))`.
- [ ] **Isolamento do `gc_cache`:** Eventos puros do Google Calendar permanecem restritos à tabela `gc_cache` e jamais são mesclados dentro do array exportado para o `sync.json`.
- [ ] **Blindagem de Timezone (`GMT-0300`):** Strings de data pura (`YYYY-MM-DD`) nunca são passadas diretamente para `new Date("YYYY-MM-DD")` (evitando regressão de 1 dia às 21h no Brasil). Sempre utilizar `T12:00:00` ou desestruturação numérica `new Date(year, month - 1, day)`.

### 3. Proteção de Cotas de APIs Externas (`metadataService.ts` & `/api/*`)
- [ ] **Debounce Mínimo de 800ms:** Inputs de busca automática possuem debounce $\ge 800\text{ms}$ antes de acionar a rede.
- [ ] **Cache em Memória (`Map`):** Consultas repetidas na mesma sessão retornam instantaneamente do cache em memória com `0` chamadas HTTP extras.
- [ ] **Lazy Fetching no RAWG:** A busca de jogos consome apenas `1` request na listagem do modal e faz `1` request de detalhe (`/api/metadata/games?id=...`) **somente** para o jogo que o usuário selecionar.
- [ ] **Tratamento Explícito de `HTTP 429` e `504`:** Erros de limite de cota lançam mensagens amigáveis em português (`pt-BR`) ou acionam o fallback automático sem quebrar a UI.

