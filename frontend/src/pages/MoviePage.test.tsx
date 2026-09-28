import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { api } from "../api";
import { makeDetail, renderApp } from "../test/utils";
import MoviePage from "./MoviePage";

vi.mock("../api", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api")>();
  return {
    ...original,
    api: { ...original.api, movie: vi.fn(), reviews: vi.fn(), createReview: vi.fn(), deleteMovie: vi.fn() },
  };
});

const view = (admin: boolean) =>
  renderApp(
    <Routes>
      <Route path="/filme/:id" element={<MoviePage />} />
    </Routes>,
    { route: "/filme/m1", admin },
  );

beforeEach(() => {
  vi.mocked(api.movie).mockResolvedValue(makeDetail());
  vi.mocked(api.reviews).mockResolvedValue([
    { sk_movie_review_id: "r1", nome: "Ana", nota: 10, comentario: "Incrível", created_at: "2026-01-02T10:00:00" },
  ]);
});

describe("MoviePage", () => {
  it("mostra detalhes, média e avaliações", async () => {
    view(false);
    expect(await screen.findByRole("heading", { name: /Matrix/ })).toBeInTheDocument();
    expect(screen.getByText("4.0 · 3 avaliações")).toBeInTheDocument();
    expect(screen.getByText("Wachowski")).toBeInTheDocument();
    expect(await screen.findByText("Incrível")).toBeInTheDocument();
  });

  it("visitante não vê editar/remover nem o formulário de avaliação", async () => {
    view(false);
    await screen.findByRole("heading", { name: /Matrix/ });
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remover" })).not.toBeInTheDocument();
    expect(screen.getByText(/Entre como administrador/)).toBeInTheDocument();
  });

  it("administrador publica uma avaliação em estrelas (nota × 2)", async () => {
    vi.mocked(api.createReview).mockResolvedValue({
      sk_movie_review_id: "r2", nome: "Beto", nota: 8, comentario: "Bom", created_at: "2026-01-03T10:00:00",
    });
    view(true);
    await screen.findByRole("heading", { name: /Matrix/ });

    const submit = screen.getByRole("button", { name: "Escolha uma nota" });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText("Seu nome"), "Beto");
    await userEvent.click(screen.getByRole("radio", { name: "4 estrelas" }));
    await userEvent.type(screen.getByPlaceholderText("Escreva sua resenha"), "Bom");
    await userEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));

    expect(api.createReview).toHaveBeenCalledWith("m1", { nome: "Beto", nota: 8, comentario: "Bom" });
  });

  it("administrador remove o filme após confirmar", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(api.deleteMovie).mockResolvedValue(undefined);
    view(true);
    await userEvent.click(await screen.findByRole("button", { name: "Remover" }));
    expect(api.deleteMovie).toHaveBeenCalledWith("m1");
  });

  it("não remove quando a confirmação é negada", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    view(true);
    await userEvent.click(await screen.findByRole("button", { name: "Remover" }));
    expect(api.deleteMovie).not.toHaveBeenCalled();
  });
});
