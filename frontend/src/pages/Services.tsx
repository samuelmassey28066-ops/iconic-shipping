import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, MessageCircle, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { PageTransition, Stagger, StaggerItem } from "@/components/site/Motion";
import { Btn, CtaBanner, PageHero, SectionTitle } from "@/components/site/Sections";
import ServiceInquiry from "@/components/site/ServiceInquiry";
import { IMG, SPECIALIZED_30, mailHref, waHref, waMessage } from "@/lib/content";
import type { ServiceDef } from "@/lib/content";
import { useServices, useSettings } from "@/lib/hooks";

export default function Services() {
  const s = useSettings();
  const svc = useServices().filter((x) => x.visible !== false);
  const [panel, setPanel] = useState<ServiceDef | null>(null);
  const [q, setQ] = useState("");
  const list = SPECIALIZED_30.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <PageTransition>
      <PageHero eyebrow="Our Services" title="Complete Marine Services" highlight="for Indian Ports" text="Port clearance, marine logistics, hold cleaning, tank squeezing, marine supply and technical services — coordinated from Gandhidham, Gujarat." image={IMG.aerial}>
        <Btn to="/quote" testid="services-hero-quote-button">Request a Quote</Btn>
      </PageHero>
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Service Categories" title="Choose a Service to" highlight="View Details" text="Click any service to open a quick panel with the full description and a ready-made inquiry, or open its dedicated page." />
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {svc.map((x) => (
              <StaggerItem key={x.slug}>
                <button onClick={() => setPanel(x)} data-testid={`service-card-${x.slug}`} className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-sky-100 bg-white text-left shadow-[0_20px_40px_-30px_rgba(11,29,58,0.5)] transition-[border-color,box-shadow] hover:border-sky-300 hover:shadow-[0_30px_50px_-25px_rgba(2,132,199,0.45)]">
                  <div className="relative h-48 overflow-hidden">
                    <img src={x.image} alt={x.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    {x.main && <span className="absolute left-4 top-4 rounded-full bg-ocean px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Primary</span>}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="-mt-12 mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-ocean shadow-lg ring-4 ring-white transition-colors group-hover:bg-ocean group-hover:text-white"><x.icon className="h-5 w-5" /></span>
                    <h3 className="text-[18px] font-bold leading-snug text-navy">{x.title}</h3>
                    <p className="mt-2 flex-1 text-[14px] leading-relaxed text-slate-600">{x.short}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ocean">View details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </button>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
      <section className="bg-sky-soft px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionTitle eyebrow="Port & Logistics Directory" title="30+ Specialized" highlight="Port Services" />
            <div className="relative mb-10 w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services" className="h-11 rounded-full bg-white pl-9" data-testid="services-search-input" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="services-directory">
            {list.map((x, i) => (
              <motion.div layout key={x.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ delay: (i % 6) * 0.04 }} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <x.icon className="h-5 w-5 shrink-0 text-ocean" />
                <span className="flex-1 text-[14px] font-medium text-navy">{x.name}</span>
                <a href={waHref(s.whatsapp, `Hello ${s.company_name},\n\nI would like to enquire about: ${x.name}\n\nVessel Name: [Enter vessel name]\nVessel Location / Port: [Enter location]\nRequirements: [Enter details]\n\nPlease share your quotation.\n\nThank you.`)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp about ${x.name}`} className="grid h-8 w-8 place-items-center rounded-full bg-wa/10 text-wa transition-colors hover:bg-wa hover:text-white"><MessageCircle className="h-4 w-4" /></a>
              </motion.div>
            ))}
            {!list.length && <p className="text-slate-500">No services match “{q}”.</p>}
          </div>
        </div>
      </section>
      <CtaBanner />

      <Sheet open={!!panel} onOpenChange={(o) => !o && setPanel(null)}>
        <SheetContent side="right" showCloseButton={false} className="w-full overflow-y-auto border-l-0 bg-white p-0 sm:max-w-xl" data-testid="service-side-panel">
          {panel && (
            <>
              <SheetTitle className="sr-only">{panel.title}</SheetTitle>
              <div className="relative h-56 overflow-hidden">
                <motion.img initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 1.2 }} src={panel.image} alt={panel.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 to-transparent" />
                <button onClick={() => setPanel(null)} aria-label="Close panel" data-testid="service-panel-close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-navy transition-transform hover:rotate-90"><X className="h-4 w-4" /></button>
                <h2 className="absolute bottom-4 left-6 right-6 text-2xl font-extrabold text-white">{panel.title}</h2>
              </div>
              <div className="space-y-5 p-6">
                <p className="text-[15px] leading-relaxed text-slate-600">{panel.description}</p>
                <div className="flex flex-wrap gap-2">
                  {panel.items.map((it) => <span key={it} className="rounded-full bg-sky-soft px-3 py-1 text-[12.5px] font-medium text-navy">{it}</span>)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Btn href={waHref(s.whatsapp, waMessage(panel, {}, s.company_name))} external variant="wa" testid="panel-whatsapp-button" className="h-11 text-[13px]"><MessageCircle className="h-4 w-4" /> WhatsApp</Btn>
                  <Btn href={mailHref(panel, s.email, {}, s.company_name)} testid="panel-email-button" className="h-11 text-[13px]"><Mail className="h-4 w-4" /> Email</Btn>
                </div>
                <Link to={panel.path} data-testid="panel-full-page-link" className="inline-flex items-center gap-1 text-[14px] font-semibold text-ocean">Open full service page <ArrowRight className="h-4 w-4" /></Link>
                <ServiceInquiry service={panel} compact />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}
