// Hand-written mirrors of backend/models/schemas.py — keep in sync.
export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff" | "customer";
  company: string;
  phone: string;
  whatsapp: string;
  country: string;
  address: string;
  gst_number: string;
  active: boolean;
  permissions: string[];
  created_at: string;
}

export interface MessageOut {
  message: string;
}

export interface FileRef {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  uploaded_by: string;
}

export interface Note {
  id: string;
  text: string;
  author: string;
  at: string;
}

export interface EnquiryIn {
  name: string;
  company: string;
  email: string;
  mobile: string;
  whatsapp: string;
  country: string;
  service_category: string;
  service_required: string;
  vessel_name: string;
  imo_number: string;
  vessel_type: string;
  current_port: string;
  next_port: string;
  requirement: string;
  expected_date: string;
  cargo_details: string;
  instructions: string;
  attachment_ids: string[];
  source: string;
  website: string;
}

export interface Enquiry extends Omit<EnquiryIn, "attachment_ids" | "website"> {
  id: string;
  enquiry_no: string;
  customer_id: string | null;
  attachments: FileRef[];
  status: string;
  assigned_to: string | null;
  assigned_name: string;
  notes?: Note[];
  replies: Note[];
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnquiryCreated {
  id: string;
  enquiry_no: string;
  status: string;
}

export interface TrackOut {
  enquiry_no: string;
  status: string;
  service_category: string;
  service_required: string;
  vessel_name: string;
  created_at: string;
  updated_at: string;
  replies: Note[];
  quotation_status: string | null;
  quotation_total: number | null;
}

export interface QuoteItem {
  description: string;
  qty: number;
  unit_price: number;
}

export interface QuotationIn {
  enquiry_id: string;
  items: QuoteItem[];
  gst_percent: number;
  discount: number;
  payment_terms: string;
  validity: string;
  notes: string;
  currency: string;
}

export interface Quotation {
  id: string;
  quote_no: string;
  enquiry_id: string;
  enquiry_no: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company: string;
  service: string;
  vessel_name: string;
  items: QuoteItem[];
  gst_percent: number;
  discount: number;
  payment_terms: string;
  validity: string;
  notes: string;
  currency: string;
  subtotal: number;
  gst_amount: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "rejected";
  customer_comment: string;
  created_at: string;
  sent_at: string;
  responded_at: string;
}

export interface SiteSettings {
  company_name: string;
  owner: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  address: string;
  map_query: string;
  office_hours: string;
  hero_title: string;
  hero_highlight: string;
  hero_subtitle: string;
  hero_description: string;
  hero_image: string;
  about_text: string;
  footer_text: string;
}

export interface ServiceOverride {
  slug: string;
  title: string;
  short: string;
  description: string;
  image: string;
  visible: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface OutboxItem {
  id: string;
  to: string;
  subject: string;
  body: string;
  kind: string;
  status: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_name: string;
  action: string;
  target: string;
  at: string;
}

export interface MonthCount {
  month: string;
  count: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface Stats {
  total_enquiries: number;
  new_enquiries: number;
  pending_enquiries: number;
  active_customers: number;
  total_quotations: number;
  approved_quotations: number;
  completed_services: number;
  monthly: MonthCount[];
  by_service: LabelCount[];
  by_status: LabelCount[];
  daily: MonthCount[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface ShareLink {
  path: string;
  phone: string;
  quote_no: string;
  total: number;
  customer_name: string;
}

export interface TestimonialIn {
  name: string;
  company: string;
  role: string;
  rating: number;
  message: string;
  website: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string;
  rating: number;
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export type VesselStatus = "scheduled" | "arrived" | "in_service" | "departed" | "cancelled";

export interface VesselCallIn {
  vessel_name: string;
  imo_number: string;
  vessel_type: string;
  port: string;
  berth: string;
  eta: string;
  etd: string;
  service_category: string;
  enquiry_id: string;
  crew_assigned: string;
  status: VesselStatus;
  notes: string;
}

export interface VesselCall extends VesselCallIn {
  id: string;
  enquiry_no: string;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VesselBoard {
  today: string;
  calls: VesselCall[];
}

export interface CustomerVesselCall {
  id: string;
  vessel_name: string;
  port: string;
  berth: string;
  eta: string;
  etd: string;
  service_category: string;
  enquiry_no: string;
  status: VesselStatus;
}
