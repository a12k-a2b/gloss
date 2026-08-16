import { create } from "zustand";
import { SEED_ARTICLES } from "@/data/articles";
import type { AskKind } from "@/lib/ask-select";
import {
  kindFromTaps,
  rangeForKind,
  textForRange,
  tokenize,
  coveringRange,
  type AskToken,
} from "@/lib/ask-select";
import { snapUnit } from "@/lib/units";
import type {
  Article,
  ContrastName,
  MobilePane,
  Term,
  ThemeName,
  ThemePref,
  TypeScale,
} from "@/lib/types";

const SETTINGS_KEY = "gloss-settings-v2";
const CUSTOM_KEY = "gloss-custom-v1";
const ASKED_KEY = "gloss-asked-v1";

type Settings = {
  theme: ThemeName;
  themePref: ThemePref;
  contrast: ContrastName;
  typeScale: TypeScale;
  articleId: string;
  formatSaved: boolean;
  marginFollow: boolean;
  paginate: boolean;
  shelfCode: string;
};

export type AskState = {
  requestId: number;
  kind: AskKind;
  text: string;
  surrounding: string;
  blockKey: string;
  originIndex: number;
  tokenStart: number;
  tokenEnd: number;
  tapCount: number;
  status: "loading" | "ready";
  term: Term | null;
};

function loadSettings(): Settings {
  const fallback: Settings = {
    theme: "paper",
    themePref: "system",
    contrast: "standard",
    typeScale: 1,
    articleId: SEED_ARTICLES[0].id,
    formatSaved: true,
    marginFollow: true,
    paginate: false,
    shelfCode: "",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<Settings>;
    const parsed = { ...fallback, ...saved };
    if (saved.themePref == null && saved.theme === "ink") {
      parsed.themePref = "ink";
    }
    return parsed;
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

function loadAsked(): Record<string, Term[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ASKED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Term[]>) : {};
  } catch {
    return {};
  }
}

type ReaderState = {
  hydrated: boolean;
  theme: ThemeName;
  themePref: ThemePref;
  contrast: ContrastName;
  typeScale: TypeScale;
  articleId: string;
  customArticles: Article[];
  extraTerms: Record<string, Term[]>;
  activeTermId: string | null;
  expanded: boolean;
  focusedTermId: string | null;
  mobilePane: MobilePane;
  libraryOpen: boolean;
  importOpen: boolean;
  hintSeen: boolean;
  onboarded: boolean;
  formatSaved: boolean;
  marginFollow: boolean;
  paginate: boolean;
  shelfCode: string;
  ask: AskState | null;
  pulseToken: string | null;
  visibleTermIds: string[];
  hydrate: () => void;
  setTheme: (theme: ThemeName) => void;
  setThemePref: (pref: ThemePref) => void;
  cycleThemePref: () => void;
  setContrast: (contrast: ContrastName) => void;
  setTypeScale: (typeScale: TypeScale) => void;
  openArticle: (id: string) => void;
  addArticle: (article: Article) => void;
  mergeArticles: (articles: Article[]) => void;
  removeArticle: (id: string) => void;
  focusTerm: (id: string | null) => void;
  expandTerm: (id: string) => void;
  collapse: () => void;
  setMobilePane: (pane: MobilePane) => void;
  setLibraryOpen: (open: boolean) => void;
  setImportOpen: (open: boolean) => void;
  setFormatSaved: (on: boolean) => void;
  setMarginFollow: (on: boolean) => void;
  setPaginate: (on: boolean) => void;
  setShelfCode: (code: string) => void;
  dismissHint: () => void;
  finishOnboarding: () => void;
  replayOnboarding: () => void;
  applyAskTap: (input: {
    blockKey: string;
    tokenIndex: number;
    tapCount: number;
    fullText: string;
    tokens?: AskToken[];
    surrounding?: string;
  }) => void;
  completeAsk: (requestId: number, term: Term) => void;
  dismissAsk: () => void;
  setPulseToken: (id: string | null) => void;
  setVisibleTerms: (ids: string[]) => void;
};

function persistSettings(partial: Partial<Settings>) {
  if (typeof window === "undefined") return;
  const current = loadSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...partial }));
}

