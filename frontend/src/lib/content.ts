import {
  Anchor, Ship, FileText, ClipboardCheck, Container, Truck, Globe2, Route, Waves, Droplets, Sparkles,
  Cog, Zap, ShoppingBag, Paintbrush, LifeBuoy, Wrench, ShieldCheck, Clock, Users, BadgeCheck, Handshake,
  Headset, Scale, HardHat, PackageCheck, Compass, Building2, Recycle, Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SiteSettings, ServiceOverride } from "./types";

const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
const G = "https://static.prod-images.emergentagent.com/jobs/ffa49224-6598-4b85-b5a3-d900eb10470d/images/";

export const IMG = {
  hero: u("1595587637401-83ff822bd63e", 2000),
  cranes: u("1578575437130-527eed3abbec"),
  aerial: u("1678182451047-196f22a4143e"),
  sunset: u("1554254648-2d58a1bc3fd5", 2000),
  dusk: u("1598193957011-39b9f2916992"),
  engine: u("1652837135894-cd1d7f74588a"),
  control: u("1685720543547-cc4873188c75"),
  electrical: u("1563456019560-2b37aa7ad890"),
  switchgear: u("1558054665-fbe00cd7d920"),
  lifeboat: u("1532528425368-31e68a9665fe"),
  lifebuoy: u("1725281773502-97ff247c8e98"),
  repair: u("1758574697274-ebbbd08ec0d9"),
  chandling: u("1586528116311-ad8dd3c8310d"),
  stores: u("1587293852726-70cdb56c2866"),
  barrels: u("1790655570706-fd0b13a315f1"),
  shipDock: u("1662727247800-00be77e8d7c8"),
  crew: u("1753526372675-7a4e9d148a87"),
  holdWorkers: G + "38735c9419791c76abe019abb88f7fbf06a87c8d3e1662888a2d160a9664ae19.jpeg",
  holdBefore: G + "2786ad9e48e1c4403a1bbcf94d036a8716962dc3a98a97d31cf7c17cbace567e.jpeg",
  holdAfter: G + "244bb9946b38f1ee87a779d481c347a22a230892f6c76abd9e32b063d4807c32.jpeg",
  tank: G + "91bf9784d06bc85284869a8ef2164124561d609efce28f4f5fc379c2b8cbe0d4.jpeg",
};

export const DEFAULT_SETTINGS: SiteSettings = {
  company_name: "ICONIC SHIPPING SERVICES",
  owner: "VIKASH",
  phone: "+91 9712476193",
  whatsapp: "+91 9712476193",
  email: "supply@iconicshipping.org",
  location: "Gandhidham, Gujarat, India",
  address: "Gandhidham, Kutch, Gujarat, India",
  map_query: "Gandhidham, Gujarat, India",
  office_hours: "Mon – Sat, 9:00 AM – 7:00 PM IST",
  hero_title: "Your Trusted Partner in",
  hero_highlight: "Port Clearance & Marine Logistics",
  hero_subtitle:
    "Reliable Port Operations, Professional Marine Logistics, Hold Cleaning & Tank Squeezing Services Across Indian Ports.",
  hero_description:
    "ICONIC SHIPPING SERVICES delivers dependable port clearance, marine logistics and professional vessel cleaning solutions with a commitment to quality, safety and efficient operations.",
  hero_image: "",
  about_text:
    "ICONIC SHIPPING SERVICES, based in Gandhidham, Gujarat, India, is focused on delivering dependable port clearance, marine logistics and vessel cleaning solutions. Our objective is to simplify marine operations through professional coordination, reliable services and customer-focused support.",
  footer_text:
    "Dependable port clearance, marine logistics, marine supply and vessel cleaning support from Gandhidham, Gujarat.",
};

export interface InquiryField {
  key: string;
  label: string;
  placeholder: string;
  options?: string[];
}

export interface ServiceDef {
  slug: string;
  title: string;
  short: string;
  description: string;
  image: string;
  gallery: string[];
  icon: LucideIcon;
  items: string[];
  fields: InquiryField[];
  main?: boolean;
  path: string;
  visible?: boolean;
}

const qty: InquiryField = { key: "quantity", label: "Quantity / Requirements", placeholder: "Enter details" };

