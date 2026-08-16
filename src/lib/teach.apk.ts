import type { TeachResult } from "./teach";

export async function teachPassage(
  _title: string,
  _text: string,
): Promise<TeachResult> {
  return {
    ok: false,
    error:
      "Teaching a new passage needs the online app. The two essays in the library work fully on this tablet.",
  };
}
