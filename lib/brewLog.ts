import { SavedRecipe } from "@/types";

const STORAGE_KEY = "brewmate_log";

export function getBrewLog(): SavedRecipe[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToBrewLog(entry: SavedRecipe): void {
  const log = getBrewLog();
  log.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

export function updateBrewLogEntry(
  id: string,
  updates: Partial<Pick<SavedRecipe, "rating" | "userNotes">>
): void {
  const log = getBrewLog();
  const idx = log.findIndex((e) => e.id === id);
  if (idx !== -1) {
    log[idx] = { ...log[idx], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  }
}

export function deleteFromBrewLog(id: string): void {
  const log = getBrewLog().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

export function getBrewLogEntry(id: string): SavedRecipe | undefined {
  return getBrewLog().find((e) => e.id === id);
}
