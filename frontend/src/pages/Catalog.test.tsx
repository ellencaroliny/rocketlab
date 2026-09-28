import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "../api";
import { makeMovie, renderApp } from "../test/utils";
import Catalog from "./Catalog";

vi.mock("../api", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api")>();
  return { ...original, api: { ...original.api, listMovies: vi.fn(), genres: vi.fn() } };
});

const page = (over = {}) => ({
  items: [makeMovie({ sk_movie_id: "a", titulo: "Alien" }), makeMovie({ sk_movie_id: "b", titulo: "Blade" })],
  total: 50,
  page: 1,
  size: 24,
  pages: 3,
  ...over,
});

beforeEach(() => {
  window.scrollTo = vi.fn();
  vi.mocked(api.genres).mockResolvedValue(["Action", "Drama"]);
  vi.mocked(api.listMovies).mockResolvedValue(page());
});

describe("Catalog", () => {
  it("lista os filmes e o total", async () => {
    renderApp(<Catalog />);
    expect(await screen.findByText("50 filmes")).toBeInTheDocument();
    expect(screen.getByTitle("Alien")).toBeInTheDocument();
    expect(screen.getByTitle("Blade")).toBeInTheDocument();
  });

  it("usa o termo de busca da URL na consulta e no título", async () => {
    renderApp(<Catalog />, { route: "/catalogo?q=alien" });
    expect(await screen.findByText("Resultados para “alien”")).toBeInTheDocument();
    expect(api.listMovies).toHaveBeenCalledWith(expect.objectContaining({ q: "alien", page: 1 }));
  });

  it("avança de página", async () => {
    renderApp(<Catalog />);
    await userEvent.click(await screen.findByRole("button", { name: "Próxima" }));
    expect(api.listMovies).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it("filtra por gênero e volta para a primeira página", async () => {
    renderApp(<Catalog />, { route: "/catalogo?page=3" });
    await screen.findByText("50 filmes");
    await userEvent.selectOptions(screen.getByLabelText("Gênero"), "Drama");
    expect(api.listMovies).toHaveBeenLastCalledWith(expect.objectContaining({ genero: "Drama", page: 1 }));
  });

  it("mostra mensagem quando nada é encontrado", async () => {
    vi.mocked(api.listMovies).mockResolvedValue(page({ items: [], total: 0, pages: 1 }));
    renderApp(<Catalog />);
    expect(await screen.findByText("Nenhum filme encontrado.")).toBeInTheDocument();
  });
});
