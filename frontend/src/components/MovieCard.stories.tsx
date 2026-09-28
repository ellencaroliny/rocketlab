import type { Meta, StoryObj } from "@storybook/react";
import MovieCard from "./MovieCard";

const meta: Meta<typeof MovieCard> = {
  title: "Componentes/MovieCard",
  component: MovieCard,
  decorators: [
    (Story) => (
      <div style={{ width: 200 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    movie: {
      sk_movie_id: "1",
      titulo: "Emesis Blue [sfm]",
      diretor: "Chad Payne",
      ano_lancamento: 2023,
      generos: ["Animation", "Horror"],
      sinopse: null,
      url_poster: "https://image.tmdb.org/t/p/w500/2fpG1PiHPHdLt8X2e7WAct7EVB7.jpg",
      url_backdrop: null,
      nota_media: 7.4,
      qtd_avaliacoes: 5,
    },
  },
};
export default meta;

type Story = StoryObj<typeof MovieCard>;

export const ComPoster: Story = {};

export const SemPoster: Story = {
  args: { movie: { ...meta.args!.movie!, url_poster: null } },
};

export const SemAvaliacoes: Story = {
  args: { movie: { ...meta.args!.movie!, nota_media: null, qtd_avaliacoes: 0 } },
};
