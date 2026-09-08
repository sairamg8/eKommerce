/**
 * Raw catalog seed, grouped by leaf-category slug. Kept apart from
 * products.ts so the generator stays readable and this stays editable.
 * Prices are in rupees; the generator converts to paise.
 */
export type Seed = {
  name: string;
  price: number;
  attrs: Record<string, string | number | boolean>;
};

export const PRODUCT_SEED: Record<string, Seed[]> = {
  "electronics-audio": [
    { name: "Aurora ANC Over-Ear Headphones", price: 18999, attrs: { driver: "40mm", anc: true, battery_hrs: 40 } },
    { name: "Pulse Wireless Earbuds Pro", price: 9499, attrs: { driver: "11mm", anc: true, battery_hrs: 28 } },
    { name: "Cadence Bookshelf Speakers", price: 24999, attrs: { power_w: 120, bluetooth: true, pair: true } },
    { name: "Nomad Portable Bluetooth Speaker", price: 4299, attrs: { ip_rating: "IPX7", battery_hrs: 18 } },
    { name: "Studio One USB Microphone", price: 7999, attrs: { pattern: "cardioid", bit_depth: 24 } },
  ],
  "electronics-wearables": [
    { name: "Vertex Smartwatch S3", price: 21999, attrs: { display: "AMOLED", gps: true, battery_hrs: 72 } },
    { name: "Vertex Band Lite", price: 3499, attrs: { display: "LCD", gps: false, battery_hrs: 240 } },
    { name: "Pace Running Watch", price: 15499, attrs: { gps: true, water_resist: "5ATM", battery_hrs: 120 } },
    { name: "Halo Sleep Tracker Ring", price: 27999, attrs: { material: "titanium", battery_hrs: 168 } },
  ],
  "electronics-cameras": [
    { name: "Lumen X20 Mirrorless Body", price: 89999, attrs: { sensor: "APS-C", mp: 26, video: "4K60" } },
    { name: "Lumen 35mm f/1.8 Prime", price: 32999, attrs: { mount: "LX", aperture: "f/1.8" } },
    { name: "Vantage Action Cam 4K", price: 24999, attrs: { video: "4K120", waterproof: true } },
    { name: "Tripod Carbon Traveller", price: 11999, attrs: { material: "carbon", max_load_kg: 12 } },
  ],
  "computers-laptops": [
    { name: "Meridian 14 Ultrabook", price: 114999, attrs: { cpu: "Core Ultra 7", ram_gb: 16, ssd_gb: 512 } },
    { name: "Meridian 16 Creator", price: 189999, attrs: { cpu: "Core Ultra 9", ram_gb: 32, ssd_gb: 1024 } },
    { name: "Forge 15 Gaming Laptop", price: 154999, attrs: { gpu: "RTX 4060", ram_gb: 16, ssd_gb: 1024 } },
    { name: "Nimbus 13 Everyday", price: 62999, attrs: { cpu: "Core 5", ram_gb: 16, ssd_gb: 512 } },
  ],
  "computers-peripherals": [
    { name: "Tactile 75 Mechanical Keyboard", price: 12999, attrs: { switch: "brown", layout: "75%", hotswap: true } },
    { name: "Glide Pro Wireless Mouse", price: 6499, attrs: { dpi: 26000, weight_g: 63 } },
    { name: "Panorama 34in Ultrawide", price: 74999, attrs: { resolution: "3440x1440", hz: 144 } },
    { name: "Clarity 27in 4K Monitor", price: 41999, attrs: { resolution: "3840x2160", hz: 60 } },
    { name: "DockHub 11-in-1 USB-C", price: 8999, attrs: { ports: 11, power_delivery_w: 100 } },
  ],
  "computers-storage": [
    { name: "Vault NVMe SSD 2TB", price: 17999, attrs: { capacity_gb: 2048, read_mbps: 7000 } },
    { name: "Vault Portable SSD 1TB", price: 9999, attrs: { capacity_gb: 1024, interface: "USB 3.2" } },
    { name: "Archive HDD 8TB", price: 15999, attrs: { capacity_gb: 8192, rpm: 7200 } },
  ],
  "home-kitchen-cookware": [
    { name: "Ironclad Cast Iron Skillet 12in", price: 3999, attrs: { material: "cast iron", diameter_cm: 30 } },
    { name: "Chef's Triply Saucepan Set", price: 7499, attrs: { pieces: 3, material: "stainless" } },
    { name: "Damascus 8in Chef Knife", price: 8999, attrs: { steel: "VG-10", layers: 67 } },
    { name: "Nonstick Grill Pan", price: 2799, attrs: { coating: "ceramic", induction: true } },
  ],
  "home-kitchen-appliances": [
    { name: "Brew Precision Coffee Maker", price: 18999, attrs: { capacity_l: 1.5, grinder: true } },
    { name: "Vortex Air Fryer 6L", price: 11499, attrs: { capacity_l: 6, presets: 12 } },
    { name: "Silent Blend Pro Blender", price: 14999, attrs: { power_w: 1400, noise_db: 62 } },
    { name: "SteamPlus Electric Kettle", price: 3299, attrs: { capacity_l: 1.7, temp_control: true } },
  ],
  "home-kitchen-decor": [
    { name: "Lattice Woven Throw", price: 4499, attrs: { material: "cotton", size: "130x170" } },
    { name: "Arc Floor Lamp", price: 12999, attrs: { finish: "brass", bulb: "E27" } },
    { name: "Terra Ceramic Planter Set", price: 2999, attrs: { pieces: 3, drainage: true } },
  ],
  "fashion-men": [
    { name: "Oxford Slim Fit Shirt", price: 2499, attrs: { fabric: "cotton", fit: "slim" } },
    { name: "Traveller Chino Trousers", price: 3299, attrs: { fabric: "stretch twill", fit: "tapered" } },
    { name: "Quilted Bomber Jacket", price: 7999, attrs: { fabric: "nylon", lining: "quilted" } },
  ],
  "fashion-women": [
    { name: "Linen Wrap Midi Dress", price: 4299, attrs: { fabric: "linen", length: "midi" } },
    { name: "Merino Crewneck Sweater", price: 5499, attrs: { fabric: "merino wool", gsm: 240 } },
    { name: "High-Rise Tailored Trousers", price: 3899, attrs: { fabric: "viscose blend", rise: "high" } },
  ],
  "fashion-accessories": [
    { name: "Full-Grain Leather Belt", price: 2299, attrs: { material: "full-grain leather", width_mm: 35 } },
    { name: "Commuter Backpack 22L", price: 6499, attrs: { capacity_l: 22, laptop_in: 16 } },
    { name: "Polarised Aviator Sunglasses", price: 4999, attrs: { lens: "polarised", uv: "UV400" } },
  ],
  "fitness-equipment": [
    { name: "Hex Dumbbell Pair 10kg", price: 4999, attrs: { weight_kg: 10, coating: "rubber" } },
    { name: "Olympic Barbell 20kg", price: 15999, attrs: { weight_kg: 20, knurling: "medium" } },
    { name: "Resistance Band Set", price: 1799, attrs: { pieces: 5, max_resistance_kg: 45 } },
    { name: "Foldable Treadmill T5", price: 54999, attrs: { max_speed_kmh: 16, incline: true } },
    { name: "Yoga Mat Pro 6mm", price: 2499, attrs: { thickness_mm: 6, material: "TPE" } },
  ],
  "fitness-supplements": [
    { name: "Whey Isolate 2kg — Chocolate", price: 4999, attrs: { protein_g: 27, servings: 66 } },
    { name: "Creatine Monohydrate 500g", price: 1899, attrs: { servings: 100, micronised: true } },
    { name: "Daily Multivitamin 90ct", price: 1299, attrs: { servings: 90, vegetarian: true } },
  ],
  "books-technology": [
    { name: "Designing Data-Intensive Applications", price: 1899, attrs: { pages: 616, format: "paperback" } },
    { name: "The Pragmatic Programmer", price: 2299, attrs: { pages: 352, format: "hardcover" } },
    { name: "PostgreSQL Internals", price: 2799, attrs: { pages: 480, format: "paperback" } },
    { name: "System Design Interview Vol.2", price: 1599, attrs: { pages: 320, format: "paperback" } },
  ],
  "books-business": [
    { name: "Zero to One", price: 899, attrs: { pages: 224, format: "paperback" } },
    { name: "The Lean Startup", price: 999, attrs: { pages: 336, format: "paperback" } },
    { name: "Thinking, Fast and Slow", price: 1199, attrs: { pages: 499, format: "paperback" } },
  ],
};
