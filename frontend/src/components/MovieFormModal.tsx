import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { MovieDetail, MovieInput } from "../types";

const empty = (v: string) => (v.trim() === "" ? null : v.trim());

export default function MovieFormModal({
  movie,
  onClose,
}: {
  movie?: MovieDetail;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState(movie?.titulo ?? "");
  const [diretor, setDiretor] = useState(movie?.diretor ?? "");
  const [ano, setAno] = useState(movie?.ano_lancamento?.toString() ?? "");
  const [duracao, setDuracao] = useState(movie?.duracao_minutos?.toString() ?? "");
  const [generos, setGeneros] = useState(movie?.generos.join(", ") ?? "");
  const [sinopse, setSinopse] = useState(movie?.sinopse ?? "");
  const [poster, setPoster] = useState(movie?.url_poster ?? "");
  const [backdrop, setBackdrop] = useState(movie?.url_backdrop ?? "");

  const save = useMutation({
    mutationFn: (data: MovieInput) =>
      movie ? api.updateMovie(movie.sk_movie_id, data) : api.createMovie(data),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["movies"] });
      qc.invalidateQueries({ queryKey: ["movie", saved.sk_movie_id] });
      qc.invalidateQueries({ queryKey: ["genres"] });
      onClose();
      navigate(`/filme/${saved.sk_movie_id}`);
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate({
      titulo: titulo.trim(),
      diretor: empty(diretor),
      ano_lancamento: ano ? Number(ano) : null,
      duracao_minutos: duracao ? Number(duracao) : null,
      generos: generos.split(",").map((g) => g.trim()).filter(Boolean),
      sinopse: empty(sinopse),
      url_poster: empty(poster),
      url_backdrop: empty(backdrop),
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <h2>{movie ? "Editar filme" : "Novo filme"}</h2>
        <label>
          Título *
          <input required maxLength={500} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>
        <div className="row">
          <label>
            Diretor
            <input value={diretor} onChange={(e) => setDiretor(e.target.value)} />
          </label>
          <label>
            Ano
            <input type="number" min={1888} max={2100} value={ano} onChange={(e) => setAno(e.target.value)} />
          </label>
          <label>
            Duração (min)
            <input type="number" min={0} value={duracao} onChange={(e) => setDuracao(e.target.value)} />
          </label>
        </div>
        <label>
          Gêneros (separados por vírgula)
          <input placeholder="Drama, Comedy" value={generos} onChange={(e) => setGeneros(e.target.value)} />
        </label>
        <label>
          Sinopse
          <textarea rows={4} maxLength={4000} value={sinopse} onChange={(e) => setSinopse(e.target.value)} />
        </label>
        <label>
          URL do pôster
          <input type="url" value={poster} onChange={(e) => setPoster(e.target.value)} />
        </label>
        <label>
          URL do backdrop
          <input type="url" value={backdrop} onChange={(e) => setBackdrop(e.target.value)} />
        </label>
        {save.error && <p className="error">{(save.error as Error).message}</p>}
        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" disabled={save.isPending}>
            {save.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
