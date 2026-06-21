# Sistema de Gestão de Requerimentos de Cálculo de Diferenças de Abono Pecuniário, 1/3 de férias e 13º salário - PMRO/7ºBPMP1

Sistema web do 7º BPMP1/PMRO para gerenciamento de requerimentos de
diferenças decorrentes da inclusão do auxílio-saúde e auxílio-alimentação na
base de cálculo do abono pecuniário, 1/3 de férias e 13º salário.

O sistema permite que operadores autenticados mantenham usuários, policiais
militares e requerimentos recebidos pela OPM, com consulta por posto/graduação,
controle de envio para a CP e exportação de relatórios em PDF e Excel. Inclui
ainda o **Módulo de Cálculo de Diferenças**, que reproduz a planilha oficial da
CP (CP9) para apurar, por requerimento, os valores devidos com correção
monetária pelo IPCA-E, e exporta uma planilha `.ods` fiel ao modelo da CP.

## Stack

- Backend: Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL, JWT e bcrypt/passlib.
  Cálculo monetário com `Decimal`. Geração da planilha `.ods` modelo CP9 via
  **LibreOffice headless + `python3-uno`**. Testes com **pytest**.
- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, Axios,
  lucide-react, jsPDF, jspdf-autotable e xlsx-js-style.
- Infraestrutura: Docker Compose para desenvolvimento e produção, nginx para
  servir o frontend em produção e Traefik v3.3 para proxy reverso com HTTPS.

## Estrutura

```text
backend/
  app/
    api/v1/routes/     Rotas REST: auth, usuários, policiais, requerimentos e cálculo
    core/              Configuração, banco, segurança e constantes
                       (calculo_constants.py, calculo_seed.py)
    crud/              Operações de persistência (inclui calculo.py)
    models/            Modelos SQLAlchemy (inclui requerimento_evento.py e calculo.py)
    schemas/           Schemas e validações Pydantic (inclui calculo.py)
    services/          Núcleo de cálculo e exportação
                       calculo_service.py     Engine puro de cálculo (Decimal)
                       export_ods_service.py  Orquestra a geração do .ods (subprocess)
                       uno_fill_worker.py     Worker UNO que preenche o template
    templates/         modelo_cp9.ods (template da planilha oficial)
    main.py            Aplicação FastAPI, CORS e seed do admin inicial
  alembic/             Migrações do banco
  tests/               Testes (test_calculo_service.py)
frontend/
  src/
    components/        Componentes compartilhados (inclui PolicialFormModal.tsx)
    context/           Auth, loader e toast
    pages/             Telas da aplicação (inclui CalculoFormPage.tsx)
    services/          API, máscaras, colunas e exportadores
    types/             Tipos TypeScript
traefik/
  dynamic/routers.yml  Template de roteamento por domínio
  render-and-run.sh    Renderiza o domínio e inicia o Traefik
```

## Funcionalidades

### Autenticação

- Login por e-mail e senha em `/login`.
- Token JWT salvo no `localStorage` com a chave `pmro_token`.
- Redirecionamento automático para login quando a API retorna `401`.
- Expiração padrão do token: 480 minutos, configurável por
  `ACCESS_TOKEN_EXPIRE_MINUTES`.
- Todas as rotas de negócio exigem `Authorization: Bearer <token>`.

### Usuários

- Listagem paginada, busca por nome ou e-mail, criação, edição e exclusão.
- Criação exige nome completo, e-mail, senha e confirmação de senha.
- Edição de outro usuário altera apenas nome e e-mail.
- Alteração de senha só é permitida para o próprio usuário autenticado e exige
  a senha atual.

### Policiais militares

- Listagem paginada, filtro por posto/graduação, busca por nome ou matrícula,
  criação, edição e exclusão.
- Cada policial possui **posto/graduação**, **matrícula**, **nome completo** e
  **OPM** (unidade; padrão `7º BPM`).
