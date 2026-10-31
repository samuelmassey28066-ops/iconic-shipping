import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Anchor, CalendarClock, Pencil, Plus, Ship, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { SERVICES, serviceTitle } from "@/lib/content";
import { errMsg } from "@/lib/hooks";
import type { Enquiry, Testimonial, VesselBoard, VesselCall, VesselCallIn, VesselStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Stars } from "@/components/site/Testimonials";
import { NativeSelect } from "./AdminParts";

export const VESSEL_STATUS: Record<VesselStatus, { l: string; c: string }> = {
  scheduled: { l: "Scheduled", c: "bg-sky-100 text-sky-700" },
  arrived: { l: "Arrived", c: "bg-amber-100 text-amber-700" },
  in_service: { l: "In Service", c: "bg-violet-100 text-violet-700" },
  departed: { l: "Departed", c: "bg-emerald-100 text-emerald-700" },
  cancelled: { l: "Cancelled", c: "bg-red-100 text-red-700" },
};

const EMPTY: VesselCallIn = { vessel_name: "", imo_number: "", vessel_type: "", port: "Kandla", berth: "", eta: "", etd: "", service_category: "port-clearance", enquiry_id: "", crew_assigned: "", status: "scheduled", notes: "" };

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};
const dayLabel = (iso: string, today: string) => {
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
};

