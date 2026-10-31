import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Bell, Check, Download, FileText, Headset, Inbox, LogOut, MessageCircle, Mail, Paperclip, Plus, Send, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/site/Layout";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { GENERAL_WA, STATUS_LABEL, serviceTitle, waHref } from "@/lib/content";
import { errMsg, uploadFile, useMe, useSettings } from "@/lib/hooks";
import { endSession } from "@/lib/session";
import type { CustomerVesselCall } from "@/lib/types";
import type { Enquiry, FileRef, MessageOut, Notification, Quotation, UserPublic } from "@/lib/types";
import { cn } from "@/lib/utils";

export const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const statusTone = (s: string) =>
  ["completed", "approved", "accepted"].includes(s) ? "bg-emerald-100 text-emerald-700" : ["rejected", "closed"].includes(s) ? "bg-red-100 text-red-700" : s === "new" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700";

function EnquiryCard({ e }: { e: Enquiry }) {
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const up = useMutation({
    mutationFn: (f: File) => uploadFile<FileRef>(`/my/enquiries/${e.id}/documents`, f),
    onSuccess: () => { toast.success("Document uploaded"); qc.invalidateQueries({ queryKey: ["my-enquiries"] }); },
    onError: (x) => toast.error(errMsg(x)),
  });
  const send = useMutation({
    mutationFn: () => apiPost<MessageOut>(`/my/enquiries/${e.id}/messages`, { text: msg }),
    onSuccess: () => { setMsg(""); toast.success("Message sent to support"); qc.invalidateQueries({ queryKey: ["my-enquiries"] }); },
    onError: (x) => toast.error(errMsg(x)),
  });
  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-5" data-testid={`portal-enquiry-${e.enquiry_no}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-heading text-lg font-bold text-navy">{e.enquiry_no}</p>
          <p className="text-[13px] text-slate-500">{serviceTitle(e.service_category)} · {e.vessel_name || "—"} · {new Date(e.created_at).toLocaleDateString()}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-[12px] font-bold", statusTone(e.status))} data-testid="portal-enquiry-status">{STATUS_LABEL[e.status] ?? e.status}</span>
      </div>
      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-[13.5px] text-slate-600">{e.requirement}</p>
      {e.attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {e.attachments.map((a) => <a key={a.id} href={`/api/files/${a.id}`} className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-3 py-1 text-[12px] text-navy"><Paperclip className="h-3 w-3" />{a.filename}</a>)}
        </div>
      )}
      {e.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-sky-200 pl-3">
          {e.replies.map((r) => <p key={r.id} className="text-[13px]"><b className="text-navy">{r.author}:</b> <span className="text-slate-600">{r.text}</span></p>)}
        </div>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Message support about this enquiry" value={msg} onChange={(x) => setMsg(x.target.value)} className="h-10 rounded-full" data-testid="portal-message-input" />
        <button disabled={!msg.trim() || send.isPending} onClick={() => send.mutate()} data-testid="portal-message-send" className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ocean px-4 text-[13px] font-semibold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" /> Send</button>
        <label className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-sky-200 px-4 text-[13px] font-semibold text-navy" data-testid="portal-upload-doc">
          <Paperclip className="h-3.5 w-3.5" /> Upload document
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(x) => { const f = x.target.files?.[0]; if (f) up.mutate(f); x.target.value = ""; }} />
        </label>
      </div>
    </div>
  );
}

