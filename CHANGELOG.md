# Changelog Oficial: MyTuDo

> Este arquivo é mantido em sincronia com [Controle/CHANGELOG.md](file:///d:/Programacao/MyTuDo/Controle/CHANGELOG.md).

Este documento registra as notas de versão (release notes) do MyTuDo com foco em experiência do usuário e qualidade de engenharia.

---

## [v9.3.0] - 2026-10-30
### Motor de Auto-Tagging de Tarefas (Triunvirato de IA) e Polimento Definitivo de UI/UX
- **Motor Serverless de Auto-Tagging (`/api/ai/auto-tag`):** Classificação automática e inteligente de tarefas contra as tags cadastradas pelo usuário, operando com o Triunvirato de IA ordenado por inteligência semântica:
  1. Primário: `gemini-3.8-flash` (Google AI Studio) com validação estrita via JSON Schema.
  2. Fallback 1: `deepseek-flash` (DeepSeek Platform) em modo `json_object`.
  3. Fallback 2: `llama-3.3-70b-versatile` (Groq Cloud) em modo `json_object`.
  - Calibragem semântica em `temperature: 0.25` em todos os modelos e validação determinística anti-alucinação descartando tags inexistentes.
- **Fluxo Assíncrono Desacoplado na UI:** Switch *"Vincular tags automaticamente (IA)"* integrado à criação de tarefas no `TodoApp.tsx`: ao salvar uma nova tarefa, o registro é persistido a 0ms no IndexedDB e o motor de IA classifica as tags em segundo plano com indicador visual sutil na interface.
- **Feedback Elegante sem Alerts:** Botões de tag (`TaskItem.tsx` e `AutoTagButton.tsx`) atualizados com micro-feedbacks visuais nos botões (*"Analisando..."*, *"Tags aplicadas"*, *"Sem tags afins"*), substituindo diálogos modais intrusivos de `alert()`.
- **Blindagem da Bolinha Flutuante (Viewport Clamping):** Implementação de restrição matemática contínua nas coordenadas do menu hambúrguer arrastável na carga inicial do `localStorage` e em listeners de `window.resize`, impedindo que o botão fique inacessível fora da tela ao alternar entre monitores grandes e viewport Mobile (`412x915`).
- **Barra de Ferramentas e Views sem Sobreposição:** Reorganização da toolbar da estante (`EntertainmentList.tsx`) com `flex-wrap` harmonioso entre status e controles de visualização, com indicador visual de rolagem horizontal em telas touch.
- **Roll-over Automático de Temporadas:** O botão `+1` em séries e animes agora permite avançar automaticamente para `Temporada N+1, Episódio 1` ao concluir os episódios de uma temporada intermediária, sincronizando dinamicamente o teto da nova temporada e travando estritamente no final da última temporada disponível.
- **Proporção Livre para Capas Horizontais:** Remoção do contêiner vertical rígido (`200x280px`) no modal de visualização (`EntertainmentViewModal.module.css`), permitindo que artes horizontais (16:9 de jogos eletrônicos) e pôsteres verticais se ajustem naturalmente sem faixas vazias.
- **Trava Reativa contra Tetos Excedidos:** Clamping reativo imediato (`Math.min`) nos inputs de Temporada Atual e Episódio Atual no formulário de entretenimento.
- **Resiliência Avançada de Busca Cultural:**
  - TMDB: Fallback morfológico para variações de singular e plural em português (ex: `"ovelha detetive"` localiza *"As Ovelhas Detetives"*).
  - RAWG: Ampliação para 8 resultados (`page_size=8`) e resolução de termos compostos separados por espaço (ex: `"Cyber punk 2077"` localiza o jogo base *"Cyberpunk 2077"*).
  - Google Books: Circuit Breaker em memória de 15 minutos ao detectar limites de requisição (HTTP 429/403), desviando silenciosamente para a Open Library sem emitir erros no console.
- **README Bilíngue e Versão na Sidebar:** Criação de `README.md` em Inglês (Default) e `README.pt-BR.md` em Português com seletores de idioma no cabeçalho; exibição da versão estável `MyTuDo v9.3.0` no rodapé da `Sidebar.tsx`.

---

## [v9.2.4] - 2026-10-28
### Refinamentos Visuais, Hotfixes da Auditoria e Higienização do Repositório
- **Alternador de Visualização Estilo Windows Explorer:** Novo seletor no topo da Estante permitindo alternar instantaneamente entre três modos de exibição: Cards Grandes (padrão imersivo), Ícones Compactos (grade mais densa) e Lista Detalhada (linhas compactas com miniatura, status, progresso e botão +1), com persistência automática no armazenamento local.
- **Formulário de Entretenimento Reorganizado:** Seletor de Categoria movido para ficar posicionado imediatamente acima do botão "Buscar Metadados da Web", proporcionando um fluxo intuitivo de cadastro.
- **Modal de Detalhes Limpo:** Remoção do título redundante do cabeçalho e remoção do efeito Dual Layer Blur dentro do modal de visualização, exibindo a capa crua com proporções preservadas em contêiner de dimensões fixas sem distorções visuais.
- **Rodapé Global Realocado:** Rodapé inferior da tela principal removido para maximizar a área útil vertical (especialmente no Calendário), com informações transferidas de forma compacta e discreta para a base da Sidebar.
- **Lazy Fetching no RAWG (SEC-02):** Otimização profunda na busca de jogos: a consulta inicial realiza apenas 1 requisição para listar os 5 candidatos no modal, e a requisição de detalhes é realizada sob demanda apenas para o jogo selecionado, reduzindo o consumo de cota de 6 para 2 requisições por busca (economia de 66,7%).
- **Correção no Google Books (SEC-01):** Remoção de parâmetro de chave de API em chamadas do Google Books para evitar bloqueio por restrição de serviço da chave exclusiva do Google Picker.
- **Atribuições Legais de Termos de Serviço (TOS-01):** Rodapé de conformidade legal adicionado no modal de busca e na visualização de detalhes, creditando TMDB, RAWG.io (com link ativo) e AniList.
- **Higienização do Repositório:** Documentos soltos movidos para a pasta de requisitos, exclusão de arquivos órfãos de depuração, exclusão de pastas internas no `.gitignore` e desindexação do repositório Git.

---

## [v9.2.3-gov] - 2026-10-28
### Marco de Auditoria Arquitetural (7 Pilares) e Governança ai-memory
- **Relatório Oficial de Auditoria:** Varredura completa cobrindo Segurança de Aplicação (AppSec), LGPD e Termos de Serviço de APIs, prontidão para o futuro empacotamento nativo da Fase 12 (Capacitor para Android e Tauri v2 para Desktop), análise de concorrência do motor de sincronização e arquitetura da Command Bar Global.
- **Governança de Memória Akita:** Estruturação da pasta Controle/ separando regras ativas (`MEMORIA_IA.md`), histórico de decisões (`DECISOES_ARQUITETURAIS.md` com ADRs 001 a 012) e estado de sessão (`ESTADO_ATUAL.md`).
- **Esquadrão de 6 Agent Skills:** Criação de rotinas especializadas em `.agents/skills/` (`grill-me-mytudo`, `plan-architect`, `local-first-guard`, `qa-stress-tester`, `security-apk-audit`, `phase-closeout`).
- **Cofre de Ideias Futuras:** Criação de `Requisitos/BACKLOG_FUTURO_IDEIAS.md` para arquivamento de conceitos de sinergia entre módulos e visão computacional.

---

## [v9.2.3] - 2026-09-21
### Polimento de Metadados, Capas e Responsividade
- **Sinopses de Jogos Limpas:** Remoção de concatenações de texto na descrição do RAWG.
- **Busca Resiliente no TMDB:** Fallback automático para títulos em inglês quando a consulta em português não retorna dados imediatos.
- **Proteção contra Erros de Cota no Google Books:** Debounce de 850ms para prevenir bloqueios de requisições em rajada.
- **Temporadas com Contagem Precisa:** Denominador contextual de episódios baseado no teto da temporada selecionada.
- **Automação ao Concluir Obras:** Preenchimento automático de progresso ao definir status como "Concluído".
- **Confirmação no Botão de Sincronização:** Micro-toast com status claro de atualização dos tetos.
- **Efeito Dual Layer Blur nos Cards:** Camada de fundo desfocada combinada com imagem frontal sem cortes nos cartões da estante.

---

## [v9.2.2] - 2026-09-21
### Integração Visual de Metadados (AniList e DNA de Mídia)
- **Migração para AniList GraphQL:** Consultas de animes e mangás migradas para a API oficial do AniList com retorno completo de metadados.
- **Sub-seções de DNA Cultural:** Painéis específicos para jogos (Metacritic colorido, plataformas, tempo de jogo), filmes (diretores, duração, tagline), séries (criadores, status) e livros (editora, páginas, ISBN).
- **Botão de Sincronização de Tetos:** Atualização rápida de obras em andamento com micro-toast.

---

## [v9.2.1] - 2026-09-21
### Correções de Modelo de Dados e Limites Rígidos
- **Separação de Datas:** Desacoplamento entre `releaseYear`/`releaseDate` e data de início de consumo do usuário (`startDate`).
- **Tetos Máximos de Progresso:** Criação de `maxEpisodes` e `maxSeasons` no banco com travamento do botão +1 no teto correspondente.

---

## [v9.2.0] - 2026-09-21
### Busca de Metadados da Web no Entretenimento
- **Modal de Seleção Visual:** Apresentação dos 5 melhores resultados com mini-pôsteres, sinopse e contagem de episódios/páginas.
- **Integração com TMDB, RAWG, Jikan e Google Books.**

---

## [v9.1.0] - 2026-09-20
### Modo de Visualização (View Mode) no Entretenimento
- Abertura de modal de detalhes ao executar duplo clique em itens da Estante.
- Controle rápido de progresso (+1) e transição para edição ou exclusão.