export const SERVICES: ServiceDef[] = [
  {
    slug: "port-clearance", main: true, path: "/port-clearance", icon: Anchor,
    title: "Port Clearance & Marine Logistics Services",
    short: "Efficient port operations, vessel coordination, shipping documentation and marine logistics support across Indian ports.",
    description:
      "Your reliable partner for efficient port operations, vessel coordination, shipping documentation and marine logistics support across Indian ports. We coordinate with port authorities, customs, shipping lines and terminal operators so your vessel and cargo move without unnecessary delays.",
    image: IMG.cranes, gallery: [IMG.cranes, IMG.aerial, IMG.dusk, IMG.shipDock],
    items: [
      "Port Clearance Services", "Vessel Arrival & Departure Formalities", "Import & Export Documentation Coordination",
      "Customs Clearance Coordination", "Ship Agency Support", "Vessel Berthing Coordination",
      "Port Dues & Shipping Charges Coordination", "Cargo Handling Coordination", "Container Handling & Transportation",
      "Freight Forwarding Coordination", "Shipping Line Coordination", "Bill of Lading Documentation Support",
      "Transit Cargo & Transshipment Coordination", "Vessel Port Call Coordination", "Marine Logistics Management",
      "Door-to-Door Logistics Coordination",
    ],
    fields: [
      { key: "equipment", label: "Service Needed", placeholder: "e.g. Port clearance, customs coordination", options: [] },
      { key: "eta", label: "Vessel ETA / ETD", placeholder: "Enter ETA / ETD" },
      { key: "cargo", label: "Cargo Type", placeholder: "Enter cargo type" },
      qty,
    ],
  },
  {
    slug: "hold-cleaning", main: true, path: "/hold-cleaning", icon: Sparkles,
    title: "Hold Cleaning & Tank Squeezing",
    short: "Professional vessel hold cleaning and tank squeezing solutions to support safe, efficient and reliable vessel operations.",
    description:
      "Professional vessel hold cleaning and tank squeezing solutions to support safe, efficient and reliable vessel operations. Our teams coordinate cleaning between discharge and loading so your holds and tanks are prepared for the next cargo on schedule.",
    image: IMG.holdWorkers, gallery: [IMG.holdWorkers, IMG.tank, IMG.holdBefore, IMG.holdAfter],
    items: [
      "Cargo Hold Cleaning", "Tank Cleaning", "Tank Squeezing", "Sludge Removal", "Residue Removal",
      "High Pressure Washing", "Cargo Hold Preparation", "Pre-loading Cleaning", "Post-discharge Cleaning",
      "Debris Removal", "Industrial Cleaning Support", "Environmentally Responsible Waste Handling",
    ],
    fields: [
      { key: "equipment", label: "Cleaning Required", placeholder: "e.g. Cargo hold cleaning, tank squeezing" },
      { key: "cargo", label: "Previous / Next Cargo", placeholder: "Enter cargo type" },
      { key: "holds", label: "No. of Holds / Tanks", placeholder: "Enter number" },
      qty,
    ],
  },
  {
    slug: "marine-machinery", path: "/services/marine-machinery", icon: Cog,
    title: "Marine Machinery & Equipment",
    short: "Compressors, oil separators, pumps, motors and spare parts supplied to your vessel's specification.",
    description:
      "Supply coordination for marine machinery and equipment including air compressors, oil separators, pumps, electric motors and engine-room spare parts. Share the maker, model and part numbers and we will source and coordinate delivery to your vessel at port.",
    image: IMG.engine, gallery: [IMG.engine, IMG.control, IMG.shipDock],
    items: ["Air Compressors", "Oil / Water Separators", "Pumps & Spare Parts", "Electric Motors", "Engine Room Spares", "Technical Specification Sourcing"],
    fields: [
      { key: "equipment", label: "Equipment", placeholder: "Compressor / Oil Separator / Pump / Motor / Spares" },
      { key: "specs", label: "Maker / Model / Part No.", placeholder: "Enter technical specifications" },
      qty,
    ],
  },
  {
    slug: "electrical-electronic", path: "/services/electrical-electronic", icon: Zap,
    title: "Electrical & Electronic Equipment",
    short: "Marine cables, switchgear, control panels, navigation equipment and electronic components.",
    description:
      "Supply coordination for shipboard electrical and electronic equipment — marine cables, switchgear, control panels, navigation equipment and electronic components — matched to your vessel's requirements.",
    image: IMG.electrical, gallery: [IMG.electrical, IMG.switchgear, IMG.control],
    items: ["Marine Cables", "Switchgear", "Control Panels", "Navigation Equipment", "Electronic Components", "Lighting & Fittings"],
    fields: [
      { key: "equipment", label: "Equipment", placeholder: "Cables / Switchgear / Control Panel / Navigation / Components" },
      { key: "specs", label: "Specifications / Rating", placeholder: "Enter voltage, size, model" },
      qty,
    ],
  },
  {
    slug: "ship-chandling", path: "/services/ship-chandling", icon: ShoppingBag,
    title: "Ship Chandling & Supplies",
    short: "Deck stores, ship provisions, bonded stores and cabin supplies delivered alongside.",
    description:
      "Ship chandling coordination for deck stores, engine stores, fresh and dry provisions, bonded stores and cabin supplies. Send your requisition list and delivery window and we will coordinate supply at the berth or anchorage.",
    image: IMG.chandling, gallery: [IMG.chandling, IMG.stores, IMG.crew],
    items: ["Deck Stores", "Engine Stores", "Ship Provisions", "Bonded Stores", "Cabin & Galley Supplies", "Safety Stores"],
    fields: [
      { key: "equipment", label: "Supply Type", placeholder: "Deck Stores / Provisions / Bonded Stores" },
      { key: "specs", label: "Item List", placeholder: "Enter items or requisition reference" },
      qty,
    ],
  },
  {
    slug: "marine-consumables", path: "/services/marine-consumables", icon: Droplets,
    title: "Marine Consumables & Fluids",
    short: "Marine paints, lubricating oils, fresh water supply and other consumables.",
    description:
      "Coordination of marine consumables and fluids including marine paints and coatings, lubricating oils, greases, chemicals and fresh water supply to vessels at port.",
    image: IMG.barrels, gallery: [IMG.barrels, IMG.shipDock, IMG.aerial],
    items: ["Marine Paints & Coatings", "Lubricating Oil", "Greases & Hydraulic Oil", "Fresh Water Supply", "Marine Chemicals", "General Consumables"],
    fields: [
      { key: "equipment", label: "Product", placeholder: "Marine Paint / Lube Oil / Fresh Water" },
      { key: "specs", label: "Grade / Brand", placeholder: "Enter grade or brand" },
      qty,
    ],
  },
  {
    slug: "lsa-ffa", path: "/services/lsa-ffa", icon: LifeBuoy,
    title: "LSA/FFA Inspection & Certification",
    short: "Lifeboats, liferafts, fire extinguishers and fire systems — inspection requirement coordination.",
    description:
      "Coordination of life-saving appliance (LSA) and fire-fighting appliance (FFA) inspection requirements — lifeboats, liferafts, fire extinguishers and fixed fire systems — through approved service providers, as per your vessel's survey schedule.",
    image: IMG.lifeboat, gallery: [IMG.lifeboat, IMG.lifebuoy, IMG.crew],
    items: ["Lifeboats & Davits", "Liferafts", "Fire Extinguishers", "Fixed Fire Systems", "Breathing Apparatus", "Inspection Scheduling"],
    fields: [
      { key: "equipment", label: "Equipment", placeholder: "Lifeboat / Liferaft / Extinguishers / Fire System" },
      { key: "specs", label: "Inspection Requirement", placeholder: "Annual / Renewal / Specific requirement" },
      qty,
    ],
  },
  {
    slug: "marine-repair", path: "/services/marine-repair", icon: Wrench,
    title: "Marine Repair & Maintenance",
    short: "Shipboard repairs, machinery repairs and equipment maintenance coordination.",
    description:
      "Coordination of shipboard repairs, machinery repairs and equipment maintenance while your vessel is at port. Share the technical requirement and we will arrange suitable technicians and timelines.",
    image: IMG.repair, gallery: [IMG.repair, IMG.engine, IMG.dusk],
    items: ["Shipboard Repairs", "Machinery Repairs", "Equipment Maintenance", "Steel & Pipe Work", "Electrical Repairs", "Technical Attendance"],
    fields: [
      { key: "equipment", label: "Repair Type", placeholder: "Shipboard / Machinery / Equipment Maintenance" },
      { key: "specs", label: "Technical Requirement", placeholder: "Describe the defect or work" },
      qty,
    ],
  },
  {
    slug: "hold-tank-cleaning", path: "/services/hold-tank-cleaning", icon: Waves,
    title: "Hold Cleaning & Tank Cleaning",
    short: "Cargo hold cleaning and tank cleaning to prepare your vessel for the next cargo.",
    description:
      "Cargo hold cleaning and tank cleaning coordination including residue removal, high pressure washing and debris removal — planned around your cargo type, port and loading schedule.",
    image: IMG.tank, gallery: [IMG.tank, IMG.holdWorkers, IMG.holdAfter],
    items: ["Cargo Hold Cleaning", "Tank Cleaning", "Residue & Sludge Removal", "High Pressure Washing", "Debris Removal", "Pre-loading Preparation"],
    fields: [
      { key: "equipment", label: "Cleaning Required", placeholder: "Cargo Hold Cleaning / Tank Cleaning" },
      { key: "cargo", label: "Cargo Type", placeholder: "Previous / next cargo" },
      qty,
    ],
  },
];

