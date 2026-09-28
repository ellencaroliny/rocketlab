import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ratingLabel, StarsDisplay, StarsInput } from "./Stars";

describe("StarsDisplay", () => {
  it("converte a nota 0–10 para 0–5 estrelas", () => {
    render(<StarsDisplay nota={8} />);
    expect(screen.getByLabelText("4.0 de 5")).toBeInTheDocument();
  });

  it("indica ausência de nota", () => {
    render(<StarsDisplay nota={null} />);
    expect(screen.getByLabelText("Sem nota")).toBeInTheDocument();
  });
});

describe("StarsInput", () => {
  it("devolve a quantidade de estrelas clicada", async () => {
    const onChange = vi.fn();
    render(<StarsInput value={0} onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "4 estrelas" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("marca a estrela selecionada", () => {
    render(<StarsInput value={2} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "2 estrelas" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "3 estrelas" })).toHaveAttribute("aria-checked", "false");
  });
});

describe("ratingLabel", () => {
  it("formata média e quantidade com plural correto", () => {
    expect(ratingLabel(9, 1)).toBe("4.5 · 1 avaliação");
    expect(ratingLabel(9, 4)).toBe("4.5 · 4 avaliações");
    expect(ratingLabel(null, 0)).toBe("Sem avaliações");
  });
});
