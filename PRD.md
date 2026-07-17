# PRD — Cida | Controle Financeiro e Clínico para Fisioterapia

**Produto:** Cida  
**Versão do documento:** 1.5  
**Data:** 17 de julho de 2026  
**Status:** Em alinhamento (decisões parciais fechadas)  

---

## 1. Visão do produto

A **Cida** é um sistema de controle financeiro e clínico para uma fisioterapeuta especialista em **saúde da mulher** (com foco em **incontinência urinária**) que presta serviço dentro de uma **clínica**.

O produto resolve três dores ao mesmo tempo:

1. **Financeiro transparente** — quanto entrou, quanto sai para a clínica, quanto fica com a profissional, e o custo do cartão.
2. **Prestação de contas** — registro claro de receitas e despesas relacionadas ao atendimento na clínica.
3. **Resultado do paciente** — evolução clínica visível, para que o dashboard mostre não só dinheiro, mas **resultado terapêutico**.

> Ideia central: o dinheiro e o cuidado andam juntos. Cada sessão gera receita *e* um registro de evolução.

---

## 2. Problema

Hoje, o controle costuma ficar em planilha, WhatsApp ou caderno. Isso gera:

- Confusão sobre o **percentual da clínica** e o **percentual/taxa do cartão**
- Dificuldade em saber **quantas parcelas** do tratamento já foram pagas
- Prestação de contas incompleta (receitas vs. despesas)
- Histórico clínico do paciente disperso ou inexistente
- Visão fraca de faturamento (dia, mês, período) e de **resultado clínico**

---

## 3. Objetivos

| Objetivo | Como medimos sucesso |
|----------|----------------------|
| Controle financeiro confiável | 100% das sessões e pagamentos registrados |
| Percentuais configuráveis | Clínica e cartão editáveis, aplicados automaticamente |
| Prestação de contas clara | Relatório mensal de receitas e despesas exportável |
| Evolução do paciente | Cada paciente com histórico de sessões e o que foi feito |
| Dashboard moderno e interativo | Tudo alinhado em gráficos: faturamento, rateios, evolução clínica |

---

## 4. Usuários

| Persona | Papel |
|---------|--------|
| **Fisioterapeuta (Cida)** | Usuária principal. Registra pacientes, sessões, pagamentos, despesas e consulta o dashboard. |
| **Clínica (visão futura)** | Recebe prestação de contas via **relatório Excel**. Acesso/login da clínica fica fora do MVP. |

---

## 5. Escopo do MVP

### 5.1 Incluído no MVP

- Cadastro e identificação de pacientes
- Histórico de evolução clínica por sessão (**escala + texto livre** + **aparelhos eletrônicos**)
- Cadastro / catálogo de **aparelhos eletrônicos** (biofeedback, eletroestimulação, etc.)
- Cobrança em **pacote fechado** e **avulso por sessão**
- Registro de tratamentos / planos (com parcelas, quando for pacote)
- Configuração de **% da clínica** e **% do cartão**
- **Escolha por lançamento:** % da clínica sobre o valor **com** ou **sem** taxa do cartão
- **Escolha por lançamento:** se a clínica **rateia** (divide) a despesa/taxa do cartão ou não
- Controle de receitas e despesas
- Prestação de contas exportável em **Excel**
- **Dashboard moderno e interativo**, com indicadores sempre alinhados a gráficos
- Indicador clínico de **chances de resultado** (literatura + adesão) no dashboard
- **Relatório clínico para o paciente** ao final do tratamento (sem dados financeiros; inclui aparelhos usados)
- Filtros por dia / mês / período (com drill-down nos gráficos)

### 5.2 Fora do MVP (backlog)

- App mobile nativo
- Portal de login da clínica
- Integração com maquininha / gateway de pagamento
- Prontuário eletrônico completo (CID, laudos, anexos pesados)
- Multi-profissional / multi-clínica
- WhatsApp automático de cobrança

---

## 6. Conceitos do domínio (como pensamos juntos)

### 6.1 Relação clínica × profissional

A fisioterapeuta atende **na clínica**. Em cada receita há **duas escolhas explícitas** sobre o cartão:

