import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, MessageCircle, MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMG, waHref } from "@/lib/content";
import { useSettings } from "@/lib/hooks";
import { Eyebrow, Reveal, SplitHeading } from "./Motion";
import { WaveBand } from "./Wave";

export function Btn({ to, href, children, variant = "primary", testid, className, external }: {
  to?: string; href?: string; children: ReactNode; variant?: "primary" | "outline" | "wa" | "white" | "navy"; testid?: string; className?: string; external?: boolean;
}) {
  const cls = cn(
    "group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full px-6 text-[14px] font-semibold transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 active:scale-[0.97]",
    variant === "primary" && "bg-ocean text-white shadow-[0_14px_30px_-12px_rgba(2,132,199,0.85)] hover:shadow-[0_20px_40px_-12px_rgba(2,132,199,0.9)]",
    variant === "outline" && "border border-sky-200 bg-white/80 text-navy hover:border-ocean hover:bg-white",
    variant === "wa" && "bg-wa text-white shadow-[0_14px_30px_-12px_rgba(37,211,102,0.85)]",
    variant === "white" && "bg-white text-navy hover:bg-sky-50",
    variant === "navy" && "bg-navy text-white hover:bg-navy-2",
    className,
  );
  const inner = (
    <>
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {children}
    </>
  );
  if (href) return <a href={href} data-testid={testid} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a>;
  return <Link to={to ?? "/"} data-testid={testid} className={cls}>{inner}</Link>;
}

export function SectionTitle({ eyebrow, title, highlight, text, center, light }: { eyebrow: string; title: string; highlight?: string; text?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={cn("mb-10 max-w-3xl", center && "mx-auto text-center [&_p]:justify-center")}>
      <Eyebrow light={light}>{eyebrow}</Eyebrow>
      <SplitHeading text={title} highlight={highlight} className={cn("text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-[44px]", light ? "text-white" : "text-navy")} />
      {text && (
        <Reveal dir="right" delay={0.1}>
          <p className={cn("mt-4 text-[16px] leading-relaxed", light ? "text-slate-300" : "text-slate-600")}>{text}</p>
        </Reveal>
      )}
    </div>
  );
}

export function PageHero({ eyebrow, title, highlight, text, image, children }: { eyebrow: string; title: string; highlight?: string; text: string; image: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 140]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.08, 1.2]);
  return (
    <section ref={ref} className="relative overflow-hidden bg-sky-soft pb-24 pt-32 sm:pt-40" data-testid="page-hero">
      <motion.div className="absolute inset-y-0 right-0 w-full lg:w-[62%]" style={{ y }}>
        <motion.img src={image} alt="" style={{ scale }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,#F0F7FF_0%,rgba(240,247,255,0.92)_35%,rgba(240,247,255,0.25)_75%,rgba(240,247,255,0)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(240,247,255,0.9),rgba(240,247,255,0.97))]" />
      </motion.div>
      <div className="relative mx-auto max-w-7xl px-6">
        <motion.p initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ocean">{eyebrow}</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="max-w-2xl text-4xl font-extrabold leading-[1.08] text-navy sm:text-5xl lg:text-[56px]">
          {title} {highlight && <span className="text-gradient-ocean">{highlight}</span>}
        </motion.h1>
        <motion.p initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.25 }} className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-slate-600">{text}</motion.p>
        {children && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }} className="mt-8 flex flex-wrap gap-3">{children}</motion.div>}
      </div>
      <WaveBand color="#ffffff" opacity={0.5} className="bottom-0 h-16" slow />
      <WaveBand color="#ffffff" className="-bottom-1 h-12" />
    </section>
  );
}

export function CtaBanner() {
  const s = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], [-60, 60]);
  return (
    <section ref={ref} className="px-4 py-16 sm:px-6" data-testid="cta-banner">
      <Reveal dir="zoom" className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-navy">
        <motion.img src={IMG.sunset} alt="Ship at sunset" loading="lazy" style={{ x, scale: 1.2 }} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,29,58,0.95)_0%,rgba(11,29,58,0.75)_55%,rgba(11,29,58,0.3)_100%)]" />
        <div className="relative flex flex-col gap-6 px-8 py-12 sm:px-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Ready to Move Your <span className="text-sky-300">Vessel & Cargo?</span></h2>
            <p className="mt-2 max-w-xl text-slate-300">Get in touch with {s.owner} and our team for reliable port clearance, marine logistics and vessel cleaning support.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Btn to="/quote" testid="cta-get-quote-button">Get a Quote <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Btn>
            <Btn href={waHref(s.whatsapp, `Hello ${s.company_name},\n\nI would like a quotation.\n\nRequired Service: [Enter service]\nVessel Name: [Enter vessel name]\nVessel Location / Port: [Enter location]\n\nThank you.`)} external variant="wa" testid="cta-whatsapp-button"><MessageCircle className="h-4 w-4" /> WhatsApp</Btn>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-[16/10] select-none overflow-hidden rounded-3xl shadow-[0_30px_60px_-25px_rgba(11,29,58,0.45)]" data-testid="before-after-slider">
      <img src={after} alt="After cleaning" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="Before cleaning" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <span className="absolute left-4 top-4 rounded-full bg-navy/80 px-3 py-1 text-xs font-bold text-white">BEFORE</span>
      <span className="absolute right-4 top-4 rounded-full bg-ocean px-3 py-1 text-xs font-bold text-white">AFTER</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ocean shadow-lg"><MoveHorizontal className="h-5 w-5" /></span>
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare before and after" data-testid="before-after-range" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-[11px] text-slate-600">Illustrative images</p>
    </div>
  );
}
