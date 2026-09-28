import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { api } from "./api";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import { renderApp } from "./test/utils";

vi.mock("./api", async (importOriginal) => {
  const original = await importOriginal<typeof import("./api")>();
  return { ...original, api: { ...original.api, login: vi.fn() } };
});

function Shell() {
  return (
    <>
      <Navbar onNewMovie={() => {}} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<p>Página inicial</p>} />
      </Routes>
    </>
  );
}

describe("autenticação", () => {
  it("visitante vê 'Entrar' e não vê 'Novo filme'", () => {
    renderApp(<Shell />);
    expect(screen.getByRole("link", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /novo filme/i })).not.toBeInTheDocument();
  });

  it("administrador logado vê 'Novo filme' e 'Sair'", () => {
    renderApp(<Shell />, { admin: true });
    expect(screen.getByRole("button", { name: /novo filme/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("login com sucesso guarda a sessão e volta para o início", async () => {
    vi.mocked(api.login).mockResolvedValue({ access_token: "abc", username: "admin" });
    renderApp(<Shell />, { route: "/login" });

    await userEvent.type(screen.getByLabelText("Usuário"), "admin");
    await userEvent.type(screen.getByLabelText("Senha"), "admin123");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Página inicial")).toBeInTheDocument();
    expect(api.login).toHaveBeenCalledWith("admin", "admin123");
    expect(JSON.parse(localStorage.getItem("rocketflix.auth")!)).toEqual({
      token: "abc",
      username: "admin",
    });
  });

  it("credenciais inválidas mostram o erro e não criam sessão", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("Usuário ou senha inválidos"));
    renderApp(<Shell />, { route: "/login" });

    await userEvent.type(screen.getByLabelText("Usuário"), "admin");
    await userEvent.type(screen.getByLabelText("Senha"), "errada");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Usuário ou senha inválidos");
    expect(localStorage.getItem("rocketflix.auth")).toBeNull();
  });

  it("sair encerra a sessão", async () => {
    renderApp(<Shell />, { admin: true });
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    await waitFor(() => expect(localStorage.getItem("rocketflix.auth")).toBeNull());
    expect(screen.getByRole("link", { name: "Entrar" })).toBeInTheDocument();
  });
});
