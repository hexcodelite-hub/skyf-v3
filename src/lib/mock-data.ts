export type Skin = {
  id: string;
  name: string;
  weapon: string;
  rarity: "consumer" | "industrial" | "milspec" | "restricted" | "classified" | "covert" | "contraband";
  price: number;
  gradient: string;
  soldThisMonth: number;
};

export const SKINS: Skin[] = [
  { id: "s1", name: "Dragon Lore", weapon: "AWP", rarity: "covert", price: 25000, gradient: "linear-gradient(135deg,#7a5a1c,#e0b64a,#3a2a08)", soldThisMonth: 3 },
  { id: "s2", name: "Fade", weapon: "Karambit", rarity: "covert", price: 18500, gradient: "linear-gradient(135deg,#ff3d81,#ffb347,#4b2ea0)", soldThisMonth: 5 },
  { id: "s3", name: "Asiimov", weapon: "AK-47", rarity: "covert", price: 4200, gradient: "linear-gradient(135deg,#f4f4f4,#f47521,#1a1a1a)", soldThisMonth: 12 },
  { id: "s4", name: "Neon Rider", weapon: "AK-47", rarity: "covert", price: 3800, gradient: "linear-gradient(135deg,#ff2d95,#00e5ff,#1a0033)", soldThisMonth: 9 },
  { id: "s5", name: "Printstream", weapon: "M4A1-S", rarity: "covert", price: 3500, gradient: "linear-gradient(135deg,#eaeaea,#111,#8a8a8a)", soldThisMonth: 8 },
  { id: "s6", name: "Wildfire", weapon: "Desert Eagle", rarity: "covert", price: 1200, gradient: "linear-gradient(135deg,#ff5a1f,#ffe066,#3d0a00)", soldThisMonth: 14 },
  { id: "s7", name: "Hyper Beast", weapon: "AWP", rarity: "covert", price: 2100, gradient: "linear-gradient(135deg,#00d1b2,#ff2d95,#0a0a2a)", soldThisMonth: 6 },
  { id: "s8", name: "Vulcan", weapon: "AK-47", rarity: "classified", price: 1600, gradient: "linear-gradient(135deg,#0ea5e9,#0f172a,#e2e8f0)", soldThisMonth: 11 },
  { id: "s9", name: "Redline", weapon: "AK-47", rarity: "classified", price: 450, gradient: "linear-gradient(135deg,#1a1a1a,#dc2626,#111)", soldThisMonth: 22 },
  { id: "s10", name: "Cyrex", weapon: "M4A4", rarity: "classified", price: 380, gradient: "linear-gradient(135deg,#0ea5e9,#111,#f1f5f9)", soldThisMonth: 18 },
  { id: "s11", name: "Doppler", weapon: "Butterfly Knife", rarity: "covert", price: 15000, gradient: "linear-gradient(135deg,#8b5cf6,#0ea5e9,#111)", soldThisMonth: 2 },
  { id: "s12", name: "Golden Coil", weapon: "R8 Revolver", rarity: "classified", price: 620, gradient: "linear-gradient(135deg,#eab308,#78350f,#1a1a1a)", soldThisMonth: 7 },
];

export type LeaderboardUser = {
  rank: number;
  kickName: string;
  points: number;
  watchHours: number;
  avatar: string;
};

const NAMES = [
  "cskyf", "PavelCZ", "TomasHrac", "MartinaGG", "JakubStreamer", "LukasCS",
  "PetraGamer", "OndrejPro", "DavidNoScope", "EliskaFrag", "FilipHS", "AdamAce",
  "KarolinaCS", "MilanKick", "VeronikaDust", "RadekMirage", "IvanaNuke", "SimonInferno",
  "NikolaHead", "MichalClutch", "TerezaSpray", "JiriFlick", "KristynaFire", "VojtechBoom",
  "MonikaKill", "VaclavPlant", "AnnaDefuse", "RobertPeek", "JanaSmoke", "PatrikFlash",
  "KaterinaPro", "DominikRush", "SabinaWin", "AlesLeague", "GabrielaClip",
];