export const SEVEN = SERVICES.filter((s) => !s.main);

export function mergeServices(overrides: ServiceOverride[] | undefined): ServiceDef[] {
  if (!overrides?.length) return SERVICES;
  return SERVICES.map((s) => {
    const o = overrides.find((x) => x.slug === s.slug);
    if (!o) return s;
    return {
      ...s,
      title: o.title || s.title,
      short: o.short || s.short,
      description: o.description || s.description,
      image: o.image || s.image,
      visible: o.visible,
    };
  });
}

export const SPECIALIZED_30: { name: string; icon: LucideIcon }[] = [
  ["Port Clearance Services", ClipboardCheck], ["Import & Export Customs Clearance", FileText], ["Vessel Arrival & Departure Formalities", Ship],
  ["Ship Agency Services", Anchor], ["Marine Logistics & Cargo Coordination", Route], ["Port Documentation & Permit Processing", FileText],
  ["Shipping Line Coordination", Globe2], ["Cargo Loading & Unloading Coordination", PackageCheck], ["Container Handling & Transportation", Container],
  ["Freight Forwarding Services", Truck], ["Import & Export Documentation", FileText], ["Bill of Lading Documentation Support", ClipboardCheck],
  ["Port Dues & Shipping Charges Coordination", Scale], ["Vessel Berthing & Port Call Coordination", Anchor], ["Crew Change & Crew Logistics Assistance", Users],
  ["Ship Spares & Marine Equipment Delivery", Cog], ["Bunker Supply Coordination", Droplets], ["Ship Chandling & Vessel Provisioning", ShoppingBag],
  ["Warehousing & Cargo Storage Coordination", Building2], ["Project Cargo & Heavy-Lift Logistics", HardHat], ["Dangerous Goods Documentation Support", ShieldCheck],
  ["Transit Cargo & Transshipment Coordination", Route], ["Marine Survey & Cargo Inspection Coordination", Compass], ["Port-to-Port Cargo Transportation", Ship],
  ["Door-to-Door Logistics Coordination", Truck], ["Customs Compliance & Regulatory Documentation", BadgeCheck], ["Shipping Documents Verification", FileText],
  ["Empty Container Return Coordination", Container], ["Port Health & Quarantine Formalities Assistance", ShieldCheck], ["End-to-End Marine Supply Chain Management", Globe2],
].map(([name, icon]) => ({ name: name as string, icon: icon as LucideIcon }));

