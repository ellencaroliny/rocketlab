# RocketFlix — Sistema de Avaliação de Filmes (Rocket Lab 2026.2)

Aplicação full stack para o Administrador gerenciar um catálogo de filmes e suas avaliações,
com interface inspirada na Netflix.

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React + TypeScript, React Router, TanStack Query (cache de consultas) |
| Backend | FastAPI (Python 3.11+), SQLAlchemy 2 assíncrono, Alembic |
| Banco | SQLite |

## Funcionalidades

- Cadastro de filmes (título, diretor, ano, gêneros, sinopse, duração, pôster/backdrop)
- Catálogo paginado, com filtro por gênero e ordenação (A–Z, mais recentes, melhor avaliados)
- Página de detalhes com informações completas, elenco, produtoras e lista de avaliações
- Busca por título **ou diretor**
- Edição e remoção de filmes
- Nova avaliação com nota de 1 a 5 estrelas e resenha
- Média geral das avaliações em cada filme (estrelas + valor + quantidade)
- **Autenticação do administrador** (JWT): leitura é pública; cadastrar, editar, remover filmes e
  publicar avaliações exigem login
- Layout responsivo, cache de consultas no frontend
- Testes automatizados (backend com pytest, frontend com Vitest + Testing Library)
- Documentação de componentes com Storybook

## Login do administrador

Usuário e senha padrão (ambiente local): **`admin` / `admin123`**. Para alterar, edite
`ADMIN_USERNAME`, `ADMIN_PASSWORD` e `SECRET_KEY` em `backend/.env` (use uma chave secreta
própria fora do ambiente local). Entre pelo botão **Entrar** no topo da página.

## Como executar

Pré-requisitos: **Python 3.11+** e **Node.js 18+**.

### 1. Dados iniciais (CSVs)

Copie os 10 arquivos `.csv` fornecidos (`dim_*.csv`, `bridge_*.csv`, `fact_movies_performance.csv`
e `movies_reviews.csv`) para `backend/data/`. Eles não são versionados.

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate      Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env            # Windows: copy .env.example .env
alembic upgrade head            # cria as tabelas
python -m app.seed --dir data   # carrega os CSVs (execute uma única vez)
uvicorn app.main:app --reload
```

- API: <http://localhost:8000> — documentação interativa em <http://localhost:8000/docs>
- Para refazer a carga: apague `backend/rocketlab.db` e repita `alembic upgrade head` e o seed.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra <http://localhost:5173>. Se a API estiver em outro endereço, defina `VITE_API_URL`
(padrão: `http://localhost:8000/api/v1`).

### 4. Testes

```bash
cd backend && pytest        # API e autenticação
cd frontend && npm test     # componentes, páginas e fluxo de login
```

### 5. Storybook (documentação dos componentes)

```bash
cd frontend
npm run storybook
```

Abre em <http://localhost:6006> (Stars, MovieCard, Pagination, Navbar e Login).

## API

`POST /api/v1/auth/login` (`username`, `password`) devolve o token; envie-o como
`Authorization: Bearer <token>` nas rotas marcadas com 🔒. `GET /api/v1/auth/me` valida o token.

Prefixo `/api/v1/movies`. As notas trafegam na escala 0–10 do banco; a interface exibe 1–5
estrelas (estrelas × 2 ao salvar).

| Método | Rota | Descrição |
|---|---|---|
| GET | `/movies?page&size&q&genero&sort&min_avaliacoes` | Catálogo paginado (`sort`: `titulo`, `recentes`, `nota`) |
| GET | `/movies/generos` | Lista de gêneros |
| POST | `/movies` 🔒 | Cadastra filme |
| GET | `/movies/{id}` | Detalhes, com média e quantidade de avaliações |
| PUT | `/movies/{id}` 🔒 | Atualiza filme |
| DELETE | `/movies/{id}` 🔒 | Remove filme (e suas avaliações) |
| GET | `/movies/{id}/avaliacoes` | Avaliações do filme |
| POST | `/movies/{id}/avaliacoes` 🔒 | Nova avaliação (`nome`, `nota` 0–10, `comentario`) |

## Decisões

- **Média das avaliações** calculada ao vivo a partir de `movie_reviews`, pois o resumo
  `dim_reviews` dos CSVs não coincide com as avaliações individuais. Rankings por nota ficam em
  cache no servidor por 60 s (descartado a cada escrita) e há um índice dedicado (migração `0002`).
- **Filmes repetidos:** a base tem muitos registros do mesmo filme (ex.: dezenas de "Die Hart 2").
  O catálogo mostra todos; a vitrine da home agrupa por título/ano.
- **Diretor** é a pessoa de tipo `Diretor` no modelo estrela; ao cadastrar/editar, o backend
  cria ou reaproveita o registro em `dim_people`. Gêneros seguem a mesma lógica.

## Estrutura

```text
backend/   app/movies (models, schemas, router), app/seed.py, migrations/, tests/
frontend/  src/pages (Home, Catalog, MoviePage), src/components, src/api.ts
```
