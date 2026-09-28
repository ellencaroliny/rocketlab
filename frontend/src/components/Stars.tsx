import { useState } from "react";

/** Exibe uma nota de 0–10 como 0–5 estrelas (com preenchimento parcial). */
export function StarsDisplay({ nota, size = 18 }: { nota: number | null; size?: number }) {
  const pct = nota === null ? 0 : Math.max(0, Math.min(100, (nota / 10) * 100));
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={nota === null ? "Sem nota" : `${(nota / 2).toFixed(1)} de 5`}>
      <span className="stars-bg">★★★★★</span>
      <span className="stars-fg" style={{ width: `${pct}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

/** Seletor de 1–5 estrelas. */
export function StarsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="stars-input" role="radiogroup" aria-label="Nota">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          className={n <= shown ? "on" : ""}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ratingLabel(nota: number | null, qtd: number) {
  if (nota === null) return "Sem avaliações";
  return `${(nota / 2).toFixed(1)} · ${qtd} avaliaç${qtd === 1 ? "ão" : "ões"}`;
}
