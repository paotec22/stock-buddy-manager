export interface AccessoryItem {
  id: string | number;
  name: string;
  part_number?: string | null;
  category: string;
  compatible_with?: string | null;
  quantity: number;
  unit: string;
  price: number | null; // Can be null - spare parts may not have a specific price
  location: string;
  condition: 'New' | 'Refurbished' | 'Salvaged' | 'OEM';
  notes?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export type NewAccessoryItem = Omit<AccessoryItem, 'id' | 'created_at' | 'updated_at'> & {
  id?: string | number;
};

export const ACCESSORY_CATEGORIES = [
  "All Categories",
  "Curtain Motors & Tracks",
  "Solar & Lighting",
  "Smart Switches & Panels",
  "Cameras & Security",
  "Brackets & Mounts",
  "Cables, Power & Plugs",
  "Fasteners & Hardware",
  "General Spares",
] as const;

export const DEFAULT_ACCESSORIES: AccessoryItem[] = [
  {
    id: "acc-1",
    name: "Telescopic Track Glider Runners (Pack of 20)",
    part_number: "TRK-GLD-20",
    category: "Curtain Motors & Tracks",
    compatible_with: "Telescopic Aluminium Tracks (3m - 6m)",
    quantity: 45,
    unit: "packs",
    price: 3500,
    location: "Ikeja",
    condition: "New",
    notes: "Heavy-duty nylon low-friction rollers with stainless eyelets. Shelf B2.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: "acc-2",
    name: "Smart Curtain Motor Drive Gear Pulley",
    part_number: "MOT-PL-01",
    category: "Curtain Motors & Tracks",
    compatible_with: "Tuya Motorised Curtain Drive (Engine)",
    quantity: 18,
    unit: "pcs",
    price: null, // No specific price!
    location: "Ikeja",
    condition: "New",
    notes: "Replacement motor drive head gear. Variable pricing / warranty replacement.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: "acc-3",
    name: "Heavy-Duty Dual Track Ceiling Brackets",
    part_number: "BRK-CL-02",
    category: "Brackets & Mounts",
    compatible_with: "Double Curtain Tracks (All sizes)",
    quantity: 60,
    unit: "pairs",
    price: 4500,
    location: "Ikeja",
    condition: "New",
    notes: "Powder coated white finish with expansion screws included. Shelf A4.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: "acc-4",
    name: "Replacement RF 433MHz Single-Channel Remote",
    part_number: "RMT-RF-01",
    category: "Curtain Motors & Tracks",
    compatible_with: "Curtain Motors & Roller Shades",
    quantity: 12,
    unit: "pcs",
    price: 6500,
    location: "Ikeja",
    condition: "New",
    notes: "Pre-paired test units available in drawer C1. Uses CR2450 button cell.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "acc-5",
    name: "12V 10Ah LiFePO4 Solar Floodlight Battery Pack",
    part_number: "BAT-SOL-1210",
    category: "Solar & Lighting",
    compatible_with: "200W / 300W Solar Floodlights & Street Lights",
    quantity: 8,
    unit: "pcs",
    price: null, // No specific price!
    location: "Ikeja",
    condition: "New",
    notes: "Built-in BMS protection board. Price quoted on request based on exchange.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "acc-6",
    name: "Solar CCTV Camera Antenna & 2m Extension Cable",
    part_number: "CAM-ANT-02",
    category: "Cameras & Security",
    compatible_with: "4G / WiFi Solar PTZ Cameras",
    quantity: 15,
    unit: "sets",
    price: null, // No specific price!
    location: "Ikeja",
    condition: "New",
    notes: "SMA male connector, weather-sealed base. Bin 5.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "acc-7",
    name: "Curtain Track Steel Wire Timing Belt (per meter)",
    part_number: "BLT-ST-01",
    category: "Curtain Motors & Tracks",
    compatible_with: "Motorised Curtain Tracks",
    quantity: 120,
    unit: "meters",
    price: 1800,
    location: "Ikeja",
    condition: "New",
    notes: "Internal stainless steel core, anti-stretch polyurethane teeth.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "acc-8",
    name: "Wall Mount Brackets for Smart Home Control Panel",
    part_number: "PNL-BRK-86",
    category: "Smart Switches & Panels",
    compatible_with: "4-inch & 8-inch Wall Touchscreens",
    quantity: 25,
    unit: "pcs",
    price: 2200,
    location: "Ikeja",
    condition: "New",
    notes: "Standard 86-type electrical gang box mounting frame.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "acc-9",
    name: "Salvaged Motor Gearbox Transmission Assembly",
    part_number: "SP-SALV-09",
    category: "General Spares",
    compatible_with: "Legacy WiFi Curtain Engines",
    quantity: 4,
    unit: "pcs",
    price: null, // No specific price!
    location: "Ikeja",
    condition: "Salvaged",
    notes: "Tested working from decommissioned systems. For warranty/servicing only.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "acc-10",
    name: "Curtain Track Joint Connectors (Straight & 90° Corner)",
    part_number: "JNT-TRK-01",
    category: "Curtain Motors & Tracks",
    compatible_with: "Modular Aluminium Curtain Tracks",
    quantity: 32,
    unit: "pcs",
    price: 2500,
    location: "Cement",
    condition: "New",
    notes: "Includes locking grub screws and hex key.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: "acc-11",
    name: "100W Solar Panel Replacement Glass & Cell Assembly",
    part_number: "SOL-PNL-100R",
    category: "Solar & Lighting",
    compatible_with: "Integrated Solar Street Lights",
    quantity: 5,
    unit: "pcs",
    price: null, // No specific price!
    location: "Cement",
    condition: "New",
    notes: "Spare panel for cracked glass replacement. Price on request.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "acc-12",
    name: "Curtain Track End Caps with Damping Stopper",
    part_number: "END-CAP-02",
    category: "Curtain Motors & Tracks",
    compatible_with: "Tuya / Dooya Compatible Tracks",
    quantity: 28,
    unit: "pairs",
    price: 1500,
    location: "Uyo",
    condition: "New",
    notes: "Quiet rubber buffer stopper prevents track jumping.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "acc-13",
    name: "3-Pin Heavy Duty Power Terminal Connectors",
    part_number: "CON-3P-HD",
    category: "Cables, Power & Plugs",
    compatible_with: "Motorised Curtain Power Inlets",
    quantity: 50,
    unit: "pcs",
    price: null, // No specific price!
    location: "Uyo",
    condition: "New",
    notes: "Push-fit quick wiring terminals for site installations.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];
