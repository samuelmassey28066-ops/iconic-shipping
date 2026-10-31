import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { MessageSquarePlus, Quote as QuoteIcon, Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost } from "@/lib/api";
import { errMsg } from "@/lib/hooks";
import type { MessageOut, Testimonial, TestimonialIn } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Reveal, Stagger, StaggerItem } from "./Motion";
import { SectionTitle } from "./Sections";

export function Stars({ n, size = "h-4 w-4", onPick }: { n: number; size?: string; onPick?: (v: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onPick} onClick={() => onPick?.(i)} aria-label={`${i} star`} data-testid={onPick ? `testimonial-star-${i}` : undefined} className={cn(!onPick && "cursor-default")}>
          <Star className={cn(size, i <= n ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
        </button>
      ))}
    </span>
  );
}

const EMPTY: TestimonialIn = { name: "", company: "", role: "", rating: 5, message: "", website: "" };

function FeedbackDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [f, setF] = useState<TestimonialIn>(EMPTY);
  const set = (k: keyof TestimonialIn) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const m = useMutation({
    mutationFn: () => apiPost<MessageOut>("/testimonials", f),
    onSuccess: (r) => { toast.success(r.message); setF(EMPTY); onOpenChange(false); },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="testimonial-dialog">
        <DialogHeader>
          <DialogTitle>Share your experience</DialogTitle>
          <DialogDescription>Your feedback is published after a quick review by our team.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); m.mutate(); }} data-testid="testimonial-form">
          <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} aria-hidden />
          <Stars n={f.rating} size="h-7 w-7" onPick={(v) => setF((p) => ({ ...p, rating: v }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input required minLength={2} placeholder="Your name *" value={f.name} onChange={set("name")} data-testid="testimonial-name-input" />
            <Input placeholder="Company" value={f.company} onChange={set("company")} data-testid="testimonial-company-input" />
          </div>
          <Input placeholder="Role (e.g. Master, Ship Owner, Agent)" value={f.role} onChange={set("role")} data-testid="testimonial-role-input" />
          <Textarea required minLength={10} rows={4} placeholder="Your feedback * (min 10 characters)" value={f.message} onChange={set("message")} data-testid="testimonial-message-input" />
          <button type="submit" disabled={m.isPending} data-testid="testimonial-submit-button" className="h-11 w-full rounded-full bg-ocean text-[14px] font-semibold text-white disabled:opacity-60">Submit feedback</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Testimonials() {
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ["testimonials"], queryFn: () => apiGet<Testimonial[]>("/testimonials") });
  const list = q.isError ? [] : q.data ?? [];
  return (
    <section className="relative overflow-hidden bg-white px-4 py-24 sm:px-6" data-testid="testimonials-section">
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionTitle eyebrow="Client Feedback" title="What Our Clients" highlight="Say About Us" text="Feedback from ship owners, masters, agents and operators we have worked with." />
          <Reveal dir="right" className="mb-10">
            <button onClick={() => setOpen(true)} data-testid="testimonial-open-button" className="inline-flex h-12 items-center gap-2 rounded-full border border-sky-200 bg-white px-6 text-[14px] font-semibold text-navy transition-[transform,border-color] hover:-translate-y-0.5 hover:border-ocean">
              <MessageSquarePlus className="h-4 w-4 text-ocean" /> Share your feedback
            </button>
          </Reveal>
        </div>
        {list.length ? (
          <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {list.slice(0, 6).map((t, i) => (
              <StaggerItem key={t.id} className={cn("relative rounded-3xl border border-sky-100 p-7 shadow-[0_25px_50px_-35px_rgba(11,29,58,0.45)]", i % 3 === 1 ? "bg-navy text-white lg:-translate-y-6" : "bg-white")}>
                <QuoteIcon className={cn("h-8 w-8", i % 3 === 1 ? "text-sky-300" : "text-sky-200")} />
                <p className={cn("mt-4 text-[15px] leading-relaxed", i % 3 === 1 ? "text-slate-200" : "text-slate-600")} data-testid="testimonial-message">“{t.message}”</p>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-ocean to-cyan font-heading font-bold text-white">{t.name.slice(0, 1).toUpperCase()}</span>
                    <span><span className={cn("block text-[14.5px] font-bold", i % 3 === 1 ? "text-white" : "text-navy")} data-testid="testimonial-name">{t.name}</span><span className={cn("text-[12.5px]", i % 3 === 1 ? "text-slate-400" : "text-slate-500")}>{[t.role, t.company].filter(Boolean).join(" · ")}</span></span>
                  </div>
                  <Stars n={t.rating} />
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <Reveal dir="up">
            <motion.div className="rounded-3xl border border-dashed border-sky-200 bg-sky-soft/60 p-10 text-center" data-testid="testimonials-empty">
              <p className="font-heading text-xl font-bold text-navy">Worked with us? Be the first to share your experience.</p>
              <p className="mt-1 text-[14px] text-slate-600">Approved feedback appears here.</p>
            </motion.div>
          </Reveal>
        )}
      </div>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}
