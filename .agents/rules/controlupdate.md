# Regra Obrigatória de Governança e Atualização da Pasta `Controle/` (Padrão Akita `ai-memory`)

Sempre que for feita qualquer alteração de código, concluída uma sub-etapa, hotfix, auditoria ou fase no projeto **MyTuDo**, você **DEVE OBRIGATORIAMENTE** executar o protocolo da Skill `phase-closeout` e atualizar sincronizadamente os arquivos da pasta `Controle/`:

1. **`Controle/ESTADO_ATUAL.md`:** Atualizar sempre a versão estável atual, o resumo da última entrega concluída e a fila imediata de próximas sub-etapas (Session Handoff).
2. **`Controle/ROADMAP.md`:** Marcar a etapa/sub-etapa finalizada como `✅ Concluído` e apontar a próxima como `⏳ Próxima`.
3. **`Controle/CHANGELOG.md` (e `CHANGELOG.md` na raiz, quando aplicável):** Registrar as notas da versão (*release notes*) em Português do Brasil (`pt-BR`) estrito.
4. **`Controle/DECISOES_ARQUITETURAIS.md`:** Registrar um novo ADR (`ADR-01X`) ou atualizar um existente sempre que uma decisão arquitetural, mudança de API ou regra de modelagem for tomada.
5. **`Controle/MEMORIA_IA.md`:** Manter como a Constituição enxuta de regras pétreas, invariantes, anti-patterns proibidos e strings canônicas do Triunvirato de IA (`llama-3.3-70b-versatile`, `gemini-3.8-flash`, `deepseek-flash`), sem jamais reintroduzir contradições históricas.
Sempre que for feita qualquer alteração de código, concluída uma sub-etapa, hotfix, auditoria ou fase no projeto **MyTuDo**, você **DEVE OBRIGATORIAMENTE** executar o protocolo da Skill `phase-closeout` e atualizar sincronizadamente os arquivos da pasta `Controle/`:

1. **`Controle/ESTADO_ATUAL.md`:** Atualizar sempre a versão estável atual, o resumo da última entrega concluída e a fila imediata de próximas sub-etapas (Session Handoff).
2. **`Controle/ROADMAP.md`:** Marcar a etapa/sub-etapa finalizada como `✅ Concluído` e apontar a próxima como `⏳ Próxima`.
3. **`Controle/CHANGELOG.md` (e `CHANGELOG.md` na raiz, quando aplicável):** Registrar as notas da versão (*release notes*) em Português do Brasil (`pt-BR`) estrito.
4. **`Controle/DECISOES_ARQUITETURAIS.md`:** Registrar um novo ADR (`ADR-01X`) ou atualizar um existente sempre que uma decisão arquitetural, mudança de API ou regra de modelagem for tomada.
5. **`Controle/MEMORIA_IA.md`:** Manter como a Constituição enxuta de regras pétreas, invariantes, anti-patterns proibidos e strings canônicas do Triunvirato de IA (`llama-3.3-70b-versatile`, `gemini-3.8-flash`, `deepseek-flash`), sem jamais reintroduzir contradições históricas.
