import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Anchor, ArrowRight, CheckCircle2, Compass, Globe2, LifeBuoy, MessageCircle, Play, ShieldCheck, Ship, Waves, Headset, Target, Eye } from "lucide-react";
import { Counter, Eyebrow, PageTransition, Reveal, RevealImage, SplitHeading, Stagger, StaggerItem } from "@/components/site/Motion";
import { Btn, CtaBanner, SectionTitle } from "@/components/site/Sections";
import { WaveBand } from "@/components/site/Wave";
import Testimonials from "@/components/site/Testimonials";
import { HOLD_HIGHLIGHTS, IMG, SPECIALIZED_30, WHY_US, waHref, waMessage } from "@/lib/content";
import { useServices, useSettings } from "@/lib/hooks";

function Hero() {
  const s = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 180]);
  const imgScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1, 1.12]);
  const textY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -80]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);
  const trust = [
    { icon: Anchor, t: "Professional Marine Services", d: "Port & vessel support" },
    { icon: Compass, t: "Reliable Port Coordination", d: "Across Indian ports" },
    { icon: ShieldCheck, t: "Quality & Safety Commitment", d: "On every assignment" },
  ];
  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden bg-sky-soft" data-testid="home-hero">
      <motion.div className="absolute inset-0 overflow-hidden lg:left-[30%]" style={{ y: imgY }}>
        <motion.img
          src={s.hero_image || IMG.hero}
          alt="Container ship at an international seaport with port cranes"
          fetchPriority="high"
          initial={reduce ? false : { scale: 1.25, opacity: 0 }}
          animate={{ scale: 1.05, opacity: 1 }}
          transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ scale: imgScale }}
          className="h-full w-full object-cover"
          data-testid="hero-image"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,#F0F7FF_0%,rgba(240,247,255,0.94)_22%,rgba(240,247,255,0.35)_55%,rgba(240,247,255,0)_80%)] max-lg:bg-[linear-gradient(180deg,rgba(240,247,255,0.92)_0%,rgba(240,247,255,0.8)_60%,rgba(240,247,255,0.5)_100%)]" />
      </motion.div>
      {/* floating maritime icons */}
      {[{ I: Ship, c: "left-[46%] top-[22%]", d: 0 }, { I: LifeBuoy, c: "left-[8%] bottom-[18%]", d: 1.5 }, { I: Anchor, c: "right-[6%] top-[30%]", d: 3 }].map(({ I, c, d }, i) => (
        <div key={i} className={`absolute hidden lg:block ${c} animate-float`} style={{ animationDelay: `${d}s` }} aria-hidden>
          <div className="glass grid h-12 w-12 place-items-center rounded-2xl border border-white/70 text-ocean shadow-lg"><I className="h-5 w-5" /></div>
        </div>
      ))}
      <motion.div style={{ y: textY, opacity: fade }} className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-6 pb-40 pt-32">
        <motion.p initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-ocean">
          <span className="h-px w-10 bg-ocean" /> Port Clearance & Marine Logistics Services
        </motion.p>
        <h1 className="max-w-3xl text-[40px] font-extrabold leading-[1.05] text-navy sm:text-6xl lg:text-[68px]" data-testid="hero-title">
          <motion.span className="block" initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}>{s.hero_title}</motion.span>
          <motion.span className="block text-gradient-ocean" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}>{s.hero_highlight}</motion.span>
        </h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }} className="mt-6 max-w-xl text-[18px] font-semibold leading-snug text-navy/90" data-testid="hero-subtitle">{s.hero_subtitle}</motion.p>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.05 }} className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-slate-600">{s.hero_description}</motion.p>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.2 }} className="mt-8 flex flex-wrap gap-3">
          <Btn to="/services" testid="hero-explore-services-button">Explore Our Services <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Btn>
          <Btn to="/quote" variant="navy" testid="hero-request-quote-button">Request a Quotation</Btn>
          <Btn href={waHref(s.whatsapp, `Hello ${s.company_name},\n\nI would like to enquire about your services.\n\nRequired Service: [Enter service]\nVessel Name: [Enter vessel name]\nVessel Location / Port: [Enter location]\n\nThank you.`)} external variant="wa" testid="hero-whatsapp-button"><MessageCircle className="h-4 w-4" /> Contact Us on WhatsApp</Btn>
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 1.5 }} className="absolute inset-x-0 bottom-20 z-10 px-4">
        <div className="glass mx-auto grid max-w-3xl gap-2 rounded-3xl border border-white/80 p-3 shadow-[0_25px_50px_-20px_rgba(11,29,58,0.35)] sm:grid-cols-3 lg:ml-auto lg:mr-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]" data-testid="hero-trust-bar">
          {trust.map((t) => (
            <div key={t.t} className="flex items-center gap-3 rounded-2xl px-3 py-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-100 text-ocean"><t.icon className="h-5 w-5" /></span>
              <span><span className="block text-[13px] font-bold text-navy">{t.t}</span><span className="text-[11.5px] text-slate-500">{t.d}</span></span>
            </div>
          ))}
        </div>
      </motion.div>
      <WaveBand color="#ffffff" opacity={0.45} className="bottom-0 h-24" slow />
      <WaveBand color="#ffffff" className="-bottom-1 h-16" />
    </section>
  );
}