#### A) Base do percentual da clínica

| Modo | Como calcula a base do % da clínica |
|------|-------------------------------------|
| **Com taxa do cartão** | Base = valor bruto − taxa do cartão (líquido). O % da clínica incide sobre o líquido. |
| **Sem taxa do cartão** | Base = valor bruto. O % da clínica incide sobre o bruto. |

#### B) A clínica rateia a despesa do cartão?

| Opção | O que acontece com a taxa do cartão |
|-------|-------------------------------------|
| **Não rateia** | A taxa do cartão é descontada **somente** do valor da profissional. |
| **Rateia** | A taxa do cartão é **dividida** entre clínica e profissional na proporção do rateio (ex.: clínica 30% / profissional 70% da taxa). |

```
Valor bruto
Taxa cartão = bruto × % cartão   (se pagamento for cartão; senão = 0)

Base da clínica = (escolha A)
  → COM taxa:  base = bruto − taxa cartão
  → SEM taxa:  base = bruto

Parte bruta clínica      = base × % clínica
Parte bruta profissional = (bruto − taxa cartão, ou regra da base) − parte bruta clínica
  (na prática: o sistema mostra o split final após o rateio da taxa)

Se rateia taxa = NÃO:
  taxa_clínica = 0
  taxa_profissional = taxa cartão
Se rateia taxa = SIM:
  taxa_clínica = taxa cartão × % clínica
  taxa_profissional = taxa cartão × (1 − % clínica)

Valor final clínica      = parte bruta clínica − taxa_clínica
Valor final profissional = parte bruta profissional − taxa_profissional
```

> As duas opções são **independentes**: dá para calcular o % da clínica sobre o bruto **e** ainda assim ratear (ou não) a taxa do cartão.

- Nas **configurações**: modo padrão da base (com/sem) + padrão de rateio da taxa (sim/não).
- Em cada **lançamento**: seletores visíveis para as duas escolhas, com preview do cálculo na tela.

### 6.2 Modelos de cobrança: pacote e avulso

O sistema aceita **os dois** modelos:

| Modelo | Como funciona |
|--------|----------------|
| **Pacote fechado** | Tratamento com valor total, nº de sessões previstas e **parcelas**. Ex.: protocolo de incontinência — 10 sessões em 4x. |
| **Avulso** | Cobrança por sessão (ou receita avulsa), sem pacote obrigatório. |

- Um **paciente** pode ter pacotes e também atendimentos avulsos ao longo do tempo.
- No **pacote**: valor total, número de parcelas e status de cada parcela (`pendente` / `paga` / `atrasada`).
- No **avulso**: cada sessão/pagamento é um lançamento independente.
- Cada **sessão** registra o que foi feito (evolução) e pode ou não estar ligada a um pagamento naquele dia.

### 6.3 Especialidade e recursos terapêuticos

Campos e labels pensados para **saúde da mulher / incontinência urinária**, sem travar o sistema só nisso — o histórico de evolução é texto estruturado + tags clínicas opcionais.

#### Aparelhos eletrônicos no tratamento

O tratamento pélvico frequentemente combina exercícios manuais/orientação com **aparelhos eletrônicos**. O Cida precisa registrar isso na sessão, no indicador clínico e no relatório do paciente.

**Tipos de recurso (catálogo padrão, editável):**

| Tipo | Exemplos de uso |
|------|-----------------|
| **Biofeedback EMG** (eletromiográfico) | Captação da atividade muscular; retorno visual/sonoro; sonda ou eletrodo de superfície |
| **Biofeedback manométrico / pressórico** | Pressão perineal via sonda (ex.: balão/sonda vaginal ou anal) |
| **Eletroestimulação** | Correntes TENS, FES/EMS, Aussie, etc., para contração ou inibição (ex.: urgência) |
| **Combinado** | Biofeedback + eletroestimulação na mesma sessão |
| **Sem aparelho eletrônico** | Apenas exercício / terapia manual / educação |
| **Outro** | Campo livre (laser, radiofrequência, etc., se a profissional usar) |

**Por sessão, registrar:**

