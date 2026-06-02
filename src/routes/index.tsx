import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { loadContent, saveContent } from "../lib/api/content.functions";

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
const ADMIN: Name = "Sabrina";

type PaidMap = Record<Name, Record<string, boolean>>;
const ALL_PAID_FALSE = Object.fromEntries(
  NAMES.map((n) => [n, {} as Record<string, boolean>])
) as PaidMap;

type Claim = { name: Name; note?: string };

type Item = {
  id: string;
  label: string;
  qty: number | "unlimited" | "byo";
  hint?: string;
};

type Section = { id: string; title: string; items: Item[] };

const DEFAULT_SECTIONS: Section[] = [
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

type ItinDay = {
  date: string;
  label: string;
  blocks: { time: string; what: string }[];
};

const DEFAULT_ITINERARY: ItinDay[] = [
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

const DEFAULT_CARS: { name: string; people: string; leave: string; arrive: string }[] = [
  { name: "Car #1", people: "Sabrina, Phoebe, Jane", leave: "9:00 AM", arrive: "2:30 PM" },
  { name: "Car #2", people: "Lara, Jess, Nicole, p/u Casey", leave: "9:30 AM", arrive: "4:00 PM" },
  { name: "Car #3", people: "Isabel, Kait, Taylor", leave: "10:00 AM", arrive: "4:00 PM" },
  { name: "Car #4", people: "Charlene", leave: "1:00 PM", arrive: "4:00 PM" },
];

const DEFAULT_HOUSE = {
  addr: "21 Bellevue St Unit #5, Dewey Beach, DE 19971",
  checkIn: "Thursday, July 30 · 4:00 PM",
  checkOut: "Sunday, August 2 · 10:00 AM",
};

type Theme = {
  id: string;
  event: string;
  themeName: string;
  description: string;
  icon?: string;
  imageUrl?: string;
};

const DEFAULT_THEMES: Theme[] = [
  {
    id: "thu-night",
    event: "Thursday night",
    themeName: "Sunset",
    description: "Sunset tones — warm oranges, pinks, and golds. Think sundress or cute going-out look.",
    icon: "🌅",
    imageUrl: "",
  },
  {
    id: "fri-night",
    event: "Friday night",
    themeName: "Glitter",
    description: "Go glam. Glitter, shimmer, sequins — anything that catches the light.",
    icon: "✨",
    imageUrl: "",
  },
  {
    id: "sat-boat",
    event: "Boat · Saturday",
    themeName: "Tini Bikinis",
    description: "Green bathing suits & cover-ups. Matching energy encouraged.",
    icon: "🍸",
    imageUrl: "",
  },
  {
    id: "sat-bonfire",
    event: "Bonfire · Saturday night",
    themeName: "Games & PJs",
    description: "Comfy cozy. PJs, sweats, whatever you're sleeping in.",
    icon: "🌙",
    imageUrl: "",
  },
];

type Expense = {
  label: string;
  total: number;
  payer: string;
  perPerson: number;
  splitAmong: Name[];
  note?: string;
};

const INITIAL_EXPENSES: Expense[] = [
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
  const [tab, setTab] = useState<"details" | "itinerary" | "signup" | "vibes" | "payments">("details");
  const [formFor, setFormFor] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState(1);
  const [formNote, setFormNote] = useState("");
  const [paid, setPaid] = useState<PaidMap>(ALL_PAID_FALSE);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);

  // Admin state
  const [adminMode, setAdminMode] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [adminPwError, setAdminPwError] = useState(false);

  // Editable content state — synced to Cloudflare KV (shared across all browsers)
  const [themes, setThemes] = useState<Theme[]>(DEFAULT_THEMES);
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [itinerary, setItinerary] = useState<ItinDay[]>(DEFAULT_ITINERARY);
  const [cars, setCars] = useState(DEFAULT_CARS);
  const [houseInfo, setHouseInfo] = useState(DEFAULT_HOUSE);

  // Load shared content from KV on mount
  useEffect(() => {
    loadContent().then((data) => {
      if (!data) return;
      if (data.themes) setThemes(data.themes as Theme[]);
      if (data.sections) setSections(data.sections as Section[]);
      if (data.itinerary) setItinerary(data.itinerary as ItinDay[]);
      if (data.cars) setCars(data.cars as typeof DEFAULT_CARS);
      if (data.houseInfo) setHouseInfo(data.houseInfo as typeof DEFAULT_HOUSE);
      if (data.claims) setClaims(data.claims as Record<string, Claim[]>);
    }).catch(() => {});
  }, []);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveContent({
        data: {
          password: "nyler",
          content: { themes, sections, itinerary, cars, houseInfo, claims },
        },
      });
      toast.success("Saved!");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Save failed — " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const saveClaims = (nextClaims: Record<string, Claim[]>) => {
    saveContent({
      data: {
        password: "nyler",
        content: { themes, sections, itinerary, cars, houseInfo, claims: nextClaims },
      },
    }).catch((err) => console.error("Auto-save claims failed:", err));
  };

  const setThemesA = (v: Theme[]) => setThemes(v);
  const setSectionsA = (v: Section[]) => setSections(v);
  const setItineraryA = (v: ItinDay[]) => setItinerary(v);
  const setCarsA = (v: typeof DEFAULT_CARS) => setCars(v);
  const setHouseInfoA = (v: typeof DEFAULT_HOUSE) => setHouseInfo(v);

  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
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
    const nextClaims = { ...claims, [item.id]: [...current, ...additions] };
    setClaims(nextClaims);
    saveClaims(nextClaims);
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
    const nextClaims = { ...claims, [item.id]: next };
    setClaims(nextClaims);
    saveClaims(nextClaims);
    toast(`Removed one ${item.label.toLowerCase()}`);
  };

  const handleAdminSubmit = () => {
    if (adminPw === "nyler") {
      setAdminMode(true);
      setShowAdminModal(false);
      setAdminPw("");
      setAdminPwError(false);
      toast.success("Admin mode on");
    } else {
      setAdminPwError(true);
    }
  };

  return (
    <div className="noise-overlay relative min-h-screen text-foreground">
      {/* Admin mode banner */}
      {adminMode && (
        <div className="relative z-20 border-b border-[var(--gold)]/30 bg-[var(--gold)]/10 px-5 py-2 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
            Admin mode · editing enabled
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-4 rounded-md bg-[var(--gold)] px-3 py-1 text-xs font-medium uppercase tracking-wider text-[var(--olive-deep)] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setAdminMode(false)}
            className="ml-3 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Exit
          </button>
        </div>
      )}

      {/* Admin password modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl">
            <h2 className="font-display text-2xl text-foreground">
              <em className="text-[var(--gold)]">Admin</em>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the password to unlock editing.
            </p>
            <input
              autoFocus
              type="password"
              value={adminPw}
              onChange={(e) => { setAdminPw(e.target.value); setAdminPwError(false); }}
              placeholder="••••••"
              className={`mt-4 w-full rounded-md border bg-background px-4 py-3 text-center text-base text-foreground outline-none transition focus:ring-1 focus:ring-[var(--gold)] ${adminPwError ? "border-red-500 focus:border-red-500" : "border-border focus:border-[var(--gold)]"}`}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdminSubmit();
                if (e.key === "Escape") { setShowAdminModal(false); setAdminPw(""); setAdminPwError(false); }
              }}
            />
            {adminPwError && (
              <p className="mt-2 text-xs text-red-400">Incorrect password.</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAdminSubmit}
                className="flex-1 rounded-md bg-[var(--gold)] px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[var(--olive-deep)]"
              >
                Unlock
              </button>
              <button
                onClick={() => { setShowAdminModal(false); setAdminPw(""); setAdminPwError(false); }}
                className="rounded-md border border-border px-4 py-2.5 text-xs uppercase tracking-wider text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
          <TabBtn active={tab === "vibes"} onClick={() => setTab("vibes")}>
            Vibes
          </TabBtn>
          {adminMode && (
            <TabBtn active={tab === "payments"} onClick={() => setTab("payments")}>
              Payments
            </TabBtn>
          )}
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-3xl px-5 py-8 pb-24">
        {tab === "details" && (
          <DetailsTab
            claims={claims}
            paid={paid}
            user={user}
            expenses={expenses}
            cars={cars}
            setCars={adminMode ? setCarsA : undefined}
            houseInfo={houseInfo}
            setHouseInfo={adminMode ? setHouseInfoA : undefined}
            itinerary={itinerary}
            setItinerary={adminMode ? setItineraryA : undefined}
          />
        )}
        {tab === "itinerary" && (
          <ItineraryTab
            itinerary={itinerary}
            setItinerary={adminMode ? setItineraryA : undefined}
          />
        )}
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

            {sections.map((section, sIdx) => (
              <section key={section.id} className="mb-12">
                <div className="mb-5 flex items-center gap-3">
                  {adminMode ? (
                    <input
                      value={section.title}
                      onChange={(e) => {
                        const next = sections.map((s, i) =>
                          i === sIdx ? { ...s, title: e.target.value } : s
                        );
                        setSectionsA(next);
                      }}
                      className="font-display w-full bg-transparent text-3xl text-[var(--gold)] outline-none border-b border-[var(--gold)]/30 focus:border-[var(--gold)] sm:text-4xl"
                    />
                  ) : (
                    <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                      <em className="text-[var(--gold)]">{section.title}</em>
                    </h2>
                  )}
                  {adminMode && (
                    <button
                      onClick={() => {
                        const id = `${section.id}-item-${Date.now()}`;
                        const next = sections.map((s, i) =>
                          i === sIdx
                            ? { ...s, items: [...s.items, { id, label: "New item", qty: 1 as number }] }
                            : s
                        );
                        setSectionsA(next);
                      }}
                      className="shrink-0 rounded-md border border-[var(--gold)]/40 px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--gold)] hover:bg-[var(--gold)]/10"
                    >
                      + Item
                    </button>
                  )}
                </div>
                <ul className="divide-y divide-border rounded-lg border border-border bg-card/40">
                  {section.items.map((item, iIdx) => (
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
                      adminMode={adminMode}
                      onEditItem={(updated) => {
                        const next = sections.map((s, si) =>
                          si === sIdx
                            ? { ...s, items: s.items.map((it, ii) => (ii === iIdx ? updated : it)) }
                            : s
                        );
                        setSectionsA(next);
                      }}
                      onDeleteItem={() => {
                        const next = sections.map((s, si) =>
                          si === sIdx
                            ? { ...s, items: s.items.filter((_, ii) => ii !== iIdx) }
                            : s
                        );
                        setSectionsA(next);
                      }}
                    />
                  ))}
                </ul>
              </section>
            ))}

            {adminMode && (
              <button
                onClick={() => {
                  const id = `section-${Date.now()}`;
                  setSectionsA([...sections, { id, title: "New section", items: [] }]);
                }}
                className="w-full rounded-lg border border-dashed border-[var(--gold)]/40 px-4 py-3 text-xs uppercase tracking-wider text-[var(--gold)] hover:bg-[var(--gold)]/5"
              >
                + Add section
              </button>
            )}
          </>
        )}
        {tab === "who" && <WhoTab claims={claims} user={user} sections={sections} />}
        {tab === "vibes" && (
          <VibesTab
            themes={themes}
            setThemes={adminMode ? setThemesA : undefined}
          />
        )}
        {tab === "payments" && adminMode && (
          <SpendTab
            paid={paid}
            user={user}
            expenses={expenses}
            setExpenses={setExpenses}
            onToggle={(n, label) =>
              setPaid({
                ...paid,
                [n]: { ...paid[n], [label]: !paid[n]?.[label] },
              })
            }
          />
        )}
      </main>

      <footer className="relative z-10 border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">
        <p>Made with love · cheers to Nicole 🥂</p>
        <button
          onClick={() => {
            if (adminMode) {
              setAdminMode(false);
              toast("Admin mode off");
            } else {
              setShowAdminModal(true);
            }
          }}
          className="mt-3 inline-block rounded-md border border-border/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 transition hover:border-border hover:text-muted-foreground"
        >
          {adminMode ? "Exit admin" : "Admin"}
        </button>
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
  adminMode,
  onEditItem,
  onDeleteItem,
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
  adminMode?: boolean;
  onEditItem?: (updated: Item) => void;
  onDeleteItem?: () => void;
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

  if (adminMode && onEditItem) {
    return (
      <li className="px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <input
            value={item.label}
            onChange={(e) => onEditItem({ ...item, label: e.target.value })}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none border-b border-border/50 focus:border-[var(--gold)] py-0.5"
          />
          <select
            value={item.qty}
            onChange={(e) => {
              const v = e.target.value;
              const qty = v === "unlimited" || v === "byo" ? v : parseInt(v) || 1;
              onEditItem({ ...item, qty });
            }}
            className="rounded border border-border/50 bg-background/30 px-2 py-1 text-xs text-muted-foreground outline-none focus:border-[var(--gold)]"
          >
            <option value="unlimited">unlimited</option>
            <option value="byo">byo</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <input
            value={item.hint ?? ""}
            onChange={(e) => onEditItem({ ...item, hint: e.target.value || undefined })}
            placeholder="hint"
            className="w-24 bg-transparent text-xs text-muted-foreground outline-none border-b border-border/30 focus:border-[var(--gold)] py-0.5"
          />
          <button
            onClick={onDeleteItem}
            className="shrink-0 text-xs text-muted-foreground/50 hover:text-red-400"
            aria-label="Delete item"
          >
            ✕
          </button>
        </div>
      </li>
    );
  }

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
  sections,
}: {
  claims: Record<string, Claim[]>;
  user: Name | "";
  sections: Section[];
}) {
  const itemsByPerson = useMemo(() => {
    const map = {} as Record<Name, { label: string; count: number }[]>;
    for (const n of NAMES) map[n] = [];
    for (const section of sections) {
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
  }, [claims, sections]);

  const visibleNames = user && user !== ADMIN ? [user as Name] : NAMES;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {visibleNames.map((name) => {
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

function EditableField({
  value,
  onChange,
  className,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className={`w-full resize-none bg-transparent outline-none border-b border-[var(--gold)]/30 focus:border-[var(--gold)] ${className ?? ""}`}
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-transparent outline-none border-b border-[var(--gold)]/30 focus:border-[var(--gold)] ${className ?? ""}`}
    />
  );
}

function DetailsTab({
  claims,
  paid,
  user,
  expenses,
  cars,
  setCars,
  houseInfo,
  setHouseInfo,
  itinerary,
  setItinerary,
}: {
  claims: Record<string, Claim[]>;
  paid: PaidMap;
  user: Name | "";
  expenses: Expense[];
  cars: typeof DEFAULT_CARS;
  setCars?: (c: typeof DEFAULT_CARS) => void;
  houseInfo: typeof DEFAULT_HOUSE;
  setHouseInfo?: (h: typeof DEFAULT_HOUSE) => void;
  itinerary: ItinDay[];
  setItinerary?: (it: ItinDay[]) => void;
}) {
  const [selectedGirl, setSelectedGirl] = useState<Name | null>(null);
  const lockedToUser = user !== "" && user !== ADMIN;
  const activeGirl = lockedToUser ? (user as Name) : selectedGirl;
  const adminMode = !!setCars;

  if (activeGirl) {
    const sg = activeGirl;
    const car = cars.find((c) => c.people.includes(sg));
    const items: { label: string; note?: string }[] = [];
    for (const section of ([] as Section[])) {
      for (const item of section.items) {
        const list = claims[item.id] ?? [];
        for (const c of list) {
          if (c.name === sg) items.push({ label: item.label, note: c.note });
        }
      }
    }
    // Re-derive items from claims directly, grouped by label with count
    const itemCounts: Record<string, { count: number; note?: string }> = {};
    for (const [itemId, claimList] of Object.entries(claims)) {
      for (const c of claimList) {
        if (c.name === sg) {
          if (!itemCounts[itemId]) itemCounts[itemId] = { count: 0, note: c.note };
          itemCounts[itemId].count += 1;
        }
      }
    }
    const allClaimedItems = Object.entries(itemCounts).map(([label, { count, note }]) => ({ label, count, note }));
    const userExpenses = expenses.filter((e) => e.splitAmong.includes(sg));
    const earlyLeavers = ["Phoebe", "Taylor", "Casey"];
    const leavesEarly = earlyLeavers.includes(sg);

    return (
      <div className="space-y-8">
        {!lockedToUser && (
          <button
            onClick={() => setSelectedGirl(null)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            ← Back to details
          </button>
        )}

        <div className="text-center">
          <h2 className="font-display text-5xl text-[var(--gold)] sm:text-6xl">{sg}</h2>
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
            <p className="mt-2 text-xs text-muted-foreground">With {car.people}</p>
          </section>
        )}

        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h3 className="font-display text-2xl text-foreground">
            <em className="text-[var(--gold)]">You're bringing</em>
          </h3>
          {allClaimedItems.length === 0 ? (
            <p className="mt-3 text-sm italic text-muted-foreground">Nothing signed up yet</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {allClaimedItems.map((it, i) => (
                <span
                  key={i}
                  className="rounded-full border border-[var(--gold)] bg-[var(--gold)]/10 px-3 py-1.5 text-sm text-[var(--gold-soft)]"
                >
                  {it.label} ({it.count})
                  {it.note && <span className="ml-1 opacity-70">· {it.note}</span>}
                </span>
              ))}
            </div>
          )}
        </section>

        {userExpenses.length > 0 && (
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h3 className="font-display text-2xl text-foreground">
              <em className="text-[var(--gold)]">Payment</em>
            </h3>
            <ul className="mt-3 space-y-2">
              {userExpenses.map((e) => {
                const hasPaid = !!paid[sg]?.[e.label];
                return (
                  <li key={e.label} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{e.label}</span>
                    <span
                      className={
                        "rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider " +
                        (hasPaid
                          ? "border-green-700/40 bg-green-900/20 text-green-400"
                          : "border-border bg-background/30 text-muted-foreground")
                      }
                    >
                      {hasPaid ? "Paid" : "Not paid"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Owed to {userExpenses[0]?.payer}
            </p>
          </section>
        )}

        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h3 className="font-display text-2xl text-foreground">
            <em className="text-[var(--gold)]">Itinerary</em>
          </h3>
          <div className="mt-4 space-y-5">
            {itinerary.map((day) => (
              <div key={day.date}>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
                  {day.label} · {day.date}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {day.blocks.map((b, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-16 shrink-0 tabular-nums text-muted-foreground">{b.time}</span>
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

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="font-display text-3xl text-foreground sm:text-4xl">
          <em className="text-[var(--gold)]">The house</em>
        </h2>
        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">Address</dt>
            {adminMode && setHouseInfo ? (
              <EditableField
                value={houseInfo.addr}
                onChange={(v) => setHouseInfo({ ...houseInfo, addr: v })}
                className="mt-1 text-sm text-foreground"
              />
            ) : (
              <dd className="mt-1 text-sm text-foreground">{houseInfo.addr}</dd>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(houseInfo.addr)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-[var(--gold)] underline-offset-2 hover:underline"
            >
              Open in Maps →
            </a>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">Check in</dt>
            {adminMode && setHouseInfo ? (
              <EditableField
                value={houseInfo.checkIn}
                onChange={(v) => setHouseInfo({ ...houseInfo, checkIn: v })}
                className="mt-1 text-sm text-foreground"
              />
            ) : (
              <dd className="mt-1 text-sm text-foreground">{houseInfo.checkIn}</dd>
            )}
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">Check out</dt>
            {adminMode && setHouseInfo ? (
              <EditableField
                value={houseInfo.checkOut}
                onChange={(v) => setHouseInfo({ ...houseInfo, checkOut: v })}
                className="mt-1 text-sm text-foreground"
              />
            ) : (
              <dd className="mt-1 text-sm text-foreground">{houseInfo.checkOut}</dd>
            )}
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
          {cars.map((c, idx) => (
            <li key={c.name} className="py-4">
              {adminMode && setCars ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl italic text-foreground shrink-0">{c.name}</span>
                    <button
                      onClick={() => setCars(cars.filter((_, i) => i !== idx))}
                      className="text-xs text-muted-foreground/50 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">People</label>
                      <EditableField
                        value={c.people}
                        onChange={(v) => setCars(cars.map((car, i) => i === idx ? { ...car, people: v } : car))}
                        className="text-sm text-muted-foreground"
                        multiline
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Leave</label>
                        <EditableField
                          value={c.leave}
                          onChange={(v) => setCars(cars.map((car, i) => i === idx ? { ...car, leave: v } : car))}
                          className="text-sm text-[var(--gold-soft)]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Arrive</label>
                        <EditableField
                          value={c.arrive}
                          onChange={(v) => setCars(cars.map((car, i) => i === idx ? { ...car, arrive: v } : car))}
                          className="text-sm text-[var(--gold-soft)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-xl italic text-foreground">{c.name}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
                      Leave {c.leave} · Arrive {c.arrive}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.people}</p>
                </>
              )}
            </li>
          ))}
        </ul>
        {adminMode && setCars && (
          <button
            onClick={() =>
              setCars([
                ...cars,
                { name: `Car #${cars.length + 1}`, people: "", leave: "", arrive: "" },
              ])
            }
            className="mt-3 w-full rounded-md border border-dashed border-[var(--gold)]/40 py-2 text-xs uppercase tracking-wider text-[var(--gold)] hover:bg-[var(--gold)]/5"
          >
            + Add car
          </button>
        )}
      </section>
    </div>
  );
}

// ---------- Itinerary ----------

function ItineraryTab({
  itinerary,
  setItinerary,
}: {
  itinerary: ItinDay[];
  setItinerary?: (it: ItinDay[]) => void;
}) {
  const adminMode = !!setItinerary;

  const updateDay = (dIdx: number, updated: ItinDay) => {
    if (!setItinerary) return;
    setItinerary(itinerary.map((d, i) => (i === dIdx ? updated : d)));
  };

  return (
    <div className="space-y-8">
      {itinerary.map((day, dIdx) => (
        <section
          key={day.date}
          className="rounded-lg border border-border bg-card/40 p-6"
        >
          <div className="flex items-baseline justify-between gap-3">
            {adminMode ? (
              <div className="flex flex-1 gap-2">
                <EditableField
                  value={day.label}
                  onChange={(v) => updateDay(dIdx, { ...day, label: v })}
                  className="font-display text-3xl text-[var(--gold)] sm:text-4xl"
                />
                <EditableField
                  value={day.date}
                  onChange={(v) => updateDay(dIdx, { ...day, date: v })}
                  className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]"
                />
              </div>
            ) : (
              <>
                <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                  <em className="text-[var(--gold)]">{day.label}</em>
                </h2>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
                  {day.date}
                </span>
              </>
            )}
          </div>
          <ul className="mt-4 divide-y divide-border">
            {day.blocks.map((b, bIdx) => (
              <li key={bIdx} className="flex gap-4 py-3">
                {adminMode ? (
                  <>
                    <div className="w-24 shrink-0">
                      <EditableField
                        value={b.time}
                        onChange={(v) =>
                          updateDay(dIdx, {
                            ...day,
                            blocks: day.blocks.map((bl, i) => (i === bIdx ? { ...bl, time: v } : bl)),
                          })
                        }
                        className="text-sm tabular-nums text-[var(--gold-soft)]"
                      />
                    </div>
                    <div className="flex-1">
                      <EditableField
                        value={b.what}
                        onChange={(v) =>
                          updateDay(dIdx, {
                            ...day,
                            blocks: day.blocks.map((bl, i) => (i === bIdx ? { ...bl, what: v } : bl)),
                          })
                        }
                        className="text-sm text-foreground"
                      />
                    </div>
                    <button
                      onClick={() =>
                        updateDay(dIdx, {
                          ...day,
                          blocks: day.blocks.filter((_, i) => i !== bIdx),
                        })
                      }
                      className="text-xs text-muted-foreground/50 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <span className="w-20 shrink-0 text-sm tabular-nums text-[var(--gold-soft)]">{b.time}</span>
                    <span className="text-sm text-foreground">{b.what}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
          {adminMode && (
            <button
              onClick={() =>
                updateDay(dIdx, {
                  ...day,
                  blocks: [...day.blocks, { time: "", what: "" }],
                })
              }
              className="mt-2 w-full rounded border border-dashed border-[var(--gold)]/30 py-1.5 text-[10px] uppercase tracking-wider text-[var(--gold)] hover:bg-[var(--gold)]/5"
            >
              + Add block
            </button>
          )}
        </section>
      ))}
      {adminMode && setItinerary && (
        <button
          onClick={() =>
            setItinerary([
              ...itinerary,
              { label: "New day", date: "", blocks: [] },
            ])
          }
          className="w-full rounded-lg border border-dashed border-[var(--gold)]/40 py-3 text-xs uppercase tracking-wider text-[var(--gold)] hover:bg-[var(--gold)]/5"
        >
          + Add day
        </button>
      )}
    </div>
  );
}

// ---------- Spend / Payments ----------

function SpendTab({
  paid,
  user,
  onToggle,
  expenses,
  setExpenses,
}: {
  paid: PaidMap;
  user: Name | "";
  onToggle: (name: Name, label: string) => void;
  expenses: Expense[];
  setExpenses: (e: Expense[]) => void;
}) {
  const isAdmin = user === ADMIN;
  const visibleNames = user && !isAdmin ? [user as Name] : NAMES;
  const [view, setView] = useState<"list" | "checklist">("checklist");
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTotal, setNewTotal] = useState(0);
  const [newPayer, setNewPayer] = useState<Name>(ADMIN);
  const [newSplit, setNewSplit] = useState<Name[]>([...NAMES]);

  const totalRequired = NAMES.reduce(
    (sum, n) => sum + expenses.filter((e) => e.splitAmong.includes(n)).length,
    0,
  );
  const totalPaid = NAMES.reduce(
    (sum, n) =>
      sum +
      expenses.filter((e) => e.splitAmong.includes(n) && paid[n]?.[e.label]).length,
    0,
  );

  const addExpense = () => {
    const label = newLabel.trim();
    if (!label || newSplit.length === 0 || newTotal <= 0) {
      toast.error("Need a label, total > 0, and at least one person");
      return;
    }
    if (expenses.some((e) => e.label === label)) {
      toast.error("That label already exists");
      return;
    }
    setExpenses([
      ...expenses,
      {
        label,
        total: newTotal,
        payer: newPayer,
        perPerson: Math.round((newTotal / newSplit.length) * 100) / 100,
        splitAmong: newSplit,
      },
    ]);
    setAdding(false);
    setNewLabel("");
    setNewTotal(0);
    setNewSplit([...NAMES]);
    toast.success(`Added ${label}`);
  };

  const removeExpense = (label: string) => {
    if (!confirm(`Delete "${label}"?`)) return;
    setExpenses(expenses.filter((e) => e.label !== label));
  };

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card/40 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">
            <em className="text-[var(--gold)]">Payments</em>
          </h2>
          <div className="flex gap-1 rounded-md border border-border bg-background/30 p-1">
            <button
              onClick={() => setView("checklist")}
              className={`rounded px-2.5 py-1 text-[11px] uppercase tracking-wider transition ${
                view === "checklist"
                  ? "bg-[var(--gold)] text-[var(--olive-deep)]"
                  : "text-muted-foreground"
              }`}
            >
              Checklist
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded px-2.5 py-1 text-[11px] uppercase tracking-wider transition ${
                view === "list"
                  ? "bg-[var(--gold)] text-[var(--olive-deep)]"
                  : "text-muted-foreground"
              }`}
            >
              List
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
          {totalPaid} of {totalRequired} paid
          <span className="ml-2 normal-case tracking-normal text-[var(--gold)]">
            · tap any to toggle
          </span>
        </p>

        {view === "checklist" ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-2 py-2 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    Name
                  </th>
                  {expenses.map((e) => (
                    <th
                      key={e.label}
                      className="border-b border-border px-2 py-2 text-center text-[11px] uppercase tracking-wider text-[var(--gold-soft)]"
                    >
                      <div>{e.label}</div>
                      <div className="text-muted-foreground normal-case tracking-normal">
                        ${e.perPerson}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleNames.map((n) => {
                  const isMe = n === user;
                  return (
                    <tr key={n}>
                      <td className="border-b border-border px-2 py-2 text-foreground">
                        {n} {isMe && <span className="text-[var(--gold)]">(you)</span>}
                      </td>
                      {expenses.map((e) => {
                        const inSplit = e.splitAmong.includes(n);
                        const hasPaid = !!paid[n]?.[e.label];
                        if (!inSplit) {
                          return (
                            <td
                              key={e.label}
                              className="border-b border-border px-2 py-2 text-center text-muted-foreground/40"
                            >
                              —
                            </td>
                          );
                        }
                        return (
                          <td
                            key={e.label}
                            className="border-b border-border px-2 py-2 text-center"
                          >
                            <button
                              onClick={() => onToggle(n, e.label)}
                              className={`inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded border text-xs transition hover:border-[var(--gold)] ${
                                hasPaid
                                  ? "border-green-700/50 bg-green-900/30 text-green-400"
                                  : "border-border bg-background/30 text-muted-foreground"
                              }`}
                              aria-label={hasPaid ? "Paid" : "Not paid"}
                            >
                              {hasPaid ? "✓" : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <ul className="mt-5 space-y-5">
            {visibleNames.map((n) => {
              const isMe = n === user;
              const userExpenses = expenses.filter((e) => e.splitAmong.includes(n));
              return (
                <li key={n} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {n} {isMe && <span className="text-[var(--gold)]">(you)</span>}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {userExpenses.map((e) => {
                      const hasPaid = !!paid[n]?.[e.label];
                      return (
                        <li
                          key={e.label}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {e.label}
                            <span className="ml-2 text-xs tabular-nums text-[var(--gold-soft)]">
                              ${e.perPerson}
                            </span>
                          </span>
                          <button
                            onClick={() => onToggle(n, e.label)}
                            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider transition hover:border-[var(--gold)] ${
                              hasPaid
                                ? "border-green-700/40 bg-green-900/20 text-green-400"
                                : "border-border bg-background/30 text-muted-foreground"
                            }`}
                          >
                            {hasPaid ? "Paid" : "Not paid"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-2xl text-foreground">
            <em className="text-[var(--gold)]">Manage expenses</em>
          </h3>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs uppercase tracking-wider text-[var(--olive-deep)]"
            >
              + Add expense
            </button>
          )}
        </div>

        {adding && (
          <div className="mt-4 space-y-3 rounded-md border border-[var(--gold)]/30 bg-background/60 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Label
                </label>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Brunch"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--gold)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Total ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={newTotal || ""}
                  onChange={(e) => setNewTotal(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--gold)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Paid by
                </label>
                <select
                  value={newPayer}
                  onChange={(e) => setNewPayer(e.target.value as Name)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--gold)]"
                >
                  {NAMES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Per person
                </label>
                <div className="rounded-md border border-border bg-background/40 px-3 py-2 text-sm text-[var(--gold-soft)]">
                  ${newSplit.length > 0
                    ? (Math.round((newTotal / newSplit.length) * 100) / 100).toFixed(2)
                    : "—"}
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Split among ({newSplit.length})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {NAMES.map((n) => {
                  const on = newSplit.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() =>
                        setNewSplit(on ? newSplit.filter((x) => x !== n) : [...newSplit, n])
                      }
                      className={`rounded-full border px-2.5 py-1 text-xs transition ${
                        on
                          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                          : "border-border bg-background/30 text-muted-foreground"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addExpense}
                className="rounded-md bg-[var(--gold)] px-3 py-2 text-xs uppercase tracking-wider text-[var(--olive-deep)]"
              >
                Save
              </button>
              <button
                onClick={() => setAdding(false)}
                className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <ul className="mt-4 divide-y divide-border">
          {expenses.map((e) => (
            <li key={e.label} className="flex items-baseline justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <span className="text-foreground">{e.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ${e.total} · ${e.perPerson}/person · {e.splitAmong.length} people · paid by {e.payer}
                </span>
              </div>
              <button
                onClick={() => removeExpense(e.label)}
                className="shrink-0 text-xs text-muted-foreground hover:text-red-400"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function toDirectImageUrl(url: string): string {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return url;
}

// ---------- Vibes ----------

function VibesTab({
  themes,
  setThemes,
}: {
  themes: Theme[];
  setThemes?: (t: Theme[]) => void;
}) {
  const adminMode = !!setThemes;

  const updateTheme = (idx: number, updated: Theme) => {
    if (!setThemes) return;
    setThemes(themes.map((t, i) => (i === idx ? updated : t)));
  };

  return (
    <div className="space-y-6">
      {themes.map((theme, idx) => (
        <section key={theme.id} className="rounded-lg border border-border bg-card/40 p-6">
          {adminMode ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-3">
                    <div className="w-16">
                      <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Icon
                      </label>
                      <input
                        value={theme.icon ?? ""}
                        onChange={(e) => updateTheme(idx, { ...theme, icon: e.target.value })}
                        placeholder="🍸"
                        className="w-full rounded-md border border-border bg-background px-2 py-2 text-center text-lg outline-none focus:border-[var(--gold)]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Event
                      </label>
                      <EditableField
                        value={theme.event}
                        onChange={(v) => updateTheme(idx, { ...theme, event: v })}
                        className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Theme name
                    </label>
                    <EditableField
                      value={theme.themeName}
                      onChange={(v) => updateTheme(idx, { ...theme, themeName: v })}
                      className="font-display text-3xl text-[var(--gold)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Description
                    </label>
                    <EditableField
                      value={theme.description}
                      onChange={(v) => updateTheme(idx, { ...theme, description: v })}
                      className="text-sm text-muted-foreground"
                      multiline
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Image URL (collage / mood board)
                    </label>
                    <input
                      type="url"
                      value={theme.imageUrl ?? ""}
                      onChange={(e) => updateTheme(idx, { ...theme, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--gold)]"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setThemes(themes.filter((_, i) => i !== idx))}
                  className="shrink-0 text-xs text-muted-foreground/50 hover:text-red-400"
                  aria-label="Delete theme"
                >
                  ✕
                </button>
              </div>
              {theme.imageUrl && (
                <img
                  src={toDirectImageUrl(theme.imageUrl!)}
                  alt={`${theme.themeName} mood board`}
                  className="mt-2 w-full rounded-lg object-cover"
                  style={{ maxHeight: "288px" }}
                />
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {theme.icon && (
                  <span className="text-3xl" aria-hidden>{theme.icon}</span>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
                    {theme.event}
                  </p>
                  <h2 className="font-display mt-0.5 text-3xl text-[var(--gold)] sm:text-4xl">
                    <em>{theme.themeName}</em>
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{theme.description}</p>
              {theme.imageUrl && (
                <img
                  src={toDirectImageUrl(theme.imageUrl!)}
                  alt={`${theme.themeName} mood board`}
                  className="mt-4 w-full rounded-lg object-cover"
                  style={{ maxHeight: "288px" }}
                />
              )}
            </>
          )}
        </section>
      ))}

      {adminMode && setThemes && (
        <button
          onClick={() =>
            setThemes([
              ...themes,
              {
                id: `theme-${Date.now()}`,
                event: "Event",
                themeName: "Theme",
                description: "",
                imageUrl: "",
              },
            ])
          }
          className="w-full rounded-lg border border-dashed border-[var(--gold)]/40 py-3 text-xs uppercase tracking-wider text-[var(--gold)] hover:bg-[var(--gold)]/5"
        >
          + Add theme
        </button>
      )}
    </div>
  );
}
