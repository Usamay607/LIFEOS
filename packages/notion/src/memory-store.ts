import type { LosDataSnapshot } from "@los/types";
import { createStarterSnapshot } from "./seed";

class MemoryStore {
  private snapshot: LosDataSnapshot;

  constructor() {
    this.snapshot = createStarterSnapshot();
  }

  get(): LosDataSnapshot {
    return this.snapshot;
  }

  replace(snapshot: LosDataSnapshot): void {
    this.snapshot = snapshot;
  }

  reset(): void {
    this.snapshot = createStarterSnapshot();
  }
}

export const memoryStore = new MemoryStore();
