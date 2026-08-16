export type AnalysisResult = {
  title: string;
  dek: string;
  field?: string;
  reader?: string;
  terms: never[];
};

export async function analyzePassage(): Promise<{ ok: false; error: string }> {
  return {
    ok: false,
    error:
      "Teaching a new passage needs the online app. The two essays in the library work fully on this tablet.",
  };
}

export async function illustrateTerm(): Promise<{ ok: false; error: string }> {
  return {
    ok: false,
    error: "Drawing a figure needs the online app. The ink diagram above is the offline one.",
  };
}