- Quais aparelhos / modalidades foram usados (multi-seleção)
- Via / acessório quando fizer sentido (ex.: sonda vaginal, sonda anal, eletrodo de superfície) — opcional
- Observação curta (parâmetros gerais em texto livre, se quiser: frequência, tempo, tolerância)
- Nome do equipamento (opcional, vinculado ao catálogo: ex. “Neurodyn”, “Perina Stim”, genérico “Biofeedback EMG”)

**No relatório clínico do paciente:** listar de forma clara e não técnica demais os recursos usados ao longo do tratamento (ex.: “Biofeedback e eletroestimulação em X de Y sessões”), sem jargão financeiro e sem dados de cobrança.

**No dashboard clínico:** gráfico de uso de aparelhos (quantas sessões com biofeedback, eletro, só exercício, etc.) — útil para a profissional ver o perfil do protocolo.

### 6.4 Indicador clínico + relatório final para o paciente

Há **duas faces** do mesmo módulo clínico — nenhuma delas inclui dinheiro, parcelas, %, cartão ou valores:

| Face | Para quem | Quando |
|------|-----------|--------|
| **Indicador no dashboard** | Fisioterapeuta | Durante o tratamento (acompanhamento) |
| **Relatório clínico do paciente** | Paciente (entregue pela profissional) | **Ao final / alta do tratamento** |

#### A) Indicador no dashboard (uso interno)

No dash clínico (e na ficha do paciente), um indicador visual do tipo:

> “Se as sessões forem feitas corretamente e com boa adesão, a literatura aponta chances elevadas de **cura ou melhora**.”

Alimentado por:

1. **Faixas de referência da literatura** (configuráveis — ver seção 16)  
2. **Adesão real** (sessões feitas / previstas)  
3. **Evolução da escala** (1–5) ao longo das sessões  

Serve para a profissional **motivar, acompanhar e decidir** o rumo do tratamento — não para cobrança.

#### B) Relatório clínico ao final do tratamento (para o paciente)

Quando o tratamento for concluído (alta / fim do pacote / encerramento manual), o sistema gera um **relatório clínico imprimível/exportável (PDF)** destinado ao **paciente**.

**O relatório NÃO contém:** valores, parcelas, % da clínica, taxa de cartão, receitas ou despesas.

**O relatório CONTÉM (somente clínico):**

| Bloco | Conteúdo |
|-------|----------|
| Identificação | Nome, idade, período do tratamento |
| Queixa / foco | Ex.: incontinência urinária de esforço |
| Resumo do percurso | Nº de sessões previstas × realizadas; % de adesão |
| Evolução | Gráfico da escala sessão a sessão + texto das principais condutas |
| Aparelhos / recursos | Quais modalidades eletrônicas foram usadas no percurso (biofeedback, eletroestimulação, etc.) e em quantas sessões |
| Indicador de chances | Faixa da literatura (“com adesão correta…”) × adesão que a paciente teve |
| Resultado observado | Comparativo início × fim (escala e síntese em texto da profissional) |
| Orientação de manutenção | Campo editável (exercícios em casa, retorno, cuidados) |
| Disclaimer | Estimativa populacional; não é garantia de cura; elaborada pela fisioterapeuta |

**Fluxo sugerido:**

1. Profissional marca tratamento como **concluído / alta**.  
2. Sistema monta o rascunho do relatório clínico (gráficos + dados das evoluções).  
3. Profissional revisa, ajusta o texto de síntese e orientação.  
4. Gera **PDF** para entregar / enviar ao paciente.

#### Como o indicador funciona (MVP)

| Entrada | Uso |
|---------|-----|
| Tipo de queixa (ex.: IUE, mista, urgência) | Seleciona a faixa de referência da literatura |
| Adesão às sessões (% realizadas vs. previstas) | Ajusta o indicador no dash e no relatório final |
| Evolução clínica (escala 1–5) | Trajetória no gráfico (dash + relatório) |

