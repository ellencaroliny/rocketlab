import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "./Pagination";

describe("Pagination", () => {
  it("não renderiza com uma página só", () => {
    const { container } = render(<Pagination page={1} pages={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("navega para a próxima página e para a última", async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} pages={5} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    await userEvent.click(screen.getByRole("button", { name: "»" }));
    expect(onChange).toHaveBeenNthCalledWith(1, 3);
    expect(onChange).toHaveBeenNthCalledWith(2, 5);
  });

  it("desabilita voltar na primeira página e avançar na última", () => {
    const { rerender } = render(<Pagination page={1} pages={3} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    rerender(<Pagination page={3} pages={3} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });
});