function CallDialog({ open, onOpenChange, edit }: { open: boolean; onOpenChange: (o: boolean) => void; edit: VesselCall | null }) {
  const qc = useQueryClient();
  const [f, setF] = useState<VesselCallIn>(EMPTY);
  const [key, setKey] = useState("");
  const k = `${open}-${edit?.id ?? "new"}`;
  if (key !== k) { setKey(k); setF(edit ? { ...EMPTY, ...edit } : EMPTY); }
  const enq = useQuery({ queryKey: ["admin-enquiries", "", "", "", false], queryFn: () => apiGet<Enquiry[]>("/admin/enquiries?q=&status=&service=&archived=false"), enabled: open });
  const set = (k2: keyof VesselCallIn) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k2]: e.target.value }));
  const save = useMutation({
    mutationFn: () => (edit ? apiPut<VesselCall>(`/admin/vessel-calls/${edit.id}`, f) : apiPost<VesselCall>("/admin/vessel-calls", f)),
    onSuccess: () => { toast.success(edit ? "Vessel call updated" : "Vessel call scheduled"); qc.invalidateQueries({ queryKey: ["vessel-board"] }); onOpenChange(false); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const pickEnquiry = (id: string) => {
    const e = enq.data?.find((x) => x.id === id);
    setF((p) => ({ ...p, enquiry_id: id, ...(e ? { vessel_name: p.vessel_name || e.vessel_name, vessel_type: p.vessel_type || e.vessel_type, imo_number: p.imo_number || e.imo_number, port: e.current_port || p.port, service_category: e.service_category } : {}) }));
  };
  const fld = (label: string, el: React.ReactNode, wide?: boolean) => <div className={cn("space-y-1", wide && "sm:col-span-2")}><Label className="text-[12px]">{label}</Label>{el}</div>;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" data-testid="vessel-call-dialog">
        <DialogHeader><DialogTitle>{edit ? "Edit vessel call" : "Schedule vessel arrival"}</DialogTitle></DialogHeader>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          {fld("Link to enquiry (optional — customer will see this vessel's ETA)", (
            <NativeSelect value={f.enquiry_id} onChange={pickEnquiry} testid="vessel-enquiry-select" className="w-full">
              <option value="">No linked enquiry</option>
              {enq.data?.map((e) => <option key={e.id} value={e.id}>{e.enquiry_no} · {e.name} · {e.vessel_name || "—"}{e.customer_id ? " (portal customer)" : ""}</option>)}
            </NativeSelect>
          ), true)}
          {fld("Vessel name *", <Input required minLength={2} value={f.vessel_name} onChange={set("vessel_name")} data-testid="vessel-name-input" />)}
          {fld("IMO", <Input value={f.imo_number} onChange={set("imo_number")} data-testid="vessel-imo-input" />)}
          {fld("Vessel type", <Input value={f.vessel_type} onChange={set("vessel_type")} data-testid="vessel-type-input" />)}
          {fld("Port *", <Input required minLength={2} value={f.port} onChange={set("port")} data-testid="vessel-port-input" />)}
          {fld("Berth / anchorage", <Input value={f.berth} onChange={set("berth")} data-testid="vessel-berth-input" />)}
          {fld("Service", <NativeSelect value={f.service_category} onChange={(v) => setF((p) => ({ ...p, service_category: v }))} testid="vessel-service-select" className="w-full">{SERVICES.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}</NativeSelect>)}
          {fld("ETA *", <Input required type="datetime-local" value={f.eta} onChange={set("eta")} data-testid="vessel-eta-input" />)}
          {fld("ETD", <Input type="datetime-local" value={f.etd} onChange={set("etd")} data-testid="vessel-etd-input" />)}
          {fld("Status", <NativeSelect value={f.status} onChange={(v) => setF((p) => ({ ...p, status: v as VesselStatus }))} testid="vessel-status-select" className="w-full">{Object.entries(VESSEL_STATUS).map(([k2, v]) => <option key={k2} value={k2}>{v.l}</option>)}</NativeSelect>)}
          {fld("Crew assigned", <Input placeholder="e.g. Clearance: Ramesh · Cleaning team B (6)" value={f.crew_assigned} onChange={set("crew_assigned")} data-testid="vessel-crew-input" />)}
          {fld("Internal notes", <Textarea rows={2} value={f.notes} onChange={set("notes")} data-testid="vessel-notes-input" />, true)}
          <button type="submit" disabled={save.isPending} data-testid="vessel-save-button" className="h-11 rounded-full bg-ocean text-[14px] font-semibold text-white sm:col-span-2">{edit ? "Save changes" : "Add to board"}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VesselBoardTab() {
  const qc = useQueryClient();
  const [scope, setScope] = useState<"upcoming" | "all">("upcoming");
  const [svc, setSvc] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<VesselCall | null>(null);
  const q = useQuery({ queryKey: ["vessel-board", scope], queryFn: () => apiGet<VesselBoard>(`/admin/vessel-calls?scope=${scope}`) });
  const del = useMutation({ mutationFn: (id: string) => apiDelete(`/admin/vessel-calls/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["vessel-board"] }) });
  const quick = useMutation({
    mutationFn: ({ c, status }: { c: VesselCall; status: VesselStatus }) => apiPut<VesselCall>(`/admin/vessel-calls/${c.id}`, { ...c, status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vessel-board"] }),
    onError: (e) => toast.error(errMsg(e)),
  });
  const today = q.data?.today ?? "";
  const calls = (q.data?.calls ?? []).filter((c) => !svc || c.service_category === svc);
  const groups = useMemo(() => {
    const m = new Map<string, VesselCall[]>();
    calls.forEach((c) => { const d = c.eta.slice(0, 10); m.set(d, [...(m.get(d) ?? []), c]); });
    return [...m.entries()];
  }, [calls]);
  const week = today ? calls.filter((c) => c.eta.slice(0, 10) >= today && c.eta.slice(0, 10) <= addDays(today, 6)).length : 0;
  const summary = [
    { l: "Arriving today", v: calls.filter((c) => c.eta.slice(0, 10) === today).length, i: CalendarClock },
    { l: "Next 7 days", v: week, i: Ship },
    { l: "Alongside / in service", v: calls.filter((c) => c.status === "arrived" || c.status === "in_service").length, i: Anchor },
    { l: "No crew assigned", v: calls.filter((c) => !c.crew_assigned && c.status !== "departed" && c.status !== "cancelled").length, i: Users },
  ];
  return (
    <div className="space-y-4" data-testid="vessel-board">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {summary.map((x) => (
          <div key={x.l} className="rounded-2xl border border-sky-100 bg-white p-4"><x.i className="h-5 w-5 text-ocean" /><p className="mt-2 font-heading text-3xl font-extrabold text-navy">{x.v}</p><p className="text-[12px] text-slate-500">{x.l}</p></div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sky-100 bg-white p-3">
        <NativeSelect value={scope} onChange={(v) => setScope(v as "upcoming" | "all")} testid="vessel-scope-select"><option value="upcoming">Upcoming & alongside</option><option value="all">All (incl. past)</option></NativeSelect>
        <NativeSelect value={svc} onChange={setSvc} testid="vessel-service-filter"><option value="">All services</option>{SERVICES.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}</NativeSelect>
        <button onClick={() => { setEdit(null); setOpen(true); }} data-testid="vessel-add-button" className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-full bg-ocean px-4 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Schedule arrival</button>
      </div>
      {groups.length ? groups.map(([day, items]) => (
        <div key={day} className="rounded-2xl border border-sky-100 bg-white p-4" data-testid={`vessel-day-${day}`}>
          <p className={cn("mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider", day === today ? "text-ocean" : "text-slate-500")}>
            <span className={cn("h-2 w-2 rounded-full", day === today ? "bg-ocean animate-blink" : "bg-slate-300")} /> {dayLabel(day, today)} <span className="font-normal normal-case text-slate-400">{day}</span>
          </p>
          <div className="space-y-2">
            {items.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="grid items-center gap-3 rounded-xl bg-sky-soft/70 p-3 md:grid-cols-[80px_1.4fr_1fr_1.2fr_auto]" data-testid={`vessel-call-${c.vessel_name.replace(/\s+/g, "-").toLowerCase()}`}>
                <div className="font-heading text-xl font-extrabold text-navy">{c.eta.slice(11, 16) || "—"}</div>
                <div><p className="font-bold text-navy">{c.vessel_name} <span className="text-[12px] font-normal text-slate-500">{c.vessel_type}{c.imo_number && ` · IMO ${c.imo_number}`}</span></p><p className="text-[12.5px] text-slate-600">{c.port}{c.berth && ` · ${c.berth}`}{c.etd && ` · ETD ${c.etd.replace("T", " ")}`}</p></div>
                <div className="text-[12.5px]"><p className="font-semibold text-navy">{serviceTitle(c.service_category)}</p>{c.enquiry_no && <p className="text-slate-500">{c.enquiry_no}</p>}</div>
                <div className="text-[12.5px]"><p className={cn(c.crew_assigned ? "text-navy" : "font-semibold text-amber-600")}>{c.crew_assigned || "Crew not assigned"}</p>{c.notes && <p className="line-clamp-1 text-slate-500">{c.notes}</p>}</div>
                <div className="flex items-center gap-1.5">
                  <NativeSelect value={c.status} onChange={(v) => quick.mutate({ c, status: v as VesselStatus })} testid={`vessel-quick-status-${c.id}`} className={cn("h-8 border-0 text-[12px] font-bold", VESSEL_STATUS[c.status].c)}>
                    {Object.entries(VESSEL_STATUS).map(([k2, v]) => <option key={k2} value={k2}>{v.l}</option>)}
                  </NativeSelect>
                  <button aria-label="Edit" onClick={() => { setEdit(c); setOpen(true); }} className="grid h-8 w-8 place-items-center rounded-full bg-white text-navy" data-testid={`vessel-edit-${c.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                  <button aria-label="Delete" onClick={() => del.mutate(c.id)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )) : <div className="rounded-2xl bg-white p-10 text-center text-slate-500" data-testid="vessel-board-empty">{q.isLoading ? "Loading…" : "No upcoming vessel calls. Click “Schedule arrival” to plan one."}</div>}
      <CallDialog open={open} onOpenChange={setOpen} edit={edit} />
    </div>
  );
}

export function TestimonialsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const q = useQuery({ queryKey: ["admin-testimonials"], queryFn: () => apiGet<Testimonial[]>("/admin/testimonials") });
  const inv = () => { qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); qc.invalidateQueries({ queryKey: ["testimonials"] }); };
  const patch = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => apiPatch<Testimonial>(`/admin/testimonials/${id}`, { status }), onSuccess: (t) => { toast.success(`Testimonial ${t.status}`); inv(); }, onError: (e) => toast.error(errMsg(e)) });
  const del = useMutation({ mutationFn: (id: string) => apiDelete(`/admin/testimonials/${id}`), onSuccess: inv });
  const list = (q.data ?? []).filter((t) => !filter || t.status === filter);
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["pending", "approved", "rejected", ""].map((s) => (
          <button key={s || "all"} onClick={() => setFilter(s)} data-testid={`testimonial-filter-${s || "all"}`} className={cn("h-9 rounded-full px-4 text-[13px] font-semibold capitalize", filter === s ? "bg-ocean text-white" : "bg-white text-navy")}>
            {s || "all"} ({(q.data ?? []).filter((t) => !s || t.status === s).length})
          </button>
        ))}
      </div>
      {list.map((t) => (
        <div key={t.id} className="rounded-2xl border border-sky-100 bg-white p-5" data-testid={`admin-testimonial-${t.id}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-navy">{t.name} <span className="text-[12.5px] font-normal text-slate-500">{[t.role, t.company].filter(Boolean).join(" · ")} · {new Date(t.created_at).toLocaleDateString()}</span></p>
            <Stars n={t.rating} />
          </div>
          <p className="mt-2 text-[14px] text-slate-700">“{t.message}”</p>
          <div className="mt-3 flex gap-2">
            {t.status !== "approved" && <button onClick={() => patch.mutate({ id: t.id, status: "approved" })} data-testid={`testimonial-approve-${t.id}`} className="h-8 rounded-full bg-emerald-600 px-4 text-[12.5px] font-semibold text-white">Approve & publish</button>}
            {t.status !== "rejected" && <button onClick={() => patch.mutate({ id: t.id, status: "rejected" })} data-testid={`testimonial-reject-${t.id}`} className="h-8 rounded-full bg-red-50 px-4 text-[12.5px] font-semibold text-red-700">{t.status === "approved" ? "Unpublish" : "Reject"}</button>}
            <button onClick={() => del.mutate(t.id)} aria-label="Delete" className="ml-auto text-red-500"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      {!list.length && <div className="rounded-2xl bg-white p-8 text-center text-slate-500">No {filter} testimonials.</div>}
    </div>
  );
}