- Postos/graduações são exibidos na ordem hierárquica:
  `SD PM`, `CB PM`, `3º SGT PM`, `2º SGT PM`, `1º SGT PM`, `ST PM`, `CAD PM`,
  `2º TEN PM`, `1º TEN PM`, `CAP PM`, `MAJ PM`, `TC PM`, `CEL PM`.
- A exclusão de um policial remove também os requerimentos vinculados.

### Requerimentos

- Tela inicial com cards por posto/graduação e contador de requerimentos.
- Listagem por posto com busca por nome ou RE, paginação, visualização, edição,
  exclusão e marcação de `enviado_para_cp`.
- Formulário com busca/autocomplete do policial por matrícula ou nome e botão
  **"Novo"** que abre um modal de cadastro rápido de policial militar; ao salvar,
  o policial recém-criado já fica selecionado no formulário.
- Cadastro dos **eventos** financeiros por ano (abono, 1/3 de férias e 13º), com
  data de recebimento e valor do auxílio saúde do mês.
- Visualização individual organizada por identificação do processo, dados do
  policial, situação funcional e tabela de **Eventos** (ano, evento, data de
  recebimento e auxílio saúde).
- Exportação da lista filtrada por posto para PDF e Excel.
- Exportação do requerimento individual para PDF.
- **Módulo de Cálculo de Diferenças** por requerimento (ver seção própria), com
  exportação da planilha `.ods` no modelo oficial da CP.

## Regras e validações

### Usuários

- `nome_completo`: obrigatório, entre 3 e 180 caracteres.
- `email`: obrigatório, entre 5 e 180 caracteres, deve conter `@`, é convertido
  para minúsculas e deve ser único.
- `senha`: entre 6 e 128 caracteres.
- Senhas são armazenadas somente como hash bcrypt.

### Policiais militares

- `posto_graduacao`: obrigatório e restrito aos 13 valores oficiais.
- `matricula`: obrigatória, única, numérica, com 9 dígitos e prefixo `1000`.
- `nome_completo`: obrigatório, entre 3 e 180 caracteres.
- `opm`: obrigatória, entre 2 e 60 caracteres, com padrão `7º BPM`.

### Requerimentos

- `policial_id`: obrigatório e deve apontar para policial existente.
- `num_processo_sei_requerimento`: obrigatório, único e no formato
  `0000.000000/0000-00`. A unicidade é exigida na **criação**; na **atualização**
  só há conflito (`409`) se o número pertencer a **outro** registro (editar o
  próprio requerimento mantendo o mesmo SEI é permitido).
- `data_recebimento_opm`: obrigatória. Também é a **data-base da prescrição**.
- `hora_recebimento_opm`: obrigatória.
- `num_sei_certidao_opm`: obrigatório, entre 1 e 40 caracteres.
- `tem_afastamentos`, `gozou_ferias_5_anos`, `tem_prioridade_legal` e
  `enviado_para_cp`: booleanos, com padrão `false`.
- **Eventos** (`requerimento_evento`): cada evento tem `tipo_evento`
  (`ABONO`, `1/3-FÉRIAS` ou `13º`), `ano` de referência (2021–2026),
  `data_recebido` (data completa do pagamento, que pode cair em outro ano) e
  `valor_auxilio_saude` (padrão brasileiro, ex.: `50,00`; a API normaliza `50`
  para `50,00`). Não pode haver dois eventos com o mesmo (tipo, ano); o valor do
  auxílio é obrigatório quando o evento é informado.
- Os dados de posto, matrícula, nome e OPM do policial não são duplicados na
  tabela de requerimentos; eles são retornados via relacionamento com o policial.

## Módulo de Cálculo de Diferenças

O módulo reproduz a lógica da planilha original da CP (CP9) para o cálculo das
diferenças referentes à inclusão do **auxílio-saúde** e **auxílio-alimentação**
na base de cálculo de:

- abono pecuniário;
- 1/3 constitucional de férias;
- 13º salário.

Os cálculos são feitos **oficialmente no backend**, em
`backend/app/services/calculo_service.py`, usando `Decimal` com precisão plena.
O **backend é a fonte da verdade**: o frontend apenas consome o resultado da API
para simulação, visualização, salvamento e exportação — não duplica a regra.

