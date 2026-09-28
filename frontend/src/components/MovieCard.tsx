import { Link } from "react-router-dom";
import type { MovieSummary } from "../types";
import { StarsDisplay } from "./Stars";

export default function MovieCard({ movie }: { movie: MovieSummary }) {
  return (
    <Link to={`/filme/${movie.sk_movie_id}`} className="card" title={movie.titulo}>
      {movie.url_poster ? (
        <img src={movie.url_poster} alt={movie.titulo} loading="lazy" />
      ) : (
        <div className="poster-fallback">{movie.titulo}</div>
      )}
      <div className="card-overlay">
        <strong>{movie.titulo}</strong>
        <span>
          {movie.ano_lancamento ?? "—"}
          {movie.generos[0] ? ` · ${movie.generos[0]}` : ""}
        </span>
        <StarsDisplay nota={movie.nota_media} size={14} />
      </div>
    </Link>
  );
}
