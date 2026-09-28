import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import MovieCard from "../components/MovieCard";
import Pagination from "../components/Pagination";
import type { Sort } from "../types";

const PAGE_SIZE = 24;

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const genero = params.get("genero") ?? "";
  const sort = (params.get("sort") as Sort) ?? "titulo";
  const page = Math.max(1, Number(params.get("page") ?? 1));

  const genres = useQuery({ queryKey: ["genres"], queryFn: api.genres });
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["movies", "catalog", { q, genero, sort, page }],
    queryFn: () => api.listMovies({ q, genero, sort, page, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  }

  return (
    <div className="page">
      <div className="toolbar">
        <h1>{q ? `Resultados para “${q}”` : "Catálogo"}</h1>
        <div className="filters">
          <select value={genero} onChange={(e) => update({ genero: e.target.value })} aria-label="Gênero">
            <option value="">Todos os gêneros</option>
            {genres.data?.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Ordenar por">
            <option value="titulo">A–Z</option>
            <option value="recentes">Mais recentes</option>
            <option value="nota">Melhor avaliados</option>
          </select>
        </div>
      </div>

      {isError && <p className="error">{(error as Error).message}</p>}
      {isLoading && <p className="empty">Carregando…</p>}
      {data && (
        <>
          <p className="count">
            {data.total.toLocaleString("pt-BR")} filme{data.total === 1 ? "" : "s"}
            {isFetching && " · atualizando…"}
          </p>
          {data.items.length === 0 ? (
            <p className="empty">Nenhum filme encontrado.</p>
          ) : (
            <div className="grid">
              {data.items.map((m) => (
                <MovieCard key={m.sk_movie_id} movie={m} />
              ))}
            </div>
          )}
          <Pagination
            page={data.page}
            pages={data.pages}
            onChange={(p) => {
              update({ page: String(p) });
              window.scrollTo({ top: 0 });
            }}
          />
        </>
      )}
    </div>
  );
}
