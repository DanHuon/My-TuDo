# 📢 Changelog Oficial: MyTuDo

> Este arquivo é mantido em sincronia com [Controle/CHANGELOG.md](file:///d:/Programacao/MyTuDo/Controle/CHANGELOG.md).

Este documento registra todas as atualizações e notas de versão (*release notes*) do **MyTuDo**, com foco na experiência do usuário final.

---

## [v9.2.2] - 2026-09-21
### 🎨 Integração Visual de Metadados (AniList & DNA de Mídia)
- **Migração Definitiva para o AniList (GraphQL):** Fim dos erros de timeout em animes e mangás. As consultas agora utilizam a API oficial do AniList, trazendo dados riquíssimos em tempo real (capítulos, volumes, estúdios, média de notas e status de lançamento traduzido).
- **Sub-Seções Visuais de DNA no View Mode:**
  - **Jogos:** Selo com pontuação do Metacritic colorido dinamicamente (Verde para aclamação, Amarelo para misto, Vermelho para abaixo da média), estimativa de horas de jogo (`playtime`), classificação indicativa e lista de plataformas disponíveis.
  - **Filmes:** Frase de efeito (Tagline) estilizada abaixo do título, duração formatada em horas e minutos (`Xh Ym`), diretor(es) e nota da crítica TMDB.
  - **Séries:** Criador(es), emissora original (ex: HBO, Netflix, AMC), status oficial da produção e nota TMDB.
  - **Animes e Mangás:** Estúdio responsável, formato da obra (TV, Filme, Mangá), status oficial e contagem de volumes e capítulos.
  - **Livros:** Autores, editora, total de páginas e código ISBN.
- **Sincronização de Tetos em 1 Clique (🔄):** Obras em andamento agora contam com o botão "Sincronizar Tetos" na tela de visualização. Ao clicar, o sistema consulta a API externa e atualiza automaticamente a quantidade de episódios ou capítulos lançados, emitindo um aviso em banner (micro-toast) sem fechar o modal.

---

## [v9.2.1] - 2026-09-21
### 🛠️ Correções de Modelo de Dados & Limites Rígidos de Progresso
- **Separação de Datas:** A data oficial de lançamento da obra agora é salva no campo dedicado `releaseYear`/`releaseDate`, preservando a data de início (`startDate`) estritamente para o momento em que você começou a consumir a obra.
- **Tetos Máximos de Episódios/Páginas:** Implementação de `maxEpisodes` e `maxSeasons` no banco de dados. O botão de avanço rápido `+1` na tela de detalhes e no cartão agora trava automaticamente ao atingir o teto da obra.
- **Preparação para Sincronização Dinâmica (Sync 🔄):** Estrutura desenhada para atualizar tetos de obras em lançamento com 1 clique.

---

## [v9.2.0] - 2026-09-21
### 🔍 Busca Inteligente de Metadados da Web no Entretenimento
- **Autocompletar com 1 Clique:** Novo botão "🔍 Buscar Metadados da Web" no formulário de cadastro e edição de itens de Entretenimento.
- **Mini-Modal de Seleção Visual:** Apresenta os 5 melhores resultados com mini-pôsteres em alta resolução, título oficial, título original/autores, ano de lançamento, sinopse resumida e contagem de episódios/páginas/temporadas.
- **Integração com Múltiplas Fontes Especializadas:**
  - **Filmes e Séries:** Conexão nativa com a base de dados do TMDB com sinopses e títulos oficiais em português (pt-BR).
  - **Jogos Eletrônicos:** Consulta direta à base de dados internacional do RAWG Video Games Database.
  - **Animes e Mangás:** Consulta ao MyAnimeList (via Jikan v4) com fallback inteligente para séries do TMDB.
  - **Livros:** Busca no Google Books com contingência automática e ilimitada na Open Library.
- **Proteção contra Sobrecarga e Rate-Limits:** Sistema integrado de cache em memória (respostas instantâneas a buscas repetidas) e tratamento amigável de limites de API (HTTP 429).
- **Pré-visualização Instantânea da Capa:** Visualização da imagem diretamente no formulário ao colar ou autocompletar uma URL.
- **Refinamentos da Estante:** Indicador explícito de Temporada (`T: X | Ep: Y`) nos cartões de Séries e Animes e fechamento com a tecla `Escape`.

---

## [v9.1.0] - 2026-09-20
### 🎬 Modo de Visualização Elegante (View Mode) no Entretenimento
- **Novo View Mode no Duplo Clique:** Ao dar duplo clique em qualquer item da Estante (filmes, séries, animes, jogos, livros), abre-se um modal de visualização imersivo com pôster ampliado, sinopse completa e badges de status.
- **Progresso Rápido no Próprio Modal:** Avance episódios ou capítulos com o botão `+1` diretamente na tela de detalhes sem precisar entrar em modo de edição.
- **Transição Rápida para Edição:** Botão "✏️ Editar" no rodapé para alternar instantaneamente para o formulário completo.
- **Exclusão Segura:** Botão de exclusão com confirmação rápida dentro da própria tela de visualização.

---

## [v8.2.83] - 2026-09-20
### 🌟 Interatividade Avançada de Mídia (Finalização da Fase 8)
- **Arrastar e Soltar no Desktop (Drag & Drop):** Agora você pode arrastar qualquer scan ou documento da galeria diretamente para dentro do seu texto na anotação.
- **Alinhamento e Contorno de Imagens (Text Wrap):** Ao clicar em uma foto no editor, uma barra flutuante permite alinhá-la à Esquerda, Centro ou Direita. O texto agora contorna suavemente as fotos de quadros e livros.
- **Visualizador de PDF no Aplicativo:** PDFs anexados agora abrem diretamente no leitor interno (Lightbox) sem abrir abas adicionais no navegador.
- **Formatação Visual dos Botões:** Os botões de **B** (Negrito), *I* (Itálico) e ~~S~~ (Tachado) da barra de ferramentas agora exibem visualmente o estilo que aplicam.

---

## [v8.2.821] - 2026-09-19
### 🛠️ Hotfix de Estabilidade e Tabelas
- **Criação Visual de Tabelas:** Novo seletor em grade (estilo Word/Docs) que permite desenhar tabelas de até 10x10 apenas passando o mouse.
- **Fidelidade ao Copiar e Colar:** Tabelas copiadas do MyTuDo agora colam no Google Docs e Microsoft Word com bordas e formatação intactas.
- **Acesso Seguro a Pastas:** Aviso claro quando uma pasta vinculada do Google Drive não tiver permissão de acesso, evitando telas em branco.
- **Foco Instantâneo da Barra de Ferramentas:** Correção da necessidade de dar Alt+Tab para ativar os botões de tabela.

---

## [v8.2.82] - 2026-09-18
### 💻 Workspace Lado a Lado & Modo Mobile Inteligente
- **Fim dos Modais no Computador:** Ao editar ou criar anotações no desktop, o editor abre lado a lado com a galeria de scans da nuvem.
- **Rolagem Independente:** O texto da anotação e a galeria de fotos rolam separadamente com altura travada na tela.
- **Navegação por Abas no Celular:** Em smartphones, a tela divide-se em abas ergonômicas ("📝 Anotações" e "☁️ Scans") com transição automática ao selecionar anexos.

---

## [v8.2.81] - 2026-09-17
### 📂 Navegação de Subpastas & Menu Recolhível
- **Explorador de Subpastas do Drive:** Navegação em pastas aninhadas com trilha de navegação (*Breadcrumbs*) e retorno instantâneo (0ms de espera).
- **Menu Lateral Recolhível no Desktop:** Possibilidade de ocultar a barra lateral para ganhar mais foco e área de leitura/escrita.
- **Botão de Atualização Rápida:** Botão de recarregamento para sincronizar uploads recentes do Drive sem sair da página.

---

## [v8.2.7] - 2026-09-15
### 🖼️ Pré-visualização em Alta Resolução & Anexos Híbridos
- **Lightbox de Scans:** Clique para ampliar imagens em alta resolução e navegar em documentos PDF completos.
- **Novo Modal de Inserção de Mídia:** Adicione anexos colando links do Google Drive com validação em tempo real ou usando o seletor visual do Drive.
- **Dois Modos de Exibição:** Escolha entre incorporar imagens diretamente no texto ou exibi-las como cartões elegantes de anexo.

---

## [v8.1.0] - 2026-09-10
### 🎓 Fundação da Central de Conhecimento e Estudos
- **Editor de Texto Rico (TipTap):** Suporte completo a títulos, listas com marcadores, listas ordenadas, tabelas e imagens.
- **Hierarquia Acadêmica:** Organização em Matérias > Assuntos > Anotações de Estudo.
- **Nuvem Pura (Zero Cota Local):** Integração com o Google Drive sem consumir espaço do seu dispositivo.
