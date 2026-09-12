# Requisitos Futuros: Módulo de Estudos & Faculdade (Integração Google Drive e Ponteiros)

Este documento foi criado para registrar a arquitetura e os requisitos da fase de Estudos, focando no uso da nuvem pura e em um sistema de referências visuais sem duplicidade de arquivos[cite: 16].

## Visão Geral do Recurso
O módulo será o "Segundo Cérebro" acadêmico do usuário. Ele permitirá a escrita de anotações ricas (Rich Text) e a organização avançada de mídias (fotos de quadros, PDFs) que foram digitalizadas externamente. A arquitetura operará em "Nuvem Pura", onde o aplicativo atuará apenas como um organizador e visualizador de ponteiros (links) para o Google Drive, economizando 100% do armazenamento local[cite: 16].

## Fluxo de Trabalho Padrão (Workflow)
A arquitetura deve suportar rigorosamente o seguinte fluxo operacional:
1. O usuário utiliza o aplicativo nativo do Google Drive (Scanner) para fotografar quadros ou cadernos e faz o upload para pastas estruturadas no Drive.
2. O usuário abre o MyTuDo, acessa o Módulo de Estudos e aciona o Google Picker.
3. O usuário seleciona os arquivos recém-escaneados e os organiza visualmente em abas de unidades, disciplinas ou dias de aula, criando apenas "ponteiros" locais.

## Requisitos Técnicos
1. **Google Drive Picker API (Nuvem Pura):**
   - O aplicativo integrará a interface do Google Picker nativo injetada via script.
   - O Picker será configurado apenas para selecionar arquivos existentes, sem realizar upload direto pelo MyTuDo.
   - Ao selecionar um arquivo, o aplicativo extrairá apenas os metadados (URL, `driveFileId`, `mimeType`, `name`)[cite: 16].

2. **Sistema de Ponteiros e Estrutura de Dados:**
   - O banco de dados local (IndexedDB) salvará exclusivamente os metadados textuais na tabela de notas/estudos[cite: 16].
   - Os arquivos não serão duplicados nem movidos de suas pastas originais no Google Drive. 
   - A interface (UI) permitirá organizar esses ponteiros em estruturas aninhadas: Semestres > Disciplinas > Unidades/Dias.

3. **Autenticação e Escopos:**
   - Será adicionado o escopo de leitura do Drive (`https://www.googleapis.com/auth/drive.readonly`) no fluxo OAuth existente[cite: 16].
   - Isso garantirá que o Picker tenha permissão para varrer o Drive do usuário em busca dos scans de aula.

4. **Tratamento Offline / Fallback Visual:**
   - Como a abordagem escolhida é a "Nuvem Pura", as imagens escaneadas dependerão de conexão com a internet para serem renderizadas.
   - O sistema deve implementar um _fallback_ visual rigoroso (ex: skeleton loaders ou um ícone de "Arquivo na Nuvem - Offline") para que a interface não quebre caso o usuário acesse as anotações do MyTuDo sem internet[cite: 16]. Todo o texto digitado via TipTap continuará acessível offline.