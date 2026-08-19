# Requisitos e Viabilidade de Implementação: MyTuDo

Este documento serve como um guia vivo para a análise e planejamento da implementação dos novos requisitos no MyTuDo.

## 1. Tasks e Calendário (Eventos e Recorrência)

**Viabilidade: Alta | Complexidade: Alta**

### 1.1 e 1.2.1 - Recorrência e Histórico (Logs)
- **Desafio:** Lidar com tarefas que se repetem e registrar que a tarefa foi cumprida no ciclo anterior.
- **Solução Técnica:** 
  - Ao invés de usar apenas um objeto `Task`, podemos implementar o padrão de **Eventos Recorrentes (RRULE)**. Uma tarefa recorrente é um "molde".
  - **Geração de Instâncias:** A UI vai calcular e exibir as instâncias futuras baseadas na regra (ex: "toda terça e quinta").
  - **Histórico (Log):** Quando o usuário marcar uma tarefa recorrente como concluída (ex: "tomar remédio hoje"), nós salvaremos um registro no banco de dados (`TaskCompletionLog`) com a data exata em que foi cumprida.
  - A renovação automática na lista será natural, pois se hoje é terça, a tarefa aparecerá para hoje; se foi marcada como feita, ela some da visão de pendentes de hoje. Na visão do KanBan, ela pode aparecer no "Concluído" apenas no escopo do dia atual.

### 1.2 e 1.2.2 - Telas "Agenda, Semana, Hoje" e Google Calendar
- **Desafio:** Ter interface de calendário interativa e sincronizar bidirecionalmente com o Google Calendar e funcionar offline.
- **Solução Técnica:**
  - **UI:** Usar bibliotecas consolidadas como `FullCalendar` ou `react-big-calendar`, que já oferecem visualizações ricas (Mês, Semana, Dia, Agenda) idênticas ao Google Calendar.
  - **Integração Google (Aproveitamento da Auth Atual):** Como o aplicativo já faz o login usando `@react-oauth/google` para o Drive, basta adicionarmos o escopo (scope) do Google Calendar (`https://www.googleapis.com/auth/calendar.events`). Isso nos permite *importar o seu calendário atual* e agir diretamente nele, sem precisar criar um do zero.
  - **Sincronização Offline-First:** 
    1. O App faz um fetch dos eventos diretamente do Google Calendar via API e salva um cache rápido no banco de dados local (IndexedDB Dexie).
    2. Modificações (criar/editar/apagar) ocorrem no banco local instantaneamente, mantendo a experiência fluida e permitindo uso offline.
    3. Em background, o webapp envia a mudança de volta para o Google Calendar, tornando-o o servidor centralizador ("Backend") da Agenda.

---

## 2. Memórias (Pensamentos e Anotações Rápidas)

**Viabilidade: Alta | Complexidade: Baixa**

- **Desafio:** Seção de pensamentos isolados de Tasks, filtráveis por Tags.
- **Solução Técnica:**
  - De acordo com a arquitetura atual do app, já temos uma tabela de IndexedDB genérica chamada `items` e um sistema de Tags dinâmico embutido no payload.
  - Para as memórias, em vez de criar uma tabela nova, nós vamos apenas injetar objetos com `type: 'memory'`.
  - Como as Tags do app já são um array salvo dentro do `payload`, as memórias herdarão nativamente o **mesmo ecossistema de Tags** já existente.
  - Na UI, a tela de Memórias faz uma query no banco buscando apenas por `type === 'memory'`, garantindo que elas jamais se misturem na tela de Tasks (`type === 'task'`), mesmo compartilhando as mesmas tags.

---

## 3. Estudos / Pesquisas Pessoais

**Viabilidade: Alta | Complexidade: Média**

### 3.0 - Anotações Maiores e Editor Rico
- **Desafio:** "Página infinita" com formatação avançada (estilo Notion/Word) que suporte textos, links, imagens e embeds.
- **Solução Técnica (Tiptap vs Google Docs):** Optaremos por um editor WYSIWYG robusto (como `TipTap` ou `Editor.js`) integrado nativamente ao app, em vez de apenas embedar um iframe do Google Docs. O motivo disso é vital para a premissa do MyTuDo: **PWA Local-First e Offline**. 
  - Se usássemos Google Docs/Sheets, você ficaria refém de internet para sequer abrir e ler suas anotações, perdendo totalmente a pesquisa rápida e instantânea e a fluidez do app.
  - Usando o editor nativo (Notion-style), o documento vive localmente com você (salvo no Dexie) e a sincronização dele como arquivo JSON vai pro Drive, mas ele sempre abre em 0 segundos mesmo no modo avião.

