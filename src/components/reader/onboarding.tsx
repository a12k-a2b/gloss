import { useEffect } from "react";
import { BeaverWait } from "@/components/reader/beaver-wait";
import { SEED_ARTICLES } from "@/data/articles";
import { useReader } from "@/store/reader";

type Gate =
  | "look"
  | "theme"
  | "article"
  | "glossary"
  | "pages"
  | "filter"
  | "type-up"
  | "type-down"
  | "import";

type Wait =
  | "ink"
  | "paper"
  | "system"
  | "word"
  | "phrase"
  | "sentence"
  | "paragraph"
  | "clear"
  | "open"
  | "close"
  | "pages-on"
  | "page-next"
  | "page-first"
  | "pages-off"
  | "filter-all"
  | "filter-page"
  | "type-big"
  | "type-normal"
  | "import-open"
  | "import-close";

type Step = {
  kicker: string;
  title: string;
  beaver: string;
  gate: Gate;
  next?: string;
  wait?: Wait;
};

const STEPS: Step[] = [
  {
    kicker: "The beaver",
    title: "This is Gloss. I’ll walk you through it — hands on, not a slideshow.",
    beaver: "The kettle’s on. Tap Continue when you’re ready.",
    gate: "look",
    next: "Continue",
  },
  {
    kicker: "The spread",
    title: "Essay on the left. Teacher on the right. That’s the whole room.",
    beaver: "Ninety-five percent of your time stays on the left. Glance right when a word is fog.",
    gate: "look",
    next: "I see it",
  },
  {
    kicker: "Day and night",
    title: "Tap the sun-and-moon, top right. The page should go ink-dark.",
    beaver: "That’s night paper. Good for a dim room.",
    gate: "theme",
    wait: "ink",
  },
  {
    kicker: "Day and night",
    title: "Tap it again. Back to cream paper.",
    beaver: "Day paper. The Daylight likes this in a window.",
    gate: "theme",
    wait: "paper",
  },
  {
    kicker: "Day and night",
    title: "Once more — so it follows the room again.",
    beaver: "Auto. Light by day, ink at night. We’ll leave it there.",
    gate: "theme",
    wait: "system",
  },
  {
    kicker: "Ask a word",
    title: "In the essay: pick a word that is not underlined. Tap it twice.",
    beaver: "Once just wiggles it. Twice is “what is that?” The right column should start teaching.",
    gate: "article",
    wait: "word",
  },
  {
    kicker: "Grow it",
    title: "Same place — tap a third time. The highlight should take the next few words.",
    beaver: "That’s the phrase. One idea, not one dictionary entry.",
    gate: "article",
    wait: "phrase",
  },
  {
    kicker: "Grow it",
    title: "Fourth tap. The whole sentence.",
    beaver: "Sometimes the fog is the sentence, not the noun.",
    gate: "article",
    wait: "sentence",
  },
  {
    kicker: "Grow it",
    title: "Fifth tap. The whole paragraph.",
    beaver: "That’s as wide as we go.",
    gate: "article",
    wait: "paragraph",
  },
  {
    kicker: "Put it away",
    title: "Tap empty paper in the essay — not the highlight.",
    beaver: "Gone. That’s how you keep reading. No menu, no undo.",
    gate: "article",
    wait: "clear",
  },
  {
    kicker: "A word we already know",
    title: "Now tap an underlined word once.",
    beaver: "Those already have a note. One tap opens the lesson on the right.",
    gate: "article",
    wait: "open",
  },
  {
    kicker: "Back to the list",
    title: "On the right, tap the back arrow (or swipe the column back).",
    beaver: "You’re in the glossary again. The essay never left.",
    gate: "glossary",
    wait: "close",
  },
  {
    kicker: "Turn pages",
    title: "Tap the two-page icon in the bar — like an open book.",
    beaver: "Some people like to flip. Some like to scroll. Try a flip.",
    gate: "pages",
    wait: "pages-on",
  },
  {
    kicker: "Turn pages",
    title: "On the essay: swipe left, or tap the right edge, to the next leaf.",
    beaver: "The margin will follow this page, not the whole essay.",
    gate: "article",
    wait: "page-next",
  },
  {
    kicker: "Turn pages",
    title: "Swipe right, or tap the left edge, back to the first leaf.",
    beaver: "Same hands as a paper book.",
    gate: "article",
    wait: "page-first",
  },
  {
    kicker: "Turn pages",
    title: "Tap the two-page icon again to go back to scrolling.",
    beaver: "We’ll leave you on a long page. Flip is there if you miss it.",
    gate: "pages",
    wait: "pages-off",
  },
  {
    kicker: "A quieter margin",
    title: "Tap the filter (the list icon). The right column should grow.",
    beaver: "That’s every taught word, even the ones off-screen. Useful. Louder.",
    gate: "filter",
    wait: "filter-all",
  },
  {
    kicker: "A quieter margin",
    title: "Tap it again. Only words on this page.",
    beaver: "This is the default. Glanceable. We’ll leave it here.",
    gate: "filter",
    wait: "filter-page",
  },
  {
    kicker: "Type",
    title: "Tap the plus. Type should get larger.",
    beaver: "The Daylight likes a big face. Try it.",
    gate: "type-up",
    wait: "type-big",
  },
  {
    kicker: "Type",
    title: "Tap the minus, back to where we were.",
    beaver: "You can live wherever is comfortable.",
    gate: "type-down",
    wait: "type-normal",
  },
  {
    kicker: "Your own pages",
    title: "Tap the open-book icon — left of the title.",
    beaver: "This is how a new essay comes in. Have a look. Don’t paste anything yet.",
    gate: "import",
    wait: "import-open",
  },
  {
    kicker: "Your own pages",
    title: "Close that sheet (the X, or the dim paper around it).",
    beaver: "After this tour you can bring a real link. I’ll sit with the tea.",
    gate: "look",
    wait: "import-close",
  },
  {
    kicker: "You’re in",
    title: "That’s the instrument. The Happy essay is waiting. Tap a word that feels like fog.",
    beaver: "Library has “Meet the beaver again” if a friend wants a second pass.",
    gate: "look",
    next: "Start reading",
  },
];

