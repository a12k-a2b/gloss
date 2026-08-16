import { LoaderCircle } from "lucide-react";
import { TermDetail } from "@/components/reader/term-detail";
import { growHint, kindLabel } from "@/lib/ask-select";
import { useReader } from "@/store/reader";

export function AskDock() {
  const ask = useReader((s) => s.ask);
  const dismissAsk = useReader((s) => s.dismissAsk);

  if (!ask) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 lg:hidden">
      <div className="pointer-events-auto max-h-[58%] overflow-hidden rounded-t-lg bg-paper hairline-strong">
        <div className="flex items-center justify-between border-b border-rule px-4 py-2">
          <div className="min-w-0">
            <p className="caps">You asked · {kindLabel(ask.kind)}</p>
            <p className="truncate font-serif text-sm text-ink-soft">
              {growHint(ask.kind)}
            </p>
          </div>
        </div>
        <div className="h-[min(52dvh,28rem)]">
          {ask.status === "loading" || !ask.term ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <LoaderCircle className="size-5 animate-spin text-ink-faint" strokeWidth={1.6} />
              <p className="font-serif text-lg font-medium text-ink text-balance">
                {ask.text}
              </p>
              <p className="font-sans text-sm text-ink-soft">Sitting with this…</p>
            </div>
          ) : (
            <TermDetail
              term={ask.term}
              related={[]}
              onBack={dismissAsk}
              onOpenRelated={() => {}}
              kicker={`You asked · ${kindLabel(ask.kind)}`}
              backLabel="Passage"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function AskTeacherPane() {
  const ask = useReader((s) => s.ask);
  const dismissAsk = useReader((s) => s.dismissAsk);

  if (!ask) return null;

  if (ask.status === "loading" || !ask.term) {
    return (
      <div className="flex h-full flex-col">
        <header className="border-b border-rule px-5 py-3">
          <p className="caps">You asked · {kindLabel(ask.kind)}</p>
          <p className="mt-1 font-sans text-sm text-ink-soft">{growHint(ask.kind)}</p>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <LoaderCircle className="size-5 animate-spin text-ink-faint" strokeWidth={1.6} />
          <p className="font-serif text-xl font-medium text-ink text-balance">{ask.text}</p>
          <p className="font-sans text-sm text-ink-soft">Sitting with this…</p>
        </div>
      </div>
    );
  }

  return (
    <TermDetail
      term={ask.term}
      related={[]}
      onBack={dismissAsk}
      onOpenRelated={() => {}}
      kicker={`You asked · ${kindLabel(ask.kind)}`}
      backLabel="Passage"
    />
  );
}
