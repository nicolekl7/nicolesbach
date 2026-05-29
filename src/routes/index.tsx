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
    "details" | "itinerary" | "signup" | "who" | "admin"
  >("details");
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [adminOk, setAdminOk] = useState(false);


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

  const claim = (item: Item) => {
    if (!requireUser()) return;
    if (item.qty === "byo") return;
    const current = claims[item.id] ?? [];
    if (
      typeof item.qty === "number" &&
      current.length >= item.qty &&
      !current.some((c) => c.name === user)
    ) {
      return;
    }
    setClaims({ ...claims, [item.id]: [...current, { name: user as Name }] });
    setNoteFor(item.id);
    setNoteText("");
    toast.success(`You've got ${item.label.toLowerCase()}`, {
      description: "Add a note if there's a detail to share.",
    });
  };

  const unclaim = (item: Item) => {
    if (!requireUser()) return;
    const current = claims[item.id] ?? [];
    const idx = current.findIndex((c) => c.name === user);
    if (idx === -1) return;
    const next = [...current];
    next.splice(idx, 1);
    setClaims({ ...claims, [item.id]: next });
    toast(`Removed ${item.label.toLowerCase()}`);
  };

  const saveNote = (itemId: string) => {
    const list = claims[itemId] ?? [];
    const idx = [...list].reverse().findIndex((c) => c.name === user);
    if (idx === -1) return;
    const realIdx = list.length - 1 - idx;
    const next = [...list];
    next[realIdx] = { ...next[realIdx], note: noteText.trim() || undefined };
    setClaims({ ...claims, [itemId]: next });
    setNoteFor(null);
    setNoteText("");
    if (noteText.trim()) toast.success("Note saved");
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
        <div className="flex gap-1 rounded-lg border border-border bg-card/40 p-1">
          <TabBtn active={tab === "signup"} onClick={() => setTab("signup")}>
            Item signup
          </TabBtn>
          <TabBtn active={tab === "who"} onClick={() => setTab("who")}>
            Who's bringing what
          </TabBtn>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-3xl px-5 py-8 pb-24">
        {tab === "signup" ? (
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
                      onClaim={() => claim(item)}
                      onUnclaim={() => unclaim(item)}
                      noteOpen={noteFor === item.id}
                      noteText={noteText}
                      setNoteText={setNoteText}
                      onSaveNote={() => saveNote(item.id)}
                      onCloseNote={() => setNoteFor(null)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </>
        ) : (
          <WhoTab claims={claims} user={user} />
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
      className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
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
  onClaim,
  onUnclaim,
  noteOpen,
  noteText,
  setNoteText,
  onSaveNote,
  onCloseNote,
}: {
  item: Item;
  claims: Claim[];
  user: Name | "";
  onClaim: () => void;
  onUnclaim: () => void;
  noteOpen: boolean;
  noteText: string;
  setNoteText: (v: string) => void;
  onSaveNote: () => void;
  onCloseNote: () => void;
}) {
  const isByo = item.qty === "byo";
  const isUnlimited = item.qty === "unlimited";
  const finiteQty = typeof item.qty === "number" ? item.qty : null;
  const taken = claims.length;
  const remaining = finiteQty !== null ? Math.max(0, finiteQty - taken) : null;
  const fullyCovered = finiteQty !== null && taken >= finiteQty;
  const userOnIt = user && claims.some((c) => c.name === user);
  const locked = fullyCovered && !userOnIt;
  const others = claims.filter((c) => c.name !== user);

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
              {others.length > 0 && (
                <>
                  {others.map((c, i) => (
                    <span key={i}>
                      {c.name}
                      {c.note ? (
                        <span className="text-muted-foreground/70"> ({c.note})</span>
                      ) : null}
                      {i < others.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </>
              )}
              {userOnIt && (
                <span className={others.length > 0 ? " · " : ""}>
                  <span className="text-[var(--gold)]">you</span>
                  {claims.find((c) => c.name === user)?.note && (
                    <span className="text-muted-foreground/70">
                      {" "}
                      ({claims.find((c) => c.name === user)?.note})
                    </span>
                  )}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="shrink-0">
          {isByo ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : userOnIt ? (
            <button
              onClick={onUnclaim}
              className="rounded-md border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              Undo
            </button>
          ) : (
            <button
              onClick={onClaim}
              disabled={locked}
              className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--olive-deep)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              {locked ? "Full" : "Bring it"}
            </button>
          )}
        </div>
      </div>

      {noteOpen && userOnIt && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note (e.g. 'handle of tequila', 'big bag')"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--gold)]"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveNote();
              if (e.key === "Escape") onCloseNote();
            }}
          />
          <button
            onClick={onSaveNote}
            className="rounded-md bg-[var(--gold)] px-3 py-2 text-xs uppercase tracking-wider text-[var(--olive-deep)]"
          >
            Save
          </button>
          <button
            onClick={onCloseNote}
            className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground"
          >
            Skip
          </button>
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
    const map = {} as Record<Name, { label: string; note?: string }[]>;
    for (const n of NAMES) map[n] = [];
    for (const section of SECTIONS) {
      for (const item of section.items) {
        const list = claims[item.id] ?? [];
        for (const c of list) {
          map[c.name].push({ label: item.label, note: c.note });
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
                {items.length} {items.length === 1 ? "item" : "items"}
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
                    {it.note && (
                      <span className="ml-1 opacity-70">· {it.note}</span>
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
