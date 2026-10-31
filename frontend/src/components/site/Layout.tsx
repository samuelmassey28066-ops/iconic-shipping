import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { ChevronDown, Mail, Menu, MessageCircle, Phone, UserRound, MapPin, ArrowRight, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GENERAL_WA, IMG, telHref, waHref } from "@/lib/content";
import { useMe, useServices, useSettings } from "@/lib/hooks";
import { WaveBand } from "./Wave";
import { Reveal } from "./Motion";

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" data-testid="site-logo" className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("grid shrink-0 place-items-center", light && "rounded-xl bg-white p-1")}>
        <img src="/logo-mark.png" alt="ICONIC Shipping Services logo" width={44} height={43} className={cn("object-contain", light ? "h-9 w-9" : "h-11 w-11")} />
      </span>
      <span className="leading-none">
        <span className={cn("block font-heading text-[22px] font-extrabold tracking-tight", light ? "text-white" : "text-navy")}>ICONIC</span>
        <span className="block whitespace-nowrap text-[9.5px] font-bold tracking-[0.18em] text-[#E8731A]">SHIPPING SERVICES</span>
      </span>
    </Link>
  );
}

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/services", label: "Our Services", dropdown: true },
  { to: "/port-clearance", label: "Port Clearance" },
  { to: "/hold-cleaning", label: "Hold Cleaning" },
  { to: "/why-us", label: "Why Choose Us" },
  { to: "/contact", label: "Contact Us" },
];

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      data-testid="scroll-progress"
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-ocean via-cyan to-sky-300"
      style={{ scaleX }}
    />
  );
}

