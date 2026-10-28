---
name: phase-closeout
description: Use this skill at the conclusion of every sub-step, phase, or hotfix in MyTuDo. Synchronously updates the Controle/ governance files (Akita ai-memory pattern: ESTADO_ATUAL.md, DECISOES_ARQUITETURAIS.md, MEMORIA_IA.md, ROADMAP.md, CHANGELOG.md) and generates the user walkthrough.
---

# 🏁 Skill: `phase-closeout` (Fechamento Sincronizado Akita & Geração de Walkthrough)

## Objetivo
Garantir que **toda alteração de código, sub-etapa, hotfix ou fase concluída** no **MyTuDo** atualize de forma atômica e sincronizada os arquivos de governança da pasta `Controle/` (seguindo o padrão `ai-memory` de Fábio Akita e a regra global `.agents/rules/controlupdate.md`) e entregue um `walkthrough.md` claro ao usuário.

---

## Checklist Obrigatório de Fechamento (Passo a Passo)

### Passo 1: Atualização Sincronizada da Pasta `Controle/`
Verifique e atualize os 5 arquivos de governança abaixo conforme a natureza da entrega:

1. **`Controle/ESTADO_ATUAL.md` (Obrigatório em toda entrega):**
   - Atualize a data, a **Versão Estável no Código** (ex: `v9.2.4`) e confirme o status do `npx tsc --noEmit`.
   - Mova a sub-etapa recém-concluída para o histórico recente e promova a próxima sub-etapa na **Fila Imediata de Execução**.
2. **`Controle/ROADMAP.md` (Obrigatório ao concluir sub-etapa/fase):**
   - Marque a sub-etapa entregue como `✅ Concluído` detalhando os itens implementados.
   - Atualize o marcador `⏳ Próxima` para a etapa seguinte.
3. **`Controle/CHANGELOG.md` e `CHANGELOG.md` na raiz (Obrigatório em toda versão):**
   - Adicione uma nova seção `## [vX.Y.Z] - YYYY-MM-DD` no topo do arquivo com notas de lançamento (*release notes*) escritas em **Português do Brasil (`pt-BR`)**, focadas no valor entregue ao usuário final.
4. **`Controle/DECISOES_ARQUITETURAIS.md` (Condicional — Novas Decisões):**
   - Se a etapa introduziu uma nova decisão técnica, mudança de biblioteca, alteração de schema ou padrão visual, adicione um novo **ADR (`ADR-01X`)** ou atualize o ADR correspondente.
5. **`Controle/MEMORIA_IA.md` (Condicional — Novas Invariantes):**
   - Atualize **apenas** se uma nova regra pétrea, invariante, modelo canônico ou módulo principal tiver entrado em vigor, mantendo o arquivo enxuto e livre de histórico obsoleto.

### Passo 2: Geração do Artifact `walkthrough.md`
Crie ou atualize `<artifactDir>/walkthrough.md` (com `ArtifactMetadata` configurado como `UserFacing: true`, `RequestFeedback: false`) contendo:
1. **Resumo Executivo das Entregas:** O que foi construído ou corrigido, com links clicáveis `[arquivo.tsx](file:///d:/Programacao/MyTuDo/...)` para todos os arquivos e símbolos modificados.
2. **Tabela de Validação Técnica (QA):** Resultado do `npx tsc --noEmit` (`Exit Code: 0`) e testes de rotas/serviços executados.
3. **Roteiro Prático de Teste para o Usuário:** Passos numerados, claros e rápidos para o usuário validar visualmente a entrega em `http://localhost:3000`.
4. **Status da Governança (`Controle/`):** Confirmação dos arquivos de controle atualizados e indicação da próxima etapa na fila.

