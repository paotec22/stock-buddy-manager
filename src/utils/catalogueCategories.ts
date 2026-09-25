import React from "react";
import {
  Blinds,
  ToggleLeft,
  Lightbulb,
  ShieldCheck,
  Router,
  Wrench,
  Package,
  LucideIcon,
} from "lucide-react";
import { InventoryItem } from "./inventoryUtils";

export type CategoryId =
  | "all"
  | "curtains_tracks"
  | "switches_panels"
  | "lighting_solar"
  | "security_access"
  | "hubs_power"
  | "hardware_accessories"
  | "general_products";

export interface ProductCategory {
  id: CategoryId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  badgeClass: string;
  pillActiveClass: string;
  accentBorder: string;
  accentColor: string;
  keywords: string[];
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: "curtains_tracks",
    name: "Curtains & Window Automation",
    shortName: "Curtains & Tracks",
    tagline: "Automated Motors, Tracks & Window Shades",
    description:
      "Motorized curtain tracks, smart tubular motors, telescopic rails, roller blinds, gliders, and drapery automation.",
    icon: Blinds,
    badgeClass: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
    pillActiveClass: "bg-sky-600 text-white shadow-sm font-semibold border-sky-600",
    accentBorder: "border-sky-500/30 dark:border-sky-500/20",
    accentColor: "text-sky-600 dark:text-sky-400",
    keywords: [
      "curtain",
      "track",
      "motor",
      "tubular",
      "roller",
      "blind",
      "shade",
      "drapery",
      "rail",
      "glider",
      "runner",
      "pulley",
      "belt",
      "somfy",
      "dooya",
      "transmission",
      "curtains",
      "tracks",
    ],
  },
  {
    id: "switches_panels",
    name: "Smart Switches & Touch Panels",
    shortName: "Smart Switches",
    tagline: "Wall Switches, Touch Panels & Dimmers",
    description:
      "Luxury tempered glass touch switches, multi-gang wireless panels, smart dimmers, and DIN-rail breakers.",
    icon: ToggleLeft,
    badgeClass: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
    pillActiveClass: "bg-indigo-600 text-white shadow-sm font-semibold border-indigo-600",
    accentBorder: "border-indigo-500/30 dark:border-indigo-500/20",
    accentColor: "text-indigo-600 dark:text-indigo-400",
    keywords: [
      "switch",
      "switches",
      "touch switch",
      "gang",
      "dimmer",
      "dimming",
      "touch panel",
      "wall switch",
      "scene",
      "breaker",
      "relay",
      "kinetic",
      "push button",
      "wall panel",
      "gang switch",
    ],
  },
  {
    id: "lighting_solar",
    name: "Smart Lighting & Solar Solutions",
    shortName: "Lighting & Solar",
    tagline: "LED Strips, Architectural Lights & Solar",
    description:
      "Smart architectural lighting, RGB/CCT LED strip lights, smart bulbs, solar floodlights, street lamps, and power drivers.",
    icon: Lightbulb,
    badgeClass: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    pillActiveClass: "bg-amber-600 text-white shadow-sm font-semibold border-amber-600",
    accentBorder: "border-amber-500/30 dark:border-amber-500/20",
    accentColor: "text-amber-600 dark:text-amber-400",
    keywords: [
      "light",
      "lights",
      "lighting",
      "lamp",
      "bulb",
      "led",
      "strip",
      "downlight",
      "spotlight",
      "solar",
      "floodlight",
      "ambient",
      "chandelier",
      "driver",
      "cob",
      "neon",
      "flood",
      "fixture",
    ],
  },
  {
    id: "security_access",
    name: "Security, Cameras & Smart Locks",
    shortName: "Security & Locks",
    tagline: "Biometric Locks, CCTV & Alarm Sensors",
    description:
      "Smart biometric door locks, video doorbells, PTZ cameras, motion sensors, magnetic door contacts, and alarm sirens.",
    icon: ShieldCheck,
    badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    pillActiveClass: "bg-emerald-600 text-white shadow-sm font-semibold border-emerald-600",
    accentBorder: "border-emerald-500/30 dark:border-emerald-500/20",
    accentColor: "text-emerald-600 dark:text-emerald-400",
    keywords: [
      "lock",
      "door lock",
      "camera",
      "cctv",
      "doorbell",
      "bell",
      "pir",
      "sensor",
      "detector",
      "siren",
      "alarm",
      "fingerprint",
      "keypad",
      "access",
      "intercom",
      "surveillance",
      "deadbolt",
    ],
  },
  {
    id: "hubs_power",
    name: "Smart Hubs, Gateways & Power",
    shortName: "Hubs & Power",
    tagline: "Zigbee Gateways, Smart Sockets & Remotes",
    description:
      "Central Zigbee/Matter gateways, smart WiFi plugs, smart power strips, universal IR/RF blasters, and energy monitors.",
    icon: Router,
    badgeClass: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30",
    pillActiveClass: "bg-purple-600 text-white shadow-sm font-semibold border-purple-600",
    accentBorder: "border-purple-500/30 dark:border-purple-500/20",
    accentColor: "text-purple-600 dark:text-purple-400",
    keywords: [
      "gateway",
      "gateways",
      "hub",
      "bridge",
      "zigbee",
      "matter",
      "socket",
      "plug",
      "power strip",
      "extension",
      "remote",
      "ir blaster",
      "rf",
      "repeater",
      "tuya hub",
      "smart plug",
      "adapter plug",
    ],
  },
  {
    id: "hardware_accessories",
    name: "Accessories, Mounts & Hardware",
    shortName: "Hardware & Mounts",
    tagline: "Mounting Brackets, Cabling & Spare Parts",
    description:
      "Heavy-duty ceiling/wall brackets, power supplies, connecting cables, fasteners, adapters, and genuine spare parts.",
    icon: Wrench,
    badgeClass: "bg-teal-500/10 text-teal-700 border-teal-500/20 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30",
    pillActiveClass: "bg-teal-600 text-white shadow-sm font-semibold border-teal-600",
    accentBorder: "border-teal-500/30 dark:border-teal-500/20",
    accentColor: "text-teal-600 dark:text-teal-400",
    keywords: [
      "bracket",
      "brackets",
      "mount",
      "mounting",
      "cable",
      "wire",
      "cord",
      "power supply",
      "adapter",
      "connector",
      "screw",
      "fastener",
      "hardware",
      "spare",
      "battery",
      "coupler",
      "clamp",
    ],
  },
  {
    id: "general_products",
    name: "General Smart Products",
    shortName: "Other Products",
    tagline: "Smart Home Hardware & Miscellaneous",
    description:
      "Additional lifestyle automation hardware, smart devices, and uncategorized inventory.",
    icon: Package,
    badgeClass: "bg-slate-500/10 text-slate-700 border-slate-500/20 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
    pillActiveClass: "bg-slate-700 text-white shadow-sm font-semibold border-slate-700",
    accentBorder: "border-slate-500/30 dark:border-slate-500/20",
    accentColor: "text-slate-600 dark:text-slate-400",
    keywords: [],
  },
];

