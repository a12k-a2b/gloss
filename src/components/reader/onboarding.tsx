import { useEffect } from "react";
import { BeaverWait } from "@/components/reader/beaver-wait";
import { SEED_ARTICLES } from "@/data/articles";
import { useReader } from "@/store/reader";

type Gate = "look" | "theme" | "article" | "glossary";

type Step = {
  kicker: string;
  title: string;
  beaver: string;
  gate: Gate;
  next?: string;
  wait?: "ink" | "paper" | "system" | "word" | "phrase" | "sentence" | "paragraph" | "clear" | "open" | "close";
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
    kicker: "You’re in",
    title: "That’s the whole instrument. Bring your own pages when you want. For now, read.",
    beaver: "If you forget, the library has “Meet the beaver again.” I’ll be here.",
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

function matchesWait(
  wait: Step["wait"],
  themePref: string,
  askKind: string | null,
  expanded: boolean,
): boolean {
  if (!wait) return false;
  if (wait === "ink" || wait === "paper" || wait === "system") return themePref === wait;
  if (wait in ASK_RANK) {
    return (ASK_RANK[askKind ?? ""] ?? 0) >= ASK_RANK[wait];
  }
  if (wait === "clear") return !askKind && !expanded;
  if (wait === "open") return expanded;
  if (wait === "close") return !expanded && !askKind;
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
  const openArticle = useReader((s) => s.openArticle);
  const collapse = useReader((s) => s.collapse);
  const dismissAsk = useReader((s) => s.dismissAsk);
  const themePref = useReader((s) => s.themePref);
  const ask = useReader((s) => s.ask);
  const expanded = useReader((s) => s.expanded);
  const step = useReader((s) => s.tourStep);
  const setTourStep = useReader((s) => s.setTourStep);

  useEffect(() => {
    if (!hydrated || done) return;
    setThemePref("system");
    openArticle(SEED_ARTICLES[0].id);
    collapse();
    dismissAsk();
  }, [hydrated, done, setThemePref, openArticle, collapse, dismissAsk]);

  useEffect(() => {
    if (done) return;
    const card = STEPS[step];
    if (!card?.wait) return;
    if (matchesWait(card.wait, themePref, ask?.kind ?? null, expanded)) {
      const t = window.setTimeout(() => setTourStep(step + 1), 280);
      return () => window.clearTimeout(t);
    }
  }, [done, step, themePref, ask?.kind, expanded, setTourStep]);

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