| Faixa sugerida no produto (editável nas configs) | Base na literatura |
|--------------------------------------------------|--------------------|
| **Cura relatada (IUE, protocolo supervisionado)** | ~**46–56%** (Cochrane / revisões derivadas) |
| **Cura ou melhora (IUE)** | ~**55–74%+** (Cochrane; revisões citam até ~74% cura/melhora vs. controle) |
| **Cura ou melhora (faixa ampla em revisões)** | ~**56–85%** (revisões clínicas / fisioterapia pélvica) |
| **Sem tratamento / controle** | ~**3–11%** de cura ou melhora relatada (contraste educativo) |

**Regra de UX do indicador (dash):**

- Alta adesão (≥80%): zona de melhor chance.  
- Média (50–79%): chance moderada + alerta motivacional.  
- Baixa (&lt;50%): deixa claro que a literatura pressupõe treino correto e consistente.  
- Disclaimer sempre visível.

**Separação de dashboards / visões:**

| Visão | Conteúdo |
|-------|----------|
| **Financeiro** | Faturamento, split clínica/profissional, cartão, despesas — **nunca** vai no relatório do paciente |
| **Clínico** | Sessões, evolução, adesão, chances de resultado, relatório final do paciente |

> No MVP, as faixas ficam **configuráveis**. Fontes detalhadas na seção 16.

---

## 7. Requisitos funcionais

### 7.1 Configurações financeiras

| ID | Requisito |
|----|-----------|
| CFG-01 | Campo editável para **percentual da clínica** (ex.: 30%). |
| CFG-02 | Campo editável para **percentual/taxa do cartão** (ex.: 3,5%). |
| CFG-03 | Histórico de alteração dos percentuais (data + valor antigo/novo), para não distorcer meses passados. |
| CFG-04 | Opção de percentuais **padrão** e override por lançamento. |
| CFG-05 | Configuração do modo padrão: parte da clínica **com** ou **sem** incluir a taxa do cartão na base de cálculo. |
| CFG-06 | Em cada receita, seletor: “% da clínica sobre valor **com taxa** / **sem taxa** do cartão”. |
| CFG-07 | Configuração padrão: clínica **rateia** ou **não rateia** a despesa/taxa do cartão. |
| CFG-08 | Em cada receita, seletor: “Clínica rateia taxa do cartão? **Sim / Não**”. |
| CFG-09 | Configurar **faixas de chance de resultado** (cura / cura+melhora) por tipo de queixa, com texto de fonte. |
| CFG-10 | Ativar/desativar o indicador clínico de chances no dashboard. |
| CFG-11 | Texto padrão de disclaimer e de orientação de manutenção no relatório do paciente. |
| CFG-12 | Catálogo de **aparelhos eletrônicos / modalidades** (ativar, renomear, adicionar). |

### 7.2 Pacientes

| ID | Requisito |
|----|-----------|
| PAC-01 | Identificação: **nome**, **idade** (ou data de nascimento), **sexo**. |
| PAC-02 | Contatos opcionais: telefone, e-mail. |
| PAC-03 | Observações gerais / anamnese resumida. |
| PAC-04 | Status: ativo, em tratamento, alta, inativo. |
| PAC-05 | Histórico de **evolução do paciente**: registro por sessão descrevendo o que foi feito. |
| PAC-06 | Evolução com **ambos**: escala numérica **e** texto livre (obrigatório ter pelo menos um dos dois por sessão — preferência: os dois preenchidos). |
| PAC-07 | Campo de **tipo de queixa / foco** (ex.: IUE, mista, urgência) para alimentar o indicador de chances. |
| PAC-08 | Na ficha: indicador clínico de chances (literatura × adesão) + disclaimer — **sem** dados financeiros. |
| PAC-09 | Encerrar tratamento / alta e gerar **relatório clínico do paciente** (PDF). |
| PAC-10 | Relatório final: evolução, adesão, gráfico de escala, **aparelhos/recursos usados**, chances vs. literatura, síntese e orientação — **zero informação financeira**. |
| PAC-11 | Profissional pode editar síntese e orientação antes de exportar o PDF. |
| PAC-12 | Em cada sessão: registrar **aparelhos eletrônicos / modalidades** usados (multi-seleção + observação opcional). |
| PAC-13 | Ficha do paciente: histórico de uso de aparelhos ao longo das sessões (timeline ou chips por sessão). |

