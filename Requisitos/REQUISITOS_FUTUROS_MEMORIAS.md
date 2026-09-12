# Requisitos Futuros: Módulo de Memórias (Imagens e Google Drive)

Este documento foi criado para registrar a ideia arquitetural do futuro upgrade no módulo de **Memórias**.

## Visão Geral do Recurso
O usuário deverá ser capaz de anexar imagens diretamente nas Memórias e ter a liberdade de movê-las livremente pelo canvas/tela. O armazenamento e gerenciamento dessas mídias não será local nem no IndexedDB (devido ao limite de cota), mas sim no **Google Drive**.

## Requisitos Técnicos
1. **Google Drive Picker API / Upload:**
   - O aplicativo precisará integrar a API do Google Drive para gerenciar pastas exclusivas do MyTuDo.
   - Quando o usuário anexar uma imagem à Memória, o sistema fará o upload dessa imagem para uma subpasta específica (ex: `MyTuDo/Memories/`).
   - A imagem deverá ser salva com visibilidade controlada pelo usuário, podendo ser listada na interface através dos links gerados pela API do Drive.

2. **Canvas Livre (Drag and Drop):**
   - A interface de edição e visualização de memórias precisará transcender um simples `<textarea>`.
   - Utilizaremos uma engine de Rich Text ou Node Editor (como TipTap com extensões customizadas ou react-rnd para arrastar e redimensionar componentes livremente).
   - O banco de dados (IndexedDB) salvará as propriedades de cada imagem: `driveFileId`, `x_position`, `y_position`, `width`, `height`, `z_index`.

3. **Autenticação:**
   - Teremos que adicionar o escopo de leitura/escrita do Drive (`https://www.googleapis.com/auth/drive.file` no mínimo) no fluxo OAuth já existente, solicitando ao usuário a permissão para que o MyTuDo atue como gerenciador desses arquivos.

4. **Tratamento Offline / Cache:**
   - As imagens provindas do Google Drive serão carregadas por URL autenticada, mas devem prever uma forma elegante de cache local ou _fallback_ visual (ex: skeleton loader) caso o usuário acesse as Memórias sem conexão de internet (PWA offline).