function persistAsked(map: Record<string, Term[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ASKED_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

let askSeq = 1;

function matchExisting(terms: Term[], phrase: string): Term | undefined {
  const needle = phrase.trim().toLowerCase();
  if (!needle) return undefined;
  return terms.find((t) => {
    if (t.term.toLowerCase() === needle) return true;
    return t.aliases.some((a) => a.toLowerCase() === needle);
  });
}

export const useReader = create<ReaderState>((set, get) => ({
  hydrated: false,
  theme: "paper",
  themePref: "system",
  contrast: "standard",
  typeScale: 1,
  articleId: SEED_ARTICLES[0].id,
  customArticles: [],
  extraTerms: {},
  activeTermId: null,
  expanded: false,
  focusedTermId: null,
  mobilePane: "read",
  libraryOpen: false,
  importOpen: false,
  hintSeen: true,
  onboarded: false,
  formatSaved: true,
  marginFollow: true,
  paginate: false,
  shelfCode: "",
  ask: null,
  pulseToken: null,
  visibleTermIds: [],
  hydrate: () => {
    const s = loadSettings();
    const custom = loadCustom();
    const extraTerms = loadAsked();
    let hintSeen = true;
    let onboarded = false;
    try {
      hintSeen = localStorage.getItem("gloss-hint-v2") === "1";
      onboarded = localStorage.getItem("gloss-onboard-v1") === "1";
    } catch {
      hintSeen = true;
    }
    set({
      ...s,
      customArticles: custom,
      extraTerms,
      hydrated: true,
      hintSeen,
      onboarded,
    });
  },
  setTheme: (theme) => {
    persistSettings({ theme, themePref: theme });
    set({ theme, themePref: theme });
  },
  setThemePref: (themePref) => {
    persistSettings({ themePref });
    set({ themePref });
  },
  cycleThemePref: () => {
    const cur = get().themePref;
    const next: ThemePref =
      cur === "system" ? "ink" : cur === "ink" ? "paper" : "system";
    persistSettings({ themePref: next, theme: next === "system" ? get().theme : next });
    set({ themePref: next, theme: next === "system" ? get().theme : next });
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
      ask: null,
      pulseToken: null,
      visibleTermIds: [],
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
      try {
        localStorage.setItem(
          CUSTOM_KEY,
          JSON.stringify(next.map((a) => ({ ...a, origin: undefined }))),
        );
      } catch {
        /* quota */
      }
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
      ask: null,
    });
  },
  mergeArticles: (incoming) => {
    const have = new Map(get().customArticles.map((a) => [a.id, a]));
    for (const a of incoming) have.set(a.id, a);
    const next = [...have.values()].sort(
      (a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0),
    );
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {
      try {
        localStorage.setItem(
          CUSTOM_KEY,
          JSON.stringify(next.map((a) => ({ ...a, origin: undefined }))),
        );
      } catch {
        /* quota */
      }
    }
    set({ customArticles: next });
  },
  removeArticle: (id) => {
    const next = get().customArticles.filter((a) => a.id !== id);
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {
      /* quota */
    }
    const extra = { ...get().extraTerms };
    delete extra[id];
    persistAsked(extra);
    const fallback = SEED_ARTICLES[0].id;
    const articleId = get().articleId === id ? fallback : get().articleId;
    persistSettings({ articleId });
    set({ customArticles: next, extraTerms: extra, articleId, ask: null });
  },
  focusTerm: (id) => set({ focusedTermId: id, activeTermId: id ?? get().activeTermId }),
  expandTerm: (id) =>
    set({
      activeTermId: id,
      focusedTermId: id,
      expanded: true,
      ask: null,
      mobilePane: "words",
    }),
  collapse: () => set({ expanded: false }),
  setMobilePane: (mobilePane) => set({ mobilePane }),
  setLibraryOpen: (libraryOpen) => set({ libraryOpen }),
  setImportOpen: (importOpen) => set({ importOpen }),
  setFormatSaved: (formatSaved) => {
    persistSettings({ formatSaved });
    set({ formatSaved });
  },
  setMarginFollow: (marginFollow) => {
    persistSettings({ marginFollow });
    set({ marginFollow });
  },
  setPaginate: (paginate) => {
    persistSettings({ paginate });
    set({ paginate });
  },
  setShelfCode: (shelfCode) => {
    persistSettings({ shelfCode });
    set({ shelfCode });
  },
  dismissHint: () => {
    try {
      localStorage.setItem("gloss-hint-v2", "1");
    } catch {
      /* ignore */
    }
    set({ hintSeen: true });
  },
  finishOnboarding: () => {
    try {
      localStorage.setItem("gloss-onboard-v1", "1");
    } catch {
      /* ignore */
    }
    set({ onboarded: true, hintSeen: true });
  },
  replayOnboarding: () => {
    try {
      localStorage.removeItem("gloss-onboard-v1");
    } catch {
      /* ignore */
    }
    set({ onboarded: false, libraryOpen: false });
  },
  applyAskTap: (input) => {
    const tokens = input.tokens ?? tokenize(input.fullText);
    const kind = kindFromTaps(input.tapCount);
    let [tokenStart, tokenEnd] = rangeForKind(
      tokens,
      input.fullText,
      input.tokenIndex,
      kind,
    );
    let text = textForRange(tokens, tokenStart, tokenEnd);
    if (!text) return;
    const surrounding = (input.surrounding ?? input.fullText).slice(0, 900);
    const article = currentArticleFrom(get());
    if (kind === "word") {
      const snap = snapUnit(text, surrounding, article.terms);
      if (snap.text !== text) {
        const at = input.fullText.toLowerCase().indexOf(snap.text.toLowerCase());
        if (at >= 0) {
          const cover = coveringRange(tokens, at, at + snap.text.length);
          tokenStart = cover[0];
          tokenEnd = cover[1];
        }
        text = snap.text;
      }
    }
    const existing =
      kind === "word" || kind === "phrase"
        ? matchExisting(article.terms, text)
        : undefined;
    const requestId = askSeq++;
    if (existing) {
      set({
        ask: {
          requestId,
          kind,
          text,
          surrounding,
          blockKey: input.blockKey,
          originIndex: input.tokenIndex,
          tokenStart,
          tokenEnd,
          tapCount: input.tapCount,
          status: "ready",
          term: existing,
        },
        expanded: false,
        focusedTermId: existing.id,
        pulseToken: null,
      });
      return;
    }
    set({
      ask: {
        requestId,
        kind,
        text,
        surrounding,
        blockKey: input.blockKey,
        originIndex: input.tokenIndex,
        tokenStart,
        tokenEnd,
        tapCount: input.tapCount,
        status: "loading",
        term: null,
      },
      expanded: false,
      pulseToken: null,
    });
  },
  completeAsk: (requestId, term) => {
    const ask = get().ask;
    if (!ask || ask.requestId !== requestId) return;
    const articleId = get().articleId;
    const keep = ask.kind === "word" || ask.kind === "phrase";
    const extra = { ...get().extraTerms };
    if (keep) {
      const list = extra[articleId] ?? [];
      extra[articleId] = [term, ...list.filter((t) => t.id !== term.id)].slice(0, 24);
      persistAsked(extra);
    }
    set({
      ask: { ...ask, status: "ready", term },
      extraTerms: keep ? extra : get().extraTerms,
    });
  },
  dismissAsk: () => set({ ask: null, pulseToken: null }),
  setPulseToken: (pulseToken) => set({ pulseToken }),
  setVisibleTerms: (visibleTermIds) => set({ visibleTermIds }),
}));

function currentArticleFrom(state: {
  articleId: string;
  customArticles: Article[];
  extraTerms: Record<string, Term[]>;
}): Article {
  const base =
    state.customArticles.find((a) => a.id === state.articleId) ??
    SEED_ARTICLES.find((a) => a.id === state.articleId) ??
    SEED_ARTICLES[0];
  const extra = state.extraTerms[state.articleId] ?? [];
  if (extra.length === 0) return base;
  const have = new Set(base.terms.map((t) => t.id));
  return { ...base, terms: [...base.terms, ...extra.filter((t) => !have.has(t.id))] };
}

export function useCurrentArticle(): Article {
  const articleId = useReader((s) => s.articleId);
  const custom = useReader((s) => s.customArticles);
  const extra = useReader((s) => s.extraTerms);
  return currentArticleFrom({ articleId, customArticles: custom, extraTerms: extra });
}
