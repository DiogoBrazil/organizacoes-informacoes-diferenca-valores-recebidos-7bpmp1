# Sistema de Gestão de Requerimentos PMRO

Sistema web para gerenciamento dos requerimentos de diferenças decorrentes da inclusão do auxílio-saúde e auxílio-alimentação na base de cálculo do abono pecuniário, 1/3 de férias e 13º salário.

## Stack

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, JWT e bcrypt.
- Frontend: React, Vite, TypeScript, Tailwind CSS, Axios, jsPDF e SheetJS.
- Infraestrutura: Docker Compose com `db`, `backend` e `frontend` (dev) e `docker-compose-prod.yml` com Traefik + HTTPS (produção).

## Execução com Docker

1. Revise as variáveis em `.env`.
2. Suba os serviços:

```bash
docker compose up --build
```

3. Acesse:

- Frontend: http://localhost:5173
- API: http://localhost:8000/docs

## Usuário inicial

O backend cria automaticamente o primeiro usuário se ele ainda não existir:

- E-mail: `admin@pmro.local`
- Senha: `admin123`

Altere esses valores no `.env` antes de usar em ambiente real.

## Deploy em produção (Traefik + HTTPS)

O arquivo `docker-compose-prod.yml` sobe a stack completa atrás do **Traefik v3** com
**SSL automático via Let's Encrypt**, em **domínio único**:

- `https://SEU_DOMINIO/` → frontend (build estático servido por nginx);
- `https://SEU_DOMINIO/api/...` → backend (FastAPI).

Como é a mesma origem, não há CORS entre frontend e API. O frontend é compilado
com `VITE_API_BASE_URL=/api/v1` (caminho relativo) no `frontend/Dockerfile.prod`.

### Pré-requisitos no servidor

- Docker e Docker Compose instalados.
- Um domínio com registro **DNS A/AAAA** apontando para o IP do servidor.
- Portas **80** e **443** liberadas (firewall/segurança).

### Passo a passo

1. Clone o projeto e entre na pasta.

2. Crie o `.env` de produção a partir do exemplo e preencha os valores:

   ```bash
   cp .env.prod.example .env
   ```

   Ajuste obrigatoriamente:
   - `DOMAIN` — domínio público (ex.: `requerimentos.seudominio.com.br`);
   - `ACME_EMAIL` — e-mail para o Let's Encrypt;
   - `POSTGRES_PASSWORD` e o trecho de senha em `DATABASE_URL` (use a mesma senha);
   - `SECRET_KEY` — chave aleatória longa;
   - `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` — admin inicial (senha forte);
   - `BACKEND_CORS_ORIGINS=https://SEU_DOMINIO`.

3. Garanta a pasta e a permissão do armazenamento de certificados (o Traefik
   recusa o `acme.json` se estiver com permissão aberta):

   ```bash
   mkdir -p letsencrypt
   touch letsencrypt/acme.json
   chmod 600 letsencrypt/acme.json
   ```

4. Suba a stack:

   ```bash
   docker compose -f docker-compose-prod.yml up -d --build
   ```

5. Acompanhe a emissão do certificado e o roteamento:

   ```bash
   docker compose -f docker-compose-prod.yml logs -f reverse-proxy
   ```

6. Acesse `https://SEU_DOMINIO/`, verifique o cadeado (certificado válido) e
   faça login. Em seguida, **troque a senha do admin** pela própria tela
   (Minha conta → Alterar senha).

### Observações

- O banco **não** expõe a porta `5432` publicamente (fica apenas na rede interna).
- As migrações Alembic e a criação do admin inicial rodam automaticamente no
  start do backend.
- O Traefik renderiza `traefik/dynamic/routers.yml` no start usando `DOMAIN`
  do `.env`; após trocar o domínio, recrie o `reverse-proxy`.
- `letsencrypt/acme.json` e o `.env` de produção **não** são versionados
  (já constam no `.gitignore`).
- Atualizações: `git pull` e novamente
  `docker compose -f docker-compose-prod.yml up -d --build`.

### Validação local (antes de enviar ao servidor)

```bash
# valida a sintaxe e a substituição de variáveis do compose de produção
DOMAIN=teste.exemplo.com ACME_EMAIL=teste@exemplo.com POSTGRES_PASSWORD=teste \
  docker compose -f docker-compose-prod.yml config

# valida o build da imagem de produção do frontend
docker build -f frontend/Dockerfile.prod -t pmro-frontend-prod ./frontend
```

## Desenvolvimento local

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Verificações

```bash
cd frontend
npm run build
```

```bash
cd backend
.venv\Scripts\python -c "from app.main import app; print(app.title)"
```
