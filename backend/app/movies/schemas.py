from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MovieBase(BaseModel):
    titulo: str = Field(min_length=1, max_length=500)
    diretor: str | None = Field(default=None, max_length=255)
    ano_lancamento: int | None = Field(default=None, ge=1888, le=2100)
    generos: list[str] = Field(default_factory=list)
    sinopse: str | None = Field(default=None, max_length=4000)
    duracao_minutos: int | None = Field(default=None, ge=0)
    url_poster: str | None = Field(default=None, max_length=2048)
    url_backdrop: str | None = Field(default=None, max_length=2048)


class MovieCreate(MovieBase):
    pass


class MovieUpdate(MovieBase):
    pass


class MovieSummary(BaseModel):
    """Item do catálogo. `nota_media` está na escala 0–10 (a UI exibe 0–5 estrelas)."""

    sk_movie_id: str
    titulo: str
    diretor: str | None
    ano_lancamento: int | None
    generos: list[str]
    sinopse: str | None
    url_poster: str | None
    url_backdrop: str | None
    nota_media: float | None
    qtd_avaliacoes: int


class MovieDetail(MovieSummary):
    duracao_minutos: int | None
    status_filme: str | None
    elenco: list[str]
    produtoras: list[str]


class MoviePage(BaseModel):
    items: list[MovieSummary]
    total: int
    page: int
    size: int
    pages: int


class ReviewCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    nota: float = Field(ge=0, le=10, description="Escala 0–10 (1 a 5 estrelas = 2 a 10)")
    comentario: str = Field(min_length=1, max_length=4000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_movie_review_id: str
    nome: str
    nota: float
    comentario: str
    created_at: datetime
