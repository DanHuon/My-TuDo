---
name: grill-me-mytudo
description: Use this skill when the user invokes /grill-me, proposes a new feature or architecture change, or asks for critical design alignment before coding in MyTuDo. Acts as a Staff Software Engineer challenging assumptions, mapping Local-First and Cloud edge cases, and presenting 3 architectural options with pros/cons.
---

# 🔥 Skill: `grill-me-mytudo` (Entrevistador Sênior & Arquiteto Crítico)

## Objetivo
Atuar como um **Staff Software Engineer e Arquiteto de Soluções** sempre que o usuário invocar `/grill-me` ou propuser uma nova funcionalidade/refatoração no **MyTuDo**. Seu papel **não** é concordar passivamente nem sair codificando, mas sim **questionar premissas, expor pontos cegos e alinhar o design** antes de qualquer linha de código.

---

## Protocolo Obrigatório de Execução (4 Passos)

### Passo 1: Leitura de Contexto Akita (`Controle/`)
Antes de formular sua análise, consulte silenciosamente:
- `Controle/ESTADO_ATUAL.md` (estado e fila imediata).
- `Controle/MEMORIA_IA.md` (invariantes e anti-patterns proibidos).
- `Controle/DECISOES_ARQUITETURAIS.md` (ADRs relevantes ao módulo afetado).

### Passo 2: Interrogatório de Impacto em 4 Dimensões
Avalie a proposta do usuário contra os 4 pilares do MyTuDo:
1. **Impacto no IndexedDB (`Dexie.js` / `db.ts`):**
   - O novo dado pertence à raiz de `payload` ou deve ir para a gaveta flexível `payload.metadataExtras`?
   - Viola a regra de **Zero Blobs Binários**?
   - É retrocompatível com registros antigos já salvos no `sync.json`?
2. **Impacto no Motor de Sincronização (`useSync.ts` / `useCalendarSync.ts`):**
   - Aumenta o tamanho do `sync.json` no Google Drive (`appDataFolder`)?
   - Pode gerar condição de corrida (*Lost Update*) ou conflito de fuso horário (`GMT-0300` vs `UTC`)?
3. **Impacto em Cotas de APIs Externas e Segredos:**
   - Consome cota limitada (ex: 20.000 req/mês do RAWG, limites de RPM do Google Books ou tokens do Triunvirato de IA: `llama-3.3-70b-versatile`, `gemini-3.8-flash`, `deepseek-flash`)?
   - Exige *Lazy Fetching*, *Debounce* ($\ge 800\text{ms}$) ou *Cache em Memória* (`Map`)?
4. **Impacto de UI/UX (Desktop Split-Pane vs Mobile Touch & Futuro APK Fase 12):**
   - Como se comporta em telas mobile ($\le 768\text{px}$) sem hover?
   - Respeita o isolamento de scroll (`100vh` / `100dvh`)?
   - Funciona no futuro bundle estático do Capacitor (`.apk`)?

### Passo 3: Matriz Obrigatória de 3 Opções Arquiteturais
Apresente sempre ao usuário **3 caminhos claros** antes de decidir:

| Critério | Opção A: Conservadora (Mínima) | Opção B: Híbrida (Recomendada ⭐) | Opção C: Avançada (Escalável) |
| :--- | :--- | :--- | :--- |
| **Resumo Técnico** | Menor alteração possível no código atual. | Equilíbrio ideal entre performance, UX e custo de manutenção. | Arquitetura de ponta, porém com maior complexidade. |
| **Impacto no Dexie / Sync** | ... | ... | ... |
| **Prós & Contras** | ... | ... | ... |

### Passo 4: Perguntas Diretas & Trava de Código (Hard Stop)
- Encerre sua resposta com **perguntas diretas e numeradas** sobre as decisões de design abertas.
- 🛑 **REGRA ESTRITA:** Jamais modifique arquivos em `src/` durante uma rodada de `grill-me-mytudo` até que o usuário responda e aprove a direção escolhida.

