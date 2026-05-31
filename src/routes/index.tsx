import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nicole's Bachelorette · Dewey Beach 2025" },
      {
        name: "description",
        content:
          "Sign up for what you're bringing to Nicole's bachelorette in Dewey Beach, July 2025.",
      },
      { property: "og:title", content: "Nicole's Bachelorette · Dewey Beach 2025" },
      {
        property: "og:description",
        content: "Sign up for what you're bringing. Claim as many as you'd like.",
      },
    ],
  }),
  component: BachelorettePage,
});

const NAMES = [
  "Casey",
  "Char",
  "Isabel",
  "Jane",
  "Jess",
  "Kait",
  "Lara",
  "Nicole",
  "Phoebe",
  "Sabrina",
  "Taylor",
] as const;
type Name = (typeof NAMES)[number];

const ALL_PAID_FALSE = Object.fromEntries(
  NAMES.map((n) => [n, false])
) as Record<Name, boolean>;

type Claim = { name: Name; note?: string };

type Item = {
  id: string;
  label: string;
  qty: number | "unlimited" | "byo";
  hint?: string;
};

type Section = { id: string; title: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    id: "bar",
    title: "Bar cart",
    items: [
      { id: "bar-shots", label: "Shot glasses", qty: 11 },
      { id: "bar-shaker", label: "Cocktail shaker", qty: 2 },
      { id: "bar-glasses", label: "Cute glasses", qty: 11 },
      { id: "bar-alcohol", label: "Alcohol", qty: "unlimited" },
      { id: "bar-mixers", label: "Mixers & syrups", qty: "unlimited" },
      { id: "bar-ice", label: "Bag ice", qty: "unlimited" },
      { id: "bar-napkins", label: "Cocktail napkins", qty: 1 },
      { id: "bar-opener", label: "Bottle opener / wine key", qty: 1 },
    ],
  },
  {
    id: "beach",
    title: "Beach day",
    items: [
      { id: "beach-cooler", label: "Cooler", qty: 2, hint: "1 XL + 1 sm w/ wheels" },
      { id: "beach-jugs", label: "Insulated jugs", qty: 2 },
      { id: "beach-bags", label: "Bogg / beach bags", qty: 3 },
      { id: "beach-chairs", label: "Beach chairs", qty: 6 },
      { id: "beach-campchairs", label: "Camp chairs", qty: 4 },
      { id: "beach-tent", label: "Beach tent", qty: 1 },
      { id: "beach-umbrella", label: "Beach umbrella", qty: 1 },
      { id: "beach-blanket", label: "Beach blanket", qty: 1 },
      { id: "beach-aloe", label: "After sun / aloe", qty: 2 },
      { id: "beach-towels", label: "Beach towels", qty: "byo" },
      { id: "beach-sunscreen", label: "Sunscreen", qty: 3 },
      { id: "beach-bug", label: "Bug spray", qty: 1 },
      { id: "beach-volley", label: "Volleyball / paddle ball", qty: 1 },
    ],
  },
  {
    id: "house",
    title: "House",
    items: [
      { id: "house-speaker", label: "Speaker", qty: 2 },
      { id: "house-steamer", label: "Steamer", qty: 2 },
      { id: "house-camera", label: "Disposable camera", qty: 1 },
      { id: "house-games", label: "Card / drinking games", qty: "unlimited" },
      { id: "house-firstaid", label: "First aid kit", qty: 1 },
      { id: "house-lighter", label: "Lighter", qty: 1 },
      { id: "house-extcord", label: "Extension cord", qty: 1 },
    ],
  },
  {
    id: "kitchen",
    title: "Kitchen",
    items: [
      { id: "kit-coffee", label: "Coffee & creamer", qty: "unlimited" },
      { id: "kit-cups", label: "Disposable cups", qty: "unlimited" },
      { id: "kit-plates", label: "Paper plates", qty: 1 },
      { id: "kit-dish", label: "Dish soap & sponge", qty: 1 },
      { id: "kit-snacks", label: "Snacks", qty: "unlimited" },
      { id: "kit-cond", label: "Condiments & cooking basics", qty: "unlimited" },
      { id: "kit-ziploc", label: "Ziploc bags / foil", qty: 1 },
    ],
  },
];

