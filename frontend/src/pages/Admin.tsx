import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { BarChart3, CalendarClock, CheckCircle2, Star, ClipboardList, FileText, Globe, Inbox, LayoutDashboard, LogOut, Mail, MessageSquare, Menu, Settings2, ShieldCheck, Users, Wrench } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/site/Layout";
import { apiGet } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import { endSession } from "@/lib/session";
import type { Stats } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TestimonialsTab, VesselBoardTab } from "./AdminExtras";
import { CustomersTab, EnquiriesTab, MessagesTab, OutboxTab, QuotationsTab, ReportsTab, ServicesTab, StaffTab, WebsiteTab } from "./AdminParts";

const COLORS = ["#0284C7", "#0EA5E9", "#0B1D3A", "#38BDF8", "#D97706", "#16A34A", "#64748B", "#DC2626", "#7DD3FC"];

function Dashboard() {
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: () => apiGet<Stats>("/admin/stats") });
  const s = q.data;
  const cards = [
    ["Total Enquiries", s?.total_enquiries, Inbox], ["New Enquiries", s?.new_enquiries, ClipboardList], ["Pending Enquiries", s?.pending_enquiries, ClipboardList],
    ["Active Customers", s?.active_customers, Users], ["Total Quotations", s?.total_quotations, FileText], ["Approved Quotations", s?.approved_quotations, CheckCircle2],
    ["Completed Services", s?.completed_services, ShieldCheck],
  ] as const;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {cards.map(([l, v, I], i) => (
          <motion.div key={l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-sky-100 bg-white p-4" data-testid={`stat-${l.toLowerCase().replace(/\s+/g, "-")}`}>
            <I className="h-5 w-5 text-ocean" /><p className="mt-2 font-heading text-3xl font-extrabold text-navy">{v ?? "—"}</p><p className="text-[12px] text-slate-500">{l}</p>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-sky-100 bg-white p-5">
          <p className="mb-3 font-bold text-navy">Monthly enquiries</p>
          <div className="h-64"><ResponsiveContainer><BarChart data={s?.monthly ?? []}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="month" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="count" fill="#0284C7" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-white p-5">
          <p className="mb-3 font-bold text-navy">Enquiries by service</p>
          <div className="h-64"><ResponsiveContainer><PieChart><Pie data={s?.by_service ?? []} dataKey="count" nameKey="label" innerRadius={50} outerRadius={90}>{(s?.by_service ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-white p-5 lg:col-span-2">
          <p className="mb-3 font-bold text-navy">Daily enquiries (last 14 days)</p>
          <div className="h-48"><ResponsiveContainer><BarChart data={(s?.daily ?? []).map((d) => ({ ...d, month: d.month.slice(5) }))}><XAxis dataKey="month" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="count" fill="#0EA5E9" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { k: "dashboard", l: "Dashboard", i: LayoutDashboard, perm: "" },
  { k: "enquiries", l: "Enquiries", i: Inbox, perm: "enquiries" },
  { k: "quotations", l: "Quotations", i: FileText, perm: "quotations" },
  { k: "vessels", l: "Vessel ETA Board", i: CalendarClock, perm: "enquiries" },
  { k: "customers", l: "Customers", i: Users, perm: "customers" },
  { k: "services", l: "Services", i: Wrench, perm: "website" },
  { k: "website", l: "Website", i: Globe, perm: "website" },
  { k: "testimonials", l: "Testimonials", i: Star, perm: "website" },
  { k: "staff", l: "Staff", i: Settings2, perm: "" },
  { k: "reports", l: "Reports", i: BarChart3, perm: "reports" },
  { k: "messages", l: "Contact Messages", i: MessageSquare, perm: "enquiries" },
  { k: "outbox", l: "Email Outbox", i: Mail, perm: "" },
];

export default function Admin() {
  const me = useMe();
  const [tab, setTab] = useState("dashboard");
  const [nav, setNav] = useState(false);
  if (me.isLoading) return <div className="grid min-h-screen place-items-center text-slate-500">Loading…</div>;
  if (me.isError || !me.data) return <Navigate to="/login" replace />;
  if (me.data.role === "customer") return <Navigate to="/portal" replace />;
  const user = me.data;
  const isAdmin = user.role === "admin";
  const tabs = TABS.filter((t) => !t.perm || isAdmin || user.permissions.includes(t.perm));
  const cur = tabs.find((t) => t.k === tab) ?? tabs[0];
  return (
    <div className="min-h-screen bg-sky-soft lg:grid lg:grid-cols-[250px_1fr]">
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-[250px] -translate-x-full bg-navy p-4 text-white transition-transform lg:static lg:translate-x-0", nav && "translate-x-0")}>
        <Logo light className="mb-8 px-2" />
        <nav className="space-y-1">
          {tabs.map((t) => (
            <button key={t.k} onClick={() => { setTab(t.k); setNav(false); }} data-testid={`admin-nav-${t.k}`} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors", cur.k === t.k ? "bg-ocean text-white" : "text-slate-300 hover:bg-white/10")}>
              <t.i className="h-4.5 w-4.5" /> {t.l}
            </button>
          ))}
        </nav>
        <div className="mt-8 border-t border-white/10 pt-4 text-[13px]">
          <p className="font-semibold">{me.data.name}</p><p className="text-slate-400">{me.data.email} · {me.data.role}</p>
          <Link to="/" className="mt-3 block text-sky-300">View website →</Link>
          <button onClick={() => endSession("/login")} data-testid="admin-logout-button" className="mt-3 inline-flex items-center gap-1.5 text-slate-300 hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>
      {nav && <div className="fixed inset-0 z-40 bg-navy/40 lg:hidden" onClick={() => setNav(false)} />}
      <main className="min-w-0 p-4 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-white lg:hidden" onClick={() => setNav(true)} aria-label="Open admin menu" data-testid="admin-menu-button"><Menu className="h-5 w-5" /></button>
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl" data-testid="admin-page-title">{cur.l}</h1>
        </div>
        <motion.div key={cur.k} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {cur.k === "dashboard" && <Dashboard />}
          {cur.k === "enquiries" && <EnquiriesTab />}
          {cur.k === "quotations" && <QuotationsTab />}
          {cur.k === "vessels" && <VesselBoardTab />}
          {cur.k === "testimonials" && <TestimonialsTab />}
          {cur.k === "customers" && <CustomersTab />}
          {cur.k === "services" && <ServicesTab />}
          {cur.k === "website" && <WebsiteTab />}
          {cur.k === "staff" && <StaffTab isAdmin={isAdmin} />}
          {cur.k === "reports" && <ReportsTab />}
          {cur.k === "messages" && <MessagesTab />}
          {cur.k === "outbox" && <OutboxTab />}
        </motion.div>
      </main>
      <Toaster richColors />
    </div>
  );
}