export const LEADERBOARD: LeaderboardUser[] = NAMES.map((n, i) => ({
  rank: i + 1,
  kickName: n,
  points: Math.max(50, 45000 - i * (1200 + (i % 5) * 130) - (i * i * 8)),
  watchHours: Math.max(1, 820 - i * 22 - (i % 3) * 5),
  avatar: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(n)}`,
})).map((u, i) => ({ ...u, rank: i + 1 }));

export type Order = {
  id: string;
  buyer: string;
  skin: string;
  weapon: string;
  price: number;
  status: "Processing" | "Sent";
  tradeUrl: string;
  createdAt: string;
};

export const ORDERS: Order[] = [
  { id: "o1", buyer: "PavelCZ", skin: "Asiimov", weapon: "AK-47", price: 4200, status: "Processing", tradeUrl: "https://steamcommunity.com/tradeoffer/new/?partner=123&token=abc", createdAt: "2026-07-01" },
  { id: "o2", buyer: "MartinaGG", skin: "Redline", weapon: "AK-47", price: 450, status: "Sent", tradeUrl: "https://steamcommunity.com/tradeoffer/new/?partner=456&token=def", createdAt: "2026-06-30" },
  { id: "o3", buyer: "TomasHrac", skin: "Hyper Beast", weapon: "AWP", price: 2100, status: "Processing", tradeUrl: "https://steamcommunity.com/tradeoffer/new/?partner=789&token=ghi", createdAt: "2026-07-02" },
  { id: "o4", buyer: "LukasCS", skin: "Wildfire", weapon: "Desert Eagle", price: 1200, status: "Sent", tradeUrl: "https://steamcommunity.com/tradeoffer/new/?partner=012&token=jkl", createdAt: "2026-06-28" },
  { id: "o5", buyer: "DavidNoScope", skin: "Neon Rider", weapon: "AK-47", price: 3800, status: "Processing", tradeUrl: "https://steamcommunity.com/tradeoffer/new/?partner=345&token=mno", createdAt: "2026-07-03" },
];

export type YoutubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  publishedAt: string;
  url: string;
};

export const VIDEOS: YoutubeVideo[] = [
  { id: "v1", title: "1v5 CLUTCH SEZONY — Ancient Ace", thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format", views: "124K", publishedAt: "před 2 dny", url: "https://youtube.com/@skyfcs" },
  { id: "v2", title: "REAGUJU na PRO hráče — Faceit level 10", thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format", views: "89K", publishedAt: "před 5 dny", url: "https://youtube.com/@skyfcs" },
  { id: "v3", title: "NOVÝ OPERATION unboxing — vyplatilo se?", thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&auto=format", views: "156K", publishedAt: "před 1 týdnem", url: "https://youtube.com/@skyfcs" },
  { id: "v4", title: "AWP TIPS — jak trefit každý flick", thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format", views: "203K", publishedAt: "před 2 týdny", url: "https://youtube.com/@skyfcs" },
  { id: "v5", title: "Skyfovo Imperium — 100 000 subs SPECIAL", thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&auto=format", views: "412K", publishedAt: "před 3 týdny", url: "https://youtube.com/@skyfcs" },
];

export const CURRENT_USER = {
  kickName: "PavelCZ",
  discordName: "Pavel#4821",
  tradeUrl: "https://steamcommunity.com/tradeoffer/new/?partner=123&token=abc",
  points: 12450,
  watchHours: 342,
  joinedAt: "2025-03-15",
  inventory: ORDERS.filter((o) => o.buyer === "PavelCZ"),
};

export const SOCIALS = {
  youtube: "https://youtube.com/@skyfcs?si=dov9Mai3n1DFtbbv",
  kick: "https://kick.com/cskyf",
  discord: "https://discord.gg/skyfovo-imperium-1449831783355908109",
  instagram: "https://www.instagram.com/skyfcs2",
};

// Monthly sales history for shop analytics
export type MonthlySale = {
  month: string; // "2026-07"
  label: string; // "Červenec 2026"
  totalRevenue: number;
  bySkin: { skin: string; weapon: string; qty: number }[];
};

export const MONTHLY_SALES: MonthlySale[] = [
  {
    month: "2026-07", label: "Červenec 2026", totalRevenue: 48200,
    bySkin: [
      { skin: "Asiimov", weapon: "AK-47", qty: 12 },
      { skin: "Redline", weapon: "AK-47", qty: 22 },
      { skin: "Hyper Beast", weapon: "AWP", qty: 6 },
      { skin: "Neon Rider", weapon: "AK-47", qty: 9 },
    ],
  },
  {
    month: "2026-06", label: "Červen 2026", totalRevenue: 62100,
    bySkin: [
      { skin: "Wildfire", weapon: "Desert Eagle", qty: 14 },
      { skin: "Printstream", weapon: "M4A1-S", qty: 8 },
      { skin: "Vulcan", weapon: "AK-47", qty: 11 },
      { skin: "Cyrex", weapon: "M4A4", qty: 18 },
    ],
  },
  {
    month: "2026-05", label: "Květen 2026", totalRevenue: 39400,
    bySkin: [
      { skin: "Redline", weapon: "AK-47", qty: 19 },
      { skin: "Golden Coil", weapon: "R8 Revolver", qty: 7 },
      { skin: "Fade", weapon: "Karambit", qty: 1 },
    ],
  },
];

export type AuditLog = {
  id: string;
  date: string;
  actor: string;
  action: string;
  target: string;
  category: "shop" | "order" | "points" | "permission" | "ban";
};

export const AUDIT_LOGS: AuditLog[] = [
  { id: "l1", date: "2026-07-03 14:22", actor: "cskyf", action: "Změnil status objednávky na Sent", target: "Order #o4 · LukasCS", category: "order" },
  { id: "l2", date: "2026-07-03 12:10", actor: "DavidNoScope", action: "Koupil skin", target: "AK-47 Neon Rider — 3800 pts", category: "shop" },
  { id: "l3", date: "2026-07-02 19:05", actor: "cskyf", action: "Přidal body uživateli", target: "PavelCZ +500", category: "points" },
  { id: "l4", date: "2026-07-02 11:47", actor: "TomasHrac", action: "Koupil skin", target: "AWP Hyper Beast — 2100 pts", category: "shop" },
  { id: "l5", date: "2026-07-01 22:33", actor: "cskyf", action: "Udělil admin práva", target: "MartinaGG (shop-only)", category: "permission" },
  { id: "l6", date: "2026-07-01 18:12", actor: "cskyf", action: "Zabanoval uživatele", target: "ToxicPlayer99 (trvale)", category: "ban" },
  { id: "l7", date: "2026-06-30 20:00", actor: "cskyf", action: "Přidal skin do shopu", target: "AK-47 Vulcan — 1600 pts", category: "shop" },
];
