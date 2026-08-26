# Guia de Testes Automatizados com Browser Subagent (IA)

Este documento guarda as estratégias para testar a interface e integrações da aplicação com o agente de IA visual (`browser_subagent`), contornando os bloqueios de login automatizado do Google.

## Alternativa 1: O "Roubo" de Sessão Local (Melhor para testar a Sincronização)
Permite que o agente aceda à aplicação com a conta Google do utilizador, sem que a senha/token precise ser colada no chat.
1. O utilizador faz login manualmente no seu navegador (localhost ou Vercel).
2. O utilizador copia o conteúdo do `localStorage` (onde o MyTuDo guarda o token) e salva num ficheiro local `token-secreto.json` (adicionado ao .gitignore).
3. O agente lê o ficheiro local e injeta o token no `localStorage` do navegador virtual antes de carregar a página.
**Vantagem:** O agente navega já logado, conseguindo inspecionar erros reais de rede e de API do Google na Console.

## Alternativa 2: A Rota de "Modo de Teste" Isolada (Melhor para testar UI/Layouts)
Ideal para corrigir quebras de CSS sem interagir com o backend/Google.
1. O agente cria temporariamente uma rota como `src/app/test-ui/page.tsx`.
2. O componente que apresenta problemas visuais (ex: `TaskForm`) é renderizado puro, sem o contexto de autenticação (`useAuth`).
3. O agente navega até essa rota isolada, tira screenshots e ajusta o layout.
**Vantagem:** Seguro, extremamente rápido, sem complicações com CORS ou OAuth.

## Alternativa 3: O Botão "Dev Bypass" (Falsificar o Login)
Injeta um estado de login falso para libertar a UI principal.
1. Criar um botão "Bypass Login" que só aparece em `localhost`.
2. Ao clicar, a app simula que existe uma sessão ativa (preenche o Contexto de Auth com dados mockados).
3. O agente acede, clica no botão e consegue navegar pelo Dashboard.
**Vantagem:** Permite testar transições de tela, modais e botões do sistema global, mesmo sem comunicação real com a nuvem.
