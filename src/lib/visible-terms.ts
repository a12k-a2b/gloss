export function collectVisibleTermIds(host: HTMLElement): string[] {
  const view = host.getBoundingClientRect();
  const shadow = host.querySelector(".origin-host")?.shadowRoot;
  const marks = [
    ...host.querySelectorAll<HTMLElement>("[data-term]"),
    ...[...(shadow?.querySelectorAll<HTMLElement>("[data-term]") ?? [])],
  ];
  const ids: string[] = [];
  for (const mark of marks) {
    if (mark.closest(".page-leaf")) continue;
    const id = mark.dataset.term;
    if (!id || ids.includes(id)) continue;
    const r = mark.getBoundingClientRect();
    const mid = (r.top + r.bottom) / 2;
    if (mid >= view.top + 4 && mid <= view.bottom - 4) ids.push(id);
  }
  return ids;
}
