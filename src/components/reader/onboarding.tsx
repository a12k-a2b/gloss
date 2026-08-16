import { useRef, useState } from "react";
import { BeaverWait } from "@/components/reader/beaver-wait";
import {
  growHint,
  kindFromTaps,
  kindLabel,
  rangeForKind,
  tokenize,
  type AskKind,
} from "@/lib/ask-select";
import { useReader } from "@/store/reader";

const PRACTICE =
  "GitOps is a way of running a cluster from a Git repository. Think of Git as the one notebook the whole kitchen reads from.";

const STEPS = [
  {
    kicker: "A friend of the margin",
    title: "This is Gloss.",
    body: "An essay on the left. A patient teacher on the right. Built for a paper screen — the Daylight — so you can read hard things without drowning in jargon.",
    beaver: "I’ll keep the kettle on.",
  },
  {
    kicker: "The spread",
    title: "Read left. Glance right.",
    body: "Underlined words already have a note. Tap one of those (once) and the right column opens the lesson. The list only shows what’s on this page, so it stays small enough to ignore.",
    beaver: "I sit in the margin. I don’t grab your sleeve.",
  },
  {
    kicker: "Ask for more",
    title: "Tap twice. Then keep tapping.",
    body: "A word we missed isn’t underlined. Tap it twice — that’s “what is that?” Tap a third time and we take the next few words (a phrase, or one idea). Fourth tap: the whole sentence. Fifth: the paragraph. Tap empty paper to put it away.",
    beaver: "Try it on the sentence below. Start on GitOps.",
    practice: true,
  },
  {
    kicker: "Your own reading",
    title: "Bring a page.",
    body: "The book icon up top. Paste any public link. I’ll fetch it, teach the jargon, and draw the boards. If a magazine is gated, we look for an archived copy. That’s when you see me with the tea.",
    beaver: "A slow page is a long sip.",
  },
  {
    kicker: "The little switches",
    title: "You barely need these. They’re here.",
    body: "Newspaper: the original publication’s type, or our quiet page. Two pages: flip like a book. Filter: only words on screen, or the whole list. Sun-and-moon: follow day and night, or lock ink / paper.",
    beaver: "Default is fine. Fiddle later.",
  },
  {
    kicker: "Phone to bed",
    title: "One shelf, two devices.",
    body: "Library → make a shared shelf. You get a six-letter code. Join it on the other machine. Clip a link on your phone, Pull on the Daylight.",
    beaver: "I’m already in the Happy essay. Go tap a word that feels like fog.",
  },
];

