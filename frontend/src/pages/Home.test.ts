import { makeMovie } from "../test/utils";
import { showcase } from "./Home";

const ids = (items: ReturnType<typeof showcase>) => items.map((m) => m.sk_movie_id);

describe("showcase", () => {
  it("agrupa variações de título, subtítulo e numeração do mesmo ano", () => {
    const items = [
      makeMovie({ sk_movie_id: "1", titulo: "Die Hart 2: Die Harter" }),
      makeMovie({ sk_movie_id: "2", titulo: "Die Hart 2 : Die Harter" }),
      makeMovie({ sk_movie_id: "3", titulo: "Die Hart 2" }),
      makeMovie({ sk_movie_id: "4", titulo: "Die Hart: Die Harter" }),
      makeMovie({ sk_movie_id: "5", titulo: "Emesis Blue [sfm]", ano_lancamento: 2023 }),
      makeMovie({ sk_movie_id: "6", titulo: "Emesis Blue", ano_lancamento: 2023 }),
      makeMovie({ sk_movie_id: "7", titulo: "Matrix" }),
    ];
    expect(ids(showcase(items))).toEqual(["1", "5", "7"]);
  });

  it("diferencia o mesmo título em anos distintos e descarta filmes sem pôster", () => {
    const items = [
      makeMovie({ sk_movie_id: "1", ano_lancamento: 1999 }),
      makeMovie({ sk_movie_id: "2", ano_lancamento: 2021 }),
      makeMovie({ sk_movie_id: "3", titulo: "Outro", url_poster: null }),
    ];
    expect(ids(showcase(items))).toEqual(["1", "2"]);
  });

  it("não repete em fileiras diferentes quando compartilham o conjunto `seen`", () => {
    const seen = new Set<string>();
    const a = showcase([makeMovie({ sk_movie_id: "1", titulo: "Alien" })], seen);
    const b = showcase(
      [makeMovie({ sk_movie_id: "2", titulo: "Alien" }), makeMovie({ sk_movie_id: "3", titulo: "Blade" })],
      seen,
    );
    expect(ids(a)).toEqual(["1"]);
    expect(ids(b)).toEqual(["3"]);
  });
});
