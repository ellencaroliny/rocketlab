import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, ListParams } from "../api";
import MovieCard from "../components/MovieCard";
import { StarsDisplay } from "../components/Stars";
import type { MovieSummary } from "../types";

/**
 * Chave para agrupar variações do mesmo filme: ignora subtítulo ("Die Hart 2: Die Harter"),
 * trecho entre colchetes/parênteses ("Emesis Blue [sfm]") e numeração final ("Die Hart 2").
 */
const titleKey = (s: string) =>
  s
    .replace(/[[(].*?[\])]/g, " ")
    .split(/\s*[:\-–]\s+/)[0]
    .replace(/\s+\d+$/, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/**
 * A base tem vários registros do mesmo filme. Na vitrine mostramos um só por título/ano,
 * e `seen` (compartilhado entre as fileiras) evita repetir o filme em fileiras diferentes.
 */
export const movieKey = (m: MovieSummary) => `${titleKey(m.titulo)}|${m.ano_lancamento}`;

export function showcase(items: MovieSummary[], seen: Set<string> = new Set()): MovieSummary[] {
  return items.filter((m) => {
    if (!m.url_poster) return false;
    const key = movieKey(m);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

interface RowConfig {
  title: string;
  link: string;
  params: ListParams;
}

function Row({ title, link, items, loading }: { title: string; link: string; items: MovieSummary[]; loading: boolean }) {
  if (!loading && items.length === 0) return null;
  return (
    <section className="row-section">
      <div className="row-head">
        <h2>{title}</h2>
        <Link to={link}>Ver tudo ›</Link>
      </div>
      <div className="row-scroll">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <div key={i} className="card skeleton" />)
          : items.map((m) => <MovieCard key={m.sk_movie_id} movie={m} />)}
      </div>
    </section>
  );
}

const GENRE_ROWS = ["Action", "Comedy", "Drama", "Horror", "Science Fiction"];

export default function Home() {
  const hero = useQuery({
    queryKey: ["movies", "hero"],
    queryFn: () => api.listMovies({ size: 60, sort: "nota", min_avaliacoes: 5 }),
  });
  const genres = useQuery({ queryKey: ["genres"], queryFn: api.genres });

  const rows: RowConfig[] = [
    { title: "Mais bem avaliados", link: "/catalogo?sort=nota", params: { sort: "nota", min_avaliacoes: 5 } },
    { title: "Lançamentos", link: "/catalogo?sort=recentes", params: { sort: "recentes" } },
    ...GENRE_ROWS.filter((g) => genres.data?.includes(g)).map((g) => ({
      title: g,
      link: `/catalogo?genero=${encodeURIComponent(g)}`,
      params: { genero: g, sort: "nota" as const, min_avaliacoes: 3 },
    })),
  ];

  const results = useQueries({
    queries: rows.map((r) => ({
      queryKey: ["movies", "row", r.params],
      queryFn: () => api.listMovies({ size: 60, ...r.params }),
    })),
  });

  // O destaque entra primeiro em `seen`, para não se repetir nas fileiras.
  const seen = new Set<string>();
  const featured = showcase(hero.data?.items ?? []).find((m) => m.url_backdrop && m.sinopse);
  if (featured) seen.add(movieKey(featured));
  const prepared = results.map((r) => showcase(r.data?.items ?? [], seen).slice(0, 30));

  return (
    <>
      {featured && (
        <section className="hero" style={{ backgroundImage: `url(${featured.url_backdrop})` }}>
          <div className="hero-shade">
            <h1>{featured.titulo}</h1>
            <div className="hero-meta">
              <StarsDisplay nota={featured.nota_media} size={20} />
              <span>{featured.ano_lancamento}</span>
              <span>{featured.generos.join(" · ")}</span>
            </div>
            <p>{featured.sinopse}</p>
            <Link className="btn primary" to={`/filme/${featured.sk_movie_id}`}>
              Ver detalhes
            </Link>
          </div>
        </section>
      )}
      {rows.map((r, i) => (
        <Row key={r.title} title={r.title} link={r.link} items={prepared[i]} loading={results[i].isLoading} />
      ))}
    </>
  );
}