### Origem dos dados do cálculo

O cálculo parte de um requerimento já cadastrado e reaproveita:

- dados do policial militar: nome completo, posto/graduação, matrícula e OPM;
- dados do requerimento: número do processo SEI, data e hora de recebimento na OPM;
- **lançamentos**, derivados dos eventos cadastrados no requerimento;
- **afastamentos**, informados pelo operador na tela de cálculo, quando houver.

A `data_recebimento_opm` é usada como **data-base da prescrição quinquenal**.

### Lançamentos

Cada lançamento representa um evento financeiro encontrado na ficha financeira do
policial. No sistema, os lançamentos **não são digitados na tela de cálculo**:
eles são **derivados dos eventos do requerimento** (`requerimento_evento`). Cada
lançamento possui:

- data recebida (`data_recebido` do evento);
- tipo de evento — `ABONO`, `1/3-FÉRIAS` ou `13º`;
- tipo de auxílio saúde — `SAUDE` ou `CONDICIONAL`.

O **tipo de auxílio saúde é derivado do valor** informado no evento
(`tipo_auxilio_from_valor`):

```text
valor == 50  -> SAUDE
valor != 50  -> CONDICIONAL
```

Eventos sem valor de auxílio saúde são ignorados no cálculo. A partir da data
recebida o sistema extrai o **ano**, o **mês** e a **competência de correção**
(`date(ano, mes, 1)`).

### Parâmetros de auxílio

O sistema usa uma tabela de parâmetros por ano e mês (`parametros_auxilio`),
contendo auxílio alimentação, auxílio saúde e auxílio saúde condicional:

- auxílio saúde: `50,00`; auxílio saúde condicional: `150,00` (constantes 2021–2026);
- auxílio alimentação por competência:

| Período | Auxílio alimentação |
| --- | --- |
| 2021 (todos os meses) | `252,50` |
| 2022 — janeiro | `272,70` |
| 2022 — fevereiro | `304,06` |
| 2022 — demais meses | `316,23` |
| 2023 (todos os meses) | `316,23` |
| 2024, 2025 e 2026 | `253,46` |

Seleção do auxílio saúde aplicável:

- tipo `SAUDE` → usa o **auxílio saúde** (`50,00`);
- tipo `CONDICIONAL` → usa o **auxílio saúde condicional** (`150,00`).

Base complementar de cada evento:

```text
base_complementar = auxilio_alimentacao + auxilio_saude_aplicavel
```

### Cálculo do 1/3 de férias

```text
diferenca_terco_ferias = base_complementar / 3
```

Aplicada apenas quando o evento for `1/3-FÉRIAS`; nos demais, fica zerada no lançamento.

### Cálculo do abono pecuniário

Fórmula original da planilha:

```text
diferenca_abono = (base_complementar / 3) + ((base_complementar / 3) / 3)
```

Equivalência matemática:

```text
diferenca_abono = base_complementar * 4 / 9
```

O sistema mantém a lógica da planilha original; aplicada apenas quando o evento for `ABONO`.

### Cálculo do 13º salário

```text
diferenca_13 = base_complementar * (avos_13 / 12)
```

- sem afastamento com reflexo no ano, normalmente `avos_13 = 12`;
- com afastamento com reflexo, `avos_13` vem da apuração de afastamentos (abaixo);
- o 13º **não é bloqueado** como o abono ou o 1/3 de férias: ele é
  proporcionalizado pelos avos remuneratórios.

### Diferença original

Para cada lançamento, apenas a parcela do seu tipo de evento é diferente de zero:

```text
diferenca_original = diferenca_abono + diferenca_terco_ferias + diferenca_13
```

- evento `ABONO` → usa `diferenca_abono`;
- evento `1/3-FÉRIAS` → usa `diferenca_terco_ferias`;
- evento `13º` → usa `diferenca_13`.

### Afastamentos

Os afastamentos apuram reflexos sobre os avos do 13º e sobre o direito ao
abono/1/3 de férias no ano civil. Cada afastamento possui **modalidade**,
**data de início** e **data de fim**.

