import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Navbar({ onNewMovie }: { onNewMovie: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, username, logout } = useAuth();
  const [text, setText] = useState("");

  useEffect(() => {
    if (location.pathname !== "/catalogo") setText("");
    else setText(new URLSearchParams(location.search).get("q") ?? "");
  }, [location.pathname, location.search]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = text.trim();
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : "/catalogo");
  }

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        ROCKETFLIX
      </Link>
      <nav>
        <Link to="/">Início</Link>
        <Link to="/catalogo">Catálogo</Link>
      </nav>
      <form className="search" onSubmit={submit} role="search">
        <input
          type="search"
          placeholder="Buscar por título ou diretor"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Buscar filmes"
        />
      </form>
      {isAdmin ? (
        <>
          <button className="btn primary" onClick={onNewMovie}>
            + Novo filme
          </button>
          <button
            className="btn"
            onClick={() => {
              logout();
              navigate("/");
            }}
            title={`Conectado como ${username}`}
          >
            Sair
          </button>
        </>
      ) : (
        <Link to="/login" className="btn primary">
          Entrar
        </Link>
      )}
    </header>
  );
}