function QuoteCard({ q }: { q: Quotation }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const r = useMutation({
    mutationFn: (decision: "accepted" | "rejected") => apiPost<Quotation>(`/my/quotations/${q.id}/respond`, { decision, comment }),
    onSuccess: (x) => { toast.success(`Quotation ${x.status}`); qc.invalidateQueries({ queryKey: ["my-quotes"] }); qc.invalidateQueries({ queryKey: ["my-enquiries"] }); },
    onError: (x) => toast.error(errMsg(x)),
  });
  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-5" data-testid={`portal-quote-${q.quote_no}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="font-heading text-lg font-bold text-navy">{q.quote_no}</p><p className="text-[13px] text-slate-500">{q.service} · Enquiry {q.enquiry_no}</p></div>
        <span className={cn("rounded-full px-3 py-1 text-[12px] font-bold capitalize", statusTone(q.status))} data-testid="portal-quote-status">{q.status}</span>
      </div>
      <table className="mt-4 w-full text-[13px]">
        <tbody>
          {q.items.map((it, i) => <tr key={i} className="border-b border-sky-50"><td className="py-1.5 text-slate-700">{it.description}</td><td className="py-1.5 text-right text-slate-500">{it.qty} × {inr(it.unit_price)}</td><td className="py-1.5 text-right font-semibold">{inr(it.qty * it.unit_price)}</td></tr>)}
          <tr><td colSpan={2} className="pt-2 text-right text-slate-500">Discount</td><td className="pt-2 text-right">- {inr(q.discount)}</td></tr>
          <tr><td colSpan={2} className="text-right text-slate-500">GST {q.gst_percent}%</td><td className="text-right">{inr(q.gst_amount)}</td></tr>
          <tr><td colSpan={2} className="text-right font-bold text-navy">Total</td><td className="text-right font-heading text-lg font-extrabold text-ocean" data-testid="portal-quote-total">{inr(q.total)}</td></tr>
        </tbody>
      </table>
      <p className="mt-3 text-[12.5px] text-slate-500">Payment terms: {q.payment_terms} · Validity: {q.validity}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a href={`/api/my/quotations/${q.id}/pdf`} data-testid="portal-quote-pdf" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-sky-200 px-4 text-[13px] font-semibold text-navy"><Download className="h-4 w-4" /> Download PDF</a>
        {q.status === "sent" && (
          <>
            <Input placeholder="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} className="h-10 max-w-xs rounded-full" data-testid="portal-quote-comment" />
            <button onClick={() => r.mutate("accepted")} data-testid="portal-quote-accept" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-[13px] font-semibold text-white"><Check className="h-4 w-4" /> Accept</button>
            <button onClick={() => r.mutate("rejected")} data-testid="portal-quote-reject" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-red-50 px-4 text-[13px] font-semibold text-red-700"><X className="h-4 w-4" /> Reject</button>
          </>
        )}
      </div>
    </div>
  );
}

function Profile({ me }: { me: UserPublic }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: me.name, company: me.company, phone: me.phone, whatsapp: me.whatsapp, country: me.country, address: me.address, gst_number: me.gst_number });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const m = useMutation({ mutationFn: () => apiPut<UserPublic>("/auth/profile", f), onSuccess: (u) => { qc.setQueryData(["me"], u); toast.success("Profile saved"); }, onError: (e) => toast.error(errMsg(e)) });
  const labels: Record<keyof typeof f, string> = { name: "Full name", company: "Company name", phone: "Phone", whatsapp: "WhatsApp", country: "Country", address: "Company address", gst_number: "GST number" };
  return (
    <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="grid gap-4 rounded-2xl border border-sky-100 bg-white p-6 sm:grid-cols-2" data-testid="portal-profile-form">
      {(Object.keys(f) as (keyof typeof f)[]).map((k) => (
        <div key={k} className="space-y-1.5"><Label className="text-[12.5px] font-semibold">{labels[k]}</Label><Input value={f[k]} onChange={set(k)} className="h-11 rounded-xl" data-testid={`profile-${k}-input`} /></div>
      ))}
      <div className="sm:col-span-2"><p className="mb-3 text-[13px] text-slate-500">Email: {me.email}</p><button type="submit" data-testid="profile-save-button" className="h-11 rounded-full bg-ocean px-6 text-[14px] font-semibold text-white">Save profile</button></div>
    </form>
  );
}

