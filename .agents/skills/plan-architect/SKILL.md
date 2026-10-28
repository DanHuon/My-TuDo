---
name: plan-architect
description: Use this skill when creating an implementation_plan.md for a new phase, sub-step, or refactoring in MyTuDo. Enforces API payload prototyping before UI work, Mermaid architecture diagrams, file-by-file change specs, and a strict Green Light approval gate.
---

# 📐 Skill: `plan-architect` (Planejador de Fases & Prototipador de Payloads)

## Objetivo
Padronizar a criação de planos de implementação (`implementation_plan.md`) no **MyTuDo**, garantindo que nenhuma etapa comece sem validação empírica de APIs externas, mapeamento cirúrgico de arquivos e aprovação formal (**Sinal Verde**) do usuário.

---

## Protocolo Obrigatório de Execução

### 1. Sincronização Inicial com o Padrão Akita
Sempre leia `Controle/ESTADO_ATUAL.md` e `Controle/MEMORIA_IA.md` antes de redigir o plano para garantir alinhamento com as regras pétreas vigentes e com as strings canônicas do Triunvirato de IA (`llama-3.3-70b-versatile`, `gemini-3.8-flash`, `deepseek-flash`).

### 2. Prototipagem de Payloads Primeiro (*Payload-First Rule*)
Se a etapa envolver uma nova API externa, query GraphQL, rota Serverless (`/api/*`) ou prompt estruturado de IA:
- **Não adivinhe o formato do JSON.**
- Crie um script temporário em `<artifactDir>/scratch/test_api.mjs` (ou inclua essa etapa como Fase 0 do plano) para inspecionar o payload real, latência, status codes (ex: `429`, `504`) e campos nulos antes de desenhar os componentes React.

### 3. Estrutura Obrigatória do `implementation_plan.md`
Todo artefato `implementation_plan.md` deve conter obrigatoriamente:
1. **Visão Geral & Objetivos da Sub-etapa:** O que será resolvido e qual o valor entregue ao usuário.
2. **Diagrama Arquitetural Mermaid (`flowchart` ou `sequenceDiagram`):** Ilustrando o fluxo entre UI, `Dexie.js`, rotas Serverless (`/api/*`) e APIs externas. Use aspas em todos os rótulos com parênteses `id["Label (Info)"]`.
3. **Estratégia de Proteção de Cotas & Segurança:**
   - Especificar *Debounce* ($\ge 800\text{ms}$), *Cache em Memória* (`Map`), *Lazy Fetching* (ex: RAWG 1+1 requests) e tratamento de `HTTP 429`.
   - Confirmar que chaves privadas permanecem restritas ao servidor e que `NEXT_PUBLIC_GOOGLE_API_KEY` jamais é usada fora do Google Picker.
4. **Especificação Arquivo por Arquivo (`[NEW]`, `[MODIFY]`, `[DELETE]`):**
   - Links clicáveis `file:///` para cada arquivo de `src/` que será alterado, detalhando interfaces, estados e estilos CSS Modules.
5. **Plano de Verificação & QA:**
   - Compilação estrita via `npx tsc --noEmit`.
   - Cenários de teste de estresse e casos de borda.

### 4. Trava de Sinal Verde (*Hard Gate*)
- Utilize `RequestFeedback: true` no `ArtifactMetadata` ao gravar o `implementation_plan.md`.
- 🛑 **PARE IMEDIATAMENTE** após apresentar o plano e aguarde o **SINAL VERDE ABSOLUTO** do usuário antes de tocar em qualquer arquivo dentro de `src/`.

