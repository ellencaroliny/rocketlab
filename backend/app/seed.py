"""Carga inicial dos CSVs no SQLite.

Uso (dentro de backend/, com o banco já migrado):
    python -m app.seed --dir data
"""

import argparse
import asyncio
import csv
from datetime import date
from pathlib import Path

from sqlalchemy import insert

from app.db.session import AsyncSessionLocal, engine
from app.movies.models import (
    DimCompany,
    DimGenre,
    DimMovie,
    DimPerson,
    DimReview,
    FactMoviePerformance,
    MovieReview,
    bridge_movie_company,
    bridge_movie_genre,
    bridge_movie_person,
)

CHUNK = 5000


def read(directory: Path, name: str) -> list[dict]:
    with open(directory / name, newline="", encoding="utf-8") as f:
        return [
            {k: (v if v != "" else None) for k, v in row.items()} for row in csv.DictReader(f)
        ]


def to_int(value):
    return int(float(value)) if value is not None else None


def to_float(value):
    return float(value) if value is not None else None


async def bulk(session, target, rows):
    for i in range(0, len(rows), CHUNK):
        await session.execute(insert(target), rows[i : i + CHUNK])


async def seed(directory: Path) -> None:
    async with AsyncSessionLocal() as session:
        movies = read(directory, "dim_movies.csv")
        for m in movies:
            m["data_lancamento"] = (
                date.fromisoformat(m["data_lancamento"]) if m["data_lancamento"] else None
            )
            m["ano_lancamento"] = to_int(m["ano_lancamento"])
            m["duracao_minutos"] = to_int(m["duracao_minutos"])
        await bulk(session, DimMovie, movies)
        await bulk(session, DimGenre, read(directory, "dim_genres.csv"))
        await bulk(session, DimCompany, read(directory, "dim_companies.csv"))
        await bulk(session, DimPerson, read(directory, "dim_people.csv"))

        await bulk(session, bridge_movie_genre, read(directory, "bridge_movie_genre.csv"))
        await bulk(session, bridge_movie_company, read(directory, "bridge_movie_company.csv"))
        await bulk(session, bridge_movie_person, read(directory, "bridge_movie_person.csv"))

        perf = read(directory, "fact_movies_performance.csv")
        for row in perf:
            for key in ("popularidade", "nota_tmdb", "nota_imdb"):
                row[key] = to_float(row[key])
            for key in ("qtd_tmdb", "qtd_imdb"):
                row[key] = to_int(row[key])
            for key in row:
                if key.endswith(("_usd", "_brl")):
                    row[key] = to_float(row[key])
                    if key.startswith("lucro") and row[key] is None:
                        row[key] = 0
        await bulk(session, FactMoviePerformance, perf)

        summaries = read(directory, "dim_reviews.csv")
        for row in summaries:
            row["qtd_avaliacoes_usuarios"] = to_int(row["qtd_avaliacoes_usuarios"]) or 0
            row["nota_media_usuarios"] = to_float(row["nota_media_usuarios"])
        await bulk(session, DimReview, summaries)

        reviews = read(directory, "movies_reviews.csv")
        for row in reviews:
            row["nota"] = float(row["nota"])
        await bulk(session, MovieReview, reviews)

        await session.commit()
    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", type=Path, default=Path("data"))
    asyncio.run(seed(parser.parse_args().dir))
    print("Carga concluída.")