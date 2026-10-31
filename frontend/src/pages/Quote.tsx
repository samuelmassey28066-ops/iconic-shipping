import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileUp, Loader2, MessageCircle, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageTransition, Reveal } from "@/components/site/Motion";
import { Btn, PageHero } from "@/components/site/Sections";
import { apiGet, apiPost } from "@/lib/api";
import { IMG, SERVICES, STATUS_LABEL, STATUS_ORDER, serviceTitle, waHref } from "@/lib/content";
import { errMsg, uploadFile, useSettings } from "@/lib/hooks";
import type { EnquiryCreated, EnquiryIn, FileRef, TrackOut } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Customer", "Service", "Vessel", "Requirement", "Attachments"];
const EMPTY: EnquiryIn = {
  name: "", company: "", email: "", mobile: "", whatsapp: "", country: "India", service_category: "", service_required: "",
  vessel_name: "", imo_number: "", vessel_type: "", current_port: "", next_port: "", requirement: "", expected_date: "",
  cargo_details: "", instructions: "", attachment_ids: [], source: "quote_form", website: "",
};

function F({ label, req, children, err }: { label: string; req?: boolean; children: React.ReactNode; err?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12.5px] font-semibold text-navy">{label} {req && <span className="text-red-500">*</span>}</Label>
      {children}
      {err && <p className="text-[12px] text-red-600">{err}</p>}
    </div>
  );
}

