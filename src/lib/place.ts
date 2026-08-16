const KEY = "gloss-place-v1";

type Place = { scroll: number; page: number };

function all(): Record<string, Place> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, Place>;
  } catch {
    return {};
  }
}

export function loadPlace(articleId: string): Place {
  return all()[articleId] ?? { scroll: 0, page: 0 };
}

export function savePlace(articleId: string, place: Place) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...all(), [articleId]: place }));
  } catch {
    /* quota */
  }
}
