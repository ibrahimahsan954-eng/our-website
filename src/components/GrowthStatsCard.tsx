import { useEffect, useId, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUp, BadgeCheck } from "lucide-react";
import { formatCompact, useCountUp } from "@/lib/count-up";
import { cn } from "@/lib/utils";

/* ============================================================
   GrowthStatsCard — reusable animated "channel growth" card.

   Dark dashboard-style card: channel identity + three KPI
   columns up top, and a full-width 12-month area chart below
   whose line draws in on scroll. Count-up numbers, no extra
   dependencies — Framer Motion + Tailwind only.

   Pair with <GrowthCalloutCard /> for the oversized headline
   number on a light background.
   ============================================================ */

export interface GrowthStat {
  label: string;
  /** Raw value — formatted compactly (179_600 → "179.6K"). */
  value: number;
  /** Optional prefix rendered before the number (e.g. "+" → "+16.4K"). */
  prefix?: string;
}

export interface GrowthStatsCardProps {
  /** Channel / client display name. */
  name: string;
  /** Subtitle shown under the name, e.g. "16.4K subscribers". */
  subtitle: string;
  /** Circular avatar URL. */
  avatar: string;
  /** Show the verified checkmark next to the name. */
  verified?: boolean;
  /** Accent color — border glow, chart line, and checkmark. */
  accent?: "green" | "red";
  /** The three KPI columns shown on the right of the top row. */
  stats: {
    views: GrowthStat;
    watchTime: GrowthStat;
    subscribers: GrowthStat;
  };
  /** 12 monthly data points (Jan → Dec), any scale — normalized for the chart. */
  chart: number[];
  /** Layout size — "large" renders a single wide hero-style card. */
  variant?: "default" | "large";
  className?: string;
}

/* ---- Size variants: default (grid card) vs large (single wide hero card) ---- */
const SIZES = {
  default: {
    card: "p-5 sm:p-7",
    topRowGap: "gap-6",
    identityGap: "gap-4",
    avatar: "size-12 sm:size-14",
    name: "text-lg font-bold sm:text-xl",
    check: "size-5",
    subtitle: "text-sm",
    kpiGap: "gap-6 sm:gap-10",
    kpiLabel: "text-xs text-white/45 sm:text-sm",
    kpiValue: "mt-1 text-xl font-bold sm:mt-1.5 sm:text-2xl",
    kpiArrow: "size-5",
    kpiArrowIcon: "size-3",
    chartGap: "mt-7",
    chart: "h-36 w-full sm:h-44",
    monthLabel: "text-xs font-semibold tracking-wide text-white/80",
  },
  large: {
    card: "p-6 sm:p-10",
    // flex-wrap + guaranteed gaps mean the identity block and the KPI grid
    // can never overlap: when they don't fit on one line, the stats wrap
    // below the logo/name row instead of colliding with it.
    topRowGap: "gap-6 sm:gap-x-8 sm:gap-y-6",
    identityGap: "gap-4 sm:gap-5",
    avatar: "size-14 sm:size-16",
    name: "text-2xl font-bold sm:text-3xl",
    check: "size-6 sm:size-7",
    subtitle: "text-base sm:text-lg",
    kpiGap: "gap-6 sm:gap-10",
    kpiLabel: "text-sm text-white/45 sm:text-base",
    kpiValue: "mt-1.5 text-xl font-bold sm:mt-2 sm:text-2xl lg:text-3xl",
    kpiArrow: "size-5 sm:size-6",
    kpiArrowIcon: "size-3 sm:size-3.5",
    chartGap: "mt-8 sm:mt-10",
    chart: "h-44 w-full sm:h-64",
    monthLabel: "text-sm font-semibold tracking-wide text-white/85",
  },
} as const;

type SizeVariant = keyof typeof SIZES;

const ACCENTS = {
  green: {
    border: "border-[#25D366]/25",
    glow: "shadow-[0_0_50px_rgba(37,211,102,0.10)]",
    hoverBorder: "hover:border-[#25D366]/45",
    stroke: "#25D366",
    soft: "rgba(37,211,102,0.30)",
    text: "text-[#25D366]",
  },
  red: {
    border: "border-[#ff4d4d]/25",
    glow: "shadow-[0_0_50px_rgba(255,77,77,0.10)]",
    hoverBorder: "hover:border-[#ff4d4d]/45",
    stroke: "#ff4d4d",
    soft: "rgba(255,77,77,0.28)",
    text: "text-[#ff6b6b]",
  },
} as const;

/* ---- chart geometry (pixel space) ----
   The SVG viewBox is set to the chart's actual rendered size (measured with a
   ResizeObserver), so geometry maps 1:1 to screen pixels. This avoids the old
   preserveAspectRatio="none" non-uniform scaling, under which a constant
   strokeWidth rendered with visibly varying thickness along steep segments.
   In 1:1 pixel space the stroke is uniform from Jan to Dec. */

const PAD_X_L = 6;
const PAD_X_R = 2;
const PAD_TOP = 14;
const PAD_BOTTOM = 10;

