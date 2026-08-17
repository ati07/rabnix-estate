// Demo/placeholder content for the portal-style landing page (projects, agents, guides, insights,
// testimonials). This is intentionally FAKE data to make the page look "full" like MagicBricks/
// 99acres for demos — it is NOT wired to the DB. Delete this module + its sections to strip the
// page back to real inventory only. Nothing here should ever drive a transaction.

// ── Deterministic gradient thumbnails (no external images) ────────────────────
// A small palette; a stable hash of the seed picks one, so the same card always gets the same look.
const GRADIENTS: [string, string][] = [
  ["#0e9f6e", "#0bbd83"],
  ["#2563eb", "#38bdf8"],
  ["#7c3aed", "#c084fc"],
  ["#db2777", "#fb7185"],
  ["#ea580c", "#fbbf24"],
  ["#0891b2", "#22d3ee"],
  ["#4f46e5", "#818cf8"],
  ["#15803d", "#84cc16"],
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function thumbGradient(seed: string): string {
  const [a, b] = GRADIENTS[hash(seed) % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export const PROPERTY_TYPE_ICON: Record<string, string> = {
  apartment: "🏢",
  independent_house: "🏠",
  villa: "🏡",
  plot: "🌳",
  commercial: "🏬",
  pg: "🛏️",
  project: "🏗️",
};

// ── Dummy datasets (city name interpolated at call time) ──────────────────────
export type DemoProject = {
  id: string;
  name: string;
  builder: string;
  locality: string;
  priceRange: string;
  config: string;
  tag: string;
};

export function demoProjects(city: string): DemoProject[] {
  return [
    { id: "p1", name: "Gaursons Riverfront", builder: "Gaursons India", locality: "Gomti Nagar", priceRange: "₹68 L – 1.4 Cr", config: "2, 3 BHK Apartments", tag: "New Launch" },
    { id: "p2", name: "Eldeco Green Meadows", builder: "Eldeco Group", locality: "Vibhuti Khand", priceRange: "₹95 L – 2.1 Cr", config: "3, 4 BHK Apartments", tag: "Ready to Move" },
    { id: "p3", name: "Omaxe Grandwoods", builder: "Omaxe Ltd", locality: "Sultanpur Road", priceRange: "₹52 L – 88 L", config: "2, 3 BHK Apartments", tag: "Premium" },
    { id: "p4", name: "Shalimar Oneworld", builder: "Shalimar Corp", locality: "Vipul Khand", priceRange: "₹1.1 – 3.2 Cr", config: "3, 4 BHK Villas", tag: "Assured Returns" },
    { id: "p5", name: "Ansal Sushant Golf City", builder: "Ansal API", locality: "Shaheed Path", priceRange: "₹45 L – 1.2 Cr", config: "Plots & Villas", tag: "Gated" },
    { id: "p6", name: "Rohtas Presidential", builder: "Rohtas Group", locality: "Hazratganj", priceRange: "₹1.4 – 2.6 Cr", config: "3, 4 BHK Apartments", tag: "Luxury" },
  ].map((p) => ({ ...p, locality: `${p.locality}, ${city}` }));
}

export type DemoAgent = {
  id: string;
  name: string;
  agency: string;
  deals: number;
  locality: string;
  rating: number;
};

export function demoAgents(city: string): DemoAgent[] {
  return [
    { id: "a1", name: "Rahul Verma", agency: "Verma Realty", deals: 128, locality: "Gomti Nagar", rating: 4.8 },
    { id: "a2", name: "Sneha Kapoor", agency: "Nest Advisors", deals: 96, locality: "Hazratganj", rating: 4.9 },
    { id: "a3", name: "Imran Khan", agency: "Prime Homes", deals: 74, locality: "Aligang", rating: 4.7 },
    { id: "a4", name: "Priya Singh", agency: "Urban Roots", deals: 152, locality: "Indira Nagar", rating: 4.9 },
    { id: "a5", name: "Arjun Mehta", agency: "Skyline Estates", deals: 61, locality: "Vibhuti Khand", rating: 4.6 },
  ].map((a) => ({ ...a, locality: `${a.locality}, ${city}` }));
}

export type DemoArticle = { id: string; title: string; category: string; readMins: number };

export const demoArticles: DemoArticle[] = [
  { id: "g1", title: "Home loan interest rates in 2026: what buyers should know", category: "Finance", readMins: 6 },
  { id: "g2", title: "Registration & stamp duty charges, explained simply", category: "Legal", readMins: 8 },
  { id: "g3", title: "Renting vs buying: a first-timer's honest math", category: "Advice", readMins: 5 },
  { id: "g4", title: "Checklist: 12 things to verify before you pay a token", category: "Buying Guide", readMins: 7 },
  { id: "g5", title: "Vaastu myths that quietly inflate property prices", category: "Opinion", readMins: 4 },
];

export type DemoStat = { label: string; value: string; sub: string };

export function demoInsights(city: string): DemoStat[] {
  return [
    { label: `Avg. 2 BHK price in ${city}`, value: "₹62 L", sub: "▲ 4.2% YoY" },
    { label: "Avg. rent (2 BHK)", value: "₹18,500/mo", sub: "▲ 6.1% YoY" },
    { label: "Properties for sale", value: "12,480", sub: "across the city" },
    { label: "Avg. price / sqft", value: "₹5,730", sub: "▲ 2.8% YoY" },
  ];
}

export type DemoRate = { locality: string; rate: string; trend: string };

export function demoRates(city: string): DemoRate[] {
  return [
    { locality: "Gomti Nagar", rate: "₹6,900", trend: "▲ 5.1%" },
    { locality: "Hazratganj", rate: "₹8,450", trend: "▲ 3.4%" },
    { locality: "Indira Nagar", rate: "₹5,200", trend: "▲ 2.0%" },
    { locality: "Aliganj", rate: "₹4,850", trend: "▲ 1.6%" },
    { locality: "Vibhuti Khand", rate: "₹7,300", trend: "▲ 4.7%" },
  ].map((r) => ({ ...r, locality: `${r.locality}, ${city}` }));
}

export type DemoTestimonial = { id: string; name: string; role: string; quote: string };

export const demoTestimonials: DemoTestimonial[] = [
  { id: "t1", name: "Ananya R.", role: "Bought a 2 BHK", quote: "Every listing I saw was real — no broker called me pretending to be the owner. Found my flat in 3 weeks." },
  { id: "t2", name: "Vikram S.", role: "Rented out a flat", quote: "Listed for free and got genuine enquiries the same day. The response-rate tracking kept me honest too." },
  { id: "t3", name: "Fatima N.", role: "First-time buyer", quote: "The verified badge and report button gave me the confidence to shortlist without visiting 20 places." },
];

export const demoLoanBanks: string[] = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB", "Bank of Baroda"];

// ── Property-detail (PDP) demo data ───────────────────────────────────────────
// Icons for amenities; unknown slugs fall back to DEFAULT_AMENITY_ICON.
export const AMENITY_ICON: Record<string, string> = {
  parking: "🅿️",
  lift: "🛗",
  power_backup: "🔌",
  security: "🛡️",
  gym: "🏋️",
  swimming_pool: "🏊",
  garden: "🌳",
  club_house: "🏛️",
  play_area: "🛝",
  water_supply: "🚰",
  gas_pipeline: "🔥",
  wifi: "📶",
  cctv: "📹",
  fire_safety: "🧯",
  air_conditioning: "❄️",
  intercom: "☎️",
};
export const DEFAULT_AMENITY_ICON = "✅";

// When a listing has no amenities recorded, show these so the section never looks bare (DEMO).
export const DEMO_DEFAULT_AMENITIES = ["parking", "lift", "power_backup", "security", "water_supply", "cctv"];

export type DemoAttr = { label: string; value: string };

// Extra "More details" attributes 99acres shows that our schema doesn't store — fabricated but
// deterministic per listing (DEMO). Swap for real fields once captured at posting time.
export function demoPropertyExtras(seed: string): DemoAttr[] {
  const pick = <T,>(arr: T[], salt: number) => arr[(hash(seed) + salt) % arr.length];
  return [
    { label: "Facing", value: pick(["East", "West", "North", "North-East", "South-East"], 1) },
    { label: "Age of construction", value: pick(["New", "0-1 years", "1-5 years", "5-10 years"], 2) },
    { label: "Parking", value: pick(["1 Covered", "2 Covered", "1 Open", "Open + Covered"], 3) },
    { label: "Water availability", value: "24 Hours Available" },
    { label: "Power backup", value: pick(["Full", "Partial", "Full"], 4) },
    { label: "Overlooking", value: pick(["Garden / Park", "Main Road", "Club", "Pool"], 5) },
    { label: "Flooring", value: pick(["Vitrified", "Marble", "Ceramic", "Wooden"], 6) },
    { label: "Balconies", value: pick(["1", "2", "2", "3"], 7) },
  ];
}

export type DemoReviewBar = { label: string; score: number };
export type DemoLocalityReview = { rating: number; count: number; bars: DemoReviewBar[] };

export function demoLocalityReview(seed: string): DemoLocalityReview {
  const jitter = (base: number, salt: number) => Math.round((base + ((hash(seed) + salt) % 10) / 10) * 10) / 10;
  return {
    rating: 4.1,
    count: 40 + (hash(seed) % 120),
    bars: [
      { label: "Connectivity", score: jitter(3.8, 1) },
      { label: "Safety", score: jitter(3.9, 2) },
      { label: "Environment", score: jitter(3.7, 3) },
      { label: "Lifestyle", score: jitter(3.6, 4) },
      { label: "Value for money", score: jitter(3.8, 5) },
    ],
  };
}

export type DemoResidentReview = { id: string; name: string; tenure: string; rating: number; text: string };

export const demoResidentReviews: DemoResidentReview[] = [
  { id: "rv1", name: "Sandeep M.", tenure: "Owner · 3+ years", rating: 4.5, text: "Peaceful, well-connected area with daily-needs shops within walking distance. Water and power supply are reliable." },
  { id: "rv2", name: "Priya K.", tenure: "Rented · 2 years", rating: 4.0, text: "Good for families — parks nearby and safe for kids in the evening. Auto/cab availability could be better at night." },
  { id: "rv3", name: "Imran S.", tenure: "Lived · 5+ years", rating: 4.2, text: "Great schools and hospitals close by. Traffic on the main road during peak hours is the only downside." },
];