export const WHY_US: { title: string; text: string; icon: LucideIcon }[] = [
  { title: "Professional Service Coordination", text: "One point of contact coordinating port, customs and vendors.", icon: Headset },
  { title: "Reliable Operations", text: "Consistent follow-through from vessel arrival to departure.", icon: Anchor },
  { title: "Quality-Focused Approach", text: "Every job checked against your scope and expectations.", icon: BadgeCheck },
  { title: "Timely Service Execution", text: "Planned around your ETA, berth window and cargo schedule.", icon: Clock },
  { title: "Customer Satisfaction", text: "Clear communication and responsive updates throughout.", icon: Handshake },
  { title: "Competitive Solutions", text: "Transparent quotations tailored to the actual requirement.", icon: Scale },
  { title: "Dedicated Support", text: "Direct access to our team by phone, WhatsApp and email.", icon: Users },
  { title: "Safety-Focused Operations", text: "Safety-conscious working practices on every vessel.", icon: ShieldCheck },
];

export const HOLD_HIGHLIGHTS = [
  { t: "Professional cleaning operations", i: Sparkles },
  { t: "Quality-focused execution", i: BadgeCheck },
  { t: "Safety-conscious working practices", i: HardHat },
  { t: "Timely coordination", i: Clock },
  { t: "Vessel-ready cleaning support", i: Ship },
  { t: "Responsible waste handling", i: Recycle },
  { t: "Debris & residue removal", i: Trash2 },
];

