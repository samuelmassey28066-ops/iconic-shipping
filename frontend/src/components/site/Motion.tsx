import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { animate, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { Variants } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
type Dir = "up" | "left" | "right" | "zoom" | "down";

const offset = (dir: Dir, d = 40) =>
  dir === "left" ? { x: -d } : dir === "right" ? { x: d } : dir === "zoom" ? { scale: 0.92 } : dir === "down" ? { y: -d } : { y: d };

// Replays every time it re-enters the viewport (scrolling down or back up).
export function Reveal({
  children, dir = "up", delay = 0, className, amount = 0.25, as = "div",
}: { children: ReactNode; dir?: Dir; delay?: number; className?: string; amount?: number; as?: "div" | "section" | "li" }) {
  const reduce = useReducedMotion();
  const C = as === "li" ? motion.li : as === "section" ? motion.section : motion.div;
  return (
    <C
      className={className}
      initial={reduce ? false : { opacity: 0, ...offset(dir) }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: false, amount }}
      transition={{ duration: 0.75, ease: EASE, delay }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </C>
  );
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function Stagger({ children, className, amount = 0.15 }: { children: ReactNode; className?: string; amount?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: false, amount }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, hover = true }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      className={className}
      variants={staggerChild}
      whileHover={hover ? { y: -6, transition: { duration: 0.25 } } : undefined}
    >
      {children}
    </motion.div>
  );
}

// Heading whose words rise one after another.
export function SplitHeading({ text, highlight, className }: { text: string; highlight?: string; className?: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const hl = highlight ? highlight.split(" ") : [];
  const word = (w: string, i: number, blue: boolean) => (
    <span key={`${blue}-${i}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
      <motion.span
        className={cn("inline-block", blue && "text-gradient-ocean")}
        variants={{ hidden: { y: "110%" }, show: { y: 0, transition: { duration: 0.7, ease: EASE } } }}
      >
        {w}&nbsp;
      </motion.span>
    </span>
  );
  return (
    <motion.h2
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: false, amount: 0.5 }}
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      {words.map((w, i) => word(w, i, false))}
      {hl.length > 0 && <br className="hidden sm:block" />}
      {hl.map((w, i) => word(w, i, true))}
    </motion.h2>
  );
}

export function Eyebrow({ children, className, light }: { children: ReactNode; className?: string; light?: boolean }) {
  return (
    <Reveal dir="left">
      <p className={cn("mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]", light ? "text-sky-300" : "text-ocean", className)}>
        <span className={cn("h-px w-8", light ? "bg-sky-300" : "bg-ocean")} />
        {children}
      </p>
    </Reveal>
  );
}

// Image that zooms out into place on reveal, with subtle scroll parallax and hover zoom.
export function RevealImage({
  src, alt, className, imgClassName, dir = "zoom", parallax = 40, testid,
}: { src: string; alt: string; className?: string; imgClassName?: string; dir?: Dir; parallax?: number; testid?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-parallax, parallax]);
  return (
    <motion.div
      ref={ref}
      data-testid={testid}
      className={cn("group relative overflow-hidden rounded-3xl", className)}
      initial={reduce ? false : { opacity: 0, ...offset(dir, 60), clipPath: "inset(8% 8% 8% 8% round 24px)" }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, clipPath: "inset(0% 0% 0% 0% round 24px)" }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 1, ease: EASE }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{ y, scale: 1.15 }}
        className={cn("h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.22]", imgClassName)}
      />
    </motion.div>
  );
}

export function Counter({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.6, ease: "easeOut", onUpdate: (v) => setVal(Math.round(v)) });
    return () => c.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className={className}>
      {val}
      {suffix}
    </span>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
