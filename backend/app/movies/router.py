import math
import time
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import require_admin
from app.db.session import get_db
from app.movies.models import DimGenre, DimMovie, DimPerson, MovieReview, bridge_movie_person
from app.movies.schemas import (
    MovieCreate,
    MovieDetail,
    MoviePage,
    MovieSummary,
    MovieUpdate,
    ReviewCreate,
    ReviewOut,
)

router = APIRouter()

Db = Annotated[AsyncSession, Depends(get_db)]

# Rankings por nota exigem agregar todas as avaliações; o resultado fica em cache por alguns
# segundos e é descartado a cada escrita (filme ou avaliação).
_RANKING_TTL = 60.0
_ranking_cache: dict[tuple, tuple[float, MoviePage]] = {}

_rating = (
    select(
        MovieReview.sk_movie_id.label("sk_movie_id"),
        func.avg(MovieReview.nota).label("nota_media"),
        func.count(MovieReview.sk_movie_review_id).label("qtd"),
    )
    .group_by(MovieReview.sk_movie_id)
    .subquery()
)


async def _commit(db: AsyncSession) -> None:
    await db.commit()
    _ranking_cache.clear()


def _director(movie: DimMovie) -> str | None:
    names = [p.nome_pessoa for p in movie.people if p.tipo_pessoa == "Diretor"]
    return ", ".join(names) or None


def _summary_fields(movie: DimMovie, nota: float | None, qtd: int | None) -> dict:
    return {
        "sk_movie_id": movie.sk_movie_id,
        "titulo": movie.titulo,
        "diretor": _director(movie),
        "ano_lancamento": movie.ano_lancamento,
        "generos": [g.nome_genero for g in movie.genres],
        "sinopse": movie.sinopse,
        "url_poster": movie.url_poster,
        "url_backdrop": movie.url_backdrop,
        "nota_media": round(nota, 2) if nota is not None else None,
        "qtd_avaliacoes": qtd or 0,
    }


_LOAD_OPTIONS = (
    selectinload(DimMovie.genres),
    selectinload(DimMovie.people),
    selectinload(DimMovie.companies),
)


def _plain_query() -> Select:
    return select(DimMovie).options(*_LOAD_OPTIONS)


def _movie_query() -> Select:
    return (
        select(DimMovie, _rating.c.nota_media, _rating.c.qtd)
        .outerjoin(_rating, _rating.c.sk_movie_id == DimMovie.sk_movie_id)
        .options(*_LOAD_OPTIONS)
    )


async def _get_movie_or_404(db: AsyncSession, movie_id: str) -> tuple:
    row = (await db.execute(_movie_query().where(DimMovie.sk_movie_id == movie_id))).first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Filme não encontrado")
    return row


def _detail(movie: DimMovie, nota: float | None, qtd: int | None) -> MovieDetail:
    return MovieDetail(
        **_summary_fields(movie, nota, qtd),
        duracao_minutos=movie.duracao_minutos,
        status_filme=movie.status_filme,
        elenco=[p.nome_pessoa for p in movie.people if p.tipo_pessoa == "Ator"][:12],
        produtoras=[c.nome_produtora for c in movie.companies],
    )


async def _apply_relations(
    db: AsyncSession, movie: DimMovie, data: MovieCreate | MovieUpdate
) -> None:
    names = list(dict.fromkeys(n.strip() for n in data.generos if n.strip()))
    genres = []
    for name in names:
        genre = (
            await db.execute(
                select(DimGenre).where(func.lower(DimGenre.nome_genero) == name.lower())
            )
        ).scalar_one_or_none()
        genres.append(genre or DimGenre(nome_genero=name))
    movie.genres = genres

    others = [p for p in movie.people if p.tipo_pessoa != "Diretor"]
    director = (data.diretor or "").strip()
    if director:
        person = (
            await db.execute(
                select(DimPerson).where(
                    DimPerson.nome_pessoa == director, DimPerson.tipo_pessoa == "Diretor"
                )
            )
        ).scalar_one_or_none()
        others.append(person or DimPerson(nome_pessoa=director, tipo_pessoa="Diretor"))
    movie.people = others


def _apply_scalars(movie: DimMovie, data: MovieCreate | MovieUpdate) -> None:
    movie.titulo = data.titulo.strip()
    movie.ano_lancamento = data.ano_lancamento
    movie.sinopse = data.sinopse
    movie.duracao_minutos = data.duracao_minutos
    movie.url_poster = data.url_poster
    movie.url_backdrop = data.url_backdrop