**Campos por evolução (sessão):**

- Data da sessão  
- Queixa / foco do dia  
- Condutas realizadas (o que foi feito) — **texto livre**  
- **Aparelhos eletrônicos / modalidades** (biofeedback EMG, biofeedback manométrico, eletroestimulação, combinado, sem aparelho, outro)  
- Via / acessório (opcional): sonda vaginal, sonda anal, eletrodo de superfície, outro  
- Observação do aparelho (opcional): tempo, tolerância, parâmetros em texto  
- Resposta do paciente / observação clínica — **texto livre**  
- **Escala de evolução** (ex.: 1–5, usada nos gráficos do dashboard)  
- Próximo passo  

### 7.3 Tratamentos, pacotes, avulso e parcelas

| ID | Requisito |
|----|-----------|
| TRT-01 | Criar **pacote fechado** vinculado ao paciente (nome do protocolo, nº de sessões previstas, valor total). |
| TRT-02 | No pacote: definir **quantidade de parcelas** e valor de cada uma. |
| TRT-03 | Registrar **quantas parcelas já foram pagas** (e quais). |
| TRT-04 | Permitir cobrança **avulsa** por sessão (sem pacote), com o mesmo rateio financeiro. |
| TRT-05 | Forma de pagamento: dinheiro, PIX, débito, crédito, outro. |
| TRT-06 | Se cartão: aplicar % do cartão automaticamente. |
| TRT-07 | Aplicar % da clínica automaticamente, respeitando a escolha **com/sem taxa** na base e se **rateia** a taxa do cartão. |
| TRT-08 | Visão clara no pacote: “Paciente X — 4/10 parcelas pagas — R$ Y em aberto”. |
| TRT-09 | Paciente pode misturar histórico de pacotes e avulsos. |

### 7.4 Receitas

| ID | Requisito |
|----|-----------|
| REC-01 | Lançar receita ligada a paciente/pacote/parcela **ou** avulsa por sessão. |
| REC-02 | Exibir: bruto, taxa cartão, líquido, modo da base, se rateia taxa, valor clínica, valor profissional, quanto cada um absorveu da taxa. |
| REC-03 | Filtrar por dia, mês, período, forma de pagamento, tipo (pacote/avulso). |
| REC-04 | Totalizadores: bruto, líquido, clínica, profissional, taxa cartão (total / clínica / profissional). |
| REC-05 | Seletor: base do % da clínica **com** ou **sem** taxa do cartão. |
| REC-06 | Seletor: clínica **rateia** ou **não rateia** a taxa do cartão. |

### 7.5 Despesas (prestação de contas)

| ID | Requisito |
|----|-----------|
| DES-01 | Registrar despesas que a fisioterapeuta presta conta à clínica (materiais, taxas, materiais descartáveis, etc.). |
| DES-02 | Categorias de despesa configuráveis. |
| DES-03 | Vincular despesa a período / clínica (e opcionalmente a paciente). |
| DES-04 | Relatório de prestação de contas: receitas + despesas do período. |
| DES-05 | Exportar prestação de contas e listagens financeiras em **Excel** (.xlsx). |

### 7.6 Dashboard (moderno, interativo, centrado em gráficos)

O dashboard é a **home** do produto. Princípio de design:

> **Nada de número solto sem gráfico.** KPIs, faturamento, rateios e evolução clínica devem estar sempre alinhados a visualizações interativas.

#### Princípios de UX do dashboard

| ID | Requisito |
|----|-----------|
| DSH-UX-01 | Visual **moderno**: tipografia clara, hierarquia forte, espaçamento generoso, paleta coerente (sem visual genérico “admin roxo”). |
| DSH-UX-02 | **Interativo**: hover com detalhe, clique para filtrar/drill-down (ex.: clicar no mês → ver dias; clicar num paciente → ficha). |
| DSH-UX-03 | Filtros globais de período (hoje, semana, mês, personalizado) que **atualizam todos os gráficos juntos**. |
| DSH-UX-04 | Alternância de visão: **Financeiro** / **Clínico** / **Visão unificada** (padrão). Dados financeiros **nunca** vazam para o relatório do paciente. |
| DSH-UX-05 | Animações leves na entrada dos gráficos e na troca de filtro (presença, não distração). |
| DSH-UX-06 | Responsivo: no mobile, gráficos empilhados e tocáveis; no desktop, composição ampla. |
| DSH-UX-07 | Empty states úteis (“ainda sem lançamentos neste mês”) em vez de gráficos vazios confusos. |