Modalidades:

- aparecem na interface: `LTIP`, `LTSD`, `LAC`, `DESERTOR`,
  `PRESO TRANS. JULG.`, `EXCLUÍDO`;
- `LICENCIADO`: existe apenas internamente, para compatibilidade da matriz de
  cálculo (não é oferecida na interface).

Apuração de avos por ano civil: para cada ano de 2021 a 2026, o sistema verifica
a interseção do afastamento com o ano (`01/01/ano` a `31/12/ano`) e calcula o
trecho dentro do ano:

```text
inicio_no_ano = max(data_inicio, 01/01/ano)
fim_no_ano    = min(data_fim, 31/12/ano)
```

Regra do dia 15:

- o mês inicial conta avo quando o afastamento começa **até o dia 15**;
- o mês final conta avo quando o afastamento termina **no dia 15 ou depois**.

Fórmula dos avos brutos dentro do ano (`avos_periodo`):

```text
avos = min(12, max(0,
        (anoFim - anoInicio) * 12 + (mesFim - mesInicio) - 1
        + (diaInicio <= 15 ? 1 : 0)
        + (diaFim    >= 15 ? 1 : 0)))
```

### Avos do 13º por ano

O sistema consolida os afastamentos por ano civil e modalidade:

- `LAC`, `LTIP`, `EXCLUÍDO`, `LICENCIADO` e `DESERTOR` reduzem avos conforme a
  soma dos avos no ano;
- `LTSD` tem regra especial (só reduz o excedente a 6 avos / 180 dias no ano);
- `PRESO TRANS. JULG.` reduz metade dos avos.

```text
ltsd_excedente = max(0, soma_avos_LTSD_no_ano - 6)
reducao_integral = LAC + LTIP + EXCLUÍDO + LICENCIADO + DESERTOR + ltsd_excedente
reducao_preso = soma_avos_PRESO_no_ano * 0,5

avos_13 = max(0, 12 - reducao_integral - reducao_preso)
```

O resultado alimenta o cálculo do 13º.

### Reflexo dos afastamentos em abono e 1/3 de férias

Conforme a lógica da planilha, considera-se que há **reflexo** no ano quando
`avos_do_ano < 12`:

- evento `13º`: o valor **não é zerado**; já foi proporcionalizado pelos avos;
- eventos `ABONO` e `1/3-FÉRIAS`: se o ano possui afastamento com reflexo, o
  percentual aplicável é **zerado**; senão, é **100%**.

```text
percentual_aplicavel = 1          # sem bloqueio (e sempre 1 para 13º)
percentual_aplicavel = 0          # ABONO/1/3-FÉRIAS em ano com reflexo

diferenca_ajustada = diferenca_original * percentual_aplicavel
```

Motivos automáticos registrados no lançamento:

- `Sem afastamento com reflexo`;
- `13º calculado por avos remuneratórios da aba Afastamentos`;
- `Férias/abono bloqueados se o ano civil possuir afastamento com reflexo`.

### Correção monetária pelo IPCA-E

A planilha original usa **IPCA-E/IBGE, sem juros, com acumulação composta mensal**.
O sistema lê uma tabela de índices mensais do banco (`indices_correcao`,
percentuais decimais). A competência de correção vem do mês/ano da data recebida
do lançamento.

```text
fator_correcao = produto(1 + percentual_mensal)
```

acumulando da competência do evento até a **última competência oficial
disponível** (`05/2026`), inclusive. Não há projeção de índices futuros: meses
sem índice divulgado contribuem com fator `1`.

```text
valor_corrigido_original = diferenca_original * fator_correcao
valor_corrigido_ajustado = diferenca_ajustada * fator_correcao
```

Data-base da correção: `31/05/2026`. Exemplos de conferência (testes):

| Competência | Fator |
| --- | --- |
| 06/2021 | `1,33553090` |
| 12/2024 | `1,07933949` |
| 05/2026 | `1,00620000` |

### Prescrição quinquenal