function Specialized() {
  return (
    <section className="relative bg-white px-4 py-20 sm:px-6" data-testid="specialized-services">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionTitle eyebrow="Port Clearance & Marine Logistics Services" title="Our" highlight="30+ Specialized Services" text="End-to-end support for your port operations, documentation and cargo movement." />
          <Reveal dir="right" className="mb-10"><Btn to="/port-clearance" variant="outline" testid="specialized-view-all">View Port Services <ArrowRight className="h-4 w-4" /></Btn></Reveal>
        </div>
        <Stagger className="grid gap-x-6 rounded-[28px] border border-sky-100 bg-gradient-to-b from-white to-sky-soft/60 p-4 shadow-[0_30px_60px_-40px_rgba(11,29,58,0.4)] sm:p-6 md:grid-cols-2 lg:grid-cols-3">
          {SPECIALIZED_30.map((x, i) => (
            <StaggerItem key={x.name} hover={false} className="group flex items-center gap-4 border-b border-sky-100/80 px-2 py-3.5 transition-colors hover:bg-white">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ocean text-[12px] font-bold text-white shadow-[0_6px_14px_-6px_rgba(2,132,199,0.9)] transition-transform group-hover:scale-110">{i + 1}</span>
              <x.icon className="h-5 w-5 shrink-0 text-navy/70 transition-colors group-hover:text-ocean" />
              <span className="text-[14px] font-medium text-navy">{x.name}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function MainServices() {
  const s = useSettings();
  const svc = useServices();
  const port = svc.find((x) => x.slug === "port-clearance")!;
  const hold = svc.find((x) => x.slug === "hold-cleaning")!;
  return (
    <>
      {/* SERVICE 01 */}
      <section className="relative overflow-hidden bg-navy py-24 text-white" data-testid="main-service-port-clearance">
        <motion.img src={port.image} alt="Port cranes and cargo ships" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-30" initial={{ scale: 1.2 }} whileInView={{ scale: 1.05 }} viewport={{ once: false }} transition={{ duration: 2 }} />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(11,29,58,0.97)_20%,rgba(11,29,58,0.8)_60%,rgba(2,132,199,0.45))]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Eyebrow light>Service 01 · Primary Service</Eyebrow>
              <SplitHeading text="Port Clearance &" highlight="Marine Logistics Services" className="text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl" />
              <Reveal dir="left" delay={0.1}><p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-slate-300">{port.short}</p></Reveal>
              <Reveal dir="up" delay={0.2} className="mt-8 flex flex-wrap gap-3">
                <Btn to="/port-clearance" testid="port-service-details-button">Service Details <ArrowRight className="h-4 w-4" /></Btn>
                <Btn to="/quote?service=port-clearance" variant="white" testid="port-service-quote-button">Request Quotation</Btn>
                <Btn href={waHref(s.whatsapp, waMessage(port, {}, s.company_name))} external variant="wa" testid="port-service-whatsapp-button"><MessageCircle className="h-4 w-4" /> WhatsApp</Btn>
                <Btn to="/contact" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10" testid="port-service-contact-button">Contact Us</Btn>
              </Reveal>
            </div>
            <RevealImage src={IMG.aerial} alt="Container terminal aerial view" dir="right" className="hidden h-72 shadow-2xl lg:block" />
          </div>
          <Stagger className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {port.items.map((it, i) => (
              <StaggerItem key={it} className="group rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md transition-colors hover:border-sky-400/50 hover:bg-white/10">
                <span className="text-[11px] font-bold tracking-widest text-sky-300">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-1.5 text-[14.5px] font-semibold leading-snug">{it}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* SERVICE 02 */}
      <section className="relative bg-sky-soft py-24" data-testid="main-service-hold-cleaning">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_1fr_0.8fr]">
          <div className="relative">
            <RevealImage src={hold.image} alt="Cargo hold cleaning crew with high pressure washing" dir="left" className="aspect-[4/3] shadow-[0_30px_60px_-25px_rgba(11,29,58,0.5)]" testid="hold-feature-image" />
            <Link to="/hold-cleaning" aria-label="View hold cleaning service" className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ocean shadow-xl transition-transform hover:scale-110" data-testid="hold-play-button">
              <span className="absolute inset-0 rounded-full bg-white animate-ring" />
              <Play className="relative ml-1 h-6 w-6 fill-ocean" />
            </Link>
          </div>
          <div>
            <Eyebrow>Service 02 · Primary Service</Eyebrow>
            <SplitHeading text="Hold Cleaning &" highlight="Tank Squeezing" className="text-4xl font-extrabold leading-[1.08] text-navy sm:text-5xl" />
            <Reveal dir="right" delay={0.1}><p className="mt-5 text-[16px] leading-relaxed text-slate-600">{hold.short}</p></Reveal>
            <Reveal dir="up" delay={0.2} className="mt-7 flex flex-wrap gap-3">
              <Btn to="/hold-cleaning" testid="hold-service-details-button">View Services <ArrowRight className="h-4 w-4" /></Btn>
              <Btn href={waHref(s.whatsapp, waMessage(hold, {}, s.company_name))} external variant="wa" testid="hold-service-whatsapp-button"><MessageCircle className="h-4 w-4" /> Enquire</Btn>
            </Reveal>
          </div>
          <Stagger className="space-y-2.5">
            {hold.items.slice(0, 9).map((it) => (
              <StaggerItem key={it} hover={false} className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2 text-[14px] text-navy shadow-sm">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-ocean" /> {it}
              </StaggerItem>
            ))}
          </Stagger>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-wrap gap-2.5 px-6">
          {HOLD_HIGHLIGHTS.map((h, i) => (
            <Reveal key={h.t} delay={i * 0.05} dir="up">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-[13px] font-semibold text-navy"><h.i className="h-4 w-4 text-ocean" /> {h.t}</span>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

function SupplyServices() {
  const svc = useServices().filter((x) => !x.main && x.visible !== false);
  return (
    <section className="bg-white px-4 py-24 sm:px-6" data-testid="supply-services">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <SectionTitle eyebrow="Marine Supply & Technical Services" title="Keep Your Fleet" highlight="Running Smoothly" text="High-quality marine supplies, technical support and coordinated services for seamless vessel operations. Open any service for details and a ready-made WhatsApp or email inquiry." />
          <RevealImage src={IMG.shipDock} alt="Ship at berth with crew" dir="right" className="hidden aspect-[16/9] lg:block" />
        </div>
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {svc.map((x, i) => (
            <StaggerItem key={x.slug} className={i === 0 ? "sm:col-span-2 lg:row-span-2" : ""}>
              <Link to={x.path} data-testid={`supply-card-${x.slug}`} className="group relative flex h-full min-h-[230px] flex-col justify-end overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-[0_25px_50px_-30px_rgba(11,29,58,0.7)]">
                <img src={x.image} alt={x.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-transparent" />
                <div className="relative">
                  <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur-md transition-colors group-hover:bg-ocean"><x.icon className="h-5 w-5" /></span>
                  <h3 className={i === 0 ? "text-2xl font-bold" : "text-lg font-bold leading-snug"}>{x.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[13px] text-slate-300">{x.short}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-sky-300">Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { n: 30, s: "+", l: "Port & logistics services" },
    { n: 9, s: "", l: "Service categories" },
    { n: 2, s: "", l: "Primary business divisions" },
    { n: 100, s: "%", l: "Commitment to safety" },
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-ocean to-cyan py-14 text-white" data-testid="stats-section">
      <WaveBand color="#ffffff" opacity={0.08} className="top-0 h-full" slow />
      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 lg:grid-cols-4">
        {items.map((it) => (
          <Reveal key={it.l} dir="up" className="text-center">
            <Counter to={it.n} suffix={it.s} className="font-heading text-5xl font-extrabold" />
            <p className="mt-1 text-[14px] text-sky-100">{it.l}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function WhyAbout() {
  const s = useSettings();
  return (
    <>
      <section className="bg-white px-4 py-24 sm:px-6" data-testid="why-section">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Why Choose ICONIC Shipping Services" title="Your Reliable Partner for" highlight="Smooth Marine Operations." center />
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((w) => (
              <StaggerItem key={w.title} className="group rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_20px_40px_-30px_rgba(11,29,58,0.4)] transition-[border-color,box-shadow] hover:border-sky-300 hover:shadow-[0_30px_50px_-25px_rgba(2,132,199,0.45)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-soft text-ocean transition-[background-color,color,transform] duration-300 group-hover:rotate-6 group-hover:bg-ocean group-hover:text-white"><w.icon className="h-5.5 w-5.5" /></span>
                <h3 className="mt-5 text-[16.5px] font-bold text-navy">{w.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-slate-600">{w.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
      <section className="bg-sky-soft px-4 py-24 sm:px-6" data-testid="about-teaser">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <RevealImage src={IMG.dusk} alt="Port cranes at dusk" dir="left" className="aspect-[4/3] shadow-[0_30px_60px_-25px_rgba(11,29,58,0.5)]" />
          <div>
            <SectionTitle eyebrow="About Us" title="A Dependable Partner for" highlight="Your Vessel at Indian Ports." />
            <Reveal dir="right"><p className="-mt-4 text-[16px] leading-relaxed text-slate-600">{s.about_text}</p></Reveal>
            <Stagger className="mt-7 grid gap-3 sm:grid-cols-3">
              {[{ i: Target, t: "Mission" }, { i: Eye, t: "Vision" }, { i: Headset, t: "Support" }].map((x) => (
                <StaggerItem key={x.t} className="flex items-center gap-2 rounded-2xl bg-white p-3 text-[14px] font-semibold text-navy shadow-sm"><x.i className="h-5 w-5 text-ocean" /> {x.t}</StaggerItem>
              ))}
            </Stagger>
            <Reveal dir="up" className="mt-8"><Btn to="/about" testid="about-learn-more-button">Learn More <ArrowRight className="h-4 w-4" /></Btn></Reveal>
          </div>
        </div>
      </section>
      <section className="border-y border-sky-100 bg-white px-6 py-10">
        <Stagger className="mx-auto grid max-w-7xl grid-cols-2 gap-6 md:grid-cols-5">
          {[{ i: Anchor, t: "Port Connectivity", d: "Indian port operations" }, { i: ShieldCheck, t: "Safety Focus", d: "Safety-conscious work" }, { i: Waves, t: "Marine Expertise", d: "Vessel-ready support" }, { i: Globe2, t: "International Clients", d: "Ship owners & agents" }, { i: Headset, t: "Direct Support", d: `Talk to ${s.owner}` }].map((x) => (
            <StaggerItem key={x.t} hover={false} className="flex items-center gap-3">
              <x.i className="h-8 w-8 shrink-0 text-ocean" />
              <span><span className="block text-[13.5px] font-bold text-navy">{x.t}</span><span className="text-[12px] text-slate-500">{x.d}</span></span>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </>
  );
}

export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <Specialized />
      <MainServices />
      <Stats />
      <SupplyServices />
      <WhyAbout />
      <Testimonials />
      <CtaBanner />
    </PageTransition>
  );
}
