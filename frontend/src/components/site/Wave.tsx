import { cn } from "@/lib/utils";

const PATH = "M0,40 C120,70 240,10 360,40 C480,70 600,10 720,40 C840,70 960,10 1080,40 C1200,70 1320,10 1440,40 L1440,80 L0,80 Z";

// Seamless animated wave band: two copies side by side translating -50%.
export function WaveBand({ color = "#ffffff", className, slow, opacity = 1 }: { color?: string; className?: string; slow?: boolean; opacity?: number }) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 overflow-hidden", className)} aria-hidden>
      <div className={cn("flex w-[200%]", slow ? "animate-wave-slow" : "animate-wave")} style={{ willChange: "transform" }}>
        {[0, 1].map((i) => (
          <svg key={i} viewBox="0 0 1440 80" preserveAspectRatio="none" className="h-full w-1/2" style={{ opacity }}>
            <path d={PATH} fill={color} />
          </svg>
        ))}
      </div>
    </div>
  );
}

export function WaveDivider({ top = "#ffffff", bottom = "#F0F7FF", flip }: { top?: string; bottom?: string; flip?: boolean }) {
  return (
    <div className="relative h-16 sm:h-20" style={{ background: top }} aria-hidden>
      <WaveBand color={bottom} opacity={0.5} className={cn("h-full bottom-0", flip && "rotate-180")} slow />
      <WaveBand color={bottom} className={cn("h-3/4 bottom-0", flip && "rotate-180")} />
    </div>
  );
}
