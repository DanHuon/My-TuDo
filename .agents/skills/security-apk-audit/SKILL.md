---
name: security-apk-audit
description: Use this skill when creating or modifying API routes (src/app/api/*), authentication flows, environment variables, or third-party integrations in MyTuDo. Audits secret isolation, LGPD/ToS compliance, and compatibility with the future Phase 12 Android APK static build.
---

# 🔐 Skill: `security-apk-audit` (Auditor de AppSec, LGPD/ToS & Prontidão APK)

## Objetivo
Blindar o **MyTuDo** contra vazamento de chaves de API, drenagem de cotas em rotas Serverless, violações de Termos de Serviço (TMDB/RAWG) ou LGPD, e incompatibilidades com o futuro empacotamento nativo Android (`.apk` via Capacitor) e Desktop (`.exe` via Tauri v2) da **Fase 12**.

---

## Protocolo de Auditoria em 4 Frentes

### 1. Isolamento Estrito de Segredos (`AppSec`)
- **Chaves Server-Only:** Confirme que `GOOGLE_CLIENT_SECRET`, `TMDB_API_KEY`, `RAWG_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY` e `DEEPSEEK_API_KEY` **jamais** possuem o prefixo `NEXT_PUBLIC_` e são lidas exclusivamente dentro de `src/app/api/**`.
- **Escopo Exclusivo da `NEXT_PUBLIC_GOOGLE_API_KEY`:** Esta chave é restrita no Google Cloud Console exclusivamente à **Google Picker API**. **NUNCA** a passe como parâmetro `&key=` para a Google Books API, Google Calendar ou qualquer outra API.
- **Zero Vazamento em Logs:** Nenhuma rota em `src/app/api/**` deve executar `console.log` imprimindo `accessToken`, `refreshToken` ou dados pessoais do usuário que ficariam retidos nos logs da Vercel.

### 2. Proteção de Cotas & Validação nas Rotas Serverless (`src/app/api/**`)
- **Validação de Entrada e Saída (`Zod` / JSON Schema):** Toda rota de API (especialmente rotas do Triunvirato de IA: `llama-3.3-70b-versatile`, `gemini-3.8-flash`, `deepseek-flash`) deve validar o corpo da requisição e forçar resposta estruturada em JSON Schema.
- **Economia de Cota (`Lazy Fetching`):** Nunca disparar chamadas em lote (`Promise.all`) para enriquecer itens que o usuário ainda não selecionou.

### 3. Conformidade Legal (LGPD & Termos de Serviço de APIs)
- **Minimização de Dados para IA (LGPD):** Ao enviar tarefas ou notas para o Triunvirato de IA (`Groq`, `Gemini`, `DeepSeek`), envie **apenas** os campos estritamente necessários para a inferência (ex: `title`, `description`, nomes das `tags`). Jamais envie `email`, `user.name`, `userId` ou tokens OAuth.
- **Atribuições Obrigatórias de ToS:**
  - **TMDB:** Manter atribuição oficial da TMDB nos modais/telas que exibem metadados de filmes e séries.
  - **RAWG Free Tier:** Manter atribuição visível com **link ativo (`<a href="https://rawg.io" target="_blank" rel="noopener noreferrer">`)** quando metadados de jogos forem exibidos.

### 4. Compatibilidade Híbrida WebApp (Vercel) + APK Nativo (Fase 12)
- **URLs de API (`/api/*`):** Evite acoplar lógica que impeça o uso futuro de um prefixo `NEXT_PUBLIC_API_BASE_URL` (necessário quando o frontend rodar empacotado no Capacitor `capacitor://localhost` consumindo o backend na Vercel).
- **APIs de Navegador:** Sempre use verificação defensiva (`typeof window !== 'undefined'`, `navigator.storage?.persist?.()`) para recursos que possam diferir entre navegadores Desktop e o Android WebView.

