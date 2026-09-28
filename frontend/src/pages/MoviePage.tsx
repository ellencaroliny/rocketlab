import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import MovieFormModal from "../components/MovieFormModal";
import { ratingLabel, StarsDisplay, StarsInput } from "../components/Stars";

function ReviewForm({ movieId }: { movieId: string }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [stars, setStars] = useState(0);
  const [comentario, setComentario] = useState("");

  const add = useMutation({
    mutationFn: () => api.createReview(movieId, { nome: nome.trim(), nota: stars * 2, comentario: comentario.trim() }),
    onSuccess: () => {
      setNome("");
      setStars(0);
      setComentario("");
      qc.invalidateQueries({ queryKey: ["reviews", movieId] });
      qc.invalidateQueries({ queryKey: ["movie", movieId] });
      qc.invalidateQueries({ queryKey: ["movies"] });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (stars > 0) add.mutate();
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <h3>Avaliar este filme</h3>
      <input required maxLength={120} placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      <StarsInput value={stars} onChange={setStars} />
      <textarea required rows={3} maxLength={4000} placeholder="Escreva sua resenha" value={comentario} onChange={(e) => setComentario(e.target.value)} />
      {add.error && <p className="error">{(add.error as Error).message}</p>}
      <button className="btn primary" disabled={add.isPending || stars === 0}>
        {stars === 0 ? "Escolha uma nota" : add.isPending ? "Enviando…" : "Publicar avaliação"}
      </button>
    </form>
  );
}

export default function MoviePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const { isAdmin } = useAuth();

  const movie = useQuery({ queryKey: ["movie", id], queryFn: () => api.movie(id) });
  const reviews = useQuery({ queryKey: ["reviews", id], queryFn: () => api.reviews(id) });

  const remove = useMutation({
    mutationFn: () => api.deleteMovie(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["movie", id] });
      qc.invalidateQueries({ queryKey: ["movies"] });
      navigate("/catalogo");
    },
  });

  if (movie.isLoading) return <p className="empty">Carregando…</p>;
  if (movie.isError || !movie.data)
    return (
      <p className="empty">
        Filme não encontrado. <Link to="/catalogo">Voltar ao catálogo</Link>
      </p>
    );
  const m = movie.data;

  return (
    <>
      <section className="detail-hero" style={m.url_backdrop ? { backgroundImage: `url(${m.url_backdrop})` } : undefined}>
        <div className="detail-shade">
          {m.url_poster && <img className="detail-poster" src={m.url_poster} alt={m.titulo} />}
          <div className="detail-info">
            <h1>
              {m.titulo} {m.ano_lancamento && <small>({m.ano_lancamento})</small>}
            </h1>
            <div className="hero-meta">
              <StarsDisplay nota={m.nota_media} size={22} />
              <span>{ratingLabel(m.nota_media, m.qtd_avaliacoes)}</span>
            </div>
            <div className="tags">
              {m.generos.map((g) => (
                <Link key={g} to={`/catalogo?genero=${encodeURIComponent(g)}`} className="tag">
                  {g}
                </Link>
              ))}
            </div>
            <p>{m.sinopse ?? "Sem sinopse."}</p>
            <dl>
              {m.diretor && (<><dt>Direção</dt><dd>{m.diretor}</dd></>)}
              {m.duracao_minutos ? (<><dt>Duração</dt><dd>{m.duracao_minutos} min</dd></>) : null}
              {m.status_filme && (<><dt>Status</dt><dd>{m.status_filme}</dd></>)}
              {m.elenco.length > 0 && (<><dt>Elenco</dt><dd>{m.elenco.join(", ")}</dd></>)}
              {m.produtoras.length > 0 && (<><dt>Produtoras</dt><dd>{m.produtoras.join(", ")}</dd></>)}
            </dl>
            {isAdmin && (
              <div className="actions left">
                <button className="btn" onClick={() => setEditing(true)}>Editar</button>
                <button
                  className="btn danger"
                  disabled={remove.isPending}
                  onClick={() => window.confirm(`Remover “${m.titulo}”?`) && remove.mutate()}
                >
                  Remover
                </button>
              </div>
            )}
            {remove.error && <p className="error">{(remove.error as Error).message}</p>}
          </div>
        </div>
      </section>

      <div className="page reviews">
        {isAdmin ? (
          <ReviewForm movieId={id} />
        ) : (
          <div className="review-form">
            <h3>Avaliar este filme</h3>
            <p className="muted">Entre como administrador para publicar avaliações.</p>
            <Link className="btn primary" to="/login" state={{ from: `/filme/${id}` }}>
              Entrar
            </Link>
          </div>
        )}
        <div>
          <h2>Avaliações ({reviews.data?.length ?? 0})</h2>
          {reviews.data?.length === 0 && <p className="empty">Seja o primeiro a avaliar.</p>}
          <ul>
            {reviews.data?.map((r) => (
              <li key={r.sk_movie_review_id} className="review">
                <div className="review-head">
                  <strong>{r.nome}</strong>
                  <StarsDisplay nota={r.nota} size={14} />
                  <time>{new Date(r.created_at).toLocaleDateString("pt-BR")}</time>
                </div>
                <p>{r.comentario}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {editing && <MovieFormModal movie={m} onClose={() => setEditing(false)} />}
    </>
  );
}