// Sabrina's pre-claims
const INITIAL_CLAIMS: Record<string, Claim[]> = {
  "beach-cooler": [{ name: "Sabrina" }],
  "beach-jugs": [{ name: "Sabrina" }],
  "beach-chairs": [{ name: "Sabrina" }, { name: "Sabrina" }],
  "beach-campchairs": [
    { name: "Sabrina" },
    { name: "Sabrina" },
    { name: "Sabrina" },
    { name: "Sabrina" },
  ],
  "beach-umbrella": [{ name: "Sabrina" }],
  "beach-blanket": [{ name: "Sabrina" }],
  "house-steamer": [{ name: "Sabrina" }],
};

function MartiniGlass({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14 22 L106 22 L60 84 Z" />
      <path d="M60 84 L60 124" />
      <path d="M36 124 L84 124" />
      <circle cx="78" cy="38" r="3.5" fill="currentColor" stroke="none" opacity="0.85" />
      <path d="M78 38 Q86 18 96 12" strokeWidth="1.2" opacity="0.7" />
    </svg>
  );
}

export default function BachelorettePage() {
  const [user, setUser] = useState<Name | "">("");
  const [claims, setClaims] = useState<Record<string, Claim[]>>(INITIAL_CLAIMS);
  const [tab, setTab] = useState<
    "details" | "itinerary" | "signup" | "who" | "spend"
  >("details");
  const [formFor, setFormFor] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState(1);
  const [formNote, setFormNote] = useState("");
  const [paid, setPaid] = useState<Record<Name, boolean>>(ALL_PAID_FALSE);


  const allItems = useMemo(() => SECTIONS.flatMap((s) => s.items), []);
  const finiteItems = useMemo(
    () => allItems.filter((i) => typeof i.qty === "number"),
    [allItems],
  );
  const finiteCovered = finiteItems.filter(
    (i) => (claims[i.id]?.length ?? 0) >= (i.qty as number),
  ).length;
  const finiteWithSomeone = finiteItems.filter(
    (i) => (claims[i.id]?.length ?? 0) > 0,
  ).length;
  const progress = Math.round((finiteWithSomeone / finiteItems.length) * 100);

  const requireUser = () => {
    if (!user) {
      toast.error("Pick your name first", {
        description: "Scroll up and select who you are.",
      });
      return false;
    }
    return true;
  };

  const openForm = (item: Item) => {
    if (!requireUser()) return;
    if (item.qty === "byo") return;
    const current = claims[item.id] ?? [];
    if (typeof item.qty === "number" && current.length >= item.qty) return;
    setFormFor(item.id);
    setFormAmount(1);
    setFormNote("");
  };

  const submitForm = (item: Item) => {
    if (!requireUser()) return;
    const current = claims[item.id] ?? [];
    let amount = Math.max(1, Math.floor(formAmount || 1));
    if (typeof item.qty === "number") {
      const room = item.qty - current.length;
      if (room <= 0) {
        setFormFor(null);
        return;
      }
      amount = Math.min(amount, room);
    }
    const note = formNote.trim() || undefined;
    const additions: Claim[] = Array.from({ length: amount }, () => ({
      name: user as Name,
      note,
    }));
    setClaims({ ...claims, [item.id]: [...current, ...additions] });
    setFormFor(null);
    setFormNote("");
    setFormAmount(1);
    toast.success(
      `You've got ${amount > 1 ? `${amount} × ` : ""}${item.label.toLowerCase()}`,
    );
  };

  const unclaim = (item: Item) => {
    if (!requireUser()) return;
    const current = claims[item.id] ?? [];
    const revIdx = [...current].reverse().findIndex((c) => c.name === user);
    if (revIdx === -1) return;
    const realIdx = current.length - 1 - revIdx;
    const next = [...current];
    next.splice(realIdx, 1);
    setClaims({ ...claims, [item.id]: next });
    toast(`Removed one ${item.label.toLowerCase()}`);
  };

  return (
    <div className="noise-overlay relative min-h-screen text-foreground">
      {/* Hero */}
      <header className="relative z-10 px-5 pt-12 pb-10 sm:pt-20 sm:pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex justify-center text-[var(--gold)]">
            <MartiniGlass className="h-20 w-20 sm:h-24 sm:w-24" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold-soft)]">
            Dewey Beach · July 2025 · Three Nights
          </p>
          <h1 className="font-display mt-5 text-5xl leading-tight text-foreground sm:text-7xl">
            Nicole's <em className="text-[var(--gold)]">Bachelorette</em>
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            Sign up below · claim as many as you'd like · we've got this
          </p>

          {/* Name selector */}
          <div className="mx-auto mt-10 max-w-sm">
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-muted-foreground">
              I am…
            </label>
            <select
              value={user}
              onChange={(e) => setUser(e.target.value as Name | "")}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
            >
              <option value="">Select your name</option>
              {NAMES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="relative z-10 mx-auto max-w-3xl px-5">
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card/40 p-1">
          <TabBtn active={tab === "details"} onClick={() => setTab("details")}>
            Details
          </TabBtn>
          <TabBtn active={tab === "itinerary"} onClick={() => setTab("itinerary")}>
            Itinerary
          </TabBtn>
          <TabBtn active={tab === "signup"} onClick={() => setTab("signup")}>
            Item signup
          </TabBtn>
          <TabBtn active={tab === "who"} onClick={() => setTab("who")}>
            Who's bringing
          </TabBtn>
          <TabBtn active={tab === "spend"} onClick={() => setTab("spend")}>
            Spend
          </TabBtn>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-3xl px-5 py-8 pb-24">
        {tab === "details" && <DetailsTab claims={claims} />}
        {tab === "itinerary" && <ItineraryTab />}
        {tab === "signup" && (
          <>
            {/* Progress */}
            <div className="mb-10 rounded-lg border border-border bg-card/40 p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg italic text-foreground">
                  {finiteWithSomeone} of {finiteItems.length} items claimed
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
                  {finiteCovered} fully covered
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--olive-deep)]">
                <div
                  className="h-full bg-[var(--gold)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {SECTIONS.map((section) => (
              <section key={section.id} className="mb-12">
                <h2 className="font-display mb-5 text-3xl text-foreground sm:text-4xl">
                  <em className="text-[var(--gold)]">{section.title}</em>
                </h2>
                <ul className="divide-y divide-border rounded-lg border border-border bg-card/40">
                  {section.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      claims={claims[item.id] ?? []}
                      user={user}
                      onOpenForm={() => openForm(item)}
                      onUnclaim={() => unclaim(item)}
                      formOpen={formFor === item.id}
                      formAmount={formAmount}
                      setFormAmount={setFormAmount}
                      formNote={formNote}
                      setFormNote={setFormNote}
                      onSubmitForm={() => submitForm(item)}
                      onCloseForm={() => setFormFor(null)}
                    />

                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
        {tab === "who" && <WhoTab claims={claims} user={user} />}
        {tab === "spend" && (
          <SpendTab paid={paid} user={user} onToggle={(n) => setPaid({ ...paid, [n]: !paid[n] })} />
        )}
      </main>


      <footer className="relative z-10 border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">
        Made with love · cheers to Nicole 🥂
      </footer>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 shrink-0 whitespace-nowrap rounded-md px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition sm:text-sm ${
        active
          ? "bg-[var(--gold)] text-[var(--olive-deep)] shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}

    >
      {children}
    </button>
  );
}

function ItemRow({
  item,
  claims,
  user,
  onOpenForm,
  onUnclaim,
  formOpen,
  formAmount,
  setFormAmount,
  formNote,
  setFormNote,
  onSubmitForm,
  onCloseForm,
}: {
  item: Item;
  claims: Claim[];
  user: Name | "";
  onOpenForm: () => void;
  onUnclaim: () => void;
  formOpen: boolean;
  formAmount: number;
  setFormAmount: (n: number) => void;
  formNote: string;
  setFormNote: (v: string) => void;
  onSubmitForm: () => void;
  onCloseForm: () => void;
}) {
  const isByo = item.qty === "byo";
  const isUnlimited = item.qty === "unlimited";
  const finiteQty = typeof item.qty === "number" ? item.qty : null;
  const taken = claims.length;
  const remaining = finiteQty !== null ? Math.max(0, finiteQty - taken) : null;
  const fullyCovered = finiteQty !== null && taken >= finiteQty;
  const userCount = user ? claims.filter((c) => c.name === user).length : 0;
  const userOnIt = userCount > 0;
  const canAddMore = !isByo && !fullyCovered;
  const others = claims.filter((c) => c.name !== user);

  // Group others by name with count
  const othersGrouped = others.reduce<{ name: Name; count: number; notes: string[] }[]>(
    (acc, c) => {
      const existing = acc.find((g) => g.name === c.name);
      if (existing) {
        existing.count += 1;
        if (c.note) existing.notes.push(c.note);
      } else {
        acc.push({ name: c.name, count: 1, notes: c.note ? [c.note] : [] });
      }
      return acc;
    },
    [],
  );
  const userNotes = claims.filter((c) => c.name === user && c.note).map((c) => c.note!);

  return (
    <li
      className={`px-4 py-4 sm:px-5 ${fullyCovered && !userOnIt ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-base text-foreground ${
                fullyCovered && !userOnIt ? "line-through" : ""
              }`}
            >
              {item.label}
            </span>
            {isByo && (
              <span className="rounded border border-dashed border-[var(--gold-soft)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--gold-soft)]">
                BYO
              </span>
            )}
            {isUnlimited && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                · open list
              </span>
            )}
            {finiteQty !== null && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                · {remaining} of {finiteQty} remaining
              </span>
            )}
          </div>
          {item.hint && (
            <p className="mt-1 text-xs italic text-muted-foreground">{item.hint}</p>
          )}
          {claims.length > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {othersGrouped.map((g, i) => (
                <span key={i}>
                  {g.name}
                  {g.count > 1 ? ` ×${g.count}` : ""}
                  {g.notes.length > 0 && (
                    <span className="text-muted-foreground/70"> ({g.notes.join(", ")})</span>
                  )}
                  {i < othersGrouped.length - 1 ? ", " : ""}
                </span>
              ))}
              {userOnIt && (
                <span className={othersGrouped.length > 0 ? " · " : ""}>
                  <span className="text-[var(--gold)]">
                    you{userCount > 1 ? ` ×${userCount}` : ""}
                  </span>
                  {userNotes.length > 0 && (
                    <span className="text-muted-foreground/70"> ({userNotes.join(", ")})</span>
                  )}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isByo ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            <>
              {userOnIt && (
                <button
                  onClick={onUnclaim}
                  className="rounded-md border border-border px-2.5 py-1.5 text-xs uppercase tracking-wider text-muted-foreground transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
                  aria-label="Remove one"
                >
                  −
                </button>
              )}
              <button
                onClick={onOpenForm}
                disabled={!canAddMore}
                className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--olive-deep)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                {!canAddMore ? "Full" : userOnIt ? "+ Add" : "Bring it"}
              </button>
            </>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="mt-3 rounded-md border border-[var(--gold)]/30 bg-background/60 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                How many?
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFormAmount(Math.max(1, formAmount - 1))}
                  className="rounded-md border border-border px-2.5 py-1.5 text-sm text-muted-foreground hover:border-[var(--gold)] hover:text-[var(--gold)]"
                  aria-label="Decrease"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={remaining ?? 99}
                  value={formAmount}
                  onChange={(e) => setFormAmount(parseInt(e.target.value) || 1)}
                  className="w-14 rounded-md border border-border bg-background px-2 py-1.5 text-center text-sm text-foreground outline-none focus:border-[var(--gold)]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormAmount(
                      remaining !== null
                        ? Math.min(remaining, formAmount + 1)
                        : formAmount + 1,
                    )
                  }
                  className="rounded-md border border-border px-2.5 py-1.5 text-sm text-muted-foreground hover:border-[var(--gold)] hover:text-[var(--gold)]"
                  aria-label="Increase"
                >
                  +
                </button>
              </div>
            </div>
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Note (optional)
              </label>
              <input
                autoFocus
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="e.g. 'handle of tequila', 'big bag'"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--gold)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmitForm();
                  if (e.key === "Escape") onCloseForm();
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onSubmitForm}
              className="rounded-md bg-[var(--gold)] px-3 py-2 text-xs uppercase tracking-wider text-[var(--olive-deep)]"
            >
              Confirm
            </button>
            <button
              onClick={onCloseForm}
              className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  );
}


