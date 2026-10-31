import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Download, FileText, MessageCircle, Plus, Send, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { DEFAULT_SETTINGS, SERVICES, STATUS_LABEL, digits, serviceTitle } from "@/lib/content";
import { errMsg, uploadFile, useSettings } from "@/lib/hooks";
import type { ShareLink } from "@/lib/types";
import type { Activity, ContactMessage, Enquiry, FileRef, OutboxItem, Quotation, QuotationIn, QuoteItem, ServiceOverride, SiteSettings, UserPublic } from "@/lib/types";
import { cn } from "@/lib/utils";
import { inr, statusTone } from "./Portal";

export const NativeSelect = ({ value, onChange, children, testid, className }: { value: string; onChange: (v: string) => void; children: React.ReactNode; testid?: string; className?: string }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} className={cn("h-10 rounded-xl border border-input bg-white px-3 text-[13.5px] text-navy", className)}>{children}</select>
);
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={cn("rounded-2xl border border-sky-100 bg-white p-5", className)}>{children}</div>;
const Pill = ({ s }: { s: string }) => <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold capitalize", statusTone(s))}>{STATUS_LABEL[s] ?? s}</span>;

// ---------------- Enquiries ----------------
function QuoteBuilder({ e, onDone }: { e: Enquiry; onDone: () => void }) {
  const qc = useQueryClient();
  const [items, setItems] = useState<QuoteItem[]>([{ description: e.service_required || serviceTitle(e.service_category), qty: 1, unit_price: 0 }]);
  const [gst, setGst] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [terms, setTerms] = useState("50% advance, balance on completion.");
  const [validity, setValidity] = useState("15 days");
  const [notes, setNotes] = useState("");
  const sub = items.reduce((a, i) => a + i.qty * i.unit_price, 0);
  const d = Math.min(discount, sub);
  const gstAmt = ((sub - d) * gst) / 100;
  const m = useMutation({
    mutationFn: () => apiPost<Quotation>("/admin/quotations", { enquiry_id: e.id, items, gst_percent: gst, discount, payment_terms: terms, validity, notes, currency: "INR" } satisfies QuotationIn),
    onSuccess: (q) => { toast.success(`Draft ${q.quote_no} created — send it from Quotations`); qc.invalidateQueries({ queryKey: ["admin-quotes"] }); onDone(); },
    onError: (x) => toast.error(errMsg(x)),
  });
  const upd = (i: number, k: keyof QuoteItem, v: string) => setItems((p) => p.map((it, j) => (j === i ? { ...it, [k]: k === "description" ? v : Number(v) || 0 } : it)));
  return (
    <div className="space-y-3 rounded-2xl bg-sky-soft p-4" data-testid="quote-builder">
      <p className="font-bold text-navy">New quotation</p>
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[1fr_70px_110px_32px] gap-2">
          <Input value={it.description} onChange={(x) => upd(i, "description", x.target.value)} placeholder="Service charge description" className="h-9 bg-white" data-testid={`qb-desc-${i}`} />
          <Input type="number" min={0} value={it.qty} onChange={(x) => upd(i, "qty", x.target.value)} className="h-9 bg-white" data-testid={`qb-qty-${i}`} />
          <Input type="number" min={0} value={it.unit_price} onChange={(x) => upd(i, "unit_price", x.target.value)} className="h-9 bg-white" data-testid={`qb-price-${i}`} />
          <button type="button" aria-label="Remove line" onClick={() => setItems((p) => p.filter((_, j) => j !== i))} disabled={items.length === 1} className="text-red-500 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => setItems((p) => [...p, { description: "", qty: 1, unit_price: 0 }])} data-testid="qb-add-line" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ocean"><Plus className="h-4 w-4" /> Add line</button>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-[12px]">GST %</Label><Input type="number" min={0} max={28} value={gst} onChange={(x) => setGst(Number(x.target.value) || 0)} className="h-9 bg-white" data-testid="qb-gst" /></div>
        <div><Label className="text-[12px]">Discount (₹)</Label><Input type="number" min={0} value={discount} onChange={(x) => setDiscount(Number(x.target.value) || 0)} className="h-9 bg-white" data-testid="qb-discount" /></div>
        <div><Label className="text-[12px]">Payment terms</Label><Input value={terms} onChange={(x) => setTerms(x.target.value)} className="h-9 bg-white" /></div>
        <div><Label className="text-[12px]">Validity</Label><Input value={validity} onChange={(x) => setValidity(x.target.value)} className="h-9 bg-white" /></div>
      </div>
      <Textarea placeholder="Notes (optional)" value={notes} onChange={(x) => setNotes(x.target.value)} className="bg-white" rows={2} />
      <div className="text-right text-[13px] text-slate-600">Subtotal {inr(sub)} · Discount {inr(d)} · GST {inr(gstAmt)} · <b className="text-navy" data-testid="qb-total">Total {inr(sub - d + gstAmt)}</b></div>
      <button onClick={() => m.mutate()} disabled={m.isPending || items.some((i) => !i.description.trim() || i.qty <= 0)} data-testid="qb-save" className="h-10 w-full rounded-full bg-ocean text-[14px] font-semibold text-white disabled:opacity-50">Save draft quotation</button>
    </div>
  );
}

