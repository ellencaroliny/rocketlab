import type { Meta, StoryObj } from "@storybook/react";
import { AuthProvider } from "../auth";
import Navbar from "./Navbar";

const STORAGE_KEY = "rocketflix.auth";

function withSession(loggedIn: boolean) {
  return (Story: () => JSX.Element) => {
    if (loggedIn) localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "demo", username: "admin" }));
    else localStorage.removeItem(STORAGE_KEY);
    return (
      <AuthProvider>
        <Story />
      </AuthProvider>
    );
  };
}

const meta: Meta<typeof Navbar> = {
  title: "Componentes/Navbar",
  component: Navbar,
  parameters: { layout: "fullscreen" },
  args: { onNewMovie: () => {} },
};
export default meta;

type Story = StoryObj<typeof Navbar>;

export const Visitante: Story = { decorators: [withSession(false)] };
export const Administrador: Story = { decorators: [withSession(true)] };
