# MyTuDo 📝

Um gerenciador de tarefas moderno, elegante e **100% Local-First**, projetado como uma alternativa personalizada ao Anytype/Notion. Funciona completamente offline no navegador (via IndexedDB), instala como aplicativo nativo (PWA) em celulares e PCs, e sincroniza seus dados de forma invisível e segura através da pasta oculta do seu próprio **Google Drive (App Data Folder)** — sem necessidade de servidor ou banco de dados em backend!

---

## ✨ Principais Funcionalidades

- 📱 **Local-First & Offline Puro:** Seus dados residem no seu dispositivo através do **IndexedDB** (usando **Dexie.js** com um esquema genérico de documentos flexíveis e *Tombstones* para deleção lógica).
- ☁️ **Sincronização em Nuvem Privada (Google Drive API):** Conecta diretamente à pasta oculta de aplicativos (`https://www.googleapis.com/auth/drive.appdata`) do seu Google Drive via OAuth 2.0 client-side. Nenhum dado transita por servidores de terceiros.
- ⚡ **Resolução de Conflitos (Last-Write-Wins):** Algoritmo inteligente que mescla modificações locais e remotas com base em timestamps (`updatedAt`).
- 👻 **Sincronização Fantasma (Auto-Sync Inteligente):**
  - **Sync ao Focar:** Sincroniza automaticamente ao trocar de aba ou desbloquear a tela.
  - **Debounce de Edições:** Salva alterações locais em lote automaticamente após 5 segundos de inatividade, com *flush* forçado ao fechar/minimizar a aba.
  - **Timer Periódico:** Mantém tudo alinhado a cada 5 minutos em segundo plano sem sobreposições.
- 📊 **Visualizações Flexíveis:**
  - **Lista de Tarefas:** Visualização clássica minimalista com filtros (Todas, Pendentes, Concluídas).
  - **Kanban Prazos (Temporal):** Organização por status temporal (Sem Prazo / Backlog, Hoje, Esta Semana, Futuro, Concluídas).
  - **Kanban Tags (Categórico):** Organização por colunas baseadas em tags personalizadas.
  - **Gerenciador de Tags:** Criação e edição de categorias de forma dinâmica.
- 📲 **PWA Instalável (A2HS):** Configurado via `@serwist/next`, permitindo instalação em um clique no celular ou computador e funcionamento sem internet.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend & Framework:** [Next.js 14](https://nextjs.org/) (Static Export / `output: 'export'`) + React 18 + TypeScript.
- **Banco de Dados Local:** [Dexie.js](https://dexie.org/) + `dexie-react-hooks` (Reatividade com `useLiveQuery`).
- **Autenticação & Cloud:** [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google) + Google Drive REST API v3.
- **PWA & Service Worker:** [@serwist/next](https://github.com/serwist/serwist).
- **Estilização:** CSS Modules com tema minimalista escuro/claro e tipografia moderna.

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior).
- [Git](https://git-scm.com/) instalado.

### 2. Instalar as dependências
Clone o repositório e acesse a pasta:
```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd MyTuDo
npm install
```

### 3. Configurar as Credenciais do Google Cloud (OAuth 2.0)
Para que o login com o Google e a sincronização do Google Drive funcionem:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) e crie um novo projeto (ex: `MyTuDo`).
2. Em **APIs & Services > Library**, procure e ative a **Google Drive API**.
3. Em **OAuth consent screen**:
   - Tipo de usuário: **External**.
   - Preencha o nome do app e emails de suporte.
   - Em **Scopes**, adicione o escopo: `https://www.googleapis.com/auth/drive.appdata`.
   - Em **Test users**, adicione a sua conta de email do Google.
4. Em **Credentials**:
   - Clique em **Create Credentials > OAuth client ID** (tipo: **Web application**).
   - Em **Authorized JavaScript origins**, adicione: `http://localhost:3000`.
   - Em **Authorized redirect URIs**, adicione: `http://localhost:3000`.
   - Copie o **Client ID** gerado.

5. Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="SEU_CLIENT_ID_DO_GOOGLE_AQUI.apps.googleusercontent.com"
```

### 4. Executar em modo de desenvolvimento
```bash
npm run dev
```
Abra no navegador em [http://localhost:3000](http://localhost:3000).

---

## 📦 Build para Produção & Deploy (ex: Vercel)

Como o projeto é 100% estático (`output: 'export'`), ele pode ser hospedado gratuitamente em qualquer CDN/Provedor estático (Vercel, Netlify, Cloudflare Pages, GitHub Pages):

### Build Local
```bash
npm run build
```
Os arquivos estáticos prontos para distribuição e o Service Worker compilado serão gerados na pasta `/out`.

### Deploy na Vercel
1. Conecte seu repositório no [Vercel](https://vercel.com).
2. Adicione a variável de ambiente `NEXT_PUBLIC_GOOGLE_CLIENT_ID` com o seu Client ID nas configurações do projeto na Vercel.
3. Após o deploy, copie a URL pública gerada (ex: `https://seu-projeto.vercel.app`).
4. Volte ao [Google Cloud Console](https://console.cloud.google.com/apis/credentials), edite o seu **OAuth 2.0 Client ID** e adicione a URL da Vercel em **Authorized JavaScript origins** e **Authorized redirect URIs** (sem a barra final `/`).

---

## 🔒 Privacidade e Segurança
- O MyTuDo não possui servidores intermediários ou bancos de dados centralizados.
- Seus dados pertencem exclusivamente a você e ficam armazenados apenas localmente no seu dispositivo e no seu Google Drive pessoal.