@router.get("", response_model=MoviePage)
async def list_movies(
    db: Db,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    q: str | None = None,
    genero: str | None = None,
    sort: Literal["titulo", "recentes", "nota"] = "titulo",
    min_avaliacoes: Annotated[int, Query(ge=0)] = 0,
) -> MoviePage:
    # A média só entra na consulta principal quando filtra/ordena por ela; nos demais casos
    # a página é obtida primeiro e as notas são buscadas só para esses filmes.
    needs_rating = sort == "nota" or min_avaliacoes > 0
    cache_key = (page, size, q, genero, sort, min_avaliacoes)
    if needs_rating and (hit := _ranking_cache.get(cache_key)):
        stored_at, cached = hit
        if time.monotonic() - stored_at < _RANKING_TTL:
            return cached
    query = _movie_query() if needs_rating else _plain_query()
    if min_avaliacoes:
        query = query.where(_rating.c.qtd >= min_avaliacoes)
    if q and q.strip():
        term = f"%{q.strip()}%"
        directed = (
            select(bridge_movie_person.c.sk_movie_id)
            .join(DimPerson, DimPerson.sk_person_id == bridge_movie_person.c.sk_person_id)
            .where(DimPerson.tipo_pessoa == "Diretor", DimPerson.nome_pessoa.ilike(term))
        )
        query = query.where(or_(DimMovie.titulo.ilike(term), DimMovie.sk_movie_id.in_(directed)))
    if genero:
        query = query.where(DimMovie.genres.any(DimGenre.nome_genero == genero))

    count_query = select(func.count()).select_from(query.order_by(None).subquery())
    total = (await db.execute(count_query)).scalar_one()

    if sort == "nota":
        order = [_rating.c.nota_media.desc().nulls_last(), DimMovie.titulo]
    elif sort == "recentes":
        order = [DimMovie.ano_lancamento.desc().nulls_last(), DimMovie.titulo]
    else:
        order = [DimMovie.titulo]
    rows = (await db.execute(query.order_by(*order).limit(size).offset((page - 1) * size))).all()
    if not needs_rating:
        movies = [r[0] for r in rows]
        stats = await db.execute(
            select(
                MovieReview.sk_movie_id,
                func.avg(MovieReview.nota),
                func.count(MovieReview.sk_movie_review_id),
            )
            .where(MovieReview.sk_movie_id.in_([m.sk_movie_id for m in movies]))
            .group_by(MovieReview.sk_movie_id)
        )
        by_id = {sk: (nota, qtd) for sk, nota, qtd in stats}
        rows = [(m, *by_id.get(m.sk_movie_id, (None, 0))) for m in movies]

    result = MoviePage(
        items=[MovieSummary(**_summary_fields(m, n, c)) for m, n, c in rows],
        total=total,
        page=page,
        size=size,
        pages=max(1, math.ceil(total / size)),
    )
    if needs_rating:
        _ranking_cache[cache_key] = (time.monotonic(), result)
    return result


@router.get("/generos", response_model=list[str])
async def list_genres(db: Db) -> list[str]:
    result = await db.execute(select(DimGenre.nome_genero).order_by(DimGenre.nome_genero))
    return list(result.scalars())


@router.post(
    "",
    response_model=MovieDetail,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_movie(data: MovieCreate, db: Db) -> MovieDetail:
    movie = DimMovie(id_filme=f"usr-{uuid4().hex[:12]}", titulo=data.titulo, status_filme="Lançado")
    movie.people = []
    _apply_scalars(movie, data)
    await _apply_relations(db, movie, data)
    db.add(movie)
    await _commit(db)
    return _detail(*await _get_movie_or_404(db, movie.sk_movie_id))


@router.get("/{movie_id}", response_model=MovieDetail)
async def get_movie(movie_id: str, db: Db) -> MovieDetail:
    return _detail(*await _get_movie_or_404(db, movie_id))


@router.put("/{movie_id}", response_model=MovieDetail, dependencies=[Depends(require_admin)])
async def update_movie(movie_id: str, data: MovieUpdate, db: Db) -> MovieDetail:
    movie, *_ = await _get_movie_or_404(db, movie_id)
    _apply_scalars(movie, data)
    await _apply_relations(db, movie, data)
    await _commit(db)
    return _detail(*await _get_movie_or_404(db, movie_id))


@router.delete(
    "/{movie_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_movie(movie_id: str, db: Db) -> Response:
    movie, *_ = await _get_movie_or_404(db, movie_id)
    await db.delete(movie)
    await _commit(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{movie_id}/avaliacoes", response_model=list[ReviewOut])
async def list_reviews(movie_id: str, db: Db) -> list[MovieReview]:
    await _get_movie_or_404(db, movie_id)
    result = await db.execute(
        select(MovieReview)
        .where(MovieReview.sk_movie_id == movie_id)
        .order_by(MovieReview.created_at.desc(), MovieReview.sk_movie_review_id)
    )
    return list(result.scalars())


@router.post(
    "/{movie_id}/avaliacoes",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_review(movie_id: str, data: ReviewCreate, db: Db) -> MovieReview:
    await _get_movie_or_404(db, movie_id)
    review = MovieReview(sk_movie_id=movie_id, **data.model_dump())
    db.add(review)
    await _commit(db)
    await db.refresh(review)
    return review
