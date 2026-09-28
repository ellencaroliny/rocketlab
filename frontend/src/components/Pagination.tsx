export default function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Paginação">
      <button className="btn" disabled={page <= 1} onClick={() => onChange(1)}>
        «
      </button>
      <button className="btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span>
        Página {page.toLocaleString("pt-BR")} de {pages.toLocaleString("pt-BR")}
      </span>
      <button className="btn" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Próxima
      </button>
      <button className="btn" disabled={page >= pages} onClick={() => onChange(pages)}>
        »
      </button>
    </nav>
  );
}