function EnquiryPanel({ e, staff, close }: { e: Enquiry; staff: UserPublic[]; close: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [builder, setBuilder] = useState(false);
  const refresh = (x: Enquiry) => { qc.setQueryData<Enquiry[]>(["admin-enquiries"], undefined); qc.invalidateQueries({ queryKey: ["admin-enquiries"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); return x; };
  const patch = useMutation({ mutationFn: (b: Record<string, unknown>) => apiPatch<Enquiry>(`/admin/enquiries/${e.id}`, b), onSuccess: (x) => { refresh(x); toast.success("Enquiry updated"); }, onError: (x) => toast.error(errMsg(x)) });
  const addNote = useMutation({ mutationFn: () => apiPost<Enquiry>(`/admin/enquiries/${e.id}/notes`, { text: note }), onSuccess: (x) => { setNote(""); refresh(x); toast.success("Note added"); } });
  const sendReply = useMutation({ mutationFn: () => apiPost<Enquiry>(`/admin/enquiries/${e.id}/reply`, { text: reply }), onSuccess: (x) => { setReply(""); refresh(x); toast.success("Reply emailed to customer"); } });
  const info: [string, string][] = [["Name", e.name], ["Company", e.company], ["Email", e.email], ["Mobile", e.mobile], ["WhatsApp", e.whatsapp], ["Country", e.country], ["Service", serviceTitle(e.service_category)], ["Service required", e.service_required], ["Vessel", `${e.vessel_name} ${e.vessel_type && `(${e.vessel_type})`}`], ["IMO", e.imo_number], ["Current port", e.current_port], ["Next port", e.next_port], ["Expected date", e.expected_date], ["Source", e.source]];
  return (
    <div className="space-y-5 p-6" data-testid="admin-enquiry-panel">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-heading text-2xl font-extrabold text-navy">{e.enquiry_no}</p><p className="text-[13px] text-slate-500">{new Date(e.created_at).toLocaleString()}</p></div>
        <Pill s={e.status} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-[12px]">Status</Label>
          <NativeSelect value={e.status} onChange={(v) => patch.mutate({ status: v })} testid="admin-enquiry-status-select" className="w-full">
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect></div>
        <div><Label className="text-[12px]">Assign to</Label>
          <NativeSelect value={e.assigned_to ?? ""} onChange={(v) => patch.mutate({ assigned_to: v })} testid="admin-enquiry-assign-select" className="w-full">
            <option value="">Unassigned</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </NativeSelect></div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-sky-soft p-4 text-[13px]">
        {info.map(([k, v]) => <div key={k}><dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k}</dt><dd className="break-words text-navy">{v || "—"}</dd></div>)}
      </dl>
      <div><p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Requirement</p><p className="mt-1 whitespace-pre-wrap text-[14px] text-navy">{e.requirement}</p>
        {e.cargo_details && <p className="mt-2 text-[13px] text-slate-600"><b>Cargo / cleaning:</b> {e.cargo_details}</p>}
        {e.instructions && <p className="mt-1 text-[13px] text-slate-600"><b>Instructions:</b> {e.instructions}</p>}</div>
      {e.attachments.length > 0 && <div className="flex flex-wrap gap-2">{e.attachments.map((a) => <a key={a.id} href={`/api/files/${a.id}`} target="_blank" rel="noreferrer" className="rounded-full bg-sky-soft px-3 py-1 text-[12px] text-ocean">{a.filename} ({a.uploaded_by})</a>)}</div>}
      <div className="space-y-2">
        <p className="font-bold text-navy">Customer conversation</p>
        {e.replies.map((r) => <p key={r.id} className="rounded-xl bg-sky-soft p-2.5 text-[13px]"><b>{r.author}:</b> {r.text}</p>)}
        <Textarea rows={2} placeholder="Reply to customer (emails them)" value={reply} onChange={(x) => setReply(x.target.value)} data-testid="admin-reply-input" />
        <button disabled={!reply.trim()} onClick={() => sendReply.mutate()} data-testid="admin-reply-send" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ocean px-4 text-[13px] font-semibold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" /> Send reply</button>
      </div>
      <div className="space-y-2">
        <p className="font-bold text-navy">Internal notes <span className="text-[12px] font-normal text-slate-500">(never shown to customer)</span></p>
        {(e.notes ?? []).map((n) => <p key={n.id} className="rounded-xl bg-amber-50 p-2.5 text-[13px]"><b>{n.author}:</b> {n.text}</p>)}
        <div className="flex gap-2"><Input placeholder="Add internal note" value={note} onChange={(x) => setNote(x.target.value)} data-testid="admin-note-input" /><button disabled={!note.trim()} onClick={() => addNote.mutate()} data-testid="admin-note-add" className="h-9 shrink-0 rounded-full bg-navy px-4 text-[13px] font-semibold text-white disabled:opacity-50">Add</button></div>
      </div>
      {builder ? <QuoteBuilder e={e} onDone={() => setBuilder(false)} /> : (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setBuilder(true)} data-testid="admin-create-quote-button" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ocean px-4 text-[13px] font-semibold text-white"><FileText className="h-4 w-4" /> Create quotation</button>
          <button onClick={() => { patch.mutate({ archived: !e.archived }); close(); }} data-testid="admin-archive-button" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-sky-200 px-4 text-[13px] font-semibold text-navy"><Archive className="h-4 w-4" /> {e.archived ? "Unarchive" : "Archive"}</button>
        </div>
      )}
    </div>
  );
}

export function EnquiriesTab() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [archived, setArchived] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useQuery({ queryKey: ["admin-enquiries", q, status, service, archived], queryFn: () => apiGet<Enquiry[]>(`/admin/enquiries?q=${encodeURIComponent(q)}&status=${status}&service=${service}&archived=${archived}`) });
  const staff = useQuery({ queryKey: ["admin-staff"], queryFn: () => apiGet<UserPublic[]>("/admin/staff") });
  const open = list.data?.find((x) => x.id === openId);
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap gap-2">
        <Input placeholder="Search ID, name, company, vessel, port" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 max-w-sm" data-testid="admin-enquiry-search" />
        <NativeSelect value={status} onChange={setStatus} testid="admin-enquiry-status-filter"><option value="">All statuses</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</NativeSelect>
        <NativeSelect value={service} onChange={setService} testid="admin-enquiry-service-filter"><option value="">All services</option>{SERVICES.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}</NativeSelect>
        <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} data-testid="admin-enquiry-archived-toggle" /> Archived</label>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-[13px]" data-testid="admin-enquiries-table">
          <thead className="bg-sky-soft text-left text-[11.5px] uppercase tracking-wider text-slate-500"><tr>{["Enquiry", "Date", "Customer", "Service", "Vessel / Port", "Assigned", "Status"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {list.data?.map((e) => (
              <tr key={e.id} onClick={() => setOpenId(e.id)} className="cursor-pointer border-t border-sky-50 transition-colors hover:bg-sky-soft/60" data-testid={`admin-enquiry-row-${e.enquiry_no}`}>
                <td className="px-4 py-3 font-semibold text-navy">{e.enquiry_no}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(e.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3"><p className="font-medium text-navy">{e.name}</p><p className="text-slate-500">{e.company}</p></td>
                <td className="px-4 py-3">{serviceTitle(e.service_category)}</td>
                <td className="px-4 py-3">{e.vessel_name || "—"}<p className="text-slate-500">{e.current_port}</p></td>
                <td className="px-4 py-3">{e.assigned_name || "—"}</td>
                <td className="px-4 py-3"><Pill s={e.status} /></td>
              </tr>
            ))}
            {!list.data?.length && <tr><td colSpan={7} className="p-8 text-center text-slate-500">{list.isLoading ? "Loading…" : "No enquiries found."}</td></tr>}
          </tbody>
        </table>
      </Card>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetTitle className="sr-only">Enquiry details</SheetTitle>
          {open && <EnquiryPanel e={open} staff={staff.data ?? []} close={() => setOpenId(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---------------- Quotations ----------------
export function QuotationsTab() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["admin-quotes"], queryFn: () => apiGet<Quotation[]>("/admin/quotations") });
  const send = useMutation({ mutationFn: (id: string) => apiPost<Quotation>(`/admin/quotations/${id}/send`), onSuccess: (q) => { toast.success(`${q.quote_no} emailed to ${q.customer_email}`); qc.invalidateQueries({ queryKey: ["admin-quotes"] }); qc.invalidateQueries({ queryKey: ["admin-enquiries"] }); }, onError: (e) => toast.error(errMsg(e)) });
  const del = useMutation({ mutationFn: (id: string) => apiDelete(`/admin/quotations/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-quotes"] }) });
  const site = useSettings();
  async function shareWa(q: Quotation) {
    const win = window.open("about:blank", "_blank"); // opened synchronously so popup blockers allow it
    try {
      const r = await apiPost<ShareLink>(`/admin/quotations/${q.id}/share-link`);
      const ph = digits(r.phone);
      const num = ph.length === 10 ? `91${ph}` : ph;
      const text = `Dear ${r.customer_name},\n\nGreetings from ${site.company_name}!\n\nPlease find our quotation ${r.quote_no} (Total ${inr(r.total)}) here:\n${window.location.origin}${r.path}\n\nKindly review and let us know your confirmation.\n\nBest Regards,\n${site.owner}\n${site.company_name}\n${site.phone}`;
      const href = num ? `https://wa.me/${num}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
      if (win) win.location.href = href; else window.location.href = href;
      if (!num) toast.info("No customer phone on file — choose the chat in WhatsApp.");
    } catch (e) {
      win?.close();
      toast.error(errMsg(e));
    }
  }
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[820px] text-[13px]" data-testid="admin-quotes-table">
        <thead className="bg-sky-soft text-left text-[11.5px] uppercase tracking-wider text-slate-500"><tr>{["Quote", "Enquiry", "Customer", "Service", "Total", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
        <tbody>
          {list.data?.map((q) => (
            <tr key={q.id} className="border-t border-sky-50" data-testid={`admin-quote-row-${q.quote_no}`}>
              <td className="px-4 py-3 font-semibold text-navy">{q.quote_no}<p className="font-normal text-slate-500">{new Date(q.created_at).toLocaleDateString()}</p></td>
              <td className="px-4 py-3">{q.enquiry_no}</td>
              <td className="px-4 py-3">{q.customer_name}<p className="text-slate-500">{q.customer_email}</p></td>
              <td className="px-4 py-3">{q.service}</td>
              <td className="px-4 py-3 font-semibold">{inr(q.total)}</td>
              <td className="px-4 py-3"><Pill s={q.status} />{q.customer_comment && <p className="mt-1 text-[11.5px] text-slate-500">“{q.customer_comment}”</p>}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <a href={`/api/admin/quotations/${q.id}/pdf`} className="inline-flex h-8 items-center gap-1 rounded-full border border-sky-200 px-3 text-[12px] font-semibold" data-testid={`admin-quote-pdf-${q.quote_no}`}><Download className="h-3.5 w-3.5" /> PDF</a>
                  {q.status !== "draft" && <button onClick={() => shareWa(q)} data-testid={`admin-quote-whatsapp-${q.quote_no}`} className="inline-flex h-8 items-center gap-1 rounded-full bg-wa px-3 text-[12px] font-semibold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</button>}
                  {q.status === "draft" && <button onClick={() => send.mutate(q.id)} data-testid={`admin-quote-send-${q.quote_no}`} className="inline-flex h-8 items-center gap-1 rounded-full bg-ocean px-3 text-[12px] font-semibold text-white"><Send className="h-3.5 w-3.5" /> Email</button>}
                  {q.status === "draft" && <button onClick={() => del.mutate(q.id)} aria-label="Delete draft" className="px-1 text-red-500"><Trash2 className="h-4 w-4" /></button>}
                </div>
              </td>
            </tr>
          ))}
          {!list.data?.length && <tr><td colSpan={7} className="p-8 text-center text-slate-500">No quotations yet. Open an enquiry and click “Create quotation”.</td></tr>}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------- Customers ----------------
export function CustomersTab() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["admin-customers"], queryFn: () => apiGet<UserPublic[]>("/admin/customers") });
  const [sel, setSel] = useState<UserPublic | null>(null);
  const hist = useQuery({ queryKey: ["admin-cust-hist", sel?.id], queryFn: () => apiGet<Enquiry[]>(`/admin/customers/${sel?.id}/enquiries`), enabled: !!sel });
  const [edit, setEdit] = useState({ name: "", company: "", phone: "", country: "" });
  const patch = useMutation({ mutationFn: (b: Partial<UserPublic>) => apiPatch<UserPublic>(`/admin/users/${sel?.id}`, b), onSuccess: (u) => { setSel(u); toast.success("Customer updated"); qc.invalidateQueries({ queryKey: ["admin-customers"] }); }, onError: (e) => toast.error(errMsg(e)) });
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-[13px]" data-testid="admin-customers-table">
          <thead className="bg-sky-soft text-left text-[11.5px] uppercase tracking-wider text-slate-500"><tr>{["Customer", "Company", "Phone", "Joined", "Status"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {list.data?.map((u) => (
              <tr key={u.id} onClick={() => { setSel(u); setEdit({ name: u.name, company: u.company, phone: u.phone, country: u.country }); }} className={cn("cursor-pointer border-t border-sky-50 hover:bg-sky-soft/60", sel?.id === u.id && "bg-sky-soft")} data-testid={`admin-customer-row-${u.email}`}>
                <td className="px-4 py-3"><p className="font-semibold text-navy">{u.name}</p><p className="text-slate-500">{u.email}</p></td>
                <td className="px-4 py-3">{u.company || "—"}</td><td className="px-4 py-3">{u.phone || "—"}</td>
                <td className="px-4 py-3">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", u.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>{u.active ? "Active" : "Disabled"}</span></td>
              </tr>
            ))}
            {!list.data?.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No registered customers yet.</td></tr>}
          </tbody>
        </table>
      </Card>
      {sel && (
        <Card className="space-y-3" >
          <p className="font-heading text-lg font-bold text-navy">{sel.email}</p>
          {(Object.keys(edit) as (keyof typeof edit)[]).map((k) => <Input key={k} value={edit[k]} placeholder={k} onChange={(e) => setEdit((p) => ({ ...p, [k]: e.target.value }))} className="h-10" data-testid={`admin-customer-${k}-input`} />)}
          <div className="flex gap-2">
            <button onClick={() => patch.mutate(edit)} data-testid="admin-customer-save" className="h-9 rounded-full bg-ocean px-4 text-[13px] font-semibold text-white">Save</button>
            <button onClick={() => patch.mutate({ active: !sel.active })} data-testid="admin-customer-toggle-active" className="h-9 rounded-full border border-sky-200 px-4 text-[13px] font-semibold">{sel.active ? "Disable account" : "Enable account"}</button>
          </div>
          <p className="pt-2 font-bold text-navy">Enquiry history</p>
          {hist.data?.length ? hist.data.map((e) => <div key={e.id} className="flex justify-between rounded-xl bg-sky-soft p-2.5 text-[13px]"><span>{e.enquiry_no} · {serviceTitle(e.service_category)}</span><Pill s={e.status} /></div>) : <p className="text-[13px] text-slate-500">No enquiries.</p>}
        </Card>
      )}
    </div>
  );
}

// ---------------- Services & Website ----------------
export function ServicesTab() {
  const qc = useQueryClient();
  const ov = useQuery({ queryKey: ["service-overrides"], queryFn: () => apiGet<ServiceOverride[]>("/services/overrides") });
  const [slug, setSlug] = useState(SERVICES[0].slug);
  const base = SERVICES.find((s) => s.slug === slug)!;
  const cur = ov.data?.find((o) => o.slug === slug);
  const [f, setF] = useState<Omit<ServiceOverride, "slug">>({ title: "", short: "", description: "", image: "", visible: true });
  const [loaded, setLoaded] = useState("");
  if (loaded !== slug + (ov.dataUpdatedAt ?? 0)) {
    setLoaded(slug + (ov.dataUpdatedAt ?? 0));
    setF({ title: cur?.title || base.title, short: cur?.short || base.short, description: cur?.description || base.description, image: cur?.image || base.image, visible: cur?.visible ?? true });
  }
  const save = useMutation({ mutationFn: () => apiPut<ServiceOverride>(`/admin/services/${slug}`, f), onSuccess: () => { toast.success("Service saved — live on the website"); qc.invalidateQueries({ queryKey: ["service-overrides"] }); }, onError: (e) => toast.error(errMsg(e)) });
  const up = useMutation({ mutationFn: (file: File) => uploadFile<FileRef>("/admin/images", file), onSuccess: (r) => setF((p) => ({ ...p, image: `/api/files/${r.id}` })), onError: (e) => toast.error(errMsg(e)) });
  return (
    <Card className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <div className="space-y-1">{SERVICES.map((s) => <button key={s.slug} onClick={() => setSlug(s.slug)} data-testid={`admin-service-${s.slug}`} className={cn("block w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium", slug === s.slug ? "bg-ocean text-white" : "text-navy hover:bg-sky-soft")}>{s.title}</button>)}</div>
      <div className="space-y-3">
        <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} data-testid="admin-service-title-input" /></div>
        <div><Label>Short description</Label><Textarea rows={2} value={f.short} onChange={(e) => setF({ ...f, short: e.target.value })} data-testid="admin-service-short-input" /></div>
        <div><Label>Full description</Label><Textarea rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} data-testid="admin-service-description-input" /></div>
        <div className="flex flex-wrap items-end gap-3">
          <img src={f.image} alt="" className="h-20 w-32 rounded-xl object-cover" />
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-sky-200 px-4 text-[13px] font-semibold"><Upload className="h-4 w-4" /> Upload photo<input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const x = e.target.files?.[0]; if (x) up.mutate(x); }} data-testid="admin-service-image-input" /></label>
          <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={f.visible} onChange={(e) => setF({ ...f, visible: e.target.checked })} data-testid="admin-service-visible-toggle" /> Visible on website</label>
        </div>
        <button onClick={() => save.mutate()} data-testid="admin-service-save" className="h-10 rounded-full bg-ocean px-6 text-[14px] font-semibold text-white">Save service</button>
      </div>
    </Card>
  );
}

export function WebsiteTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<SiteSettings>("/settings") });
  const [f, setF] = useState<SiteSettings | null>(null);
  const v = f ?? q.data ?? DEFAULT_SETTINGS;
  const save = useMutation({ mutationFn: () => apiPut<SiteSettings>("/admin/settings", v), onSuccess: (r) => { qc.setQueryData(["settings"], r); setF(null); toast.success("Website updated — header, footer, contact page & emails now use these details"); }, onError: (e) => toast.error(errMsg(e)) });
  const up = useMutation({ mutationFn: (file: File) => uploadFile<FileRef>("/admin/images", file), onSuccess: (r) => setF({ ...v, hero_image: `/api/files/${r.id}` }), onError: (e) => toast.error(errMsg(e)) });
  const long = new Set(["hero_subtitle", "hero_description", "about_text", "footer_text"]);
  const groups: [string, (keyof SiteSettings)[]][] = [
    ["Contact details", ["company_name", "owner", "phone", "whatsapp", "email", "location", "address", "map_query", "office_hours"]],
    ["Homepage banner", ["hero_title", "hero_highlight", "hero_subtitle", "hero_description", "hero_image"]],
    ["About & footer", ["about_text", "footer_text"]],
  ];
  return (
    <div className="space-y-4">
      {groups.map(([g, keys]) => (
        <Card key={g}>
          <p className="mb-4 font-bold text-navy">{g}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {keys.map((k) => (
              <div key={k} className={cn(long.has(k) && "sm:col-span-2")}>
                <Label className="text-[12px] capitalize">{k.replace(/_/g, " ")}</Label>
                {long.has(k) ? <Textarea rows={3} value={v[k]} onChange={(e) => setF({ ...v, [k]: e.target.value })} data-testid={`settings-${k}-input`} />
                  : <Input value={v[k]} onChange={(e) => setF({ ...v, [k]: e.target.value })} data-testid={`settings-${k}-input`} />}
              </div>
            ))}
          </div>
          {g === "Homepage banner" && <label className="mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-sky-200 px-4 text-[13px] font-semibold"><Upload className="h-4 w-4" /> Upload banner image<input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const x = e.target.files?.[0]; if (x) up.mutate(x); }} /></label>}
        </Card>
      ))}
      <button onClick={() => save.mutate()} disabled={save.isPending} data-testid="settings-save-button" className="h-11 rounded-full bg-ocean px-8 text-[14px] font-semibold text-white">Save website settings</button>
    </div>
  );
}

