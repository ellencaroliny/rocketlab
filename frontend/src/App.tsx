import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import MovieFormModal from "./components/MovieFormModal";
import Navbar from "./components/Navbar";
import Catalog from "./pages/Catalog";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MoviePageView from "./pages/MoviePage";

export default function App() {
  const [creating, setCreating] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <>
      <Navbar onNewMovie={() => setCreating(true)} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/filme/:id" element={<MoviePageView />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<p className="empty">Página não encontrada.</p>} />
        </Routes>
      </main>
      {creating && isAdmin && <MovieFormModal onClose={() => setCreating(false)} />}
    </>
  );
}
