import { useState } from "react";
import { BeaverWait } from "@/components/reader/beaver-wait";
import { useReader } from "@/store/reader";

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
    body: "Underlined words already have a note. The right column only shows what’s on this page, so it stays small enough to ignore until you need it. Ninety-five percent of your time should stay in the essay.",
    beaver: "I sit in the margin. I don’t grab your sleeve.",
  },
  {
    kicker: "When a word is a wall",
    title: "Swipe one. Or just tap.",
    body: "Swipe a card (or tap it) for the longer lesson — analogy, how this essay uses it, a little ink diagram, and a board if we’ve drawn one. A word we missed: tap it twice. Three times takes the phrase, four the sentence, five the paragraph. Tap empty paper to put it back.",
    beaver: "Twice is ‘what is that.’ Three is ‘those two together.’",
  },
  {
    kicker: "Your own reading",
    title: "Bring a page.",
    body: "The book icon up top. Paste any public link — software, law, biology, whatever you’re teaching yourself. I’ll fetch it, strip the junk, teach the jargon, and draw the boards. If a magazine is gated, we look for an archived copy. That’s when you see me with the tea.",
    beaver: "A slow page is a long sip. The log in the library tells us if I sat too long.",
  },
  {
    kicker: "The little switches",
    title: "You barely need these. They’re here.",
    body: "Newspaper: the original publication’s type, or our quiet page. Two pages: flip like a book (the glossary updates per page). Filter: only words on screen, or the whole list. Sun-and-moon: follow day and night, or lock ink / paper. Plus and minus: type size.",
    beaver: "Default is fine. Fiddle later.",
  },
  {
    kicker: "Phone to bed",
    title: "One shelf, two devices.",
    body: "Library → make a shared shelf. You get a six-letter code. Join it on the other machine. Clip a link on your phone, Pull on the Daylight. Or export a file if you just want a backup. That’s the whole trick.",
    beaver: "I’m already in the Happy essay. Go read. Tap a word that feels like fog.",
  },
];

export function Onboarding() {
  const hydrated = useReader((s) => s.hydrated);
  const done = useReader((s) => s.onboarded);
  const finish = useReader((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);

  if (!hydrated || done) return null;

  const card = STEPS[step] ?? STEPS[0];
  const last = step === STEPS.length - 1;

  return (
    <div className="onboard-root">
      <button
        type="button"
        aria-label="Skip"
        className="onboard-scrim"
        onClick={finish}
      />
      <div className="onboard-card" role="dialog" aria-labelledby="onboard-title">
        <BeaverWait line={card.beaver} word={false} />
        <p className="caps onboard-kicker">{card.kicker}</p>
        <h2 id="onboard-title" className="onboard-title">
          {card.title}
        </h2>
        <p className="onboard-body">{card.body}</p>
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
                onClick={() => setStep((n) => n - 1)}
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              className="onboard-next"
              onClick={() => {
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
