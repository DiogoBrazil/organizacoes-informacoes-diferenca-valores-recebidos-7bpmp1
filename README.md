# Sistema de Gestão de Requerimentos PMRO

Sistema web para gerenciamento dos requerimentos de diferenças decorrentes da inclusão do auxílio-saúde e auxílio-alimentação na base de cálculo do abono pecuniário, 1/3 de férias e 13º salário.

## Stack

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, JWT e bcrypt.
- Frontend: React, Vite, TypeScript, Tailwind CSS, Axios, jsPDF e SheetJS.
- Infraestrutura: Docker Compose com `db`, `backend` e `frontend`.

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
