/** Everyday English a college-educated adult already has. Not a dictionary — a filter. */
const RAW = `
the be to of and a in that have I it for not on with he as you do at this but his by from they we
say her she or an will my one all would there their what so up out if about who get which go me
when make can like time no just him know take people into year your good some could them see other
than then now look only come its over think also back after use two how our work first well way
even new want because any these give day most us is was are were been being had has did does doing
may might must shall should can could would will
about above across after again against along already also always among another around as at away
before behind below beneath beside between beyond both but by down during each either else enough
ever every few for from further here how however if in inside into just least less many more most
much near never next nor not nothing now of off often on once only onto or other otherwise out
outside over own past perhaps quite rather really same several since so some still such than that
the then there therefore these they this those though through throughout thus to too under until
up upon very via well what when where whether which while who whom whose why with within without
yes yet
i me my mine myself we us our ours you your yours he him his she her hers it its they them their
theirs someone anyone everyone nobody somebody anybody everybody
do does did done doing have has had having be am is are was were been being get got getting
make made making go goes went gone going come came coming take took taken taking give gave given
giving see saw seen seeing know knew known knowing think thought thinking look looked looking
want wanted use used using try tried trying need needed feel felt find found leave left put
keep kept let ask asked seem seemed become became show showed call called work worked
one two three four five six seven eight nine ten first second third last next other another
both few many much most some any all each every no none several
good bad new old great small large long short high low early late real right left same different
important possible able sure clear simple hard easy special certain public private
thing things way ways part parts place places time times day days year years person people
man men woman women child children world life hand hands eye eyes number numbers case cases
point points fact facts idea ideas problem problems question questions
system systems group groups company companies government program programs
also just only even still already yet again never always often sometimes usually
very too quite rather almost enough such
can could may might must shall should will would
because if unless although though while when where after before until since
and or but so nor
not no never none nothing nobody
yes
computer computers internet email phone website page pages file files data
today yesterday tomorrow week month year
said says saying
mr mrs ms dr
`;

export const COMMON_ENGLISH = new Set(
  RAW.split(/\s+/).map((w) => w.trim().toLowerCase()).filter(Boolean),
);

export function isCommonEnglish(word: string): boolean {
  return COMMON_ENGLISH.has(word.toLowerCase());
}
