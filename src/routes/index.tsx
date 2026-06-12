import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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

type PayStatus = "paid" | "owed" | "not-due";
type PaidMap = Record<Name, Record<string, PayStatus>>;

const INITIAL_PAID: PaidMap = Object.fromEntries(
  NAMES.map((n) => [n, { "House": "paid", "Boat - $85/pp": "not-due" }])
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
      { time: "12:00 PM", what: "Casey lands at PHL - Isabel's car picks up" },
      { time: "1:00 PM / TBD", what: "Char gets into Wilmington station - Sabrina's car picks up" },
      { time: "4:00 PM", what: "Official check in & Decorating" },
      { time: "4:15 PM", what: "Decorating & Grocery run" },
      { time: "5:30 PM", what: "Get ready - THEME: TEQUILA SUNRISE" },
      { time: "7:00 PM", what: "Dinner in Rehobeth" },
      { time: "9:00 PM", what: "Games at the house….or maybe go out" },
    ],
  },
  {
    date: "Fri, Jul 31",
    label: "Friday",
    blocks: [
      { time: "8:30 AM", what: "Pickleball (optional)" },
      { time: "9:45 AM", what: "Early birds head to beach to set up" },
      { time: "11:00 AM", what: "Sleepy heads join at beach" },
      { time: "1:00 PM", what: "Lunch TBD but beachy" },
      { time: "4:00 PM", what: "Head back to the house" },
      { time: "6:00 PM", what: "Get ready - THEME: BLING BEFORE THE RING" },
      { time: "6:30 PM", what: "Dinner delivered to the house" },
      { time: "7:30 PM", what: "Pregame games" },
      { time: "9:00 PM", what: "Out on the town" },
    ],
  },
  {
    date: "Sat, Aug 1",
    label: "Saturday",
    blocks: [
      { time: "10:00 AM", what: "Brunch + shops in Rehoboth" },
      { time: "1:00 PM", what: "Get ready - THEME: TINIS & BIKINIS" },
      { time: "2:30 PM", what: "Boat trip" },
      { time: "6:00 PM", what: "Straight off the boat into bonfire" },
      { time: "9:00 PM", what: "Games & pjs" },
    ],
  },
  {
    date: "Sun, Aug 2",
    label: "Sunday",
    blocks: [
      { time: "9:00 AM", what: "Pack up and clean" },
      { time: "10:00 AM", what: "Checkout" },
      { time: "10:30 AM", what: "Bye-bye brunch" },
      { time: "12:00 PM", what: "Phoebe / Taylor / Casey need to go" },
      { time: "6:10 PM", what: "LGA — Phoebe's flight" },
      { time: "6:50 PM", what: "LGA — Taylor's flight" },
      { time: "8:15 PM", what: "LGA — Casey's flight" },
    ],
  },
];