```text
data_limite_prescricao = data_recebimento_opm - 5 anos
prescrito = data_evento < data_limite_prescricao
```

O operador é **estritamente menor (`<`)**:

- data do evento **anterior** à data limite → prescrito;
- data do evento **igual** à data limite → **não** prescrito.

Eventos prescritos são exibidos como prescritos, **não entram no total a receber**
e aparecem na exportação como `Prescrito`/`---`, conforme o layout.

### Totais

```text
total_abono        = soma(valor_corrigido_ajustado não prescrito dos eventos ABONO)
total_terco_ferias = soma(valor_corrigido_ajustado não prescrito dos eventos 1/3-FÉRIAS)
total_13           = soma(valor_corrigido_ajustado não prescrito dos eventos 13º)
total_geral        = total_abono + total_terco_ferias + total_13
```

Eventos prescritos não compõem os totais.

### Precisão, arredondamento e armazenamento

- o backend usa `Decimal` para evitar erros de ponto flutuante;
- valores intermediários e fatores são mantidos com precisão plena;
- o arredondamento para 2 casas ocorre **apenas na exibição/exportação**,
  evitando diferença de centavos em relação à planilha original.

Tipos no banco (`backend/app/models/calculo.py`):

- valores monetários e derivados: `Numeric(18, 6)`;
- fator de correção: `Numeric(16, 8)`;
- avos do 13º: `Numeric(6, 3)`;
- percentual aplicável: `Numeric(5, 4)`.

### Snapshot congelado do cálculo

Ao salvar, o sistema persiste um **snapshot** dos dados informados e dos
resultados calculados: lançamentos, afastamentos (com `avos_por_ano` em JSONB),
parâmetros aplicados, valores intermediários, fator de correção, valores
corrigidos, motivos de ajuste, prescrição e totais.

- Alterações futuras em índices ou parâmetros **não** alteram cálculos já salvos.
- O cálculo só é atualizado por ação explícita de recálculo/salvamento (`PUT`).
- Nesta versão há relação **1:1** com o requerimento (`calculos.requerimento_id`
  é único): mantém-se apenas o **último snapshot**, sem histórico de versões.

### Simulação e salvamento

Fluxo de uso:

1. o usuário acessa o requerimento e abre o módulo de cálculo;
2. os lançamentos já vêm dos eventos do requerimento; o usuário informa apenas os
   afastamentos, quando houver;
3. o frontend chama o endpoint de **simulação**;
4. o backend calcula e retorna o resultado;
5. o usuário confere;
6. ao salvar, o backend grava o **snapshot** (`PUT`).

Endpoints (sob `/api/v1/requerimentos`):

- `GET /{id}/calculo` — retorna o cálculo salvo.
- `POST /{id}/calculo/simular` — calcula sem persistir.
- `PUT /{id}/calculo` — calcula e grava o snapshot.
- `DELETE /{id}/calculo` — remove o cálculo salvo.
- `GET /{id}/calculo/export.ods` — gera a planilha `.ods` modelo CP9.

### Exportações do cálculo

- **PDF** e **XLSX técnico**: gerados no frontend
  (`frontend/src/services/exporters.ts`), com as abas **Lançamentos**,
  **Afastamentos** e **Resumo**, a partir dos valores calculados pelo backend.
- **ODS modelo CP9**: gerado no **backend**
  (`backend/app/services/export_ods_service.py` + `uno_fill_worker.py`), usando
  **LibreOffice headless** para preencher o template
  `backend/app/templates/modelo_cp9.ods`. A planilha original é um motor de
  cálculo: o sistema preenche apenas as **células de entrada** (identificação,
  lançamentos e afastamentos) e o próprio LibreOffice **recalcula** o restante.
  São preservados o layout, as **fórmulas**, as **validações**, a **proteção de
  células**, as colunas ocultas e a **senha de abertura `123456`** (mesma do
  modelo da CP). É, portanto, uma **reprodução editável**: ao abrir e alterar uma
  célula de entrada, a planilha recalcula sozinha. O nome do arquivo segue o
  padrão `matricula_posto-graduacao_nome-completo_.ods`.