function WhoTab({
  claims,
  user,
}: {
  claims: Record<string, Claim[]>;
  user: Name | "";
}) {
  const itemsByPerson = useMemo(() => {
    const map = {} as Record<Name, { label: string; count: number }[]>;
    for (const n of NAMES) map[n] = [];
    for (const section of SECTIONS) {
      for (const item of section.items) {
        const list = claims[item.id] ?? [];
        const counts: Record<string, number> = {};
        for (const c of list) {
          counts[item.label] = (counts[item.label] || 0) + 1;
        }
        for (const c of list) {
          if (!map[c.name].some((x) => x.label === item.label)) {
            map[c.name].push({ label: item.label, count: counts[item.label] });
          }
        }
      }
    }
    return map;
  }, [claims]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {NAMES.map((name) => {
        const isMe = name === user;
        const items = itemsByPerson[name];
        const totalClaims = items.reduce((sum, it) => sum + it.count, 0);
        return (
          <div
            key={name}
            className={`rounded-lg border bg-card/40 p-5 transition ${
              isMe
                ? "border-[var(--gold)] shadow-[0_0_0_1px_var(--gold)]"
                : "border-border"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <h3
                className={`font-display text-2xl ${
                  isMe ? "text-[var(--gold)]" : "text-foreground"
                }`}
              >
                {name}
                {isMe && (
                  <span className="ml-2 text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)] not-italic">
                    you
                  </span>
                )}
              </h3>
              <span className="text-xs text-muted-foreground">
                {totalClaims} {totalClaims === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.length === 0 ? (
                <span className="text-sm italic text-muted-foreground">
                  Nothing signed up yet
                </span>
              ) : (
                items.map((it, i) => (
                  <span
                    key={i}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      isMe
                        ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                        : "border-border bg-background/30 text-muted-foreground"
                    }`}
                  >
                    {it.label}
                    {it.count > 1 && (
                      <span className="ml-0.5 opacity-70">({it.count})</span>
                    )}
                  </span>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Details ----------

const CARS: { name: string; people: string; leave: string; arrive: string }[] = [
  { name: "Car #1", people: "Sabrina, Phoebe, Jane", leave: "9:00 AM", arrive: "2:30 PM" },
  { name: "Car #2", people: "Lara, Jess, Nicole, p/u Casey", leave: "9:30 AM", arrive: "4:00 PM" },
  { name: "Car #3", people: "Isabel, Kait, Taylor", leave: "10:00 AM", arrive: "4:00 PM" },
  { name: "Car #4", people: "Charlene", leave: "1:00 PM", arrive: "4:00 PM" },
];

function DetailsTab({ claims }: { claims: Record<string, Claim[]> }) {
  const [selectedGirl, setSelectedGirl] = useState<Name | null>(null);

  if (selectedGirl) {
    const car = CARS.find((c) => c.people.includes(selectedGirl));
    const items: { label: string; note?: string }[] = [];
    for (const section of SECTIONS) {
      for (const item of section.items) {
        const list = claims[item.id] ?? [];
        for (const c of list) {
          if (c.name === selectedGirl) {
            items.push({ label: item.label, note: c.note });
          }
        }
      }
    }
    const expenses = EXPENSES.filter((e) => e.splitAmong.includes(selectedGirl));
    const earlyLeavers = ["Phoebe", "Taylor", "Casey"];
    const leavesEarly = earlyLeavers.includes(selectedGirl);
    const totalOwed = expenses.reduce((s, e) => s + e.perPerson, 0);

    return (
      <div className="space-y-8">
        <button
          onClick={() => setSelectedGirl(null)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
        >
          ← Back to details
        </button>

        <div className="text-center">
          <h2 className="font-display text-5xl text-[var(--gold)] sm:text-6xl">
            {selectedGirl}
          </h2>
        </div>

        {car && (
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h3 className="font-display text-2xl text-foreground">
              <em className="text-[var(--gold)]">Your ride</em>
            </h3>
            <p className="mt-3 text-sm font-medium text-foreground">{car.name}</p>
            <p className="text-xs text-muted-foreground">
              Leave {car.leave} · Arrive {car.arrive}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              With {car.people}
            </p>
          </section>
        )}

        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h3 className="font-display text-2xl text-foreground">
            <em className="text-[var(--gold)]">You're bringing</em>
          </h3>
          {items.length === 0 ? (
            <p className="mt-3 text-sm italic text-muted-foreground">
              Nothing signed up yet
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {items.map((it, i) => (
                <span
                  key={i}
                  className="rounded-full border border-[var(--gold)] bg-[var(--gold)]/10 px-3 py-1.5 text-sm text-[var(--gold-soft)]"
                >
                  {it.label}
                  {it.note && (
                    <span className="ml-1 opacity-70">· {it.note}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </section>

        {expenses.length > 0 && (
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h3 className="font-display text-2xl text-foreground">
              <em className="text-[var(--gold)]">Your share</em>
            </h3>
            <ul className="mt-3 space-y-2">
              {expenses.map((e) => (
                <li key={e.label} className="flex items-baseline justify-between text-sm">
                  <span className="text-foreground">{e.label}</span>
                  <span className="tabular-nums text-[var(--gold-soft)]">
                    ${e.perPerson.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Total owed to {expenses[0]?.payer}: ${totalOwed.toLocaleString()}
            </p>
          </section>
        )}

        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h3 className="font-display text-2xl text-foreground">
            <em className="text-[var(--gold)]">Itinerary</em>
          </h3>
          <div className="mt-4 space-y-5">
            {ITINERARY.map((day) => (
              <div key={day.date}>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
                  {day.label} · {day.date}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {day.blocks.map((b, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-16 shrink-0 tabular-nums text-muted-foreground">
                        {b.time}
                      </span>
                      <span className="text-foreground">{b.what}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {leavesEarly && (
            <div className="mt-4 rounded-md border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3">
              <p className="text-sm text-[var(--gold-soft)]">
                Heads up — you need to leave by Sunday at 12:00 PM.
              </p>
            </div>
          )}
        </section>
      </div>
    );
  }

  const houseAddr = "21 Bellevue St Unit #5, Dewey Beach, DE 19971";
  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="font-display text-3xl text-foreground sm:text-4xl">
          <em className="text-[var(--gold)]">The house</em>
        </h2>
        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
              Address
            </dt>
            <dd className="mt-1 text-sm text-foreground">{houseAddr}</dd>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(houseAddr)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-[var(--gold)] underline-offset-2 hover:underline"
            >
              Open in Maps →
            </a>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
              Check in
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              Thursday, July 30 · 4:00 PM
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
              Check out
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              Sunday, August 2 · 10:00 AM
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="font-display text-3xl text-foreground sm:text-4xl">
          <em className="text-[var(--gold)]">The girls</em>
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {NAMES.map((n) => (
            <button
              key={n}
              onClick={() => setSelectedGirl(n)}
              className="rounded-full border border-border bg-background/30 px-3 py-1.5 text-sm text-foreground transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="font-display text-3xl text-foreground sm:text-4xl">
          <em className="text-[var(--gold)]">Cars & arrivals</em>
        </h2>
        <ul className="mt-5 divide-y divide-border">
          {CARS.map((c) => (
            <li key={c.name} className="py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display text-xl italic text-foreground">
                  {c.name}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
                  Leave {c.leave} · Arrive {c.arrive}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.people}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------- Itinerary ----------

type ItinDay = {
  date: string;
  label: string;
  blocks: { time: string; what: string }[];
};

const ITINERARY: ItinDay[] = [
  {
    date: "Thu, Jul 30",
    label: "Thursday",
    blocks: [
      { time: "4:00 PM", what: "Official check in" },
      { time: "5:00 PM", what: "Decorating" },
      { time: "7:00 PM", what: "Sunset theme · dinner out" },
    ],
  },
  {
    date: "Fri, Jul 31",
    label: "Friday",
    blocks: [
      { time: "8:00 AM", what: "Pickleball (optional)" },
      { time: "9:00 AM", what: "Beach day" },
      { time: "7:00 PM", what: "Glitter theme" },
      { time: "8:00 PM", what: "Pregame games" },
      { time: "9:00 PM", what: "Out on the town" },
    ],
  },
  {
    date: "Sat, Aug 1",
    label: "Saturday",
    blocks: [
      { time: "10:00 AM", what: "Brunch + shops in Rehoboth" },
      { time: "1:00 PM", what: "Back to bnb · Tini Bikinis boat theme" },
      { time: "2:30 PM", what: "Walk to boat" },
      { time: "3:00 PM", what: "Boat" },
      { time: "6:00 PM", what: "Bonfire" },
      { time: "9:00 PM", what: "Games & pjs" },
    ],
  },
  {
    date: "Sun, Aug 2",
    label: "Sunday",
    blocks: [
      { time: "10:00 AM", what: "Checkout · bye-bye brunch" },
      { time: "12:00 PM", what: "Phoebe / Taylor / Casey need to go" },
    ],
  },
];

function ItineraryTab() {
  return (
    <div className="space-y-8">
      {ITINERARY.map((day) => (
        <section
          key={day.date}
          className="rounded-lg border border-border bg-card/40 p-6"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl text-foreground sm:text-4xl">
              <em className="text-[var(--gold)]">{day.label}</em>
            </h2>
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
              {day.date}
            </span>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {day.blocks.map((b, i) => (
              <li key={i} className="flex gap-4 py-3">
                <span className="w-20 shrink-0 text-sm tabular-nums text-[var(--gold-soft)]">
                  {b.time}
                </span>
                <span className="text-sm text-foreground">{b.what}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ---------- Admin ----------

type Expense = {
  label: string;
  total: number;
  payer: string;
  perPerson: number;
  splitAmong: Name[];
  note?: string;
};

const EXPENSES: Expense[] = [
  {
    label: "House",
    total: 3800,
    payer: "Sabrina",
    perPerson: 380,
    splitAmong: [
      "Nicole", "Sabrina", "Lara", "Jess", "Isabel",
      "Kait", "Phoebe", "Jane", "Char", "Casey",
    ],
    note: "Split 10 ways (Taylor not included).",
  },
  {
    label: "Boat — Octolounge Kraken",
    total: 800,
    payer: "Sabrina",
    perPerson: 80,
    splitAmong: [...NAMES],
    note: "$100 deposit paid 4/7. Split 10 ways.",
  },
];

function AdminTab({
  ok,
  pw,
  setPw,
  onSubmit,
}: {
  ok: boolean;
  pw: string;
  setPw: (v: string) => void;
  onSubmit: () => void;
}) {
  if (!ok) {
    return (
      <div className="mx-auto max-w-sm rounded-lg border border-border bg-card/40 p-6 text-center">
        <h2 className="font-display text-2xl italic text-foreground">
          Admin only
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the password to view expenses.
        </p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder="Password"
          className="mt-5 w-full rounded-md border border-border bg-background px-4 py-3 text-base text-foreground outline-none focus:border-[var(--gold)]"
        />
        <button
          onClick={onSubmit}
          className="mt-3 w-full rounded-md bg-[var(--gold)] px-4 py-2.5 text-sm font-medium uppercase tracking-wider text-[var(--olive-deep)]"
        >
          Unlock
        </button>
      </div>
    );
  }

  const totalPerPerson = {} as Record<Name, number>;
  for (const n of NAMES) totalPerPerson[n] = 0;
  for (const e of EXPENSES) {
    for (const n of e.splitAmong) totalPerPerson[n] += e.perPerson;
  }
  const grandTotal = EXPENSES.reduce((s, e) => s + e.total, 0);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="font-display text-3xl text-foreground sm:text-4xl">
          <em className="text-[var(--gold)]">Expenses</em>
        </h2>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
          Total: ${grandTotal.toLocaleString()}
        </p>
        <ul className="mt-5 divide-y divide-border">
          {EXPENSES.map((e) => (
            <li key={e.label} className="py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display text-xl italic text-foreground">
                  {e.label}
                </span>
                <span className="text-sm text-foreground">
                  ${e.total.toLocaleString()}{" "}
                  <span className="text-muted-foreground">
                    · ${e.perPerson}/pp
                  </span>
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Paid by <span className="text-[var(--gold-soft)]">{e.payer}</span>
                {e.note && <span> · {e.note}</span>}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="font-display text-2xl text-foreground sm:text-3xl">
          <em className="text-[var(--gold)]">Owed to Sabrina</em>
        </h2>
        <ul className="mt-4 divide-y divide-border">
          {NAMES.map((n) => (
            <li
              key={n}
              className="flex items-baseline justify-between py-2.5 text-sm"
            >
              <span className="text-foreground">{n}</span>
              <span className="tabular-nums text-[var(--gold-soft)]">
                ${totalPerPerson[n].toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

