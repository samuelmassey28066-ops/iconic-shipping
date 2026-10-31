import { Compass, Eye, HandHeart, Lightbulb, Target, Workflow } from "lucide-react";
import { PageTransition, Reveal, RevealImage, Stagger, StaggerItem } from "@/components/site/Motion";
import { Btn, CtaBanner, PageHero, SectionTitle } from "@/components/site/Sections";
import { IMG, WHY_US } from "@/lib/content";
import { useSettings } from "@/lib/hooks";

const BLOCKS = [
  { i: Compass, t: "Company Introduction", d: "A Gandhidham-based marine services company supporting ship owners, operators, charterers and agents with port clearance, marine logistics, marine supply and vessel cleaning coordination." },
  { i: Target, t: "Our Mission", d: "To simplify marine operations through professional coordination, reliable services and customer-focused support at every port call." },
  { i: Eye, t: "Our Vision", d: "To be a dependable, trusted name for port and vessel services across Indian ports, known for responsiveness and integrity." },
  { i: Lightbulb, t: "Our Expertise", d: "Port clearance formalities, documentation coordination, ship agency support, cargo and container coordination, hold cleaning and tank squeezing." },
  { i: HandHeart, t: "Our Commitment", d: "Quality-focused execution, safety-conscious working practices and transparent communication with every client." },
  { i: Workflow, t: "Our Service Approach", d: "Understand the requirement, share a clear quotation, coordinate execution on schedule and keep you updated until completion." },
];

export function WhyUsPage() {
  return (
    <PageTransition>
      <PageHero eyebrow="Why Choose Us" title="Your Reliable Partner for" highlight="Smooth Marine Operations." text="Professional coordination, dependable execution and direct support for vessels calling at Indian ports." image={IMG.shipDock}>
        <Btn to="/quote" testid="why-quote-button">Request a Quote</Btn>
      </PageHero>
      <section className="bg-white px-4 py-20 sm:px-6">
        <Stagger className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map((w, i) => (
            <StaggerItem key={w.title} className="group rounded-3xl border border-sky-100 bg-gradient-to-b from-white to-sky-soft p-7 shadow-[0_20px_40px_-30px_rgba(11,29,58,0.4)]">
              <span className="text-[12px] font-bold tracking-widest text-sky-400">{String(i + 1).padStart(2, "0")}</span>
              <span className="mt-3 grid h-14 w-14 place-items-center rounded-2xl bg-ocean text-white shadow-[0_12px_24px_-10px_rgba(2,132,199,0.9)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"><w.icon className="h-6 w-6" /></span>
              <h3 className="mt-5 text-[17px] font-bold text-navy">{w.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{w.text}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
      <CtaBanner />
    </PageTransition>
  );
}

export default function About() {
  const s = useSettings();
  return (
    <PageTransition>
      <PageHero eyebrow="About Us" title="A Dependable Partner for" highlight="Your Vessel at Indian Ports." text={s.about_text} image={IMG.dusk}>
        <Btn to="/contact" testid="about-contact-button">Talk to {s.owner}</Btn>
      </PageHero>
      <section className="bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <RevealImage src={IMG.cranes} alt="Port cranes" dir="left" className="row-span-2 aspect-[3/4]" />
            <RevealImage src={IMG.aerial} alt="Container terminal" dir="down" className="aspect-square" />
            <RevealImage src={IMG.holdWorkers} alt="Hold cleaning team" dir="up" className="aspect-square" />
          </div>
          <div>
            <Reveal dir="right"><img src="/logo-wordmark.png" alt="ICONIC Shipping Services" className="mb-6 h-20 w-auto" data-testid="about-wordmark" /></Reveal>
            <SectionTitle eyebrow={`Owner · ${s.owner}`} title="Built on Coordination," highlight="Reliability & Care." />
            <Reveal dir="right"><p className="-mt-4 text-[16px] leading-relaxed text-slate-600">Led by {s.owner}, {s.company_name} works closely with port authorities, customs, shipping lines, terminal operators and trusted vendors to keep your vessel's port call smooth — from arrival formalities to hold preparation for the next cargo.</p></Reveal>
            <Reveal dir="right" delay={0.1}><p className="mt-4 text-[16px] leading-relaxed text-slate-600">Based in {s.location}, near the Kandla (Deendayal) and Mundra port region, we focus on responsive communication and practical solutions.</p></Reveal>
          </div>
        </div>
      </section>
      <section className="bg-sky-soft px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Who We Are" title="Our Purpose &" highlight="Approach" center />
          <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {BLOCKS.map((b) => (
              <StaggerItem key={b.t} className="rounded-3xl bg-white p-7 shadow-[0_20px_40px_-30px_rgba(11,29,58,0.45)]">
                <b.i className="h-8 w-8 text-ocean" />
                <h3 className="mt-4 text-[18px] font-bold text-navy" data-testid={`about-block-${b.t.toLowerCase().replace(/\s+/g, "-")}`}>{b.t}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{b.d}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
      <CtaBanner />
    </PageTransition>
  );
}
