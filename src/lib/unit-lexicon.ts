import { isCommonEnglish } from "@/lib/common-english";

/**
 * Multi-word units of art that look like ordinary English (or Latin)
 * until you know the field. Only promoted when the phrase actually
 * appears in the passage — never sprinkled on.
 */
const RAW = `
due process
equal protection
probable cause
reasonable doubt
habeas corpus
stare decisis
mens rea
actus reus
prima facie
de facto
de jure
de novo
pro bono
nolo contendere
res judicata
voir dire
common law
civil law
standard of care
duty of care
burden of proof
private right of action
strict scrutiny
intermediate scrutiny
rational basis
comparative advantage
opportunity cost
moral hazard
adverse selection
public good
invisible hand
price discrimination
purchasing power
monetary policy
fiscal policy
interest rate
central dogma
natural selection
gene expression
protein folding
stem cell
immune response
double helix
in vitro
in vivo
in situ
in utero
ex vivo
peer review
double blind
randomized controlled
clinical trial
standard deviation
confidence interval
null hypothesis
statistically significant
wave function
uncertainty principle
standard model
black hole
angular momentum
electric field
magnetic field
vector space
lie group
open set
closed set
balance sheet
income statement
due diligence
supply chain
fiduciary duty
conflict of interest
pull request
merge request
continuous integration
continuous delivery
private key
public key
private ca
certificate authority
gradient descent
neural network
language model
context window
machine learning
reinforcement learning
ceteris paribus
ad hoc
ad valorem
per se
`;

export const UNIT_LEXICON: string[] = [
  ...new Set(
    RAW.split("\n")
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length > 0),
  ),
].sort((a, b) => b.length - a.length);

export function unitsInPassage(text: string): string[] {
  const hay = text.toLowerCase();
  const found: string[] = [];
  for (const unit of UNIT_LEXICON) {
    if (hay.includes(unit.toLowerCase())) found.push(unit);
  }
  const caseNames = text.match(
    /\b[A-Z][A-Za-z']+(?:\s+[A-Z][A-Za-z']+)*\s+v\.?\s+[A-Z][A-Za-z']+(?:\s+[A-Z][A-Za-z']+)*/g,
  );
  if (caseNames) {
    for (const name of caseNames) {
      let trimmed = name.replace(/\s+/g, " ").trim();
      const bits = trimmed.split(" ");
      while (bits.length > 3 && isCommonEnglish(bits[0] ?? "")) bits.shift();
      trimmed = bits.join(" ");
      if (!found.some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
        found.push(trimmed);
      }
    }
  }
  return found.sort((a, b) => b.length - a.length);
}
