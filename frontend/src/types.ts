export interface MovieSummary {
  sk_movie_id: string;
  titulo: string;
  diretor: string | null;
  ano_lancamento: number | null;
  generos: string[];
  sinopse: string | null;
  url_poster: string | null;
  url_backdrop: string | null;
  /** Escala 0–10 */
  nota_media: number | null;
  qtd_avaliacoes: number;
}

export interface MovieDetail extends MovieSummary {
  duracao_minutos: number | null;
  status_filme: string | null;
  elenco: string[];
  produtoras: string[];
}

export interface MoviePage {
  items: MovieSummary[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Review {
  sk_movie_review_id: string;
  nome: string;
  /** Escala 0–10 */
  nota: number;
  comentario: string;
  created_at: string;
}

export interface MovieInput {
  titulo: string;
  diretor: string | null;
  ano_lancamento: number | null;
  generos: string[];
  sinopse: string | null;
  duracao_minutos: number | null;
  url_poster: string | null;
  url_backdrop: string | null;
}

export type Sort = "titulo" | "recentes" | "nota";