const CATEGORY_MAP = new Map<CategoryId, ProductCategory>(
  PRODUCT_CATEGORIES.map((c) => [c.id, c])
);

export const DEFAULT_CATEGORY = PRODUCT_CATEGORIES[PRODUCT_CATEGORIES.length - 1]; // general_products

/**
 * Intelligently classify an inventory product into a relatable smart home category.
 */
export function getProductCategory(
  item: InventoryItem | { "Item Description"?: string; category?: string; features?: string[] | null }
): ProductCategory {
  // 1. Direct category property if present
  if ("category" in item && typeof item.category === "string" && item.category.trim()) {
    const rawCat = item.category.toLowerCase().trim();
    for (const cat of PRODUCT_CATEGORIES) {
      if (
        cat.name.toLowerCase() === rawCat ||
        cat.shortName.toLowerCase() === rawCat ||
        cat.id.toLowerCase() === rawCat
      ) {
        return cat;
      }
    }
  }

  // 2. Features tag (e.g. features: ["category: Curtain Motors & Tracks"])
  if (Array.isArray(item.features)) {
    for (const f of item.features) {
      if (typeof f === "string") {
        const lower = f.toLowerCase();
        if (lower.startsWith("category:") || lower.startsWith("cat:")) {
          const val = lower.split(":")[1]?.trim() || "";
          for (const cat of PRODUCT_CATEGORIES) {
            if (cat.name.toLowerCase().includes(val) || cat.shortName.toLowerCase().includes(val)) {
              return cat;
            }
          }
        }
      }
    }
  }

  // 3. Keyword matching on Item Description
  const desc = (item["Item Description"] || "").toLowerCase();

  // Multi-word / specific keyword match check first
  for (const cat of PRODUCT_CATEGORIES) {
    if (cat.id === "general_products") continue;
    for (const kw of cat.keywords) {
      // If keyword has spaces or is longer, match exact substring
      if (desc.includes(kw)) {
        return cat;
      }
    }
  }

  return DEFAULT_CATEGORY;
}

export interface CategoryGroup {
  category: ProductCategory;
  items: InventoryItem[];
}

/**
 * Groups an array of inventory items by categories.
 * Preserves the order defined in PRODUCT_CATEGORIES.
 */
export function groupItemsByCategory(items: InventoryItem[]): CategoryGroup[] {
  const groups = new Map<CategoryId, InventoryItem[]>();

  for (const cat of PRODUCT_CATEGORIES) {
    groups.set(cat.id, []);
  }

  for (const item of items) {
    const cat = getProductCategory(item);
    const list = groups.get(cat.id) || [];
    list.push(item);
    groups.set(cat.id, list);
  }

  const result: CategoryGroup[] = [];
  for (const cat of PRODUCT_CATEGORIES) {
    const catItems = groups.get(cat.id) || [];
    if (catItems.length > 0) {
      result.push({
        category: cat,
        items: catItems,
      });
    }
  }

  return result;
}

/**
 * Returns total counts per category given a list of items.
 */
export function getCategoryCounts(
  items: InventoryItem[]
): Record<CategoryId | "all", number> {
  const counts: Record<string, number> = { all: items.length };

  for (const cat of PRODUCT_CATEGORIES) {
    counts[cat.id] = 0;
  }

  for (const item of items) {
    const cat = getProductCategory(item);
    counts[cat.id] = (counts[cat.id] || 0) + 1;
  }

  return counts as Record<CategoryId | "all", number>;
}
