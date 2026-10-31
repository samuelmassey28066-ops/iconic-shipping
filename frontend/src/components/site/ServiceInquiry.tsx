import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, MessageCircle, Paperclip, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";
import { mailHref, waHref, waMessage } from "@/lib/content";
import type { InquiryValues, ServiceDef } from "@/lib/content";
import { errMsg, uploadFile, useSettings } from "@/lib/hooks";
import type { EnquiryCreated, EnquiryIn, FileRef } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12.5px] font-semibold text-navy">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-[12px] text-red-600" data-testid={`${id}-error`}>{error}</p>}
    </div>
  );
}

export default function ServiceInquiry({ service, compact }: { service: ServiceDef; compact?: boolean }) {
  const s = useSettings();
  const [vals, setVals] = useState<InquiryValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<FileRef | null>(null);
  const [honey, setHoney] = useState("");
  const [lastRef, setLastRef] = useState("");
  const set = (k: string) => (e: { target: { value: string } }) => setVals((p) => ({ ...p, [k]: e.target.value }));

  const upload = useMutation({
    mutationFn: (f: File) => uploadFile<FileRef>("/uploads", f),
    onSuccess: (r) => { setFile(r); toast.success(`Attached ${r.filename}`); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const save = useMutation({
    mutationFn: (channel: string) => {
      const extra = service.fields.map((f) => `${f.label}: ${vals[f.key] || "-"}`).join("\n");
      const body: EnquiryIn = {
        name: vals.name ?? "", company: vals.company ?? "", email: vals.email ?? "", mobile: vals.phone ?? "",
        whatsapp: vals.phone ?? "", country: "India", service_category: service.slug,
        service_required: vals.equipment ?? service.title, vessel_name: vals.vessel_name ?? "", imo_number: "",
        vessel_type: vals.vessel_type ?? "", current_port: vals.port ?? "", next_port: "",
        requirement: `${vals.description ?? ""}\n\n${extra}`.trim(), expected_date: vals.date ?? "",
        cargo_details: vals.cargo ?? "", instructions: `Sent via ${channel}`,
        attachment_ids: file ? [file.id] : [], source: `${channel}_inquiry`, website: honey,
      };
      return apiPost<EnquiryCreated>("/enquiries", body);
    },
  });

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!vals.name?.trim() || vals.name.trim().length < 2) e.name = "Please enter your name";
    if (!EMAIL_RX.test(vals.email?.trim() ?? "")) e.email = "Enter a valid email address";
    if (!/^[+\d][\d\s-]{6,}$/.test(vals.phone?.trim() ?? "")) e.phone = "Enter a valid phone / WhatsApp number";
    if (!vals.port?.trim()) e.port = "Enter port / location";
    if ((vals.description?.trim().length ?? 0) < 5) e.description = "Please describe your requirement";
    setErrors(e);
    if (Object.keys(e).length) toast.error("Please complete the required fields");
    return !Object.keys(e).length;
  }

  async function send(channel: "whatsapp" | "email", ev?: FormEvent) {
    ev?.preventDefault();
    if (!validate()) return;
    // Open the WhatsApp tab synchronously so popup blockers allow it, then point it at the final link.
    const win = channel === "whatsapp" ? window.open("about:blank", "_blank") : null;
    let ref = "";
    try {
      ref = (await save.mutateAsync(channel)).enquiry_no;
      setLastRef(ref);
    } catch (e) {
      toast.error(`Saved locally only: ${errMsg(e)}`);
    }
    const v = { ...vals, ref, ...(file ? { description: `${vals.description} (Attachment uploaded: ${file.filename})` } : {}) };
    if (channel === "whatsapp") {
      const href = waHref(s.whatsapp, waMessage(service, v, s.company_name));
      if (win) win.location.href = href;
      else window.location.href = href;
      toast.success("WhatsApp opened with your inquiry — press Send in WhatsApp to deliver it.");
    } else {
      window.location.href = mailHref(service, s.email, v, s.company_name);
      toast.info("Your email app was opened with the inquiry. The email is only sent once you press Send there.");
    }
  }

  const inp = (k: string, ph: string, type = "text") => (
    <Input id={`inq-${k}`} data-testid={`inquiry-${k}-input`} type={type} placeholder={ph} value={vals[k] ?? ""} onChange={set(k)}
      className={cn("h-11 rounded-xl bg-white", errors[k] && "border-red-400")} />
  );

  return (
    <motion.form
      data-testid="service-inquiry-form"
      onSubmit={(e) => send("whatsapp", e)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.6 }}
      className={cn("rounded-3xl border border-sky-100 bg-white/90 p-5 shadow-[0_30px_60px_-30px_rgba(11,29,58,0.35)] sm:p-7", compact && "p-4 sm:p-5 shadow-none")}
      noValidate
    >
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ocean">Service Inquiry</p>
        <h3 className="mt-1 text-xl font-bold text-navy">Enquire about {service.title}</h3>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sky-soft px-3 py-1 text-[12px] font-semibold text-ocean" data-testid="inquiry-selected-service">
          <service.icon className="h-3.5 w-3.5" /> Selected: {service.title}
        </div>
      </div>
      <input type="text" tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} className="hidden" aria-hidden name="website" />
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        <Field id="inq-name" label="Customer Name" required error={errors.name}>{inp("name", "Your full name")}</Field>
        <Field id="inq-company" label="Company Name">{inp("company", "Company / ship owner / agent")}</Field>
        <Field id="inq-email" label="Email Address" required error={errors.email}>{inp("email", "you@company.com", "email")}</Field>
        <Field id="inq-phone" label="WhatsApp / Phone Number" required error={errors.phone}>{inp("phone", "+91 98xxxxxxx", "tel")}</Field>
        <Field id="inq-vessel_name" label="Vessel Name">{inp("vessel_name", "MV ...")}</Field>
        <Field id="inq-vessel_type" label="Vessel Type">{inp("vessel_type", "Bulk carrier / Tanker / Container")}</Field>
        <Field id="inq-port" label="Port / Location" required error={errors.port}>{inp("port", "e.g. Kandla, Mundra, Tuna")}</Field>
        <Field id="inq-date" label="Expected Service Date">{inp("date", "", "date")}</Field>
        {service.fields.map((f) => (
          <Field key={f.key} id={`inq-${f.key}`} label={f.label}>{inp(f.key, f.placeholder)}</Field>
        ))}
      </div>
      <div className="mt-4">
        <Field id="inq-description" label="Description of Requirements" required error={errors.description}>
          <Textarea id="inq-description" data-testid="inquiry-description-input" rows={compact ? 3 : 4} placeholder="Describe the work, equipment, quantities or timing" value={vals.description ?? ""} onChange={set("description")} className={cn("rounded-xl bg-white", errors.description && "border-red-400")} />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-sky-300 px-4 py-2 text-[13px] font-medium text-ocean transition-colors hover:bg-sky-50" data-testid="inquiry-attachment-label">
          {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          Attach file / image (PDF, JPG, PNG · 5 MB)
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" data-testid="inquiry-attachment-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = ""; }} />
        </label>
        {file && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] text-emerald-700" data-testid="inquiry-attachment-name">
            <CheckCircle2 className="h-3.5 w-3.5" /> {file.filename}
            <button type="button" aria-label="Remove attachment" onClick={() => setFile(null)}><X className="h-3.5 w-3.5" /></button>
          </span>
        )}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} type="submit" disabled={save.isPending} data-testid="inquiry-send-whatsapp-button"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-wa px-6 text-[14px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(37,211,102,0.9)] disabled:opacity-60">
          <MessageCircle className="h-4.5 w-4.5" /> Send Inquiry via WhatsApp
        </motion.button>
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} type="button" disabled={save.isPending} onClick={() => send("email")} data-testid="inquiry-send-email-button"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ocean px-6 text-[14px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(2,132,199,0.9)] disabled:opacity-60">
          <Mail className="h-4.5 w-4.5" /> Send Inquiry via Email
        </motion.button>
      </div>
      {lastRef && (
        <p className="mt-4 text-[13px] text-slate-600" data-testid="inquiry-reference">
          Your inquiry is also recorded with reference <b className="text-navy">{lastRef}</b> — use it on the Track Enquiry page.
        </p>
      )}
      <p className="mt-3 text-[12px] text-slate-500">Both buttons use the same details. You can edit the prepared message before sending.</p>
    </motion.form>
  );
}
