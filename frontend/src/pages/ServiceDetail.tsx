import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, Mail, MessageCircle, Phone } from "lucide-react";
import { PageTransition, Reveal, RevealImage, Stagger, StaggerItem } from "@/components/site/Motion";
import { BeforeAfter, Btn, CtaBanner, PageHero, SectionTitle } from "@/components/site/Sections";
import ServiceInquiry from "@/components/site/ServiceInquiry";
import { HOLD_HIGHLIGHTS, IMG, mailHref, telHref, waHref, waMessage } from "@/lib/content";
import { useServices, useSettings } from "@/lib/hooks";

export function ServicePage({ slug }: { slug: string }) {
  const s = useSettings();
  const nav = useNavigate();
  const svc = useServices();
  const service = svc.find((x) => x.slug === slug);
  if (!service) return <Navigate to="/services" replace />;
  const others = svc.filter((x) => x.slug !== slug && x.visible !== false).slice(0, 4);
  const [first, ...rest] = service.title.split(" & ");
  return (
    <PageTransition>
      <motion.div initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} data-testid={`service-page-${slug}`}>
        <PageHero eyebrow={service.main ? "Primary Service" : "Marine Supply & Technical Services"} title={rest.length ? `${first} &` : ""} highlight={rest.length ? rest.join(" & ") : service.title} text={service.short} image={service.image}>
          <Btn to={`/quote?service=${slug}`} testid="service-request-quote-button">Request a Quote</Btn>
          <Btn href={waHref(s.whatsapp, waMessage(service, {}, s.company_name))} external variant="wa" testid="service-hero-whatsapp-button"><MessageCircle className="h-4 w-4" /> WhatsApp Enquiry</Btn>
          <Btn href={mailHref(service, s.email, {}, s.company_name)} variant="outline" testid="service-hero-email-button"><Mail className="h-4 w-4" /> Email Enquiry</Btn>
        </PageHero>
      </motion.div>

      <section className="bg-white px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <button onClick={() => (window.history.length > 1 ? nav(-1) : nav("/services"))} data-testid="service-back-button" className="mb-8 inline-flex items-center gap-2 rounded-full border border-sky-200 px-4 py-2 text-[13px] font-semibold text-navy transition-[transform,border-color] hover:-translate-x-1 hover:border-ocean">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <SectionTitle eyebrow="Service Overview" title={service.title} />
              <Reveal dir="left"><p className="-mt-4 text-[16px] leading-relaxed text-slate-600" data-testid="service-description">{service.description}</p></Reveal>
              <Stagger className="mt-8 grid gap-3 sm:grid-cols-2">
                {service.items.map((it, i) => (
                  <StaggerItem key={it} className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-soft/60 p-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ocean text-[11px] font-bold text-white">{i + 1}</span>
                    <span className="text-[14.5px] font-semibold text-navy">{it}</span>
                  </StaggerItem>
                ))}
              </Stagger>
              <div className="mt-10 grid grid-cols-2 gap-4">
                {service.gallery.slice(0, 4).map((g, i) => (
                  <RevealImage key={g} src={g} alt={`${service.title} photo ${i + 1}`} dir={i % 2 ? "right" : "left"} className="aspect-[4/3]" parallax={20} />
                ))}
              </div>
            </div>
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ServiceInquiry service={service} />
              <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
                <a href={telHref(s.phone)} className="inline-flex items-center gap-1.5 rounded-full bg-sky-soft px-3 py-1.5 font-semibold text-navy"><Phone className="h-3.5 w-3.5 text-ocean" /> {s.phone}</a>
                <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1.5 rounded-full bg-sky-soft px-3 py-1.5 font-semibold text-navy"><Mail className="h-3.5 w-3.5 text-ocean" /> {s.email}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {slug === "hold-cleaning" || slug === "hold-tank-cleaning" ? (
        <section className="bg-sky-soft px-4 py-20 sm:px-6" data-testid="before-after-section">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionTitle eyebrow="Before & After" title="Vessel-Ready" highlight="Cleaning Support" text="Drag the slider to compare a cargo hold after discharge and after cleaning. Final results depend on cargo residue, hold condition and the agreed scope of work." />
              <Stagger className="grid gap-2.5 sm:grid-cols-2">
                {HOLD_HIGHLIGHTS.map((h) => (
                  <StaggerItem key={h.t} hover={false} className="flex items-center gap-2 text-[14px] font-semibold text-navy"><CheckCircle2 className="h-4.5 w-4.5 text-ocean" /> {h.t}</StaggerItem>
                ))}
              </Stagger>
            </div>
            <Reveal dir="right"><BeforeAfter before={IMG.holdBefore} after={IMG.holdAfter} /></Reveal>
          </div>
          <div className="mx-auto mt-10 grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4">
            {[IMG.holdWorkers, IMG.tank, IMG.holdBefore, IMG.holdAfter].map((g, i) => (
              <RevealImage key={g} src={g} alt={`Hold cleaning gallery ${i + 1}`} className="aspect-square" parallax={15} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h3 className="mb-6 text-2xl font-bold text-navy">Other Services</h3>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => (
              <StaggerItem key={o.slug}>
                <Link to={o.path} data-testid={`other-service-${o.slug}`} className="group block overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
                  <div className="h-36 overflow-hidden"><img src={o.image} alt={o.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" /></div>
                  <div className="p-4"><o.icon className="h-5 w-5 text-ocean" /><p className="mt-2 text-[14.5px] font-bold text-navy">{o.title}</p></div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
      <CtaBanner />
    </PageTransition>
  );
}

export default function ServiceDetail() {
  const { slug = "" } = useParams();
  if (slug === "port-clearance") return <Navigate to="/port-clearance" replace />;
  if (slug === "hold-cleaning") return <Navigate to="/hold-cleaning" replace />;
  return <ServicePage key={slug} slug={slug} />;
}
