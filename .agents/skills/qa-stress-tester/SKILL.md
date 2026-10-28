---
name: qa-stress-tester
description: Use this skill after implementing code changes and before delivering the walkthrough in MyTuDo. Executes the mandatory QA protocol: TypeScript strict verification (npx tsc --noEmit), API endpoint/payload tests, error/429 state checks, and desktop/mobile UI responsiveness review.
---

# 🧪 Skill: `qa-stress-tester` (Protocolo de Testes & Verificação Pré-Walkthrough)

## Objetivo
Garantir que **nenhuma entrega** chegue ao usuário com erros ocultos de tipagem, regressões de layout ou falhas de integração. Como o `next.config.js` possui flags históricas que ignoram erros durante o build padrão, esta Skill atua como a barreira de qualidade obrigatória antes do `walkthrough.md`.

---

## Roteiro Obrigatório de Verificação (4 Etapas)

### Etapa 1: Verificação Estrita de TypeScript (Zero Erros)
Execute sempre no terminal (em modo Sandbox):
```powershell
npx tsc --noEmit
```
- **Critério de Aprovação:** `Exit Code: 0` com **zero linhas de erro**.
- Se houver qualquer erro de tipo (mesmo em arquivos adjacentes afetados pela sua mudança), corrija-o imediatamente antes de prosseguir.

### Etapa 2: Teste Empírico de Rotas Serverless e Serviços Externos
Se a etapa criou ou alterou rotas em `src/app/api/**` ou funções em `src/app/lib/*Service.ts`:
1. Crie um script rápido de validação em `<artifactDir>/scratch/` ou execute um teste contra o servidor local `http://localhost:3000`.
2. Verifique:
   - Status HTTP `200 OK` no caminho feliz.
   - Ausência de textos "Frankenstein" ou tags HTML sujas (`<p>`, `<br>`, `&quot;`) nas sinopses.
   - Comportamento de fallback (ex: busca em inglês no TMDB quando `pt-BR` retorna vazio; fallback Open Library quando Google Books falha).
3. **Limpeza Obrigatória:** Remova qualquer arquivo temporário de teste criado caso esteja fora da pasta `scratch/`.

### Etapa 3: Auditoria de Interatividade e Casos de Borda na UI
Revise o código dos componentes React modificados verificando:
- [ ] **Prevenção de *Event Bubbling*:** Botões internos de cartões (como `+1`, excluir ou links externos) possuem `e.stopPropagation()` para não disparar o clique/duplo-clique do cartão pai.
- [ ] **Trava de Tetos Máximos:** Botões de incremento (`+1`) possuem propriedade `disabled` ativa quando `currentValue >= maxTarget` (respeitando o teto da temporada atual `seasonEpisodes[currentSeason]` quando aplicável).
- [ ] **Atalhos de Teclado:** Modais fecham corretamente ao pressionar a tecla `Escape`.
- [ ] **Feedback Visual:** Ações assíncronas (como 🔄 *Sincronizar Tetos* ou *Auto-Tagging*) exibem estado de carregamento (`spinner`/`disabled`) e emitem retorno claro via micro-toast tanto quando há alterações quanto quando os dados já estão atualizados.

### Etapa 4: Responsividade Desktop vs. Mobile e Higiene de Idioma
- [ ] **CSS Modules Mobile (`@media (max-width: 768px)`):** Modais, grids e barras de ferramentas se adaptam sem corte horizontal (`overflow-x: hidden`) e respeitam `100dvh`.
- [ ] **Idioma 100% `pt-BR`:** Verifique se nenhum texto de interface ou mensagem de erro contém termos em `pt-PT` ou inglês não traduzido.