#### Financeiro (sempre com gráfico)

| ID | Gráfico / indicador |
|----|---------------------|
| DSH-01 | Faturamento **diário** (linha ou barras interativas) |
| DSH-02 | Faturamento **mensal** (comparativo mês a mês, com drill-down) |
| DSH-03 | Distribuição: valor clínica × valor profissional (pizza/donut ou barras empilhadas) |
| DSH-04 | Impacto da **taxa de cartão** no período (total + quanto foi rateado com a clínica × quanto ficou com a profissional) |
| DSH-05 | Receitas vs. despesas (barras comparativas) |
| DSH-06 | Parcelas a receber / em aberto (funil ou barras por status) |
| DSH-12 | Formas de pagamento (PIX, cartão, dinheiro…) em gráfico de composição |

#### Resultado do paciente (prioridade alta — também em gráficos)

| ID | Indicador |
|----|-----------|
| DSH-07 | Pacientes em tratamento × altas no período (barras / área) |
| DSH-08 | Evolução média (escala de sessão) ao longo do tempo (linha) |
| DSH-09 | Sessões realizadas no período (barras + total) |
| DSH-10 | Ranking / destaque de pacientes com evolução recente (lista ligada a sparkline de evolução) |
| DSH-11 | Taxa de adesão: sessões realizadas / sessões previstas (gauge ou barras) |
| DSH-13 | Evolução individual: ao abrir um paciente no dash, gráfico da escala sessão a sessão |
| DSH-14 | **Indicador clínico** de chances de resultado (literatura × adesão) — gauge/área interativa |
| DSH-15 | Comparativo: “com adesão correta (literatura)” vs. “adesão atual deste paciente” |
| DSH-16 | Tooltip “De onde vem esse número?” com fontes + disclaimer |
| DSH-17 | Atalho: a partir do paciente/tratamento concluído → **gerar relatório clínico** (não financeiro) |
| DSH-18 | Uso de **aparelhos eletrônicos** no período / por paciente (barras ou donut: biofeedback, eletro, só exercício, etc.) |

> Visão clínica e financeira convivem no produto, mas o **relatório entregue ao paciente é 100% clínico** (inclui recursos/aparelhos, exclui dinheiro).

---

## 8. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| NF-01 | Interface em português (Brasil). |
| NF-02 | Responsivo (desktop primeiro; uso bom no celular). |
| NF-03 | Dados sensíveis de saúde: acesso autenticado; não expor paciente em URLs públicas. |
| NF-04 | Exportação em **Excel** (.xlsx) de receitas, despesas e prestação de contas (financeiro). Relatório do paciente em **PDF clínico**. |
| NF-05 | Performance: dashboard carrega em poucos segundos com filtros de período; trocas de filtro sem travar a UI. |
| NF-06 | Gráficos modernos, interativos e legíveis; cada KPI principal tem visualização gráfica alinhada. |
| NF-07 | Biblioteca de charts adequada a interação (tooltip, zoom/brush ou drill-down, legendas clicáveis). |

---

## 9. Telas principais (mapa)

1. **Login**  
2. **Dashboard** (home — visão Financeiro / Clínico / Unificada)  
3. **Pacientes** (lista + detalhe + evoluções + indicador clínico)  
4. **Tratamentos / Parcelas**  
5. **Receitas**  
6. **Despesas**  
7. **Prestação de contas** (Excel — financeiro, para a clínica)  
8. **Relatório clínico do paciente** (PDF — ao final do tratamento; inclui aparelhos usados)  
9. **Configurações** (% clínica, % cartão, base/rateio, faixas de chance, **catálogo de aparelhos**, textos do relatório)

---

## 10. Regras de negócio

