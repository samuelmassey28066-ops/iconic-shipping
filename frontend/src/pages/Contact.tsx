import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageTransition, Reveal, Stagger, StaggerItem } from "@/components/site/Motion";
import { Btn, PageHero, SectionTitle } from "@/components/site/Sections";
import { GENERAL_WA, IMG, telHref, waHref } from "@/lib/content";
import { apiPost } from "@/lib/api";
import { errMsg, useSettings } from "@/lib/hooks";
import type { MessageOut } from "@/lib/types";

export default function Contact() {
  const s = useSettings();
  const [f, setF] = useState({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const send = useMutation({
    mutationFn: () => apiPost<MessageOut>("/contact", f),
    onSuccess: () => { toast.success("Thank you! Your message has been received. We will get back to you shortly."); setF({ name: "", email: "", phone: "", subject: "", message: "", website: "" }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const cards = [
    { i: UserRound, l: "Owner / Main Contact", v: s.owner, tid: "contact-owner" },
    { i: Phone, l: "Phone", v: s.phone, href: telHref(s.phone), tid: "contact-phone" },
    { i: MessageCircle, l: "WhatsApp", v: s.whatsapp, href: waHref(s.whatsapp, GENERAL_WA(s.company_name)), tid: "contact-whatsapp", ext: true },
    { i: Mail, l: "Email", v: s.email, href: `mailto:${s.email}`, tid: "contact-email" },
    { i: MapPin, l: "Location", v: s.location, tid: "contact-location" },
    { i: Clock, l: "Office Hours", v: s.office_hours, tid: "contact-hours" },
  ];
  return (
    <PageTransition>
      <PageHero eyebrow="Contact Us" title="Let's Plan Your" highlight="Next Port Call" text={`${s.company_name} · ${s.location}. Reach ${s.owner} directly by phone, WhatsApp or email.`} image={IMG.sunset}>
        <Btn href={telHref(s.phone)} testid="contact-call-now-button"><Phone className="h-4 w-4" /> Call Now</Btn>
        <Btn href={waHref(s.whatsapp, GENERAL_WA(s.company_name))} external variant="wa" testid="contact-whatsapp-now-button"><MessageCircle className="h-4 w-4" /> WhatsApp Now</Btn>
        <Btn href={`mailto:${s.email}`} variant="outline" testid="contact-send-email-button"><Mail className="h-4 w-4" /> Send Email</Btn>
        <Btn to="/quote" variant="navy" testid="contact-request-quote-button">Request a Quote</Btn>
      </PageHero>
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionTitle eyebrow="Official Details" title={s.company_name} />
            <Stagger className="grid gap-3 sm:grid-cols-2">
              {cards.map((c) => {
                const inner = (
                  <>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-soft text-ocean"><c.i className="h-5 w-5" /></span>
                    <span className="min-w-0"><span className="block text-[11.5px] font-bold uppercase tracking-wider text-slate-500">{c.l}</span><span className="block break-words text-[15px] font-semibold text-navy" data-testid={c.tid}>{c.v}</span></span>
                  </>
                );
                return (
                  <StaggerItem key={c.l}>
                    {c.href ? (
                      <a href={c.href} {...(c.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-center gap-3 rounded-2xl border border-sky-100 p-4 transition-colors hover:border-ocean">{inner}</a>
                    ) : (
                      <div className="flex items-center gap-3 rounded-2xl border border-sky-100 p-4">{inner}</div>
                    )}
                  </StaggerItem>
                );
              })}
            </Stagger>
            <Reveal dir="up" className="mt-6 overflow-hidden rounded-3xl border border-sky-100 shadow-sm">
              <iframe title="Office location map" data-testid="contact-map" src={`https://www.google.com/maps?q=${encodeURIComponent(s.map_query)}&output=embed`} className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </Reveal>
          </div>
          <Reveal dir="right">
            <form data-testid="contact-form" onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="rounded-3xl border border-sky-100 bg-sky-soft/50 p-6 shadow-[0_30px_60px_-35px_rgba(11,29,58,0.4)] sm:p-8">
              <h3 className="text-2xl font-bold text-navy">Send us a message</h3>
              <p className="mt-1 text-[14px] text-slate-600">We usually respond the same business day.</p>
              <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} aria-hidden />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input required minLength={2} placeholder="Full name *" value={f.name} onChange={set("name")} className="h-11 rounded-xl bg-white" data-testid="contact-name-input" />
                <Input required type="email" placeholder="Email *" value={f.email} onChange={set("email")} className="h-11 rounded-xl bg-white" data-testid="contact-email-input" />
                <Input placeholder="Phone / WhatsApp" value={f.phone} onChange={set("phone")} className="h-11 rounded-xl bg-white" data-testid="contact-phone-input" />
                <Input placeholder="Subject" value={f.subject} onChange={set("subject")} className="h-11 rounded-xl bg-white" data-testid="contact-subject-input" />
              </div>
              <Textarea required minLength={5} rows={6} placeholder="Your message *" value={f.message} onChange={set("message")} className="mt-4 rounded-xl bg-white" data-testid="contact-message-input" />
              <button type="submit" disabled={send.isPending} data-testid="contact-submit-button" className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-ocean px-7 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60">
                <Send className="h-4 w-4" /> {send.isPending ? "Sending…" : "Send Message"}
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
