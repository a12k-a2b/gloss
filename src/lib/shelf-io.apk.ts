export async function pushShelf() {
  return {
    ok: false as const,
    error: "The shared shelf needs the online app. Export a file from the library instead.",
  };
}

export async function pullShelf() {
  return {
    ok: false as const,
    error: "The shared shelf needs the online app. Import a file instead.",
  };
}