const ASK_RANK: Record<string, number> = {
  word: 1,
  phrase: 2,
  sentence: 3,
  paragraph: 4,
};

type Snap = {
  themePref: string;
  askKind: string | null;
  expanded: boolean;
  paginate: boolean;
  page: number;
  marginFollow: boolean;
  typeScale: number;
  importOpen: boolean;
};

function matchesWait(wait: Step["wait"], s: Snap): boolean {
  if (!wait) return false;
  if (wait === "ink" || wait === "paper" || wait === "system") return s.themePref === wait;
  if (wait in ASK_RANK) {
    return (ASK_RANK[s.askKind ?? ""] ?? 0) >= ASK_RANK[wait];
  }
  if (wait === "clear") return !s.askKind && !s.expanded;
  if (wait === "open") return s.expanded;
  if (wait === "close") return !s.expanded && !s.askKind;
  if (wait === "pages-on") return s.paginate;
  if (wait === "page-next") return s.paginate && s.page >= 1;
  if (wait === "page-first") return s.paginate && s.page === 0;
  if (wait === "pages-off") return !s.paginate;
  if (wait === "filter-all") return !s.marginFollow;
  if (wait === "filter-page") return s.marginFollow;
  if (wait === "type-big") return s.typeScale >= 2;
  if (wait === "type-normal") return s.typeScale <= 1;
  if (wait === "import-open") return s.importOpen;
  if (wait === "import-close") return !s.importOpen;
  return false;
}

export function currentTourGate(onboarded: boolean, step: number): Gate | null {
  if (onboarded) return null;
  return STEPS[step]?.gate ?? null;
}

export function currentTourWait(
  onboarded: boolean,
  step: number,
): Step["wait"] | undefined {
  if (onboarded) return;
  return STEPS[step]?.wait;
}

export function Onboarding() {
  const hydrated = useReader((s) => s.hydrated);
  const done = useReader((s) => s.onboarded);
  const finish = useReader((s) => s.finishOnboarding);
  const setThemePref = useReader((s) => s.setThemePref);
  const setPaginate = useReader((s) => s.setPaginate);
  const setMarginFollow = useReader((s) => s.setMarginFollow);
  const setTypeScale = useReader((s) => s.setTypeScale);
  const openArticle = useReader((s) => s.openArticle);
  const collapse = useReader((s) => s.collapse);
  const dismissAsk = useReader((s) => s.dismissAsk);
  const themePref = useReader((s) => s.themePref);
  const ask = useReader((s) => s.ask);
  const expanded = useReader((s) => s.expanded);
  const paginate = useReader((s) => s.paginate);
  const tourPage = useReader((s) => s.tourPage);
  const marginFollow = useReader((s) => s.marginFollow);
  const typeScale = useReader((s) => s.typeScale);
  const importOpen = useReader((s) => s.importOpen);
  const step = useReader((s) => s.tourStep);
  const setTourStep = useReader((s) => s.setTourStep);

  useEffect(() => {
    if (!hydrated || done) return;
    setThemePref("system");
    setPaginate(false);
    setMarginFollow(true);
    setTypeScale(1);
    openArticle(SEED_ARTICLES[0].id);
    collapse();
    dismissAsk();
  }, [
    hydrated,
    done,
    setThemePref,
    setPaginate,
    setMarginFollow,
    setTypeScale,
    openArticle,
    collapse,
    dismissAsk,
  ]);

  useEffect(() => {
    if (done) return;
    const card = STEPS[step];
    if (!card?.wait) return;
    const snap: Snap = {
      themePref,
      askKind: ask?.kind ?? null,
      expanded,
      paginate,
      page: tourPage,
      marginFollow,
      typeScale,
      importOpen,
    };
    if (matchesWait(card.wait, snap)) {
      const t = window.setTimeout(() => setTourStep(step + 1), 280);
      return () => window.clearTimeout(t);
    }
  }, [
    done,
    step,
    themePref,
    ask?.kind,
    expanded,
    paginate,
    tourPage,
    marginFollow,
    typeScale,
    importOpen,
    setTourStep,
  ]);

  if (!hydrated || done) return null;

  const card = STEPS[step] ?? STEPS[STEPS.length - 1];
  const last = step >= STEPS.length - 1;

  return (
    <div className="tour-banner" role="dialog" aria-labelledby="tour-title">
      <div className="tour-banner-fig">
        <BeaverWait line={card.beaver} word={false} />
      </div>
      <div className="tour-banner-copy">
        <p className="caps">{card.kicker}</p>
        <h2 id="tour-title" className="tour-title">
          {card.title}
        </h2>
        {card.next ? (
          <button
            type="button"
            className="onboard-next mt-3"
            onClick={() => {
              if (last) {
                setThemePref("system");
                collapse();
                dismissAsk();
                finish();
              } else {
                setTourStep(step + 1);
              }
            }}
          >
            {card.next}
          </button>
        ) : (
          <p className="tour-wait">Do that on the page. I’ll wait.</p>
        )}
      </div>
    </div>
  );
}