function chartGeometry(points: number[], vbW: number, vbH: number) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(max - min, 1);
  const innerH = vbH - PAD_TOP - PAD_BOTTOM;
  const stepX = (vbW - PAD_X_L - PAD_X_R) / Math.max(points.length - 1, 1);
  const pts = points.map((p, i) => ({
    x: PAD_X_L + i * stepX,
    y: PAD_TOP + (1 - (p - min) / range) * innerH,
  }));
  const line = pts
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(" ");
  const bottomY = (vbH - PAD_BOTTOM).toFixed(2);
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${bottomY} L ${pts[0].x.toFixed(2)} ${bottomY} Z`;
  return { pts, line, area };
}

/* ============================================================ */

export function GrowthStatsCard({
  name,
  subtitle,
  avatar,
  verified = true,
  accent = "green",
  stats,
  chart,
  variant = "default",
  className,
}: GrowthStatsCardProps) {
  const accentCfg = ACCENTS[accent];
  const s = SIZES[variant as SizeVariant];
  const gradientId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [avatarFailed, setAvatarFailed] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartBox, setChartBox] = useState({ w: 600, h: 170 });

  // Measure the chart box so the SVG viewBox matches rendered pixels 1:1
  // (keeps the stroke width perfectly uniform — see chartGeometry note).
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const update = () => setChartBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { pts, line, area } = chartGeometry(chart, chartBox.w, chartBox.h);
  const end = pts[pts.length - 1];

  // Staggered starts: Views → Watch Time → Subscribers, so the counters
  // cascade instead of all racing at once.
  const views = useCountUp(stats.views.value, inView, 1500, 0);
  const watchTime = useCountUp(stats.watchTime.value, inView, 1500, 150);
  const subscribers = useCountUp(stats.subscribers.value, inView, 1500, 300);

  const statsList = [
    { stat: stats.views, value: views },
    { stat: stats.watchTime, value: watchTime },
    { stat: stats.subscribers, value: subscribers },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-black text-white transition-colors duration-300",
        s.card,
        accentCfg.border,
        accentCfg.glow,
        accentCfg.hoverBorder,
        className,
      )}
    >
      {/* Ambient glow behind the chart */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full blur-[110px]"
        style={{ background: accentCfg.soft }}
      />

      {/* ---- Top row: channel identity + 3 KPI columns ---- */}
      <div className={cn("relative flex flex-col lg:flex-row lg:flex-wrap lg:items-center lg:justify-between", s.topRowGap)}>
        <div className={cn("flex min-w-0 items-center", s.identityGap)}>
          {/* Circular logo — the circle is enforced by an overflow-hidden
              container (not by the img itself) so the crop can never stretch
              or leak out of the frame in any browser. */}
          <span className={cn("relative block shrink-0 overflow-hidden rounded-full bg-[#1d9bf0]", s.avatar)}>
            {!avatarFailed ? (
              <img
                src={avatar}
                alt={name}
                loading="lazy"
                onError={() => setAvatarFailed(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-white sm:text-2xl">
                P
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className={cn("flex items-center gap-1.5 text-white", s.name)}>
              <span className="truncate">{name}</span>
              {verified && (
                <BadgeCheck className={cn("shrink-0", s.check, accentCfg.text)} aria-label="Verified" />
              )}
            </p>
            <p className={cn("truncate text-white/50", s.subtitle)}>{subtitle}</p>
          </div>
        </div>

        <div className={cn("grid shrink-0 grid-cols-3", s.kpiGap)}>
          {statsList.map(({ stat, value }) => (
            <div key={stat.label} className="text-center">
              <p className={cn("text-white/45", s.kpiLabel)}>{stat.label}</p>
              <p className={cn("flex items-center justify-center gap-1.5 sm:gap-2", s.kpiValue)}>
                <span>
                  {stat.prefix ?? ""}
                  {formatCompact(value)}
                </span>
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full bg-[#25D366]",
                    s.kpiArrow,
                  )}
                  aria-hidden
                >
                  <ArrowUp className={cn("text-black", s.kpiArrowIcon)} strokeWidth={3} />
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ---- 12-month area chart, line draws in on scroll ---- */}
      <div className={cn("relative", s.chartGap)}>
        <div className="relative" ref={chartRef}>
          <svg
            viewBox={`0 0 ${chartBox.w} ${chartBox.h}`}
            role="img"
            aria-label={`12-month growth chart for ${name}`}
            className={s.chart}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentCfg.stroke} stopOpacity={0.32} />
                <stop offset="100%" stopColor={accentCfg.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* gradient fill fades in after the line starts drawing */}
            <motion.path
              d={area}
              fill={`url(#${gradientId})`}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.85, ease: "easeOut" }}
            />

            {/* line draw left → right — driven by the card's once-only inView
                flag (not whileInView variants) so the tween always runs 0→1
                to completion and reaches the final data point at the right. */}
            <motion.path
              d={line}
              fill="none"
              stroke={accentCfg.stroke}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 1.7, delay: 0.15, ease: "easeInOut" }}
            />
          </svg>

          {/* End-of-line dot + glow ring. Rendered as an HTML overlay (not SVG)
              so it is always a perfect circle and precisely aligned. Positioned
              in % of the measured chart box so it tracks the line end at every
              width, at the exact 1:1 pixel mapping of the line itself. */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute z-10"
            style={{
              left: `${(end.x / chartBox.w) * 100}%`,
              top: `${(end.y / chartBox.h) * 100}%`,
              x: "-50%",
              y: "-50%",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ delay: 1.85, duration: 0.35, ease: "easeOut" }}
          >
            <span
              className="absolute -inset-2 rounded-full"
              style={{ border: `2px solid ${accentCfg.stroke}`, opacity: 0.35 }}
            />
            <span
              className="block size-3 rounded-full border-2 border-black"
              style={{ background: accentCfg.stroke }}
            />
          </motion.span>

          {/* corner month labels */}
          <span className={cn("pointer-events-none absolute bottom-4 left-2", s.monthLabel)}>Jan</span>
          <span className={cn("pointer-events-none absolute bottom-4 right-2", s.monthLabel)}>Dec</span>
        </div>
      </div>
    </motion.div>
  );
}