export default function Quote() {
  const s = useSettings();
  const [params] = useSearchParams();
  const pre = params.get("service") ?? "";
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [f, setF] = useState<EnquiryIn>({ ...EMPTY, service_category: SERVICES.some((x) => x.slug === pre) ? pre : "" });
  const [files, setFiles] = useState<FileRef[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});
  const [done, setDone] = useState<EnquiryCreated | null>(null);
  const set = (k: keyof EnquiryIn) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const inp = (k: keyof EnquiryIn, ph = "", type = "text") => (
    <Input type={type} placeholder={ph} value={f[k] as string} onChange={set(k)} className={cn("h-11 rounded-xl bg-white", err[k] && "border-red-400")} data-testid={`quote-${k}-input`} />
  );

  const upload = useMutation({
    mutationFn: (file: File) => uploadFile<FileRef>("/uploads", file),
    onSuccess: (r) => setFiles((p) => [...p, r]),
    onError: (e) => toast.error(errMsg(e)),
  });
  const submit = useMutation({
    mutationFn: () => apiPost<EnquiryCreated>("/enquiries", { ...f, attachment_ids: files.map((x) => x.id) }),
    onSuccess: (r) => { setDone(r); toast.success(`Enquiry ${r.enquiry_no} submitted`); },
    onError: (e) => toast.error(errMsg(e)),
  });

  function validate(i: number): boolean {
    const e: Record<string, string> = {};
    if (i === 0) {
      if (f.name.trim().length < 2) e.name = "Required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Valid email required";
      if (!/^[+\d][\d\s-]{5,}$/.test(f.mobile.trim())) e.mobile = "Valid mobile number required";
    }
    if (i === 1 && !f.service_category) e.service_category = "Select a service";
    if (i === 2) {
      if (!f.vessel_name.trim()) e.vessel_name = "Required";
      if (!f.vessel_type.trim()) e.vessel_type = "Required";
      if (!f.current_port.trim()) e.current_port = "Required";
    }
    if (i === 3 && f.requirement.trim().length < 5) e.requirement = "Please describe your requirement";
    setErr(e);
    return !Object.keys(e).length;
  }
  const go = (d: number) => {
    if (d > 0 && !validate(step)) return toast.error("Please complete the required fields");
    setDir(d);
    setStep((x) => x + d);
  };

  if (done) {
    return (
      <PageTransition>
        <section className="grid min-h-[80vh] place-items-center bg-sky-soft px-4 pt-28 pb-16">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg rounded-[32px] bg-white p-10 text-center shadow-[0_40px_80px_-40px_rgba(11,29,58,0.5)]" data-testid="quote-success">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-10 w-10" /></motion.span>
            <h2 className="mt-6 text-3xl font-extrabold text-navy">Enquiry Submitted</h2>
            <p className="mt-2 text-slate-600">Thank you, {f.name}. Your enquiry has been saved and our team will review it shortly.</p>
            <p className="mt-6 text-[13px] font-bold uppercase tracking-widest text-slate-500">Your Enquiry ID</p>
            <p className="mt-1 font-heading text-3xl font-extrabold text-ocean" data-testid="quote-success-enquiry-id">{done.enquiry_no}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Btn to={`/track?id=${done.enquiry_no}&email=${encodeURIComponent(f.email)}`} testid="quote-success-track-button">Track Enquiry</Btn>
              <Btn href={waHref(s.whatsapp, `Hello ${s.company_name},\n\nI have submitted enquiry ${done.enquiry_no} for ${serviceTitle(f.service_category)} (Vessel: ${f.vessel_name}, Port: ${f.current_port}).\n\nPlease share your quotation.\n\nThank you.`)} external variant="wa" testid="quote-success-whatsapp-button"><MessageCircle className="h-4 w-4" /> Follow up on WhatsApp</Btn>
            </div>
          </motion.div>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHero eyebrow="Request a Quotation" title="Tell Us About" highlight="Your Requirement" text="Five quick steps. You'll receive a unique enquiry ID you can track online." image={IMG.cranes} />
      <section className="bg-white px-4 pb-20 sm:px-6">
        <Reveal dir="up" className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-sky-100 bg-white p-5 shadow-[0_40px_80px_-40px_rgba(11,29,58,0.45)] sm:p-10" data-testid="quote-form">
            <ol className="mb-8 flex items-center gap-1.5">
              {STEPS.map((l, i) => (
                <li key={l} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-sky-100">
                    <motion.div className="absolute inset-y-0 left-0 bg-ocean" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
                  </div>
                  <span className={cn("flex items-center gap-1 text-[11.5px] font-semibold sm:text-[12.5px]", i <= step ? "text-ocean" : "text-slate-400")} data-testid={`quote-step-${i}`}>
                    {i < step ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}.</span>} <span className="hidden sm:inline">{l}</span>
                  </span>
                </li>
              ))}
            </ol>
            <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} aria-hidden />
            <div className="relative min-h-[340px] overflow-hidden">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -60 }} transition={{ duration: 0.35 }}>
                  <h3 className="mb-5 text-2xl font-bold text-navy">{["Customer Details", "Select Service", "Vessel Details", "Requirement Details", "Attachments & Review"][step]}</h3>
                  {step === 0 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <F label="Full Name" req err={err.name}>{inp("name", "Your full name")}</F>
                      <F label="Company Name">{inp("company", "Company")}</F>
                      <F label="Email" req err={err.email}>{inp("email", "you@company.com", "email")}</F>
                      <F label="Mobile Number" req err={err.mobile}>{inp("mobile", "+91 ...", "tel")}</F>
                      <F label="WhatsApp Number">{inp("whatsapp", "If different", "tel")}</F>
                      <F label="Country">{inp("country", "Country")}</F>
                    </div>
                  )}
                  {step === 1 && (
                    <div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {SERVICES.map((x) => (
                          <button type="button" key={x.slug} onClick={() => setF((p) => ({ ...p, service_category: x.slug }))} data-testid={`quote-service-${x.slug}`}
                            className={cn("flex items-center gap-3 rounded-2xl border p-4 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5", f.service_category === x.slug ? "border-ocean bg-sky-soft" : "border-sky-100 bg-white", x.main && "sm:col-span-1")}>
                            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", f.service_category === x.slug ? "bg-ocean text-white" : "bg-sky-soft text-ocean")}><x.icon className="h-5 w-5" /></span>
                            <span><span className="block text-[14px] font-bold text-navy">{x.title}</span>{x.main && <span className="text-[11px] font-bold uppercase tracking-wider text-ocean">Primary service</span>}</span>
                          </button>
                        ))}
                      </div>
                      {err.service_category && <p className="mt-2 text-[12px] text-red-600">{err.service_category}</p>}
                    </div>
                  )}
                  {step === 2 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <F label="Vessel Name" req err={err.vessel_name}>{inp("vessel_name", "MV ...")}</F>
                      <F label="IMO Number (Optional)">{inp("imo_number", "IMO 1234567")}</F>
                      <F label="Vessel Type" req err={err.vessel_type}>{inp("vessel_type", "Bulk carrier / Tanker / Container")}</F>
                      <F label="Current Port" req err={err.current_port}>{inp("current_port", "e.g. Kandla")}</F>
                      <F label="Next Port (Optional)">{inp("next_port", "Next port")}</F>
                    </div>
                  )}
                  {step === 3 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <F label="Service Required">
                        <Input list="svc-items" placeholder="Pick or type" value={f.service_required} onChange={set("service_required")} className="h-11 rounded-xl" data-testid="quote-service_required-input" />
                        <datalist id="svc-items">{SERVICES.find((x) => x.slug === f.service_category)?.items.map((i) => <option key={i} value={i} />)}</datalist>
                      </F>
                      <F label="Expected Service Date">{inp("expected_date", "", "date")}</F>
                      <div className="sm:col-span-2"><F label="Detailed Requirement" req err={err.requirement}><Textarea rows={4} value={f.requirement} onChange={set("requirement")} placeholder="Describe the scope of work" className={cn("rounded-xl", err.requirement && "border-red-400")} data-testid="quote-requirement-input" /></F></div>
                      <F label="Cargo / Cleaning Details"><Textarea rows={3} value={f.cargo_details} onChange={set("cargo_details")} className="rounded-xl" data-testid="quote-cargo_details-input" /></F>
                      <F label="Additional Instructions"><Textarea rows={3} value={f.instructions} onChange={set("instructions")} className="rounded-xl" data-testid="quote-instructions-input" /></F>
                    </div>
                  )}
                  {step === 4 && (
                    <div className="space-y-5">
                      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-soft/50 p-8 text-center transition-colors hover:border-ocean" data-testid="quote-attachment-dropzone">
                        {upload.isPending ? <Loader2 className="h-8 w-8 animate-spin text-ocean" /> : <FileUp className="h-8 w-8 text-ocean" />}
                        <span className="font-semibold text-navy">Upload PDF, JPG or PNG</span>
                        <span className="text-[12.5px] text-slate-500">Up to 5 files · 5 MB each (optional)</span>
                        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" data-testid="quote-attachment-input" onChange={(e) => { Array.from(e.target.files ?? []).slice(0, 5 - files.length).forEach((x) => upload.mutate(x)); e.target.value = ""; }} />
                      </label>
                      {files.map((x) => (
                        <div key={x.id} className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2 text-[13px] text-emerald-800">
                          <span>{x.filename}</span>
                          <button type="button" aria-label="Remove" onClick={() => setFiles((p) => p.filter((y) => y.id !== x.id))}><X className="h-4 w-4" /></button>
                        </div>
                      ))}
                      <div className="grid gap-2 rounded-2xl bg-sky-soft p-5 text-[13.5px] sm:grid-cols-2" data-testid="quote-review">
                        <p><b>Name:</b> {f.name}</p><p><b>Email:</b> {f.email}</p>
                        <p><b>Service:</b> {serviceTitle(f.service_category)}</p><p><b>Vessel:</b> {f.vessel_name} ({f.vessel_type})</p>
                        <p><b>Port:</b> {f.current_port}</p><p><b>Date:</b> {f.expected_date || "-"}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={() => go(-1)} disabled={step === 0} data-testid="quote-back-button" className="inline-flex h-11 items-center gap-2 rounded-full border border-sky-200 px-5 text-[14px] font-semibold text-navy disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Back</button>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={() => go(1)} data-testid="quote-next-button" className="inline-flex h-11 items-center gap-2 rounded-full bg-ocean px-6 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5">Next <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <button type="button" onClick={() => submit.mutate()} disabled={submit.isPending || upload.isPending} data-testid="quote-submit-button" className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-6 text-[14px] font-semibold text-white disabled:opacity-60">{submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Submit Enquiry</button>
              )}
            </div>
          </div>
        </Reveal>
      </section>
    </PageTransition>
  );
}

