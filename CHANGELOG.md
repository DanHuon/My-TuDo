# Changelog Oficial: MyTuDo

> Este arquivo é mantido em sincronia com [Controle/CHANGELOG.md](file:///d:/Programacao/MyTuDo/Controle/CHANGELOG.md).

Este documento registra as notas de versão (release notes) do MyTuDo com foco em experiência do usuário e qualidade de engenharia.

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