### Validação contra a planilha original

Os cálculos foram validados contra a planilha original da CP, em:

```text
docs-exemplo/100012345_CB PM_NOME-EXEMPLO_DIF_ABONO_TERÇO_13º___.ods
```

Senha: `123456`.

A validação compara lançamentos, afastamentos, fatores de correção, diferenças
ajustadas, diferenças corrigidas, subtotais e total geral, exigindo que o total
**bata centavo a centavo** com a planilha. O teste automatizado
`backend/tests/test_calculo_service.py` cobre um exemplo de 15 lançamentos (sem
afastamento, protocolo 21/06/2026) cujo **total geral é R$ 3.568,14**, além dos
fatores de correção e das regras de afastamento/prescrição.

### Testes e verificações

Backend (suíte de testes): o pytest é uma dependência de desenvolvimento
(`backend/requirements-dev.txt`), não incluída na imagem de produção. Instale-a
antes de rodar os testes:

```bash
cd backend
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/pytest
```

A suíte (`tests/test_calculo_service.py`, configurada em `pytest.ini`) valida o
núcleo de cálculo contra a planilha CP9.

Frontend:

```bash
cd frontend
npm run build
```

Checklist de validação manual:

- criar policial com OPM;
- criar requerimento e lançar os eventos (abono/1/3/13º);
- abrir o módulo de cálculo;
- simular;
- salvar (snapshot);
- exportar (PDF, XLSX e `.ods`);
- comparar o `.ods`/totais com a planilha original (centavo a centavo);
- testar com afastamentos (ex.: LTIP/LTSD/PRESO afetando os avos do 13º);
- testar com evento prescrito (não entra no total);
- testar exportação PDF;
- testar exportação XLSX/ODS;
- verificar se a ordenação dos requerimentos continua funcionando.

## API

Base URL: `/api/v1`.

### Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/auth/login` | Autentica e retorna `{ access_token, token_type }`. |
| `GET` | `/auth/me` | Retorna o usuário autenticado. |

### Usuários

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/usuarios` | Lista usuários. Aceita `busca`, `page` e `per_page`. |
| `GET` | `/usuarios/{id}` | Busca usuário por ID. |
| `POST` | `/usuarios` | Cria usuário. |
| `PUT` | `/usuarios/{id}` | Atualiza nome e e-mail. |
| `PUT` | `/usuarios/{id}/senha` | Atualiza senha do próprio usuário autenticado. |
| `DELETE` | `/usuarios/{id}` | Remove usuário. |

### Policiais militares

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/policiais/postos` | Lista postos/graduações na ordem oficial. |
| `GET` | `/policiais` | Lista policiais. Aceita `posto_graduacao`, `busca`, `page` e `per_page`. |
| `GET` | `/policiais/{id}` | Busca policial por ID. |
| `POST` | `/policiais` | Cria policial (inclui `opm`). |
| `PUT` | `/policiais/{id}` | Atualiza policial. |
| `DELETE` | `/policiais/{id}` | Remove policial e requerimentos vinculados. |

### Requerimentos

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/requerimentos/contadores` | Retorna contagem de requerimentos por posto. |
| `GET` | `/requerimentos` | Lista requerimentos. Aceita `posto_graduacao`, `busca`, `page` e `per_page`. |
| `GET` | `/requerimentos/{id}` | Busca requerimento por ID, incluindo `policial` e `eventos`. |
| `POST` | `/requerimentos` | Cria requerimento (com eventos). |
| `PUT` | `/requerimentos/{id}` | Atualiza requerimento (com eventos). |
| `PATCH` | `/requerimentos/{id}/enviado-cp` | Marca ou desmarca envio para CP. |
| `DELETE` | `/requerimentos/{id}` | Remove requerimento. |

### Cálculo de diferenças

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/requerimentos/{id}/calculo` | Retorna o cálculo salvo (snapshot). |
| `POST` | `/requerimentos/{id}/calculo/simular` | Calcula sem persistir. Corpo: `{ afastamentos }`. |
| `PUT` | `/requerimentos/{id}/calculo` | Calcula e grava o snapshot. Corpo: `{ afastamentos }`. |
| `DELETE` | `/requerimentos/{id}/calculo` | Remove o cálculo salvo. |
| `GET` | `/requerimentos/{id}/calculo/export.ods` | Gera a planilha `.ods` modelo CP9 (`application/vnd.oasis.opendocument.spreadsheet`). Exige cálculo salvo. |

