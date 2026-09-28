import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { StarsDisplay, StarsInput } from "./Stars";

const meta: Meta<typeof StarsDisplay> = {
  title: "Componentes/Stars",
  component: StarsDisplay,
  argTypes: {
    nota: { control: { type: "range", min: 0, max: 10, step: 0.1 }, description: "Nota na escala 0–10" },
    size: { control: { type: "number" } },
  },
  args: { nota: 7.4, size: 24 },
};
export default meta;

type Story = StoryObj<typeof StarsDisplay>;

export const Exibicao: Story = {};
export const NotaMaxima: Story = { args: { nota: 10 } };
export const SemNota: Story = { args: { nota: null } };

export const Selecao: StoryObj<typeof StarsInput> = {
  render: () => {
    const [value, setValue] = useState(3);
    return <StarsInput value={value} onChange={setValue} />;
  },
};
