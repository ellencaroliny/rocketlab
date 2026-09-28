import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import Pagination from "./Pagination";

const meta: Meta<typeof Pagination> = {
  title: "Componentes/Pagination",
  component: Pagination,
  args: { page: 3, pages: 40 },
};
export default meta;

type Story = StoryObj<typeof Pagination>;

export const Interativa: Story = {
  render: (args) => {
    const [page, setPage] = useState(args.page);
    return <Pagination {...args} page={page} onChange={setPage} />;
  },
};

export const PrimeiraPagina: Story = { args: { page: 1 } };
export const UltimaPagina: Story = { args: { page: 40 } };
export const PaginaUnica: Story = { args: { page: 1, pages: 1 } };