// ---------------- Staff, reports, outbox, messages ----------------
const PERMS = ["enquiries", "quotations", "customers", "website", "reports", "staff"];
export function StaffTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["admin-staff"], queryFn: () => apiGet<UserPublic[]>("/admin/staff") });
  const act = useQuery({ queryKey: ["admin-activity"], queryFn: () => apiGet<Activity[]>("/admin/activity"), enabled: isAdmin });
  const [f, setF] = useState({ name: "", email: "", password: "", role: "staff", permissions: ["enquiries"] as string[] });
  const create = useMutation({ mutationFn: () => apiPost<UserPublic>("/admin/staff", f), onSuccess: () => { toast.success("Staff account created"); setF({ name: "", email: "", password: "", role: "staff", permissions: ["enquiries"] }); qc.invalidateQueries({ queryKey: ["admin-staff"] }); }, onError: (e) => toast.error(errMsg(e)) });
  const patch = useMutation({ mutationFn: ({ id, b }: { id: string; b: Partial<UserPublic> }) => apiPatch<UserPublic>(`/admin/users/${id}`, b), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-staff"] }), onError: (e) => toast.error(errMsg(e)) });
  const toggle = (arr: string[], p: string) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3">
        <p className="font-bold text-navy">Team & permissions</p>
        {list.data?.map((u) => (
          <div key={u.id} className="rounded-xl bg-sky-soft p-3" data-testid={`staff-row-${u.email}`}>
            <div className="flex items-center justify-between"><p className="text-[14px] font-semibold text-navy">{u.name} <span className="text-[12px] font-normal text-slate-500">{u.email}</span></p><span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold uppercase">{u.role}</span></div>
            {u.role === "staff" && (
              <div className="mt-2 flex flex-wrap gap-2">
                {PERMS.map((p) => <label key={p} className="flex items-center gap-1 text-[12px] capitalize"><input type="checkbox" disabled={!isAdmin} checked={u.permissions.includes(p)} onChange={() => patch.mutate({ id: u.id, b: { permissions: toggle(u.permissions, p) } })} />{p}</label>)}
                {isAdmin && <button onClick={() => patch.mutate({ id: u.id, b: { active: !u.active } })} className="ml-auto text-[12px] font-semibold text-red-600">{u.active ? "Disable" : "Enable"}</button>}
              </div>
            )}
          </div>
        ))}
      </Card>
      {isAdmin && (
        <Card className="space-y-3">
          <p className="font-bold text-navy">Create staff account</p>
          <Input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="staff-name-input" />
          <Input placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="staff-email-input" />
          <Input placeholder="Temporary password (min 8)" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} data-testid="staff-password-input" />
          <NativeSelect value={f.role} onChange={(r) => setF({ ...f, role: r })} testid="staff-role-select"><option value="staff">Staff</option><option value="admin">Admin</option></NativeSelect>
          <div className="flex flex-wrap gap-3">{PERMS.map((p) => <label key={p} className="flex items-center gap-1 text-[13px] capitalize"><input type="checkbox" checked={f.permissions.includes(p)} onChange={() => setF({ ...f, permissions: toggle(f.permissions, p) })} />{p}</label>)}</div>
          <button onClick={() => create.mutate()} data-testid="staff-create-button" className="h-10 rounded-full bg-ocean px-5 text-[13px] font-semibold text-white">Create account</button>
        </Card>
      )}
      {isAdmin && (
        <Card className="lg:col-span-2">
          <p className="mb-3 font-bold text-navy">Activity log</p>
          <div className="max-h-80 space-y-1 overflow-y-auto text-[13px]" data-testid="activity-log">
            {act.data?.map((a) => <p key={a.id} className="border-b border-sky-50 py-1.5"><span className="text-slate-400">{new Date(a.at).toLocaleString()}</span> · <b>{a.user_name}</b> {a.action} <span className="text-slate-500">{a.target}</span></p>)}
          </div>
        </Card>
      )}
    </div>
  );
}