export function Track() {
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get("id") ?? "");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const q = useMutation({
    mutationFn: () => apiGet<TrackOut>(`/enquiries/track?enquiry_no=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}`),
    onError: (e) => toast.error(errMsg(e)),
  });
  const r = q.data;
  const idx = r ? STATUS_ORDER.indexOf(r.status) : -1;
  return (
    <PageTransition>
      <PageHero eyebrow="Track Enquiry" title="Check Your" highlight="Enquiry Status" text="Enter the enquiry ID you received and the email address used when submitting." image={IMG.aerial} />
      <section className="bg-white px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={(e) => { e.preventDefault(); q.mutate(); }} className="flex flex-col gap-3 rounded-3xl border border-sky-100 p-5 shadow-sm sm:flex-row" data-testid="track-form">
            <Input required placeholder="Enquiry ID e.g. ISS-250101-AB12" value={id} onChange={(e) => setId(e.target.value)} className="h-12 rounded-xl" data-testid="track-id-input" />
            <Input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" data-testid="track-email-input" />
            <button type="submit" data-testid="track-submit-button" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-ocean px-6 font-semibold text-white">{q.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Track</button>
          </form>
          {r && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-3xl bg-sky-soft p-6 sm:p-8" data-testid="track-result">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Enquiry</p><p className="font-heading text-2xl font-extrabold text-navy">{r.enquiry_no}</p></div>
                <span className="rounded-full bg-ocean px-4 py-1.5 text-[13px] font-bold text-white" data-testid="track-status">{STATUS_LABEL[r.status] ?? r.status}</span>
              </div>
              <p className="mt-3 text-[14px] text-slate-600">{serviceTitle(r.service_category)} {r.vessel_name && `· ${r.vessel_name}`}</p>
              <ol className="mt-6 grid gap-2 sm:grid-cols-6">
                {STATUS_ORDER.map((st, i) => (
                  <li key={st} className={cn("rounded-xl p-2 text-center text-[11.5px] font-semibold", i <= idx ? "bg-ocean text-white" : "bg-white text-slate-400")}>{STATUS_LABEL[st]}</li>
                ))}
              </ol>
              {r.quotation_status && <p className="mt-5 text-[14px] text-navy">Quotation: <b className="capitalize">{r.quotation_status}</b> · Total ₹{r.quotation_total?.toLocaleString("en-IN")} — <Link to="/login" className="font-semibold text-ocean underline">log in</Link> to view & respond.</p>}
              {r.replies.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-[13px] font-bold text-navy">Messages</p>
                  {r.replies.map((m) => <div key={m.id} className="rounded-xl bg-white p-3 text-[13.5px]"><b>{m.author}</b> <span className="text-slate-400">{new Date(m.at).toLocaleString()}</span><p className="mt-1 whitespace-pre-wrap text-slate-700">{m.text}</p></div>)}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
