import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCompact, useCountUp } from "@/lib/count-up";

/* ============================================================
   GrowthCalloutCard — the oversized headline number that pairs
   with <GrowthStatsCard />. Light background, huge bold figure
   (16.4K → "16.4K"), and a colored pill badge underneath
   stating the growth period. Counts up on scroll.
   ============================================================ */

export interface GrowthCalloutCardProps {
  /** Raw value — formatted compactly (16_400 → "16.4K"). */
  value: number;
  /** Text inside the colored pill, e.g. "16.4K subscribers in 12 months". */
  badge: string;
  /** Optional prefix on the big number (defaults to none). */
  prefix?: string;
  className?: string;
}

export function GrowthCalloutCard({ value, badge, prefix = "", className }: GrowthCalloutCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const display = useCountUp(value, inView, 1700, 0);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-white px-6 py-14 text-black shadow-[0_0_60px_rgba(37,211,102,0.12)] sm:px-10",
        className,
      )}
    >
      <p className="text-6xl font-extrabold leading-none tracking-tight sm:text-7xl lg:text-8xl">
        {prefix}
        {formatCompact(display)}
      </p>
      <span className="mt-5 rounded-full bg-[#25D366] px-5 py-2 text-center text-sm font-bold text-black sm:text-base">
        {badge}
      </span>
    </motion.div>
  );
}
