# Planejamento de Upgrade Futuro: Tabelas Avançadas (Tauri & Capacitor)

Este documento registra o planejamento arquitetural e o débito técnico assumido propositalmente na versão **v8.2.821** a respeito de recursos avançados de manipulação de tabelas no TipTap.

---

## 🎯 Visão Geral do Recurso
No formato atual do MyTuDo como PWA web/mobile, optamos por manter a manipulação de tabelas centralizada na barra de ferramentas superior (`Toolbar`) para garantir:
1. **Zero conflito de toque e gestos:** Telas táteis (smartphones e tablets) sofrem com elementos flutuantes sobrepostos que capturam toques de rolagem acidentalmente.
2. **Estabilidade de layout:** Evitar que a injeção dinâmica de botões nas bordas desloque o texto ou gere repaints custosos em dispositivos de menor poder de processamento.

No entanto, para a futura versão desktop nativa (`.exe` via **Tauri**) e aplicativo móvel empacotado (`.apk` via **Capacitor/WebView**), implementaremos uma experiência de edição de tabelas equivalente a suítes de produtividade modernas (como Notion e Google Docs).

---

## 🛠️ Recursos Planejados

### 1. Edição Contextual (Botões `+` Flutuantes nas Bordas)
- **Como funcionará:** Ao passar o mouse sobre a borda superior de uma coluna ou borda lateral de uma linha, um botão sutil `+` surge alinhado à divisória. O clique insere uma nova linha ou coluna imediatamente naquela posição.
- **Desafio Técnico no PWA:** No navegador mobile, a ausência de estado `hover` exige detectar toques prolongados ou selecionar a célula para exibir alças flutuantes, o que colide com a seleção nativa de texto do Android/iOS e com a rolagem vertical da anotação.
- **Arquitetura Alvo:**
  - Implementação via plugin customizado do **ProseMirror** (`prosemirror-view` decorations ou custom `NodeView`).
  - No desktop (.exe), gatilhos estritamente via `mousemove` e `mouseenter`.
  - No mobile (.apk), ativação controlada através de long-press ou menu contextual nativo.

### 2. Tabela Arrastável (Drag Handle Global)
- **Como funcionará:** Uma alça de arraste (ícone de 6 pontos `⠿`) posicionada no canto superior esquerdo externo da tabela permite arrastar a tabela inteira como um bloco atômico para qualquer ponto do documento de anotação.
- **Desafio Técnico no PWA:** O evento nativo de HTML5 Drag and Drop (`dragstart`, `dragover`, `drop`) possui suporte deficiente e inconsistente em navegadores mobile WebKit/Blink, frequentemente travando ou selecionando texto.
- **Arquitetura Alvo:**
  - Criação de um `NodeView` customizado em React para o nó `Table` do TipTap.
  - Utilização de biblioteca de abstração de gestos (como `react-dnd` com backend híbrido `touch-backend` e `html5-backend`) integrada ao modelo de transações do ProseMirror.

---

## 🗺️ Roadmap de Implementação
Esses recursos serão ativados quando o projeto iniciar oficialmente a migração simultânea:
- **Desktop (.exe):** Stack Tauri v2 (Rust + Webview2).
- **Mobile (.apk):** Stack Capacitor com bridge nativa.
