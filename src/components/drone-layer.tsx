import { useEffect, useRef, useState } from "react";

type Pos = { x: number; y: number };
type Ripple = { id: number; x: number; y: number };

/**
 * Playful cursor drone: it flies to wherever the user taps or clicks
 * and drops a little ripple at the landing spot.
 */
export function DroneLayer() {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    setPos({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.35 });

    const handle = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      setPos({ x: event.clientX, y: event.clientY });
      const id = ++idRef.current;
      setRipples((prev) => [...prev.slice(-3), { id, x: event.clientX, y: event.clientY }]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 900);
    };

    window.addEventListener("pointerdown", handle);
    return () => window.removeEventListener("pointerdown", handle);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {ripples.map((r) => (
        <span
          key={r.id}
          className="animate-drop-ping absolute h-10 w-10 rounded-full border-2 border-primary/70"
          style={{ left: r.x - 20, top: r.y - 20 }}
        />
      ))}
      <div
        className="absolute transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ left: pos.x - 34, top: pos.y - 60 }}
      >
        <div className="animate-drone-hover relative h-16 w-[68px]">
          <span className="animate-rotor absolute left-0 top-1 block h-1.5 w-6 rounded-full bg-foreground/70" />
          <span className="animate-rotor absolute right-0 top-1 block h-1.5 w-6 rounded-full bg-foreground/70" />
          <div className="absolute left-1/2 top-2.5 h-4 w-9 -translate-x-1/2 rounded-full bg-primary shadow-lift" />
          <span className="absolute left-1/2 top-4 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-spice" />
          <div className="absolute left-1/2 top-7 h-4 w-[2px] -translate-x-1/2 bg-foreground/40" />
          <div className="absolute left-1/2 top-11 h-5 w-6 -translate-x-1/2 rounded-sm bg-accent-foreground/80" />
          <span className="absolute left-1/2 top-[52px] h-1 w-3 -translate-x-1/2 rounded-full bg-success" />
        </div>
      </div>
    </div>
  );
}