As listas paginadas retornam o total de registros no header `X-Total-Count`.
O parâmetro `page` começa em `1` e `per_page` aceita no máximo `10`.

Os requerimentos são ordenados por hierarquia do posto, data de recebimento,
hora de recebimento e nome do policial.

## Execução local com Docker

1. Copie o arquivo de exemplo:

   ```bash
   cp .env.example .env
   ```

2. Revise as variáveis em `.env`, principalmente `SECRET_KEY` e os dados do
   administrador inicial.

3. Suba os serviços:

   ```bash
   docker compose up --build
   ```

4. Acesse:

   - Frontend: http://localhost:5173
   - API/OpenAPI: http://localhost:8000/docs
   - Health check: http://localhost:8000/health

O compose de desenvolvimento sobe `db`, `backend` e `frontend`. O banco expõe a
porta `5432` localmente, o backend expõe `8000` e o frontend expõe `5173`.

A imagem do backend inclui o LibreOffice headless usado para gerar o `.ods`
modelo CP9; o `entrypoint.sh` inicia um listener UNO antes do servidor.

## Usuário inicial

No startup, o backend cria automaticamente o primeiro administrador caso o
e-mail configurado ainda não exista:

- Nome: `INITIAL_ADMIN_NAME`
- E-mail: `INITIAL_ADMIN_EMAIL`
- Senha: `INITIAL_ADMIN_PASSWORD`

Valores padrão do `.env.example`:

- E-mail: `admin@pmro.local`
- Senha: `admin123`

Altere esses valores antes de usar em ambiente real.

## Desenvolvimento sem Docker

Backend:

```bash
cd backend
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
# Ajuste DATABASE_URL para apontar para seu PostgreSQL local, por exemplo:
# postgresql://pmro_user:pmro_secret@localhost:5432/pmro_requerimentos
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

A geração da planilha `.ods` modelo CP9 depende do LibreOffice e do módulo
`python3-uno` instalados no sistema; sem eles, as demais funcionalidades seguem
operando normalmente.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Em Windows, substitua `.venv/bin/python` por `.venv\Scripts\python` e
`.venv/bin/alembic` / `.venv/bin/uvicorn` por `.venv\Scripts\alembic` /
`.venv\Scripts\uvicorn`.

## Migrações

As migrações Alembic ficam em `backend/alembic/versions`.

O `backend/entrypoint.sh` executa automaticamente:

```bash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Migrações atuais:

- Schema inicial de usuários, policiais e requerimentos.
- Índice único para `num_processo_sei_requerimento`.
- Inclusão de `hora_recebimento_opm`.
- Inclusão de `enviado_para_cp`.
- Inclusão da coluna `opm` em policiais militares.
- Criação das tabelas de parâmetros (`parametros_auxilio`) e índices
  (`indices_correcao`), com seed dos valores da planilha CP9.
- Criação das tabelas do cálculo (`calculos`, `calculo_lancamentos`,
  `calculo_afastamentos`).
- Criação da tabela `requerimento_evento` (e remoção das colunas planas antigas
  de abono/1/3/auxílio saúde do requerimento).

A migração que cria o índice único de processo SEI falha propositalmente se
existirem processos duplicados, exigindo correção dos dados antes do upgrade.

## Deploy em produção

O arquivo `docker-compose-prod.yml` sobe a stack completa atrás do Traefik com
HTTPS via Let's Encrypt e desafio DNS-01 da Cloudflare.

Roteamento em domínio único:

- `https://SEU_DOMINIO/` -> frontend estático servido por nginx.
- `https://SEU_DOMINIO/api/...` -> backend FastAPI.