### 3.1 - Integração de Mídias com Google Drive
- **Desafio:** Salvar as imagens anexadas não apenas localmente, mas enviá-las para o Google Drive e utilizá-las de lá, poupando armazenamento local.
- **Solução Técnica:**
  - Com o token do OAuth2 (o mesmo usado para o Calendário), o aplicativo terá acesso à Google Drive API.
  - Quando o usuário soltar (drag & drop) ou selecionar uma imagem no editor, o webapp fará um *upload em background* para uma pasta específica do usuário no Drive (ex: `MyTuDo/Midias`).
  - Assim que o upload concluir, pegamos o link público/compartilhado do arquivo no Drive e inserimos no editor de texto. O documento do app guardará apenas o Link do Drive, não os bytes da imagem.

---

## 4. Entretenimento (Watchlist / Readlist)

**Viabilidade: Alta | Complexidade: Baixa**

- **Desafio:** Módulo para organizar livros, séries, animes, jogos, com status e acompanhamento de progresso.
- **Solução Técnica:**
  - Mesma lógica do módulo de Memórias. Vamos inserir registros na tabela unificada `items` com `type: 'entertainment'`.
  - O `payload` do objeto carregará `categoria` (Serie, Filme, Livro, etc.), `status` (Plan to watch/read, Doing, Completed), `progresso` (ex: "Episódio 5", ou "Página 140") e `nota`.
  - O sistema de **Tags será compartilhado**. Você pode taggear uma série com `Urgente` se quiser, e a arquitetura do banco local já saberá ligar a tag ao item, sem misturar a visualização com as tarefas, pois as queries das telas sempre filtram por `type`.

---

## 5. Trabalho e Faculdade

**Viabilidade: Alta | Complexidade: Média-Alta**

### 5.1 - Trabalho
- **Desafio:** Organizar anotações extensas por projeto.
- **Solução Técnica:** Usar a mesma arquitetura de "Página Infinita" (Editor Rico) definida no Requisito 3, mas categorizadas sob uma entidade `Project`, que terá uma lista em sua tela inicial.

### 5.2 - Faculdade e Integração Avançada com Google Drive
- **Desafio:** Hierarquia de sub-seções (Matéria > Assunto > etc.) e integração de visualização de arquivos do Google Drive que foram upados por outros dispositivos (ex: app de Scan no celular).
- **Solução Técnica:**
  - **Hierarquia:** Podemos usar uma estrutura de "Pastas Virtuais" ou "Páginas Aninhadas" (como no Notion), onde uma página pode conter sub-páginas infinitamente.
  - **Drive Folder Mapping (Espelhamento):** 
    - O app mapeará pastas específicas do Google Drive do usuário (ex: pasta da faculdade que ele usa para salvar os scans).
    - Usando a API do Drive, o app fará consultas periódicas (`list files` na pasta da matéria) para mostrar os PDFs e imagens recentes diretamente na visualização da Matéria no App.
    - Componentes de preview de PDF ou carrosséis de imagens buscarão e mostrarão o conteúdo diretamente das URLs do Drive, fechando o ciclo de gerenciar os arquivos no app e visualizá-los, mas mantendo a nuvem do Google como repositório primário.

---

## 6. Configurações e Tema Escuro (Dark Mode)

**Viabilidade: Alta | Complexidade: Baixa**

### 6.1 - Tema Escuro (Dark Mode)
- **Desafio:** Alternar entre temas claro e escuro de forma fluida e salvar a preferência do usuário.
- **Solução Técnica:**
  - Implementação via classes CSS / variáveis de tema (tokens de cor em CSS puro/Tailwind se aplicável).
  - Um botão de Toggle acessível rapidamente na barra superior (header/sidebar) e também espelhado na aba de Configurações.
  - Persistência da preferência em `localStorage` ou no próprio Dexie, com detecção inicial automática baseada na preferência do sistema (`prefers-color-scheme`).

### 6.2 - Aba/Modal de Configurações (Settings)
- **Desafio:** Centralizar opções de personalização, dados da conta e diagnóstico de armazenamento.
- **Solução Técnica:**
  - **Uso do Google Drive Storage:** Consulta à API do Google Drive (`about.get` com campo `storageQuota`) para exibir uma barra de progresso visual de uso (ex: "X MB usados de 15 GB").
  - **Sincronização & Diagnóstico:** Status da última sincronização com o Drive, botão para forçar sincronização manual, opção de exportação/backup dos dados locais em `.json` e limpeza de cache local.
  - **Preferências Gerais:** Tema (Claro/Escuro/Sistema), layout padrão inicial ao abrir o app (ex: abrir direto na Agenda ou no Kanban), e atalhos de teclado.