function TapPractice({
  onKind,
}: {
  onKind: (kind: AskKind | null, taps: number) => void;
}) {
  const tokens = tokenize(PRACTICE);
  const session = useRef<{ key: string; count: number; at: number } | null>(null);
  const [taps, setTaps] = useState(0);
  const [origin, setOrigin] = useState(0);
  const [pulse, setPulse] = useState<number | null>(null);
  const pulseTimer = useRef<number | null>(null);

  const kind = taps >= 2 ? kindFromTaps(taps) : null;
  const [from, to] = kind
    ? rangeForKind(tokens, PRACTICE, origin, kind)
    : [-1, -1];

  const onTapWord = (index: number) => {
    if (taps >= 2 && index >= from && index <= to) {
      const count = Math.min(taps + 1, 5);
      setTaps(count);
      onKind(kindFromTaps(count), count);
      return;
    }
    const now = Date.now();
    const same =
      session.current &&
      session.current.key === String(index) &&
      now - session.current.at < 1100;
    const count = same && session.current ? session.current.count + 1 : 1;
    session.current = { key: String(index), count, at: now };

    if (count === 1) {
      setPulse(index);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
      pulseTimer.current = window.setTimeout(() => {
        setPulse(null);
        if (session.current?.count === 1) session.current = null;
      }, 700);
      if (taps < 2) {
        setTaps(0);
        onKind(null, 1);
      }
      return;
    }

    setOrigin(index);
    setTaps(Math.min(count, 5));
    setPulse(null);
    onKind(kindFromTaps(Math.min(count, 5)), Math.min(count, 5));
  };

  const clear = () => {
    session.current = null;
    setTaps(0);
    setPulse(null);
    onKind(null, 0);
  };

  return (
    <div className="onboard-practice">
      <p className="caps">Try it</p>
      <p
        className="onboard-practice-text"
        onClick={(e) => {
          if (!(e.target instanceof HTMLElement) || !e.target.dataset.tok) {
            clear();
          }
        }}
      >
        {tokens.map((t) =>
          t.isWord ? (
            <button
              key={t.index}
              type="button"
              data-tok={t.index}
              className={
                t.index >= from && t.index <= to
                  ? "onboard-mark"
                  : pulse === t.index
                    ? "onboard-pulse"
                    : ""
              }
              onClick={(e) => {
                e.stopPropagation();
                onTapWord(t.index);
              }}
            >
              {t.text}
            </button>
          ) : (
            <span key={t.index}>{t.text}</span>
          ),
        )}
      </p>
      <ol className="onboard-taps">
        {[
          [2, "word"],
          [3, "phrase"],
          [4, "sentence"],
          [5, "paragraph"],
        ].map(([n, label]) => (
          <li key={n} className={taps === n ? "is-on" : taps > Number(n) ? "is-past" : ""}>
            <span>{n}</span> {label}
          </li>
        ))}
      </ol>
      <p className="onboard-practice-hint">
        {taps >= 2 && kind
          ? `${kindLabel(kind)}. ${growHint(kind)}`
          : taps === 1
            ? "Once more on the same word — that asks."
            : "Tap GitOps twice. Then keep tapping it."}
      </p>
    </div>
  );
}

export function Onboarding() {
  const hydrated = useReader((s) => s.hydrated);
  const done = useReader((s) => s.onboarded);
  const finish = useReader((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const [practiceLine, setPracticeLine] = useState<string | null>(null);

  if (!hydrated || done) return null;

  const card = STEPS[step] ?? STEPS[0];
  const last = step === STEPS.length - 1;
  const beaver = practiceLine ?? card.beaver;

  return (
    <div className="onboard-root">
      <button
        type="button"
        aria-label="Skip"
        className="onboard-scrim"
        onClick={finish}
      />
      <div className="onboard-card" role="dialog" aria-labelledby="onboard-title">
        <BeaverWait line={beaver} word={false} />
        <p className="caps onboard-kicker">{card.kicker}</p>
        <h2 id="onboard-title" className="onboard-title">
          {card.title}
        </h2>
        <p className="onboard-body">{card.body}</p>
        {card.practice ? (
          <TapPractice
            onKind={(kind, taps) => {
              if (!kind) {
                setPracticeLine(
                  taps === 1
                    ? "Good — once more, same word."
                    : "Tap empty paper to put it away. Try GitOps twice.",
                );
                return;
              }
              if (kind === "word") setPracticeLine("That’s the word. Tap again for the phrase.");
              else if (kind === "phrase") setPracticeLine("The idea, not just the word. Again for the sentence.");
              else if (kind === "sentence") setPracticeLine("The whole sentence. Once more for the paragraph.");
              else setPracticeLine("The whole paragraph. Tap empty paper to keep reading.");
            }}
          />
        ) : null}
        <div className="onboard-dots" aria-hidden>
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? "is-on" : ""} />
          ))}
        </div>
        <div className="onboard-actions">
          <button type="button" className="onboard-skip" onClick={finish}>
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                className="onboard-next onboard-back"
                onClick={() => {
                  setPracticeLine(null);
                  setStep((n) => n - 1);
                }}
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              className="onboard-next"
              onClick={() => {
                setPracticeLine(null);
                if (last) finish();
                else setStep((n) => n + 1);
              }}
            >
              {last ? "Start reading" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