// ---------- contact helpers ----------
export const digits = (p: string) => p.replace(/\D/g, "");
export const telHref = (p: string) => `tel:+${digits(p)}`;
export const waHref = (p: string, text: string) => `https://wa.me/${digits(p)}?text=${encodeURIComponent(text)}`;

export type InquiryValues = Record<string, string>;

const v = (vals: InquiryValues, k: string, ph: string) => (vals[k]?.trim() ? vals[k].trim() : `[${ph}]`);

export function waMessage(s: ServiceDef, vals: InquiryValues = {}, company = "ICONIC SHIPPING SERVICES"): string {
  const lines = [
    `Hello ${company},`,
    "",
    `I would like to enquire about your ${s.title} services.`,
    "",
    `Required Service: ${s.title}`,
    ...s.fields.map((f) => `${f.label}: ${v(vals, f.key, f.placeholder)}`),
    `Vessel Name: ${v(vals, "vessel_name", "Enter vessel name")}`,
    `Vessel Type: ${v(vals, "vessel_type", "Enter vessel type")}`,
    `Vessel Location / Port: ${v(vals, "port", "Enter location")}`,
  ];
  if (vals.description?.trim()) lines.push(`Details: ${vals.description.trim()}`);
  if (vals.name?.trim()) lines.push("", `Name: ${vals.name.trim()}${vals.company ? ` (${vals.company.trim()})` : ""}`);
  if (vals.phone?.trim()) lines.push(`Contact: ${vals.phone.trim()}`);
  if (vals.email?.trim()) lines.push(`Email: ${vals.email.trim()}`);
  if (vals.ref) lines.push(`Website Enquiry Ref: ${vals.ref}`);
  lines.push("", "Please share your quotation, availability and further details.", "", "Thank you.");
  return lines.join("\n");
}

export function mailHref(s: ServiceDef, to: string, vals: InquiryValues = {}, company = "ICONIC SHIPPING SERVICES"): string {
  const subject = `Inquiry – ${s.title} | ${company}`;
  const work = s.fields.filter((f) => f.key !== "quantity").map((f) => vals[f.key]?.trim()).filter(Boolean).join(", ");
  const body = [
    `Dear ${company} Team,`,
    "",
    "Greetings!",
    "",
    `We would like to enquire about your ${s.title} services.`,
    "",
    "Please find our inquiry details below:",
    "",
    `Service Required: ${s.title}`,
    `Vessel Name: ${v(vals, "vessel_name", "Vessel name")}`,
    `Vessel Type: ${v(vals, "vessel_type", "Vessel type")}`,
    `Vessel Location / Port: ${v(vals, "port", "Port / location")}`,
    `Required Equipment / Work: ${work || "[Required equipment / work]"}`,
    `Quantity / Scope of Work: ${v(vals, "quantity", "Quantity / scope")}`,
    `Expected Service Date: ${v(vals, "date", "Expected date")}`,
    ...(vals.description?.trim() ? ["", `Additional Details: ${vals.description.trim()}`] : []),
    ...(vals.ref ? [`Website Enquiry Ref: ${vals.ref}`] : []),
    "",
    "Kindly share your best quotation, availability, delivery schedule and further information.",
    "",
    "We look forward to your response.",
    "",
    "Best Regards,",
    v(vals, "name", "Customer Name"),
    v(vals, "company", "Company Name"),
    v(vals, "phone", "Contact Number"),
    v(vals, "email", "Email Address"),
  ].join("\n");
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const GENERAL_WA = (company: string) =>
  `Hello ${company},\n\nI would like to enquire about your services.\n\nRequired Service: [Enter service]\nVessel Name: [Enter vessel name]\nVessel Location / Port: [Enter location]\nRequirements: [Enter details]\n\nPlease share your quotation, availability and further details.\n\nThank you.`;

export const STATUS_LABEL: Record<string, string> = {
  new: "New", in_review: "In Review", quoted: "Quoted", approved: "Approved", in_progress: "In Progress",
  completed: "Completed", rejected: "Rejected", closed: "Closed",
};
export const STATUS_ORDER = ["new", "in_review", "quoted", "approved", "in_progress", "completed"];

export const serviceTitle = (slug: string) => SERVICES.find((s) => s.slug === slug)?.title ?? slug;
