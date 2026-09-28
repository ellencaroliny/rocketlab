import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Node recente expõe um `localStorage` global próprio que sobrepõe o do jsdom; usamos um
// armazenamento em memória para os testes serem independentes da versão do Node.
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

vi.stubGlobal("localStorage", new MemoryStorage());

afterEach(() => {
  cleanup();
  localStorage.clear();
});