function Header() {
  const s = useSettings();
  const services = useServices().filter((x) => x.visible !== false);
  const me = useMe();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); setDrop(false); }, [loc.pathname]);
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 500 && y > prev + 4);
    if (y < prev - 4) setHidden(false);
  });
  const portal = me.data ? (me.data.role === "customer" ? "/portal" : "/admin") : "/login";

  return (
    <motion.header
      data-testid="site-header"
      animate={{ y: hidden ? -110 : 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,padding] duration-300",
        scrolled ? "glass border-b border-sky-100/80 py-2 shadow-[0_8px_30px_-12px_rgba(11,29,58,0.18)]" : "bg-transparent py-4",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main">
          {NAV.map((n) =>
            n.dropdown ? (
              <div key={n.to} className="relative" onMouseEnter={() => setDrop(true)} onMouseLeave={() => setDrop(false)}>
                <NavLink
                  to={n.to}
                  data-testid="nav-services"
                  className={({ isActive }) => cn("flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium transition-colors hover:text-ocean", isActive ? "text-ocean" : "text-navy")}
                >
                  {n.label} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", drop && "rotate-180")} />
                </NavLink>
                <AnimatePresence>
                  {drop && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.22 }}
                      className="absolute left-1/2 top-full w-[560px] -translate-x-1/2 pt-3"
                    >
                      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-sky-100 bg-white p-3 shadow-[0_30px_60px_-20px_rgba(11,29,58,0.35)]">
                        {services.map((sv) => (
                          <Link key={sv.slug} to={sv.path} data-testid={`nav-dropdown-${sv.slug}`} className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-sky-soft">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-100 text-ocean transition-colors group-hover:bg-ocean group-hover:text-white">
                              <sv.icon className="h-4.5 w-4.5" />
                            </span>
                            <span className="text-[13px] font-semibold leading-snug text-navy">{sv.title}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) => cn("relative whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium transition-colors hover:text-ocean", isActive ? "text-ocean" : "text-navy")}
              >
                {({ isActive }) => (
                  <>
                    {n.label}
                    {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-ocean" />}
                  </>
                )}
              </NavLink>
            ),
          )}
        </nav>
        <div className="flex items-center gap-2">
          <a href={telHref(s.phone)} data-testid="header-call-button" aria-label="Call now" className="hidden h-10 w-10 place-items-center rounded-full border border-sky-200 bg-white text-ocean transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-sky-50 lg:grid">
            <Phone className="h-4 w-4" />
          </a>
          <a href={waHref(s.whatsapp, GENERAL_WA(s.company_name))} target="_blank" rel="noopener noreferrer" data-testid="header-whatsapp-button" aria-label="WhatsApp" className="hidden h-10 w-10 place-items-center rounded-full bg-wa text-white transition-transform hover:-translate-y-0.5 lg:grid">
            <MessageCircle className="h-4 w-4" />
          </a>
          <Link to={portal} data-testid="header-login-button" className="hidden h-10 items-center gap-1.5 rounded-full border border-sky-200 bg-white px-4 text-[13px] font-semibold text-navy transition-[transform,border-color] hover:-translate-y-0.5 hover:border-ocean md:flex">
            <UserRound className="h-4 w-4 text-ocean" /> {me.data ? "My Account" : "Login"}
          </Link>
          <Link to="/quote" data-testid="header-quote-button" className="group relative hidden h-10 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-ocean px-5 text-[13px] font-semibold text-white shadow-[0_10px_25px_-10px_rgba(2,132,199,0.8)] transition-transform hover:-translate-y-0.5 sm:flex">
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            Request a Quote
          </Link>
          <button data-testid="mobile-menu-button" aria-label="Open menu" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full bg-navy text-white xl:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" showCloseButton={false} className="w-[88vw] max-w-sm overflow-y-auto border-l-0 bg-white p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex items-center justify-between border-b border-sky-100 p-5">
            <Logo />
            <button data-testid="mobile-menu-close" aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-sky-soft text-navy"><X className="h-4 w-4" /></button>
          </div>
          <nav className="flex flex-col p-3">
            {NAV.map((n, i) => (
              <motion.div key={n.to} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                <NavLink to={n.to} end={n.to === "/"} data-testid={`mobile-nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`} className={({ isActive }) => cn("flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold", isActive ? "bg-sky-soft text-ocean" : "text-navy")}>
                  {n.label} <ArrowRight className="h-4 w-4 opacity-40" />
                </NavLink>
                {n.dropdown && (
                  <div className="mb-2 ml-4 border-l border-sky-100 pl-3">
                    {services.map((sv) => (
                      <Link key={sv.slug} to={sv.path} className="block py-1.5 text-[13px] text-slate-600 hover:text-ocean">{sv.title}</Link>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </nav>
          <div className="grid gap-2 border-t border-sky-100 p-5">
            <Link to="/quote" className={cn(buttonVariants(), "h-11 rounded-full")}>Request a Quote</Link>
            <Link to={portal} className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full")}>{me.data ? "My Account" : "Customer Login"}</Link>
            <div className="grid grid-cols-2 gap-2">
              <a href={telHref(s.phone)} className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full")}><Phone className="h-4 w-4" /> Call</a>
              <a href={waHref(s.whatsapp, GENERAL_WA(s.company_name))} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants(), "h-11 rounded-full bg-wa hover:bg-wa/90")}><MessageCircle className="h-4 w-4" /> WhatsApp</a>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.header>
  );
}

function FloatingButtons() {
  const s = useSettings();
  const subject = encodeURIComponent(`Inquiry | ${s.company_name}`);
  const body = encodeURIComponent(`Dear ${s.company_name} Team,\n\nGreetings!\n\nWe would like to enquire about your services.\n\nService Required: [Service]\nVessel Name: [Vessel name]\nVessel Location / Port: [Port]\nRequirement: [Details]\n\nBest Regards,\n[Name]\n[Company]\n[Contact Number]`);
  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col items-center gap-3 sm:bottom-7 sm:right-6">
      <motion.a
        href={`mailto:${s.email}?subject=${subject}&body=${body}`}
        data-testid="floating-email-button"
        aria-label={`Email ${s.email}`}
        className="group relative grid h-12 w-12 place-items-center rounded-full bg-ocean text-white shadow-[0_0_24px_rgba(2,132,199,0.55)] animate-float sm:h-13 sm:w-13"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
      >
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-sky-300 animate-blink" />
        <Mail className="h-5 w-5 animate-pop" />
        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full bg-navy px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">{s.email}</span>
      </motion.a>
      <motion.a
        href={waHref(s.whatsapp, GENERAL_WA(s.company_name))}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="floating-whatsapp-button"
        aria-label="Chat on WhatsApp"
        className="group relative grid h-14 w-14 place-items-center rounded-full bg-wa text-white shadow-[0_0_30px_rgba(37,211,102,0.6)] sm:h-16 sm:w-16"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="absolute inset-0 rounded-full bg-wa animate-ring" />
        <span className="absolute inset-0 rounded-full bg-wa animate-ring [animation-delay:1.1s]" />
        <span className="absolute -right-0.5 -top-0.5 z-10 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500 animate-blink" />
        <svg viewBox="0 0 24 24" className="relative h-7 w-7 animate-pop fill-white" aria-hidden>
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.41 9.41 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.4 9.4 0 0 1 9.43 9.44c0 5.2-4.23 9.43-9.44 9.43zm8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.07c0 2 .52 3.95 1.52 5.67L.6 23.6l6-1.57a11.3 11.3 0 0 0 5.43 1.38h.01c6.25 0 11.34-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02z" />
        </svg>
      </motion.a>
    </div>
  );
}

function Footer() {
  const s = useSettings();
  const year = new Date().getFullYear();
  const col = (title: string, links: [string, string][], tid: string) => (
    <div data-testid={tid}>
      <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-sky-300">{title}</h4>
      <ul className="space-y-2.5">
        {links.map(([l, h]) => (
          <li key={l}><Link to={h} className="text-[14px] text-slate-300 transition-colors hover:text-white">{l}</Link></li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer data-testid="site-footer" className="relative overflow-hidden bg-navy text-white">
      <div className="relative h-24 overflow-hidden" style={{ background: "#ffffff" }}>
        <WaveBand color="#0B1D3A" opacity={0.35} className="bottom-0 h-full" slow />
        <WaveBand color="#112a52" opacity={0.7} className="bottom-0 h-3/4" />
        <WaveBand color="#0B1D3A" className="bottom-0 h-1/2" slow />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-24 h-full opacity-[0.07]" style={{ backgroundImage: `url(${IMG.sunset})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <Reveal dir="up" amount={0.1} className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-10 pt-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1.3fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-slate-300" data-testid="footer-intro">{s.footer_text}</p>
          <p className="mt-4 text-[13px] text-slate-400">Owner: <span className="font-semibold text-white" data-testid="footer-owner">{s.owner}</span></p>
        </div>
        {col("Quick Links", [["Home", "/"], ["About Us", "/about"], ["Our Services", "/services"], ["Why Choose Us", "/why-us"], ["Request a Quote", "/quote"], ["Track Enquiry", "/track"], ["Contact Us", "/contact"]], "footer-quick-links")}
        {col("Our Services", [["Port Clearance & Marine Logistics", "/port-clearance"], ["Hold Cleaning & Tank Squeezing", "/hold-cleaning"], ["Marine Machinery & Equipment", "/services/marine-machinery"], ["Ship Chandling & Supplies", "/services/ship-chandling"], ["LSA/FFA Inspection", "/services/lsa-ffa"], ["Marine Repair & Maintenance", "/services/marine-repair"]], "footer-services")}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-sky-300">Contact</h4>
          <ul className="space-y-3 text-[14px] text-slate-300">
            <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-sky-300" /><a data-testid="footer-phone" href={telHref(s.phone)} className="hover:text-white">{s.phone}</a></li>
            <li className="flex gap-3"><MessageCircle className="mt-0.5 h-4 w-4 text-wa" /><a data-testid="footer-whatsapp" href={waHref(s.whatsapp, GENERAL_WA(s.company_name))} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp {s.whatsapp}</a></li>
            <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 text-sky-300" /><a data-testid="footer-email" href={`mailto:${s.email}`} className="break-all hover:text-white">{s.email}</a></li>
            <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-sky-300" /><span>{s.location}</span></li>
          </ul>
          <a href={waHref(s.whatsapp, GENERAL_WA(s.company_name))} target="_blank" rel="noopener noreferrer" data-testid="footer-whatsapp-button" className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-wa px-5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5">
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
        </div>
      </Reveal>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-[12.5px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {s.company_name}, Gandhidham. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy-policy" data-testid="footer-privacy-link" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" data-testid="footer-terms-link" className="hover:text-white">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function SiteLayout() {
  const loc = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, [loc.pathname]);
  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      <ScrollProgress />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <FloatingButtons />
      <Toaster richColors />
    </div>
  );
}