export function ReportsTab() {
  const kinds = [["enquiries", "Enquiry report"], ["quotations", "Quotation report"], ["customers", "Customer report"], ["services", "Service-wise report"]];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {kinds.map(([k, l]) => (
        <Card key={k}>
          <p className="font-bold text-navy">{l}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["daily", "monthly", "all"] as const).map((p) => (["xlsx", "pdf"] as const).map((fmt) => (
              <a key={p + fmt} href={`/api/admin/reports/export?kind=${k}&period=${p}&fmt=${fmt}`} data-testid={`report-${k}-${p}-${fmt}`} className="inline-flex h-8 items-center gap-1 rounded-full border border-sky-200 px-3 text-[12px] font-semibold text-navy hover:border-ocean"><Download className="h-3.5 w-3.5" /> {p} · {fmt === "xlsx" ? "Excel" : "PDF"}</a>
            )))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function OutboxTab() {
  const q = useQuery({ queryKey: ["admin-outbox"], queryFn: () => apiGet<OutboxItem[]>("/admin/outbox") });
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-[13px] text-sky-800" data-testid="outbox-banner">Every email the system sends (enquiry alerts, acknowledgements, quotations, status updates, password resets) is listed here with its delivery status.</div>
      <Card className="p-0">
        {q.data?.map((m) => (
          <div key={m.id} className="border-b border-sky-50 p-4" data-testid="outbox-item">
            <button onClick={() => setOpen(open === m.id ? null : m.id)} className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
              <span><span className="block text-[14px] font-semibold text-navy">{m.subject}</span><span className="text-[12px] text-slate-500">To {m.to} · {m.kind} · {new Date(m.created_at).toLocaleString()}</span></span>
              <span data-testid="outbox-status" className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", m.status === "delivered" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{m.status}</span>
            </button>
            {open === m.id && <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-sky-soft p-3 font-sans text-[13px] text-slate-700">{m.body}</pre>}
          </div>
        ))}
        {!q.data?.length && <p className="p-8 text-center text-slate-500">No emails yet.</p>}
      </Card>
    </div>
  );
}

export function MessagesTab() {
  const q = useQuery({ queryKey: ["admin-messages"], queryFn: () => apiGet<ContactMessage[]>("/admin/messages") });
  return (
    <div className="space-y-3">
      {q.data?.map((m) => <Card key={m.id}><p className="font-semibold text-navy">{m.subject || "General enquiry"} <span className="text-[12px] font-normal text-slate-500">· {m.name} &lt;{m.email}&gt; {m.phone} · {new Date(m.created_at).toLocaleString()}</span></p><p className="mt-2 whitespace-pre-wrap text-[14px] text-slate-700">{m.message}</p></Card>)}
      {!q.data?.length && <Card><p className="text-center text-slate-500">No contact messages yet.</p></Card>}
    </div>
  );
}
