import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../auth";
import type { MovieDetail, MovieSummary } from "../types";

export function renderApp(ui: ReactElement, { route = "/", admin = false } = {}) {
  if (admin) {
    localStorage.setItem("rocketflix.auth", JSON.stringify({ token: "tok", username: "admin" }));
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

export const makeMovie = (over: Partial<MovieSummary> = {}): MovieSummary => ({
  sk_movie_id: "m1",
  titulo: "Matrix",
  diretor: "Wachowski",
  ano_lancamento: 1999,
  generos: ["Action"],
  sinopse: "Um hacker descobre a verdade.",
  url_poster: "https://img/poster.jpg",
  url_backdrop: null,
  nota_media: 8,
  qtd_avaliacoes: 3,
  ...over,
});

export const makeDetail = (over: Partial<MovieDetail> = {}): MovieDetail => ({
  ...makeMovie(),
  duracao_minutos: 136,
  status_filme: "Lançado",
  elenco: ["Keanu Reeves"],
  produtoras: ["Warner"],
  ...over,
});
