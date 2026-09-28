import type { Meta, StoryObj } from "@storybook/react";
import { AuthProvider } from "../auth";
import Login from "./Login";

const meta: Meta<typeof Login> = {
  title: "Páginas/Login",
  component: Login,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => {
      localStorage.removeItem("rocketflix.auth");
      return (
        <AuthProvider>
          <Story />
        </AuthProvider>
      );
    },
  ],
};
export default meta;

export const Formulario: StoryObj<typeof Login> = {};