Como frontend e API usam a mesma origem, o build de produção do frontend usa
`VITE_API_BASE_URL=/api/v1`.

### Pré-requisitos

- Docker e Docker Compose instalados.
- Domínio configurado na Cloudflare.
- Registro DNS do domínio apontando para o servidor.
- Token de API Cloudflare com permissões `Zone:DNS:Edit` e `Zone:Read` para a
  zona do domínio.
- Portas `80` e `443` liberadas para acesso público ao Traefik.

### Passo a passo

1. Clone o projeto e entre na pasta.

2. Crie o `.env` de produção:

   ```bash
   cp .env.prod.example .env
   ```

3. Ajuste obrigatoriamente:

   - `DOMAIN`: domínio público, exemplo `requerimentos.seudominio.com.br`.
   - `ACME_EMAIL`: e-mail usado pelo Let's Encrypt.
   - `CF_DNS_API_TOKEN`: token Cloudflare para o desafio DNS-01.
   - `POSTGRES_PASSWORD`: senha forte do banco.
   - `DATABASE_URL`: mesma senha do banco no trecho da URL.
   - `SECRET_KEY`: chave aleatória longa.
   - `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`: administrador inicial.
   - `BACKEND_CORS_ORIGINS`: URL pública, exemplo
     `https://requerimentos.seudominio.com.br`.
   - `VITE_API_BASE_URL`: mantenha `/api/v1` para domínio único.

4. Prepare o armazenamento de certificados:

   ```bash
   mkdir -p letsencrypt
   touch letsencrypt/acme.json
   chmod 600 letsencrypt/acme.json
   ```

5. Suba a stack:

   ```bash
   docker compose -f docker-compose-prod.yml up -d --build
   ```

6. Acompanhe Traefik e backend:

   ```bash
   docker compose -f docker-compose-prod.yml logs -f reverse-proxy
   docker compose -f docker-compose-prod.yml logs -f backend
   ```

7. Acesse `https://SEU_DOMINIO/`, faça login com o admin inicial e troque a
   senha pela tela de edição do próprio usuário.

### Observações de produção

- O banco não expõe `5432` publicamente; fica apenas na rede interna.
- O Traefik não usa o socket Docker. Ele renderiza
  `traefik/dynamic/routers.yml` em `/tmp/traefik-dynamic/routers.yml` usando
  `DOMAIN`.
- Após trocar `DOMAIN`, recrie o serviço `reverse-proxy`.
- O frontend de produção é compilado em `frontend/Dockerfile.prod` e servido
  por nginx.
- `.env` e `letsencrypt/acme.json` não devem ser versionados.
- Para atualizar produção, rode `git pull` e depois:

  ```bash
  docker compose -f docker-compose-prod.yml up -d --build
  ```

## Verificações

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
.venv/bin/python -c "from app.main import app; print(app.title)"
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/pytest
```

Compose de desenvolvimento:

```bash
docker compose config
```

Compose de produção:

```bash
docker compose -f docker-compose-prod.yml config
```

Execute esse comando somente depois de criar e revisar o `.env` de produção,
porque `docker-compose-prod.yml` usa esse arquivo em `env_file`.

Build da imagem de produção do frontend:

```bash
docker build -f frontend/Dockerfile.prod -t pmro-frontend-prod ./frontend
```

## Notas importantes

- Há testes automatizados do núcleo de cálculo em `backend/tests`
  (`pytest`), validados contra a planilha oficial CP9.
- As exportações de **PDF** e **Excel (XLSX)** são geradas no frontend; a
  exportação **ODS** (modelo CP9) é gerada por endpoint do backend
  (`GET /requerimentos/{id}/calculo/export.ods`) via LibreOffice headless.
- O backend é a fonte da verdade do cálculo; o frontend apenas consome o
  resultado da API.
- A documentação interativa da API fica disponível em `/docs` no backend.
- Mensagens de erro de conflito usam HTTP `409` para e-mail, matrícula ou
  processo SEI duplicado.