const DEFAULT_CARS: { name: string; people: string; leave: string; arrive: string; driver?: string; pickups?: { name: string; time: string }[] }[] = [
  { name: "Sabrina's car", people: "Sabrina, Phoebe, Jane, and picking up Char", leave: "9:00 AM", arrive: "2:30 PM", driver: "Sabrina", pickups: [{ name: "Char", time: "1:00 PM (TBD)" }] },
  { name: "Lara's car", people: "Lara, Jess, and Nicole", leave: "9:00 AM", arrive: "3:00 PM", driver: "Lara" },
  { name: "Isabel's car", people: "Isabel, Kait, Taylor, and picking up Casey", leave: "9:00 AM", arrive: "3:30 PM", driver: "Isabel", pickups: [{ name: "Casey", time: "12:00 PM" }] },
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
    label: "Boat - $85/pp",
    total: 800,
    payer: "Sabrina",
    perPerson: 85,
    splitAmong: [...NAMES],
    note: "$85 due to Sabrina",
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
  const [user, setUser] = useState<Name | "">(() => {
    if (typeof localStorage === "undefined") return "";
    const saved = localStorage.getItem("bach-user");
    return (NAMES as readonly string[]).includes(saved ?? "") ? (saved as Name) : "";
  });
  const setUserPersisted = (name: Name | "") => {
    if (typeof localStorage !== "undefined") localStorage.setItem("bach-user", name);
    setUser(name);
  };
  const [claims, setClaims] = useState<Record<string, Claim[]>>(INITIAL_CLAIMS);
  const [activitySignups, setActivitySignups] = useState<Record<string, Name[]>>({});
  const [tab, setTab] = useState<"details" | "itinerary" | "signup" | "vibes" | "payments">("details");
  const [formFor, setFormFor] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [showNamePicker, setShowNamePicker] = useState(false);
  const [formAmount, setFormAmount] = useState(1);
  const [formNote, setFormNote] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [addItemName, setAddItemName] = useState("");
  const [addItemCategory, setAddItemCategory] = useState<"Bar" | "Beach" | "Kitchen" | "Home" | "Other">("Other");
  const [addItemQty, setAddItemQty] = useState(1);
  const [addItemNote, setAddItemNote] = useState("");
  const [paid, setPaid] = useState<PaidMap>(INITIAL_PAID);
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
      if (data.paid) {
        const loaded = data.paid as Record<string, Record<string, unknown>>;
        const valid: PayStatus[] = ["paid", "owed", "not-due"];
        const merged = Object.fromEntries(
          NAMES.map((n) => {
            const kvEntries = Object.fromEntries(
              Object.entries(loaded[n] ?? {}).filter(([, v]) => valid.includes(v as PayStatus))
            ) as Record<string, PayStatus>;
            return [n, { ...INITIAL_PAID[n], ...kvEntries }];
          })
        ) as PaidMap;
        setPaid(merged);
      }
      if (data.expenses) setExpenses(data.expenses as Expense[]);
      if (data.activitySignups) setActivitySignups(data.activitySignups as Record<string, Name[]>);
    }).catch(() => {});
  }, []);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveContent({
        data: {
          password: "nyler",
          content: { themes, sections, itinerary, cars, houseInfo, claims, paid, expenses, activitySignups },
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
        content: { themes, sections, itinerary, cars, houseInfo, claims: nextClaims, paid, expenses, activitySignups },
      },
    }).catch((err) => console.error("Auto-save claims failed:", err));
  };

  const saveExpenses = (nextExpenses: Expense[]) => {
    setExpenses(nextExpenses);
    saveContent({
      data: {
        password: "nyler",
        content: { themes, sections, itinerary, cars, houseInfo, claims, paid, expenses: nextExpenses, activitySignups },
      },
    }).catch((err) => console.error("Auto-save expenses failed:", err));
  };

  const togglePaid = (n: Name, label: string) => {
    const cycle: PayStatus[] = ["not-due", "owed", "paid"];
    const current: PayStatus = paid[n]?.[label] ?? "owed";
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    const nextPaid = { ...paid, [n]: { ...paid[n], [label]: next } };
    setPaid(nextPaid);
    saveContent({
      data: {
        password: "nyler",
        content: { themes, sections, itinerary, cars, houseInfo, claims, paid: nextPaid, expenses, activitySignups },
      },
    }).catch((err) => console.error("Auto-save paid failed:", err));
  };

  const toggleActivity = (key: string, name: Name) => {
    const current = activitySignups[key] ?? [];
    const next = current.includes(name) ? current.filter((n) => n !== name) : [...current, name];
    const nextSignups = { ...activitySignups, [key]: next };
    setActivitySignups(nextSignups);
    saveContent({
      data: {
        password: "nyler",
        content: { themes, sections, itinerary, cars, houseInfo, claims, paid, expenses, activitySignups: nextSignups },
      },
    }).catch((err) => console.error("Auto-save activity failed:", err));
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

  const openForm = (item: Item) => {
    if (!user) {
      setPendingItemId(item.id);
      setShowNamePicker(true);
      return;
    }
    if (item.qty === "byo") return;
    const current = claims[item.id] ?? [];
    if (typeof item.qty === "number" && current.length >= item.qty) return;
    setFormFor(item.id);
    setFormAmount(1);
    setFormNote("");
  };

  const pickNameAndProceed = (name: Name) => {
    setUserPersisted(name);
    setShowNamePicker(false);
    if (pendingItemId) {
      const allItems = sections.flatMap((s) => s.items);
      const item = allItems.find((i) => i.id === pendingItemId);
      setPendingItemId(null);
      if (item && item.qty !== "byo") {
        const current = claims[item.id] ?? [];
        if (typeof item.qty !== "number" || current.length < item.qty) {
          setFormFor(item.id);
          setFormAmount(1);
          setFormNote("");
        }
      }
    }
  };

  const submitForm = (item: Item) => {
    if (!user) return;
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
    if (!user) { setShowNamePicker(true); return; }
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

  const submitAddItem = () => {
    if (!addItemName.trim()) return;
    if (!user) { setShowNamePicker(true); return; }
    const catToSectionId: Record<string, string> = {
      Bar: "bar", Beach: "beach", Kitchen: "kitchen", Home: "house",
    };
    const targetId = catToSectionId[addItemCategory];
    const id = `custom-${Date.now()}`;
    const newItem: Item = {
      id,
      label: addItemName.trim(),
      qty: addItemQty,
      ...(addItemNote.trim() ? { hint: addItemNote.trim() } : {}),
    };
    const nextSections = sections.map((s) => {
      if (targetId ? s.id === targetId : s === sections[sections.length - 1]) {
        return { ...s, items: [...s.items, newItem] };
      }
      return s;
    });
    if (!targetId) {
      nextSections[nextSections.length - 1] = {
        ...nextSections[nextSections.length - 1],
        items: [...nextSections[nextSections.length - 1].items, newItem],
      };
    }
    setSectionsA(nextSections);
    const additions: Claim[] = Array.from({ length: addItemQty }, () => ({
      name: user as Name,
      ...(addItemNote.trim() ? { note: addItemNote.trim() } : {}),
    }));
    const nextClaims = { ...claims, [id]: additions };
    setClaims(nextClaims);
    saveContent({
      data: {
        password: "nyler",
        content: { themes, sections: nextSections, itinerary, cars, houseInfo, claims: nextClaims, paid, expenses, activitySignups },
      },
    }).catch((err) => console.error("Auto-save custom item failed:", err));
    setShowAddItem(false);
    setAddItemName("");
    setAddItemCategory("Other");
    setAddItemQty(1);
    setAddItemNote("");
    toast.success(`Added "${newItem.label}" and signed you up!`);
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

      {/* Name picker modal */}
      {showNamePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl">
            <h2 className="font-display text-2xl text-foreground">
              <em className="text-[var(--gold)]">Who are you?</em>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick your name to sign up</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {NAMES.map((n) => (
                <button
                  key={n}
                  onClick={() => pickNameAndProceed(n)}
                  className="rounded-full border border-[var(--gold)]/50 px-4 py-2 text-sm text-[var(--gold)] transition hover:bg-[var(--gold)]/10"
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowNamePicker(false); setPendingItemId(null); }}
              className="mt-4 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add custom item modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl">
            <h2 className="font-display text-2xl text-foreground">
              <em className="text-[var(--gold)]">Bring something else</em>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Adding as {user}</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Item name</label>
                <input
                  value={addItemName}
                  onChange={(e) => setAddItemName(e.target.value)}
                  placeholder="e.g. Bluetooth speaker"
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--gold)]"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Category</label>
                <div className="flex flex-wrap gap-2">
                  {(["Bar", "Beach", "Kitchen", "Home", "Other"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setAddItemCategory(cat)}
                      className={`rounded-full border px-3 py-1 text-sm transition ${addItemCategory === cat ? "border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)]" : "border-border text-muted-foreground hover:border-[var(--gold)]/50"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-muted-foreground"># bringing</label>
                <input
                  type="number"
                  min={1}
                  value={addItemQty}
                  onChange={(e) => setAddItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--gold)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Note (optional)</label>
                <input
                  value={addItemNote}
                  onChange={(e) => setAddItemNote(e.target.value)}
                  placeholder="Any details…"
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--gold)]"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={submitAddItem}
                disabled={!addItemName.trim()}
                className="flex-1 rounded-md bg-[var(--gold)] py-2 text-sm font-medium text-[var(--olive-deep)] transition hover:brightness-110 disabled:opacity-40"
              >
                Add &amp; sign up
              </button>
              <button
                onClick={() => { setShowAddItem(false); setAddItemName(""); setAddItemNote(""); }}
                className="rounded-md border border-border bg-[#fef9dd] px-4 py-2 text-sm text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
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
                className="rounded-md border border-border bg-[#fef9dd] px-4 py-2.5 text-xs uppercase tracking-wider text-foreground"
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
          <div className="mx-auto overflow-hidden rounded-2xl bg-card">
            <img
              src="https://lh3.googleusercontent.com/d/1BsZYxyI9m9BUn0wscivBM1sIsEdOkRkp"
              alt="Nicole's Bachelorette"
              className="w-full object-cover"
            />
          </div>
          {/* Name selector */}
          <div className={`mx-auto mt-6 inline-block rounded-xl bg-card px-6 py-4 transition ${user ? "ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-card" : ""}`}>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-muted-foreground">
              I am…
            </label>
            <select
              value={user}
              onChange={(e) => setUserPersisted(e.target.value as Name | "")}
              className="w-full min-w-[200px] rounded-md border border-border bg-[#fef9dd] px-4 py-3 text-base text-foreground outline-none transition focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
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
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
          <TabBtn active={tab === "details"} onClick={() => setTab("details")}>
            Details
          </TabBtn>
          <TabBtn active={tab === "itinerary"} onClick={() => setTab("itinerary")}>
            Itinerary
          </TabBtn>
          <TabBtn active={tab === "vibes"} onClick={() => setTab("vibes")}>
            Vibes
          </TabBtn>
          <TabBtn active={tab === "signup"} onClick={() => setTab("signup")}>
            Item signup
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
            sections={sections}
            onGoToVibes={() => setTab("vibes")}
            onGoToSignup={() => setTab("signup")}
            activitySignups={activitySignups}
            onToggleActivity={toggleActivity}
          />
        )}
        {tab === "itinerary" && (
          <ItineraryTab
            itinerary={itinerary}
            setItinerary={adminMode ? setItineraryA : undefined}
            onGoToVibes={() => setTab("vibes")}
            user={user}
            activitySignups={activitySignups}
            onToggleActivity={toggleActivity}
            cars={cars}
          />
        )}
        {tab === "signup" && (
          <>
            {/* Progress */}
            <div className="mb-10 rounded-lg border border-border bg-card p-5">
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

            {sections.filter((s) => adminMode || s.items.length > 0).map((section, sIdx) => (
              <section key={section.id} className="mb-8 rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-3 bg-[#fef9dd] px-5 py-4">
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
                <ul className="divide-y divide-border">
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

            <button
              onClick={() => {
                if (!user) { setShowNamePicker(true); return; }
                setShowAddItem(true);
              }}
              className="w-full rounded-lg border border-dashed border-[var(--gold)]/40 px-4 py-3 text-xs uppercase tracking-wider text-[var(--gold)] hover:bg-[var(--gold)]/5"
            >
              + Bring something else
            </button>

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
            setExpenses={saveExpenses}
            onToggle={togglePaid}
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
              {othersGrouped.map((g, i) => {
                const uniqueNotes = [...new Set(g.notes)];
                const notePart = uniqueNotes.length > 0 ? uniqueNotes.join(", ") : null;
                return (
                  <span key={i}>
                    {g.name}
                    {g.count > 1 ? ` ×${g.count}` : ""}
                    {notePart && <span className="text-muted-foreground/70"> ({notePart})</span>}
                    {i < othersGrouped.length - 1 || userOnIt ? ", " : ""}
                  </span>
                );
              })}
              {userOnIt && (
                <span>
                  <span className="text-[var(--gold)]">
                    you{userCount > 1 ? ` ×${userCount}` : ""}
                  </span>
                  {(() => {
                    const uniqueUserNotes = [...new Set(userNotes)];
                    return uniqueUserNotes.length > 0
                      ? <span className="text-muted-foreground/70"> ({uniqueUserNotes.join(", ")})</span>
                      : null;
                  })()}
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
                  className="rounded-md border border-border bg-[#fef9dd] px-2.5 py-1.5 text-xs uppercase tracking-wider text-foreground transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
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
                  className="rounded-md border border-border bg-[#fef9dd] px-2.5 py-1.5 text-sm text-foreground hover:border-[var(--gold)] hover:text-[var(--gold)]"
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
                  className="rounded-md border border-border bg-[#fef9dd] px-2.5 py-1.5 text-sm text-foreground hover:border-[var(--gold)] hover:text-[var(--gold)]"
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
              className="rounded-md border border-border bg-[#fef9dd] px-3 py-2 text-xs uppercase tracking-wider text-foreground"
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
            className={`rounded-lg border bg-card p-5 transition ${
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

function AdminPackingList({
  sections,
  claims,
}: {
  sections: Section[];
  claims: Record<string, Claim[]>;
}) {
  const [view, setView] = useState<"by-item" | "by-person">("by-item");

  const copyToClipboard = () => {
    let text = "";
    if (view === "by-item") {
      for (const sec of sections) {
        const lines: string[] = [];
        for (const item of sec.items) {
          const claimList = claims[item.id] ?? [];
          if (item.qty === "byo") {
            lines.push(`  ${item.label} — everyone (BYO)`);
          } else if (claimList.length === 0) {
            lines.push(`  ${item.label} — nobody yet`);
          } else {
            const grouped = claimList.reduce<Record<string, { count: number; note?: string }>>((acc, c) => {
              if (!acc[c.name]) acc[c.name] = { count: 0, note: c.note };
              acc[c.name].count++;
              return acc;
            }, {});
            const who = Object.entries(grouped).map(([n, { count, note }]) => n + (count > 1 ? ` (${count})` : "") + (note ? ` · ${note}` : "")).join(", ");
            lines.push(`  ${item.label} — ${who}`);
          }
        }
        text += `${sec.title}\n${lines.join("\n")}\n\n`;
      }
    } else {
      const allItems = sections.flatMap((s) => s.items);
      const byPerson: Record<string, string[]> = {};
      for (const item of allItems) {
        if (item.qty === "byo") {
          for (const n of NAMES) {
            byPerson[n] = byPerson[n] ?? [];
            byPerson[n].push(`${item.label} (BYO)`);
          }
        } else {
          for (const c of claims[item.id] ?? []) {
            byPerson[c.name] = byPerson[c.name] ?? [];
            byPerson[c.name].push(item.label + (c.note ? ` (${c.note})` : ""));
          }
        }
      }
      for (const n of NAMES) {
        const items = byPerson[n] ?? [];
        text += `${n}\n${items.length ? items.map((i) => `  ${i}`).join("\n") : "  nothing yet"}\n\n`;
      }
    }
    navigator.clipboard.writeText(text.trim()).then(() => toast.success("Copied to clipboard!"));
  };

  const allItems = sections.flatMap((s) => s.items);
  const byPerson: Record<string, { label: string; note?: string }[]> = {};
  for (const item of allItems) {
    if (item.qty === "byo") {
      for (const n of NAMES) {
        byPerson[n] = byPerson[n] ?? [];
        byPerson[n].push({ label: item.label });
      }
    } else {
      for (const c of claims[item.id] ?? []) {
        byPerson[c.name] = byPerson[c.name] ?? [];
        byPerson[c.name].push({ label: item.label, note: c.note });
      }
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-foreground sm:text-4xl">
          <em className="text-[var(--gold)]">Who's bringing what</em>
        </h2>
        <div className="flex gap-2">
          <div className="flex rounded-md border border-border overflow-hidden text-xs uppercase tracking-wider">
            <button
              onClick={() => setView("by-item")}
              className={`px-3 py-1.5 transition ${view === "by-item" ? "bg-[var(--gold)] text-[var(--olive-deep)]" : "bg-background/30 text-muted-foreground hover:text-foreground"}`}
            >By item</button>
            <button
              onClick={() => setView("by-person")}
              className={`px-3 py-1.5 transition border-l border-border ${view === "by-person" ? "bg-[var(--gold)] text-[var(--olive-deep)]" : "bg-background/30 text-muted-foreground hover:text-foreground"}`}
            >By person</button>
          </div>
          <button
            onClick={copyToClipboard}
            className="rounded-md border border-border bg-background/30 px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >Copy</button>
        </div>
      </div>

      {view === "by-item" ? (
        <div className="mt-5 space-y-5">
          {sections.map((sec) => (
            <div key={sec.id}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold-soft)]">{sec.title}</p>
              <ul className="mt-2 divide-y divide-border">
                {sec.items.map((item) => {
                  const claimList = claims[item.id] ?? [];
                  const isByo = item.qty === "byo";
                  return (
                    <li key={item.id} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                      <span className="text-foreground">{item.label}</span>
                      {isByo ? (
                        <span className="text-xs text-[var(--gold-soft)] italic">everyone (BYO)</span>
                      ) : claimList.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">nobody yet</span>
                      ) : (
                        <span className="text-right text-xs text-muted-foreground">
                          {Object.entries(
                            claimList.reduce<Record<string, { count: number; note?: string }>>((acc, c) => {
                              if (!acc[c.name]) acc[c.name] = { count: 0, note: c.note };
                              acc[c.name].count++;
                              return acc;
                            }, {})
                          ).map(([name, { count, note }], i, arr) => (
                            <span key={name}>
                              <span className="text-foreground">{name}</span>
                              {count > 1 && <span className="opacity-60"> ({count})</span>}
                              {note && <span className="opacity-60"> · {note}</span>}
                              {i < arr.length - 1 && ", "}
                            </span>
                          ))}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {NAMES.map((n) => {
            const claimedItems = allItems
              .filter((item) => item.qty !== "byo" && (claims[item.id] ?? []).some((c) => c.name === n))
              .map((item) => ({ label: item.label, note: (claims[item.id] ?? []).find((c) => c.name === n)?.note }));
            const byoItemLabels = allItems.filter((i) => i.qty === "byo");
            return (
              <div key={n} className="rounded-md border border-border bg-background/20 p-3">
                <p className="font-display text-lg italic text-[var(--gold)]">{n}</p>
                {claimedItems.length === 0 && byoItemLabels.length === 0 ? (
                  <p className="mt-1 text-xs italic text-muted-foreground">nothing signed up</p>
                ) : (
                  <ul className="mt-1.5 space-y-0.5">
                    {claimedItems.map((it, i) => (
                      <li key={i} className="text-xs text-foreground">
                        {it.label}{it.note && <span className="opacity-60"> · {it.note}</span>}
                      </li>
                    ))}
                    {byoItemLabels.map((it) => (
                      <li key={it.id} className="text-xs text-muted-foreground italic">{it.label} (BYO)</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
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
  sections,
  onGoToVibes,
  onGoToSignup,
  activitySignups,
  onToggleActivity,
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
  sections: Section[];
  onGoToVibes?: () => void;
  onGoToSignup?: () => void;
  activitySignups?: Record<string, Name[]>;
  onToggleActivity?: (key: string, name: Name) => void;
}) {
  const [selectedGirl, setSelectedGirl] = useState<Name | null>(null);
  const lockedToUser = user !== "" && user !== ADMIN;
  const activeGirl = lockedToUser ? (user as Name) : (selectedGirl ?? (user !== "" ? user as Name : null));
  const adminMode = !!setCars;

  if (activeGirl) {
    const sg = activeGirl;
    const car = cars.find((c) =>
      (c.people ?? "").split(",").map((p) => p.trim()).some((p) => p === sg || p.includes(sg)) ||
      c.driver === sg
    );
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
      for (const c of (claimList ?? [])) {
        if (c.name === sg) {
          if (!itemCounts[itemId]) itemCounts[itemId] = { count: 0, note: c.note };
          itemCounts[itemId].count += 1;
        }
      }
    }
    const allItems = sections.flatMap((s) => s.items);
    const allClaimedItems = Object.entries(itemCounts)
      .filter(([itemId]) => allItems.some((i) => i.id === itemId))
      .map(([itemId, { count, note }]) => ({
        label: allItems.find((i) => i.id === itemId)?.label ?? itemId,
        count,
        note,
      }));
    const defaultAllItems = DEFAULT_SECTIONS.flatMap((s) => s.items);
    const byoItems = defaultAllItems.filter((i) => i.qty === "byo");
    const userExpenses = expenses.filter((e) => (e.splitAmong ?? []).includes(sg));
    const earlyLeavers = ["Phoebe", "Taylor", "Casey"];
    const leavesEarly = earlyLeavers.includes(sg);

    return (
      <div className="space-y-8">
        {!lockedToUser && activeGirl !== user && (
          <button
            onClick={() => setSelectedGirl(null)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-[#fef9dd] px-3 py-2 text-xs uppercase tracking-wider text-foreground transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            ← Back to details
          </button>
        )}

        <div className="text-center">
          <h2 className="font-display inline-block rounded-2xl bg-[#fef9dd] px-8 py-4 text-4xl text-[var(--gold)] sm:text-5xl">{sg}</h2>
        </div>

        {(() => {
          type RideScript = { carName: string; line2: string; line3: string };
          const RIDE_SCRIPTS: Record<string, RideScript> = {
            Sabrina: { carName: "Your car", line2: "Leave by 9:00 AM · Estimated Arrival 2:30 PM", line3: "You are driving Phoebe and Jane then picking up Char on the way" },
            Phoebe:  { carName: "Sabrina's car", line2: "Leave by 9:00 AM · Estimated Arrival 2:30 PM", line3: "Sabrina is driving you and Jane then picking up Char on the way" },
            Jane:    { carName: "Sabrina's car", line2: "Leave by 9:00 AM · Estimated Arrival 2:30 PM", line3: "Sabrina is driving you and Phoebe then picking up Char on the way" },
            Char:    { carName: "Sabrina's car", line2: "Pick-up at 1:00 PM (TBD) · Estimated Arrival 2:30 PM", line3: "Sabrina is driving Phoebe and Jane then picking you up on the way" },
            Lara:    { carName: "Your car", line2: "Leave by 9:00 AM · Estimated Arrival 3:00 PM", line3: "You are driving Jess and Nicole" },
            Jess:    { carName: "Lara's car", line2: "Leave by 9:00 AM · Estimated Arrival 3:00 PM", line3: "Lara is driving you and Nicole" },
            Nicole:  { carName: "Lara's car", line2: "Leave by 9:00 AM · Estimated Arrival 3:00 PM", line3: "Lara is driving you and Jess" },
            Isabel:  { carName: "Your car", line2: "Leave by 9:00 AM · Estimated Arrival 3:30 PM", line3: "You are driving Kait and Taylor then picking up Casey on the way" },
            Kait:    { carName: "Isabel's car", line2: "Leave by 9:00 AM · Estimated Arrival 3:30 PM", line3: "Isabel is driving you and Taylor then picking up Casey on the way" },
            Taylor:  { carName: "Isabel's car", line2: "Leave by 9:00 AM · Estimated Arrival 3:30 PM", line3: "Isabel is driving you and Kait then picking up Casey on the way" },
            Casey:   { carName: "Isabel's car", line2: "Pick-up at 12:00 PM · Estimated Arrival 3:30 PM", line3: "Isabel is driving Kait and Taylor then picking you up on the way" },
          };
          const script = RIDE_SCRIPTS[sg];
          if (!script) return null;
          return (
            <section className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-2xl text-foreground">
                <em className="text-[var(--gold)]">Your ride</em>
              </h3>
              <p className="mt-3 text-sm font-medium text-foreground">{script.carName}</p>
              <p className="text-xs text-muted-foreground">{script.line2}</p>
              <p className="mt-2 text-xs text-muted-foreground">{script.line3}</p>
            </section>
          );
        })()}

        <section className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-2xl text-foreground">
              <em className="text-[var(--gold)]">You're bringing</em>
            </h3>
            {onGoToSignup && (
              <button
                onClick={onGoToSignup}
                className="text-xs uppercase tracking-wider text-[var(--gold)] hover:opacity-70"
              >
                Item sign-up →
              </button>
            )}
          </div>
          {allClaimedItems.length === 0 && byoItems.length === 0 ? (
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
              {byoItems.map((it) => (
                <span
                  key={it.id}
                  className="rounded-full border border-dashed border-[var(--gold-soft)] bg-transparent px-3 py-1.5 text-sm text-[var(--gold-soft)]"
                >
                  {it.label}
                  <span className="ml-1.5 text-[10px] uppercase tracking-wider opacity-60">BYO</span>
                </span>
              ))}
            </div>
          )}
        </section>

        {userExpenses.length > 0 && (
          <section className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display text-2xl text-foreground">
              <em className="text-[var(--gold)]">Payment</em>
            </h3>
            <ul className="mt-3 space-y-2">
              {userExpenses.map((e) => {
                const status: PayStatus = paid[sg]?.[e.label] ?? "owed";
                return (
                  <li key={e.label} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{e.label}</span>
                    {status === "not-due" && (
                      <span className="rounded-full border border-amber-700/40 bg-amber-900/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-amber-400">Not due yet</span>
                    )}
                    {status === "paid" && (
                      <span className="rounded-full border border-green-700/40 bg-green-900/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-green-400">Paid</span>
                    )}
                    {status === "owed" && (
                      <span className="rounded-full border border-border bg-background/30 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Owed</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Owed to {userExpenses[0]?.payer}
            </p>
          </section>
        )}

        <section className="rounded-lg border border-border bg-card p-6">
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
                  {day.blocks.map((b, i) => {
                    const hasTheme = /theme/i.test(b.what);
                    const isOptional = /optional/i.test(b.what);
                    const key = `${day.date}::${b.time}`;
                    const signedUp = activitySignups?.[key] ?? [];
                    const isIn = signedUp.includes(sg);
                    return (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="w-16 shrink-0 tabular-nums text-muted-foreground">{b.time}</span>
                        <div className="flex-1">
                          {hasTheme && onGoToVibes ? (
                            <button onClick={onGoToVibes} className="text-left text-foreground underline decoration-dotted underline-offset-2 hover:opacity-70">
                              {b.what}
                            </button>
                          ) : (
                            <span className="text-foreground">{b.what}</span>
                          )}
                          {isOptional && (
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {onToggleActivity && (
                                <button
                                  onClick={() => onToggleActivity(key, sg)}
                                  className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider transition ${isIn ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]" : "border-border bg-background/30 text-muted-foreground hover:border-[var(--gold)] hover:text-[var(--gold)]"}`}
                                >
                                  {isIn ? "I'm in ✓" : "I'm in!"}
                                </button>
                              )}
                              {signedUp.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {signedUp.map((n) => (
                                    <span key={n} title={n} className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[10px] font-medium text-[var(--gold-soft)]">
                                      {n.slice(0, 2)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
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
      <section className="rounded-lg border border-border bg-card p-6">
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

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-3xl text-foreground sm:text-4xl">
          <em className="text-[var(--gold)]">The girls</em>
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {NAMES.map((n) => (
            <button
              key={n}
              onClick={() => { setUserPersisted(n); setSelectedGirl(n); }}
              className="rounded-full border border-border bg-background/30 px-3 py-1.5 text-sm text-foreground transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {adminMode && (
        <AdminPackingList sections={DEFAULT_SECTIONS} claims={claims} />
      )}

      <section className="rounded-lg border border-border bg-card p-6">
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
  onGoToVibes,
  user,
  activitySignups,
  onToggleActivity,
  cars,
}: {
  itinerary: ItinDay[];
  setItinerary?: (it: ItinDay[]) => void;
  onGoToVibes?: () => void;
  user?: Name | "";
  activitySignups?: Record<string, Name[]>;
  onToggleActivity?: (key: string, name: Name) => void;
  cars?: typeof DEFAULT_CARS;
}) {
  const adminMode = !!setItinerary;
  const dragBlock = useRef<{ dIdx: number; bIdx: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ dIdx: number; bIdx: number } | null>(null);

  const updateDay = (dIdx: number, updated: ItinDay) => {
    if (!setItinerary) return;
    setItinerary(itinerary.map((d, i) => (i === dIdx ? updated : d)));
  };

  const onDragStart = (dIdx: number, bIdx: number) => {
    dragBlock.current = { dIdx, bIdx };
  };

  const onDrop = (dIdx: number, bIdx: number) => {
    if (!setItinerary || !dragBlock.current) return;
    const { dIdx: fromD, bIdx: fromB } = dragBlock.current;
    if (fromD !== dIdx || fromB === bIdx) { dragBlock.current = null; setDragOver(null); return; }
    const blocks = [...itinerary[dIdx].blocks];
    const [moved] = blocks.splice(fromB, 1);
    blocks.splice(bIdx, 0, moved);
    updateDay(dIdx, { ...itinerary[dIdx], blocks });
    dragBlock.current = null;
    setDragOver(null);
  };

  return (
    <div className="space-y-8">
      {itinerary.map((day, dIdx) => (
        <section
          key={day.date}
          className="rounded-lg border border-border bg-card p-6"
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
              <li
                key={bIdx}
                draggable={adminMode}
                onDragStart={() => onDragStart(dIdx, bIdx)}
                onDragOver={(e) => { e.preventDefault(); setDragOver({ dIdx, bIdx }); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => onDrop(dIdx, bIdx)}
                onDragEnd={() => { dragBlock.current = null; setDragOver(null); }}
                className={`flex gap-4 py-3 transition-colors ${adminMode ? "cursor-grab active:cursor-grabbing" : ""} ${dragOver?.dIdx === dIdx && dragOver?.bIdx === bIdx ? "bg-[var(--gold)]/10 rounded" : ""}`}
              >
                {adminMode ? (
                  <>
                    <span className="mt-1 shrink-0 cursor-grab text-[var(--gold)]/40 select-none" title="Drag to reorder">⠿</span>
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
                    <div className="flex-1">
                      {/theme/i.test(b.what) && onGoToVibes ? (
                        <button onClick={onGoToVibes} className="text-left text-sm text-foreground underline decoration-dotted underline-offset-2 hover:opacity-70">
                          {b.what}
                        </button>
                      ) : (
                        <span className="text-sm text-foreground">{b.what}</span>
                      )}
                      {/optional/i.test(b.what) && (() => {
                        const key = `${day.date}::${b.time}`;
                        const signedUp = activitySignups?.[key] ?? [];
                        const isIn = user ? signedUp.includes(user as Name) : false;
                        return (
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {user && user !== "admin" && onToggleActivity && (
                              <button
                                onClick={() => onToggleActivity(key, user as Name)}
                                className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider transition ${isIn ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]" : "border-border bg-background/30 text-muted-foreground hover:border-[var(--gold)] hover:text-[var(--gold)]"}`}
                              >
                                {isIn ? "I'm in ✓" : "I'm in!"}
                              </button>
                            )}
                            {signedUp.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {signedUp.map((n) => (
                                  <span
                                    key={n}
                                    title={n}
                                    className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[10px] font-medium text-[var(--gold-soft)]"
                                  >
                                    {n.slice(0, 2)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
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
          {(() => {
            if (!user || !cars) return null;
            const myCar = cars.find((c) =>
              (c.people ?? "").split(",").map((p) => p.trim()).some((p) => p === user || p.startsWith(user)) ||
              c.driver === user
            );
            const myPickup = (myCar?.pickups ?? []).find((p) => p.name === user && p.day === day.date);
            if (!myPickup) return null;
            return (
              <div className="mt-3 rounded-md border border-[var(--gold)]/30 bg-[#fef9dd] px-3 py-2">
                <p className="text-xs font-medium text-[var(--gold)]">📍 Your pickup: {myPickup.location}</p>
                <p className="text-xs text-muted-foreground">{myPickup.time !== "TBD" ? myPickup.time : "Time TBD — coordinate with your driver"}</p>
              </div>
            );
          })()}
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
      {user && cars && (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="bg-[#fef9dd] px-5 py-4">
            <h2 className="font-display text-3xl text-foreground sm:text-4xl">
              <em className="text-[var(--gold)]">Cars</em>
            </h2>
          </div>
          <div className="divide-y divide-border">
            {cars.map((car) => {
              const segments = car.people.split(",").map((p) => p.trim().replace(/^and\s+/i, ""));
              const pickupNames = segments.filter((p) => /picking up/i.test(p)).map((p) => p.replace(/^picking up\s+/i, "").trim());
              const regularPassengers = segments.filter((p) => !/picking up/i.test(p) && p !== car.driver);
              const isMycar = segments.some((p) => p === user || p.includes(user)) || car.driver === user;
              return (
                <div key={car.name} className={`px-5 py-4 ${isMycar ? "bg-[var(--gold)]/5" : ""}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{car.name}</p>
                    {isMycar && <span className="rounded-full bg-[var(--gold)]/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--gold)]">your car</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">Leave {car.leave} · Arrive {car.arrive}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {car.driver} driving
                    {regularPassengers.length > 0 ? ` · ${regularPassengers.join(", ")}` : ""}
                    {pickupNames.length > 0 ? ` · picking up ${pickupNames.join(", ")}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
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
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Expense>>({});

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
    setNewDueDate("");
    toast.success(`Added ${label}`);
  };

  const removeExpense = (label: string) => {
    if (!confirm(`Delete "${label}"?`)) return;
    setExpenses(expenses.filter((e) => e.label !== label));
  };

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card p-6">
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
                        const inSplit = (e.splitAmong ?? []).includes(n);
                        const status: PayStatus = paid[n]?.[e.label] ?? "owed";
                        if (!inSplit) {
                          return (
                            <td key={e.label} className="border-b border-border px-2 py-2 text-center text-muted-foreground/40">—</td>
                          );
                        }
                        return (
                          <td key={e.label} className="border-b border-border px-2 py-2 text-center">
                            {isAdmin ? (
                              <button
                                onClick={() => onToggle(n, e.label)}
                                className={`inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded border text-xs transition hover:border-[var(--gold)] ${
                                  status === "paid" ? "border-green-700/50 bg-green-900/30 text-green-400" :
                                  status === "not-due" ? "border-amber-700/50 bg-amber-900/20 text-amber-400" :
                                  "border-border bg-background/30 text-muted-foreground"
                                }`}
                                title={status}
                              >
                                {status === "paid" ? "✓" : status === "not-due" ? "–" : ""}
                              </button>
                            ) : (
                              <span className={`text-[10px] font-medium ${
                                status === "paid" ? "text-green-400" :
                                status === "not-due" ? "text-amber-400" :
                                "text-muted-foreground"
                              }`}>
                                {status === "paid" ? "✓" : status === "not-due" ? "–" : "·"}
                              </span>
                            )}
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
                      const status: PayStatus = paid[n]?.[e.label] ?? "owed";
                      return (
                        <li key={e.label} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {e.label}
                            <span className="ml-2 text-xs tabular-nums text-[var(--gold-soft)]">${e.perPerson}</span>
                          </span>
                          {isAdmin ? (
                            <button
                              onClick={() => onToggle(n, e.label)}
                              className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider transition hover:border-[var(--gold)] ${
                                status === "paid" ? "border-green-700/40 bg-green-900/20 text-green-400" :
                                status === "not-due" ? "border-amber-700/40 bg-amber-900/20 text-amber-400" :
                                "border-border bg-background/30 text-muted-foreground"
                              }`}
                            >
                              {status === "paid" ? "Paid" : status === "not-due" ? "Not due yet" : "Owed"}
                            </button>
                          ) : (
                            <span className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                              status === "paid" ? "border-green-700/40 bg-green-900/20 text-green-400" :
                              status === "not-due" ? "border-amber-700/40 bg-amber-900/20 text-amber-400" :
                              "border-border bg-background/30 text-muted-foreground"
                            }`}>
                              {status === "paid" ? "Paid" : status === "not-due" ? "Not due yet" : "Owed"}
                            </span>
                          )}
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

      <section className="rounded-lg border border-border bg-card p-6">
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
                className="rounded-md border border-border bg-[#fef9dd] px-3 py-2 text-xs uppercase tracking-wider text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <ul className="mt-4 divide-y divide-border">
          {expenses.map((e) => {
            const isEditing = editingLabel === e.label;
            const ef = editFields;
            const editSplit = (ef.splitAmong ?? e.splitAmong) as Name[];
            const editTotal = ef.total ?? e.total;
            const editPerPerson = editSplit.length > 0
              ? Math.round((editTotal / editSplit.length) * 100) / 100
              : 0;
            return (
              <li key={e.label} className="py-3 text-sm">
                {isEditing ? (
                  <div className="space-y-3 rounded-md border border-[var(--gold)]/30 bg-background/60 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Label</label>
                        <input value={ef.label ?? e.label} onChange={(ev) => setEditFields({ ...ef, label: ev.target.value })}
                          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-[var(--gold)]" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total ($)</label>
                        <input type="number" min={0} value={editTotal || ""} onChange={(ev) => setEditFields({ ...ef, total: parseFloat(ev.target.value) || 0 })}
                          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-[var(--gold)]" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Paid by</label>
                        <select value={ef.payer ?? e.payer} onChange={(ev) => setEditFields({ ...ef, payer: ev.target.value })}
                          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-[var(--gold)]">
                          {NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2 text-xs text-muted-foreground">Per person: ${editPerPerson.toFixed(2)}</div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Split among ({editSplit.length})</label>
                      <div className="flex flex-wrap gap-1.5">
                        {NAMES.map((n) => {
                          const on = editSplit.includes(n);
                          return (
                            <button key={n} type="button"
                              onClick={() => setEditFields({ ...ef, splitAmong: on ? editSplit.filter((x) => x !== n) : [...editSplit, n] })}
                              className={`rounded-full border px-2.5 py-1 text-xs transition ${on ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]" : "border-border bg-background/30 text-muted-foreground"}`}
                            >{n}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setExpenses(expenses.map((x) => x.label === e.label ? { ...e, ...ef, perPerson: editPerPerson } : x));
                          setEditingLabel(null);
                          setEditFields({});
                        }}
                        className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs uppercase tracking-wider text-[var(--olive-deep)]"
                      >Save</button>
                      <button onClick={() => { setEditingLabel(null); setEditFields({}); }}
                        className="rounded-md border border-border bg-[#fef9dd] px-3 py-1.5 text-xs uppercase tracking-wider text-foreground"
                      >Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-foreground">{e.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ${e.total} · ${e.perPerson}/person · {e.splitAmong.length} people · paid by {e.payer}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <button onClick={() => { setEditingLabel(e.label); setEditFields({}); }}
                        className="text-xs text-muted-foreground hover:text-[var(--gold)]">Edit</button>
                      <button onClick={() => removeExpense(e.label)}
                        className="text-xs text-muted-foreground hover:text-red-400">Delete</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
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
        <section key={theme.id} className="rounded-lg border border-border bg-card p-6">
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