1. Percentuais, modo **com/sem taxa na base** e se a clínica **rateia a taxa do cartão** (padrão nas configs) valem para novos lançamentos.  
2. Cada receita guarda as escolhas do momento (base + rateio da taxa); não muda se a configuração padrão mudar depois.  
3. Se **não rateia**: 100% da taxa do cartão desconta do valor da profissional.  
4. Se **rateia**: a taxa é dividida na proporção do % clínica / % profissional.  
5. Alterar % depois **não recalcula** automaticamente lançamentos antigos (usa o % vigente na data do lançamento).  
6. Em **pacote**, parcela só conta como “paga” quando houver lançamento de receita associado (ou marcação explícita).  
7. Em **avulso**, cada pagamento é independente; sessão clínica pode existir sem pagamento no mesmo dia (evolução ≠ caixa).  
8. Evolução da sessão: **escala + texto livre + aparelhos eletrônicos** (quando usados).  
9. Despesas entram na prestação de contas do mês selecionado.  
10. Prestação de contas e exportações financeiras saem em **Excel**.  
11. O **indicador de chances** no dash é clínico (literatura + adesão); nunca afirmar cura garantida.  
12. O **relatório ao final do tratamento** é exclusivo para o paciente e **somente clínico** — inclui evolução, adesão, aparelhos/recursos e chances; **proibido** qualquer dado financeiro.  
13. Sexo e dados clínicos são tratados com cuidado (LGPD): mínimo necessário, finalidade clara.

---

## 11. Métricas de sucesso do produto

- Tempo para registrar uma sessão + evolução < 2 minutos  
- Tempo para registrar uma parcela paga < 1 minuto  
- Prestação de contas mensal gerada sem planilha paralela  
- Uso semanal do dashboard pela profissional  
- Clareza: “sei quanto é meu, quanto é da clínica e quanto o cartão comeu”

---

## 12. Decisões alinhadas

| Tema | Decisão |
|------|---------|
| Base do % da clínica × cartão | **Escolha por lançamento** (e padrão nas configs): calcular a parte da clínica **com** ou **sem** a taxa do cartão na base. |
| Rateio da taxa do cartão | **Escolha por lançamento** (e padrão nas configs): clínica **rateia** ou **não rateia** a despesa do cartão. Se rateia, divide na proporção do %. |
| Modelo de cobrança | **Pacote fechado e avulso** — os dois no MVP. |
| Relatórios / prestação de contas | **Excel financeiro** para a clínica. **PDF clínico** para o paciente ao final do tratamento. Sem login da clínica no MVP. |
| Evolução clínica | **Ambos**: escala numérica (gráficos) + texto livre (o que foi feito). |
| Dashboard | **Moderno e interativo**; visões Financeiro / Clínico; gráficos alinhados. |
| Indicador + relatório do paciente | Indicador clínico no dash; no fim, **PDF clínico** (evolução, adesão, aparelhos, chances) — **sem financeiro**. |
| Aparelhos eletrônicos | Registro por sessão (biofeedback EMG/manométrico, eletroestimulação, combinado, etc.); catálogo configurável; no dash e no relatório clínico. |

## 12.1 Ainda em aberto

1. **Há outras especialidades** além de incontinência / saúde da mulher no curto prazo?  
2. **Stack preferida** (web app etc.) — ainda não definida.  
3. **Nome legal / CNPJ / nota fiscal** no fluxo de prestação de contas — precisa?

---

## 13. Proposta de fases

### Fase 1 — MVP financeiro + paciente
- Pacientes e evoluções (escala + texto + **aparelhos eletrônicos**)  
- Pacote fechado + avulso  
- Parcelas (quando pacote)  
- % clínica, % cartão, seletor com/sem taxa na base e se rateia taxa  
- Receitas e despesas  
- Catálogo básico de aparelhos  
- Dashboard moderno interativo (financeiro + clínico + indicador de chances + uso de aparelhos)  
- **Relatório clínico PDF** ao final do tratamento (para o paciente)

### Fase 2 — Prestação de contas e polish
- Relatório mensal em **Excel** (clínica)  
- Histórico de percentuais  
- Drill-down mais rico nos gráficos  
- Template visual mais rico do PDF clínico do paciente  
- Ajuste fino das faixas de chance e painel de fontes

