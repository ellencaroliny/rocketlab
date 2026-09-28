import type { MovieDetail, MovieInput, MoviePage, Review, Sort } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });
  if (res.status === 401 && authToken) onUnauthorized?.();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : `Erro ${res.status}`;
    throw new Error(detail);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export interface ListParams {
  page?: number;
  size?: number;
  q?: string;
  genero?: string;
  sort?: Sort;
  min_avaliacoes?: number;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ access_token: string; username: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  listMovies: (p: ListParams = {}) => {
    const qs = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => v !== undefined && v !== "" && qs.set(k, String(v)));
    return request<MoviePage>(`/movies?${qs}`);
  },
  genres: () => request<string[]>("/movies/generos"),
  movie: (id: string) => request<MovieDetail>(`/movies/${id}`),
  createMovie: (data: MovieInput) =>
    request<MovieDetail>("/movies", { method: "POST", body: JSON.stringify(data) }),
  updateMovie: (id: string, data: MovieInput) =>
    request<MovieDetail>(`/movies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMovie: (id: string) => request<void>(`/movies/${id}`, { method: "DELETE" }),
  reviews: (id: string) => request<Review[]>(`/movies/${id}/avaliacoes`),
  createReview: (id: string, data: { nome: string; nota: number; comentario: string }) =>
    request<Review>(`/movies/${id}/avaliacoes`, { method: "POST", body: JSON.stringify(data) }),
};
