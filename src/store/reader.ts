import { create } from "zustand";
import { SEED_ARTICLES } from "@/data/articles";
import type {
  Article,
  ContrastName,
  MobilePane,
  ThemeName,
  TypeScale,
} from "@/lib/types";

const SETTINGS_KEY = "gloss-settings-v2";
const CUSTOM_KEY = "gloss-custom-v1";

type Settings = {
  theme: ThemeName;
  contrast: ContrastName;
  typeScale: TypeScale;
  articleId: string;
};

function loadSettings(): Settings {
  const fallback: Settings = {
    theme: "paper",
    contrast: "standard",
    typeScale: 1,
    articleId: SEED_ARTICLES[0].id,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function loadCustom(): Article[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as Article[]) : [];
  } catch {
    return [];
  }
}

type ReaderState = {
  hydrated: boolean;
  theme: ThemeName;
  contrast: ContrastName;
  typeScale: TypeScale;
  articleId: string;
  customArticles: Article[];
  activeTermId: string | null;
  expanded: boolean;
  focusedTermId: string | null;
  mobilePane: MobilePane;
  libraryOpen: boolean;
  importOpen: boolean;
  hintSeen: boolean;
  hydrate: () => void;
  setTheme: (theme: ThemeName) => void;
  setContrast: (contrast: ContrastName) => void;
  setTypeScale: (typeScale: TypeScale) => void;
  openArticle: (id: string) => void;
  addArticle: (article: Article) => void;
  removeArticle: (id: string) => void;
  focusTerm: (id: string | null) => void;
  expandTerm: (id: string) => void;
  collapse: () => void;
  setMobilePane: (pane: MobilePane) => void;
  setLibraryOpen: (open: boolean) => void;
  setImportOpen: (open: boolean) => void;
  dismissHint: () => void;
};

function persistSettings(partial: Partial<Settings>) {
  if (typeof window === "undefined") return;
  const current = loadSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...partial }));
}

export const useReader = create<ReaderState>((set, get) => ({
  hydrated: false,
  theme: "paper",
  contrast: "standard",
  typeScale: 1,
  articleId: SEED_ARTICLES[0].id,
  customArticles: [],
  activeTermId: null,
  expanded: false,
  focusedTermId: null,
  mobilePane: "read",
  libraryOpen: false,
  importOpen: false,
  hintSeen: true,
  hydrate: () => {
    const s = loadSettings();
    const custom = loadCustom();
    let hintSeen = true;
    try {
      hintSeen = localStorage.getItem("gloss-hint") === "1";
    } catch {
      hintSeen = true;
    }
    set({
      ...s,
      customArticles: custom,
      hydrated: true,
      hintSeen,
    });
  },
  setTheme: (theme) => {
    persistSettings({ theme });
    set({ theme });
  },
  setContrast: (contrast) => {
    persistSettings({ contrast });
    set({ contrast });
  },
  setTypeScale: (typeScale) => {
    persistSettings({ typeScale });
    set({ typeScale });
  },
  openArticle: (id) => {
    persistSettings({ articleId: id });
    set({
      articleId: id,
      activeTermId: null,
      expanded: false,
      focusedTermId: null,
      libraryOpen: false,
      mobilePane: "read",
    });
  },
  addArticle: (article) => {
    const next = [
      article,
      ...get().customArticles.filter((a) => a.id !== article.id),
    ];
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {
      /* quota */
    }
    persistSettings({ articleId: article.id });
    set({
      customArticles: next,
      articleId: article.id,
      importOpen: false,
      activeTermId: null,
      expanded: false,
      focusedTermId: null,
      mobilePane: "read",
    });
  },
  removeArticle: (id) => {
    const next = get().customArticles.filter((a) => a.id !== id);
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {
      /* quota */
    }
    const fallback = SEED_ARTICLES[0].id;
    const articleId = get().articleId === id ? fallback : get().articleId;
    persistSettings({ articleId });
    set({ customArticles: next, articleId });
  },
  focusTerm: (id) => set({ focusedTermId: id, activeTermId: id ?? get().activeTermId }),
  expandTerm: (id) =>
    set({
      activeTermId: id,
      focusedTermId: id,
      expanded: true,
      mobilePane: "words",
    }),
  collapse: () => set({ expanded: false }),
  setMobilePane: (mobilePane) => set({ mobilePane }),
  setLibraryOpen: (libraryOpen) => set({ libraryOpen }),
  setImportOpen: (importOpen) => set({ importOpen }),
  dismissHint: () => {
    try {
      localStorage.setItem("gloss-hint", "1");
    } catch {
      /* ignore */
    }
    set({ hintSeen: true });
  },
}));

export function useCurrentArticle(): Article {
  const articleId = useReader((s) => s.articleId);
  const custom = useReader((s) => s.customArticles);
  return (
    custom.find((a) => a.id === articleId) ??
    SEED_ARTICLES.find((a) => a.id === articleId) ??
    SEED_ARTICLES[0]
  );
}