### Fase 3 — Escala
- Acesso da clínica (somente leitura)  
- Lembretes de parcelas  
- Anexos clínicos leves  
- Multi-dispositivo / PWA

---

## 14. Resumo do que o sistema precisa “entender”

```
PACIENTE
  ├── dados: nome, idade, sexo, status
  ├── evoluções: escala + texto + aparelhos eletrônicos da sessão
  ├── pacote fechado
  │     ├── valor total, sessões previstas
  │     └── parcelas (pagas / pendentes) → receita
  └── avulso (por sessão) → receita

APARELHOS (catálogo)
  ├── biofeedback EMG
  ├── biofeedback manométrico
  ├── eletroestimulação (TENS / FES / Aussie / etc.)
  ├── combinado
  └── outro / sem aparelho
        └── vinculado a cada evolução

DASHBOARD
  ├── visão FINANCEIRA → faturamento, split, cartão, despesas (Excel da clínica)
  └── visão CLÍNICA → sessões, evolução, adesão, aparelhos, indicador de chances
        └── fim do tratamento → RELATÓRIO CLÍNICO PDF (paciente)
              ├── evolução + adesão + gráfico
              ├── aparelhos / recursos utilizados
              ├── chances (literatura × adesão real)
              ├── síntese e orientação
              └── SEM valores / parcelas / % / cartão
```

---

## 15. Próximo passo sugerido

1. Esboçar o wireframe do **Dashboard clínico** (indicador de chances + uso de aparelhos).  
2. Esboçar o layout do **relatório clínico PDF** do paciente.  
3. Esboçar a ficha do **Paciente** (sessão com aparelhos) e o formulário de receita.  
4. Definir stack e começar o MVP da Fase 1.

---

## 16. Apêndice — evidência usada para o indicador de chances

Pesquisa web realizada em **17/07/2026**. Números são **faixas populacionais**, não prognóstico individual. Usados no **indicador do dash** e no **relatório clínico final** (nunca no financeiro).

| Referência | Link / identificação | Uso no Cida |
|------------|----------------------|-------------|
| Cochrane (resumo em português) — TMAP vs. nenhum tratamento | https://www.cochrane.org/pt/evidence/CD005654_pelvic-floor-muscle-training-urinary-incontinence-women | ~56% cura (IUE) no TMAP vs. ~6% controle; cura/melhora muito superior |
| Dumoulin et al. — meta-análise Cochrane | *Neurourol Urodyn* / Cochrane CD005654 | Evidência forte de cura/melhora com PFMT |
| Stanford — revisão PFPT | PDF revisão urologia Stanford | ~56% cura; ~74% cura/melhora; adesão como fator-chave |
| Acta Fisiátrica USP | https://www.revistas.usp.br/actafisiatrica/article/download/102869/101160/555850 | Faixa 56–84%; adesão/motivação como limitadores |
| Meta-análise supervised vs unsupervised | *Int Urogynecol J* (2023) | Sucesso citado ~56–75%; supervisão + educação importam |
| Revisões clínicas BR (síntese 60–85%) | Ex.: revisões de fisioterapia pélvica em IUE | Apoio à faixa ampla de “cura ou melhora” com adesão |

**Mensagem sugerida no indicador / relatório (exemplo):**

> “Em estudos com treinamento do assoalho pélvico bem feito e acompanhado, cerca de **5 a 7 em cada 10** mulheres com incontinência de esforço relatam **cura ou melhora**. Sem tratamento, essa chance fica bem mais baixa. Neste tratamento, a adesão foi de **X%** das sessões — veja abaixo a evolução da sua escala e os recursos utilizados (ex.: biofeedback e eletroestimulação).”

**Nota sobre aparelhos:** biofeedback (EMG ou manométrico) e eletroestimulação são recursos frequentes na fisioterapia pélvica; o Cida registra o uso por sessão para transparência clínica e para o relatório do paciente, sem substituir o julgamento clínico da profissional.

---

*Documento vivo — v1.5: aparelhos eletrônicos no tratamento (sessão, dash e relatório clínico).*