export default function Portal() {
  const me = useMe();
  const s = useSettings();
  const qc = useQueryClient();
  const isCustomer = me.data?.role === "customer";
  const enq = useQuery({ queryKey: ["my-enquiries"], queryFn: () => apiGet<Enquiry[]>("/my/enquiries"), enabled: isCustomer });
  const quotes = useQuery({ queryKey: ["my-quotes"], queryFn: () => apiGet<Quotation[]>("/my/quotations"), enabled: isCustomer });
  const calls = useQuery({ queryKey: ["my-vessels"], queryFn: () => apiGet<CustomerVesselCall[]>("/my/vessel-calls"), enabled: isCustomer });
  const notes = useQuery({ queryKey: ["my-notes"], queryFn: () => apiGet<Notification[]>("/my/notifications"), enabled: isCustomer });
  const read = useMutation({ mutationFn: () => apiPost<MessageOut>("/my/notifications/read"), onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notes"] }) });

  if (me.isLoading) return <div className="grid min-h-screen place-items-center text-slate-500">Loading…</div>;
  if (me.isError || !me.data) return <Navigate to="/login" replace />;
  if (!isCustomer) return <Navigate to="/admin" replace />;
  const unread = notes.data?.filter((n) => !n.read).length ?? 0;
  const stats = [
    { l: "Enquiries", v: enq.data?.length ?? 0, i: Inbox },
    { l: "Open", v: enq.data?.filter((e) => !["completed", "closed", "rejected"].includes(e.status)).length ?? 0, i: FileText },
    { l: "Quotations", v: quotes.data?.length ?? 0, i: FileText },
    { l: "Awaiting you", v: quotes.data?.filter((q) => q.status === "sent").length ?? 0, i: Bell },
  ];
  return (
    <div className="min-h-screen bg-sky-soft">
      <header className="sticky top-0 z-40 border-b border-sky-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/quote" data-testid="portal-new-enquiry" className="hidden h-10 items-center gap-1.5 rounded-full bg-ocean px-4 text-[13px] font-semibold text-white sm:inline-flex"><Plus className="h-4 w-4" /> New Enquiry</Link>
            <button onClick={() => endSession("/login")} data-testid="portal-logout-button" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-sky-200 px-4 text-[13px] font-semibold text-navy"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold text-navy" data-testid="portal-welcome">Welcome, {me.data.name}</h1>
          <p className="text-slate-600">{me.data.company || "Customer portal"}</p>
        </motion.div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((x, i) => (
            <motion.div key={x.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl bg-white p-4 shadow-sm">
              <x.i className="h-5 w-5 text-ocean" /><p className="mt-2 font-heading text-3xl font-extrabold text-navy">{x.v}</p><p className="text-[12.5px] text-slate-500">{x.l}</p>
            </motion.div>
          ))}
        </div>
        <Tabs defaultValue="enquiries" className="mt-8">
          <TabsList className="flex h-auto flex-wrap gap-1 bg-white p-1">
            <TabsTrigger value="enquiries" data-testid="portal-tab-enquiries">Enquiries</TabsTrigger>
            <TabsTrigger value="quotes" data-testid="portal-tab-quotes">Quotations</TabsTrigger>
            <TabsTrigger value="vessels" data-testid="portal-tab-vessels">Vessel Schedule</TabsTrigger>
            <TabsTrigger value="notes" data-testid="portal-tab-notifications">Notifications {unread > 0 && <Badge className="ml-1">{unread}</Badge>}</TabsTrigger>
            <TabsTrigger value="profile" data-testid="portal-tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="support" data-testid="portal-tab-support">Support</TabsTrigger>
          </TabsList>
          <TabsContent value="enquiries" className="mt-4 space-y-3">
            {enq.data?.length ? enq.data.map((e) => <EnquiryCard key={e.id} e={e} />) : <div className="rounded-2xl bg-white p-8 text-center text-slate-500">No enquiries yet. <Link to="/quote" className="font-semibold text-ocean">Submit your first enquiry</Link>.</div>}
          </TabsContent>
          <TabsContent value="quotes" className="mt-4 space-y-3">
            {quotes.data?.length ? quotes.data.map((q) => <QuoteCard key={q.id} q={q} />) : <div className="rounded-2xl bg-white p-8 text-center text-slate-500">No quotations yet. They appear here once our team sends them.</div>}
          </TabsContent>
          <TabsContent value="vessels" className="mt-4 space-y-3">
            {calls.data?.length ? calls.data.map((c) => (
              <div key={c.id} className="grid gap-2 rounded-2xl border border-sky-100 bg-white p-5 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-center" data-testid={`portal-vessel-${c.id}`}>
                <div><p className="font-heading text-lg font-bold text-navy">{c.vessel_name}</p><p className="text-[13px] text-slate-500">{serviceTitle(c.service_category)}{c.enquiry_no && ` · ${c.enquiry_no}`}</p></div>
                <div className="text-[13px]"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Port</p><p className="text-navy">{c.port}{c.berth && ` · ${c.berth}`}</p></div>
                <div className="text-[13px]"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ETA / ETD</p><p className="text-navy" data-testid="portal-vessel-eta">{c.eta.replace("T", " ")}{c.etd && ` → ${c.etd.replace("T", " ")}`}</p></div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-center text-[12px] font-bold capitalize text-sky-700" data-testid="portal-vessel-status">{c.status.replace("_", " ")}</span>
              </div>
            )) : <div className="rounded-2xl bg-white p-8 text-center text-slate-500">No scheduled vessel calls yet. Our team adds your vessel's ETA here once planned.</div>}
          </TabsContent>
          <TabsContent value="notes" className="mt-4">
            <div className="rounded-2xl bg-white p-5">
              <div className="mb-3 flex justify-between"><p className="font-bold text-navy">Notifications</p><button onClick={() => read.mutate()} className="text-[13px] font-semibold text-ocean" data-testid="portal-mark-read">Mark all read</button></div>
              {notes.data?.length ? notes.data.map((n) => (
                <div key={n.id} className={cn("border-b border-sky-50 py-3", !n.read && "font-semibold")}><p className="text-[14px] text-navy">{n.title}</p><p className="text-[13px] font-normal text-slate-500">{n.body} · {new Date(n.created_at).toLocaleString()}</p></div>
              )) : <p className="text-slate-500">No notifications.</p>}
            </div>
          </TabsContent>
          <TabsContent value="profile" className="mt-4"><Profile me={me.data} /></TabsContent>
          <TabsContent value="support" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <a href={waHref(s.whatsapp, GENERAL_WA(s.company_name))} target="_blank" rel="noopener noreferrer" data-testid="portal-whatsapp-support" className="rounded-2xl bg-wa p-6 text-white"><MessageCircle className="h-6 w-6" /><p className="mt-3 font-bold">WhatsApp Support</p><p className="text-[13px] opacity-90">{s.whatsapp}</p></a>
              <a href={`mailto:${s.email}`} data-testid="portal-email-support" className="rounded-2xl bg-ocean p-6 text-white"><Mail className="h-6 w-6" /><p className="mt-3 font-bold">Email Support</p><p className="text-[13px] opacity-90">{s.email}</p></a>
              <Link to="/contact" className="rounded-2xl bg-navy p-6 text-white"><Headset className="h-6 w-6" /><p className="mt-3 font-bold">Contact {s.owner}</p><p className="text-[13px] opacity-90">{s.phone}</p></Link>
            </div>
          </TabsContent>
        </Tabs>
        <p className="mt-10 flex items-center gap-2 text-[12px] text-slate-400"><UserRound className="h-3.5 w-3.5" /> Signed in as {me.data.email}</p>
      </main>
      <Toaster richColors />
    </div>
  );
}
