# Sistema de Gestão de Requerimentos PMRO

Sistema web do 7º BPMP1/PMRO para gerenciamento de requerimentos de
diferenças decorrentes da inclusão do auxílio-saúde e auxílio-alimentação na
base de cálculo do abono pecuniário, 1/3 de férias e 13º salário.

O sistema permite que operadores autenticados mantenham usuários, policiais
militares e requerimentos recebidos pela OPM, com consulta por posto/graduação,
controle de envio para a CP e exportação de relatórios em PDF e Excel.

## Stack

- Backend: Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL, JWT e bcrypt/passlib.
- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, Axios,
  lucide-react, jsPDF, jspdf-autotable e xlsx-js-style.
- Infraestrutura: Docker Compose para desenvolvimento e produção, nginx para
  servir o frontend em produção e Traefik v3.3 para proxy reverso com HTTPS.

## Estrutura

```text
backend/
  app/
    api/v1/routes/     Rotas REST de autenticação, usuários, policiais e requerimentos
    core/              Configuração, banco, segurança e constantes
    crud/              Operações de persistência
    models/            Modelos SQLAlchemy
    schemas/           Schemas e validações Pydantic
    main.py            Aplicação FastAPI, CORS e seed do admin inicial
  alembic/             Migrações do banco
frontend/
  src/
    components/        Componentes compartilhados
    context/           Auth, loader e toast
    pages/             Telas da aplicação
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
- Postos/graduações são exibidos na ordem hierárquica:
  `SD PM`, `CB PM`, `3º SGT PM`, `2º SGT PM`, `1º SGT PM`, `ST PM`, `CAD PM`,
  `2º TEN PM`, `1º TEN PM`, `CAP PM`, `MAJ PM`, `TC PM`, `CEL PM`.
- A exclusão de um policial remove também os requerimentos vinculados.

### Requerimentos

- Tela inicial com cards por posto/graduação e contador de requerimentos.
- Listagem por posto com busca por nome ou RE, paginação, visualização, edição,
  exclusão e marcação de `enviado_para_cp`.
- Formulário com busca/autocomplete do policial por matrícula ou nome.
- Visualização individual organizada por identificação do processo, dados do
  policial, situação funcional, abono/1/3 de férias e auxílio saúde.
- Exportação da lista filtrada por posto para PDF e Excel.
- Exportação do requerimento individual para PDF.

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

### Requerimentos

- `policial_id`: obrigatório e deve apontar para policial existente.
- `num_processo_sei_requerimento`: obrigatório, único e no formato
  `0000.000000/0000-00`.
- `data_recebimento_opm`: obrigatória.
- `hora_recebimento_opm`: obrigatória.
- `num_sei_certidao_opm`: obrigatório, entre 1 e 40 caracteres.
- `tem_afastamentos`, `gozou_ferias_5_anos`, `tem_prioridade_legal` e
  `enviado_para_cp`: booleanos, com padrão `false`.
- Campos de abono pecuniário e 1/3 de férias aceitam mês/ano de 2021 a 2025 no
  formato `mmm/aaaa`, por exemplo `out/2022`. A API normaliza `out./2022` para
  `out/2022`.
- Campos de auxílio saúde de 2021 a 2026 aceitam valores no padrão brasileiro,
  por exemplo `50,00`. A API normaliza `50` para `50,00` e `50,5` para `50,50`.
- Os dados de posto, matrícula e nome do policial não são duplicados na tabela
  de requerimentos; eles são retornados via relacionamento com o policial.

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
| `POST` | `/policiais` | Cria policial. |
| `PUT` | `/policiais/{id}` | Atualiza policial. |
| `DELETE` | `/policiais/{id}` | Remove policial e requerimentos vinculados. |

### Requerimentos

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/requerimentos/contadores` | Retorna contagem de requerimentos por posto. |
| `GET` | `/requerimentos` | Lista requerimentos. Aceita `posto_graduacao`, `busca`, `page` e `per_page`. |
| `GET` | `/requerimentos/{id}` | Busca requerimento por ID, incluindo o objeto `policial`. |
| `POST` | `/requerimentos` | Cria requerimento. |
| `PUT` | `/requerimentos/{id}` | Atualiza requerimento. |
| `PATCH` | `/requerimentos/{id}/enviado-cp` | Marca ou desmarca envio para CP. |
| `DELETE` | `/requerimentos/{id}` | Remove requerimento. |

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

- Não há suíte de testes automatizados configurada no repositório.
- Exportações PDF e Excel são geradas no frontend, não por endpoints do backend.
- A documentação interativa da API fica disponível em `/docs` no backend.
- Mensagens de erro de conflito usam HTTP `409` para e-mail, matrícula ou
  processo SEI duplicado.
