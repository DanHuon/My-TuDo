# Planejamento de Upgrade Futuro: Calendário "Google-Like"

Este documento serve como guia para uma futura reformulação do módulo de calendário do MyTuDo, com o objetivo de atingir 60 FPS em transições mobile (swipe entre meses, semanas e dias), replicando a experiência nativa do Google Calendar.

## Opções de Arquitetura

### 1. O Método de 3 Instâncias (`react-big-calendar`)
- **Como funciona:** Renderizar o mês anterior, o atual e o próximo usando o próprio `react-big-calendar`, envelopados em um container com `overflow-x: auto` e `scroll-snap`.
- **Prós:** Nenhuma matemática adicional necessária. O componente resolve todas as sobreposições.
- **Contras:** Altíssimo custo de renderização no React. Fazer *swipe* arrastando 3 instâncias cheias de DOM nodes pesados vai causar engasgos e perdas de frames severas em dispositivos móveis.

### 2. O Método CSS Puro (Scroll Snap + Grid)
- **Como funciona:** Construir a interface do zero, onde cada mês é uma `div` com CSS Grid (`grid-template-columns: repeat(7, 1fr)`).
- **Prós:** Performance absoluta. Permite paginação infinita sem lentidão.
- **Contras:** O pesadelo de recalcular sobreposição de eventos (`overlapping`), especialmente nas visões de "Semana" e "Dia", onde a posição Y depende do horário e a altura depende da duração.

### 3. O Método Híbrido (Recomendado)
- **Como funciona:** 
  - **Mês (Month View):** Feito 100% "na mão" com CSS Grid Puro e `date-fns`. É trivial de fazer pois não há eixo de horas, apenas caixas de dias. Usamos o Swiper.js ou CSS Scroll Snap para transições 60 FPS.
  - **Semana e Dia (Week/Day Views):** Mantemos o `react-big-calendar` apenas para essas visualizações, ativando gestos de touch nele. 
- **Prós:** Resolve a visão principal (Mês) com máxima fluidez e poupa o trabalho insano de recriar a matemática de horários.

---

## Observações de Segurança (Bugs Antigos a Evitar)

Ao trocar a tecnologia base, atenção aos seguintes comportamentos já resolvidos no MyTuDo atual:

1. **Bug do Evento "All-Day" Estendido (Loop Infinito):**
   - **O Problema Histórico:** O Google Calendar exige que eventos "All-Day" possuam a data de fim **exclusiva** e o horário cravado em `00:00:00`. (Ex: 01 de set a 02 de set para representar um evento de apenas 1 dia).
   - **Prevenção:** O formulário de edição (`TaskForm`) deve ser capaz de receber a data de fim do Banco de Dados, subtrair 1 dia para exibir ao usuário (formato inclusivo). Ao salvar, deve pegar a data do usuário e somar 1 dia novamente (formato exclusivo) para enviar à API. Nunca alimentar o componente final com a data "exclusiva", senão o evento vazará para o dia seguinte no layout.

2. **Fuso Horário (Timezone):**
   - Eventos sem horário (apenas data) tendem a recuar 3 horas no Brasil devido ao GMT-0300, caindo para as 21h do dia anterior. 
   - **Prevenção:** Padronizar eventos de "Dia Inteiro" com a hora interna setada para `12:00:00` (meio-dia) antes do parse, ou garantir que a biblioteca escolhida trabalhe estritamente em modo "Floating Time" (sem timezone anexado).

3. **Eventos RRULE (Recorrência):**
   - Regras do Google são parseadas pela biblioteca `rrule.js`. Esta biblioteca retorna instâncias em UTC. É necessário sempre compensar as horas/dias das instâncias geradas para que elas pousem no local correto da grade (veja a função `processItem` antiga para a lógica de conversão e preservação de milissegundos).

---

## Lista de Requisitos (Checklist do Calendário Atual)

Para que o novo calendário possa substituir o antigo, ele **deve** cumprir todas as seguintes funções atualmente ativas:

- [ ] **Integração Bidirecional com Google Calendar:** Fetch e Push usando a API v3.
- [ ] **Mescla de Origens:** Exibir simultaneamente eventos do Google (Tasks e Events) e eventos nativos do MyTuDo.
- [ ] **Suporte a RRULE:** Renderizar infinitamente os eventos recorrentes sem duplicar entradas no banco.
- [ ] **Visualizações Necessárias:** Mês (Month), Semana (Week), Dia (Day) e Agenda (List).
- [ ] **Manipulação "All-Day":** Respeitar a exclusividade do `end date` e manter eventos "Dia Inteiro" fixados no topo ou em destaque.
- [ ] **Gestão de Cores:** Respeitar a cor de fundo nativa definida pelo Calendário da Google para cada item.
- [ ] **Interatividade Base:** Clicar num bloco em branco abre o `TaskForm` passando o horário selecionado.
- [ ] **Interatividade Evento:** Clicar num evento existente abre o Modal de Edição pré-povoado.
- [ ] **Tradução:** Textos de cabeçalho, dias da semana, e mensagens de formato de RRULE totalmente em PT-BR.
- [ ] **Duração do Evento:** Renderizar caixas com tamanhos proporcionais à duração em horas/minutos nas visões de semana/dia.
