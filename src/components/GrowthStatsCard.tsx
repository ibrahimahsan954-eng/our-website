import { useEffect, useId, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { BadgeCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   GrowthStatsCard — reusable animated "client growth" card.

   Pass any client's data in via props (name, avatar, stats,
   12-month chart, headline number) and it renders a dark card
   with count-up numbers, a scroll-triggered line-chart draw,
   and an oversized headline stat. No extra dependencies —
   everything is Framer Motion + Tailwind.
   ============================================================ */

export interface GrowthStat {
  label: string;
  value: number;
  delta?: string;
}

export interface GrowthStatsCardProps {
  /** Channel / client display name. */
  name: string;
  /** Subtitle shown under the name, e.g. "168K subscribers". */
  subtitle: string;
  /** Circular avatar URL. */
  avatar: string;
  /** Show the verified checkmark next to the name. */
  verified?: boolean;
  /** Accent color — border glow, chart line, and headline. */
  accent?: "green" | "red";
  /** The three KPI columns shown on the right of the top row. */
  stats: {
    views: GrowthStat;
    watchTime: GrowthStat;
    subscribers: GrowthStat;
  };
  /** 12 monthly data points (Jan → Dec), any scale — normalized for the chart. */
  chart: number[];
  /** Oversized headline number (raw value, formatted like 9M / 168K) + period badge.
      Optional prefix renders before the number (e.g. "+" → "+16K"). */
  headline: { value: number; badge: string; prefix?: string };
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
    avatarDot: "size-3.5",
    name: "text-lg font-bold sm:text-xl",
    check: "size-5",
    subtitle: "text-sm",
    kpiGap: "gap-6 sm:gap-8",
    kpiValue: "text-lg font-bold sm:text-2xl",
    kpiArrow: "size-4",
    kpiLabel: "mt-1 text-xs text-white/45 sm:text-sm",
    kpiDelta: "mt-0.5 text-[11px] font-semibold text-[#25D366]",
    chartGap: "mt-7",
    chart: "h-36 w-full sm:h-44",
    monthLabel: "text-[10px] font-medium tracking-wide text-white/35",
    headlineGap: "mt-7 border-t border-white/10 pt-6",
    headline: "font-condensed text-6xl leading-none tracking-wide sm:text-7xl md:text-8xl",
    badge: "mt-3 inline-block rounded-full border px-3.5 py-1.5 text-xs font-semibold sm:text-sm",
  },
  large: {
    card: "p-6 sm:p-10",
    topRowGap: "gap-8",
    identityGap: "gap-4 sm:gap-6",
    avatar: "size-16 sm:size-20",
    avatarDot: "size-4 sm:size-5",
    name: "text-2xl font-bold sm:text-3xl",
    check: "size-6 sm:size-7",
    subtitle: "text-base sm:text-lg",
    kpiGap: "gap-8 sm:gap-14",
    kpiValue: "text-2xl font-bold sm:text-4xl",
    kpiArrow: "size-5 sm:size-6",
    kpiLabel: "mt-1.5 text-sm text-white/45 sm:text-base",
    kpiDelta: "mt-1 text-xs font-semibold text-[#25D366] sm:text-sm",
    chartGap: "mt-8 sm:mt-10",
    chart: "h-44 w-full sm:h-64",
    monthLabel: "text-xs font-medium tracking-wide text-white/35",
    headlineGap: "mt-8 border-t border-white/10 pt-6 sm:mt-10 sm:pt-8",
    headline: "font-condensed text-7xl leading-none tracking-wide sm:text-8xl md:text-9xl",
    badge: "mt-4 inline-block rounded-full border px-5 py-2 text-sm font-semibold sm:text-base",
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
    badge: "border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366]",
  },
  red: {
    border: "border-[#ff4d4d]/25",
    glow: "shadow-[0_0_50px_rgba(255,77,77,0.10)]",
    hoverBorder: "hover:border-[#ff4d4d]/45",
    stroke: "#ff4d4d",
    soft: "rgba(255,77,77,0.28)",
    text: "text-[#ff6b6b]",
    badge: "border-[#ff4d4d]/40 bg-[#ff4d4d]/10 text-[#ff6b6b]",
  },
} as const;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** 1_420_000 → "1.4M", 92_400 → "92.4K", 480 → "480". */
function formatCompact(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 100 ? Math.round(v) : Math.round(v * 10) / 10}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v >= 100 ? Math.round(v) : Math.round(v * 10) / 10}K`;
  }
  return `${Math.round(n)}`;
}

/** rAF count-up from 0 → target, starting once `active` flips true (after an
    optional `delay` so multiple counters can sequence instead of firing together). */
function useCountUp(target: number, active: boolean, duration = 1500, delay = 0) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let timeout = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    timeout = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [active, target, duration, delay]);
  return display;
}

/* ---- chart geometry (viewBox space) ---- */

const VB_W = 600;
const VB_H = 170;
const PAD_X = 6;
const PAD_TOP = 14;
const PAD_BOTTOM = 10;

function chartGeometry(points: number[]) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(max - min, 1);
  const innerH = VB_H - PAD_TOP - PAD_BOTTOM;
  const stepX = (VB_W - PAD_X * 2) / Math.max(points.length - 1, 1);
  const pts = points.map((p, i) => ({
    x: PAD_X + i * stepX,
    y: PAD_TOP + (1 - (p - min) / range) * innerH,
  }));
  const line = pts
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(" ");
  const bottomY = (VB_H - PAD_BOTTOM).toFixed(2);
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
  headline,
  variant = "default",
  className,
}: GrowthStatsCardProps) {
  const accentCfg = ACCENTS[accent];
  const s = SIZES[variant as SizeVariant];
  const gradientId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const { pts, line, area } = chartGeometry(chart);
  const end = pts[pts.length - 1];

  // Staggered starts: Views → Watch Time → Subscribers → headline, so the
  // counters cascade instead of all racing at once.
  const views = useCountUp(stats.views.value, inView, 1500, 0);
  const watchTime = useCountUp(stats.watchTime.value, inView, 1500, 150);
  const subscribers = useCountUp(stats.subscribers.value, inView, 1500, 300);
  const headlineValue = useCountUp(headline.value, inView, 1700, 550);

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
        "relative overflow-hidden rounded-3xl border bg-[#0a0a0a] text-white transition-colors duration-300",
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

      {/* ---- Top row: channel + 3 KPI columns ---- */}
      <div className={cn("relative flex flex-col lg:flex-row lg:items-center lg:justify-between", s.topRowGap)}>
        <div className={cn("flex min-w-0 items-center", s.identityGap)}>
          <span className="relative shrink-0">
            <img
              src={avatar}
              alt={name}
              loading="lazy"
              className={cn("rounded-full border border-white/10 object-cover", s.avatar)}
            />
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#0a0a0a] bg-[#25D366]",
                s.avatarDot,
              )}
              aria-hidden
            />
          </span>
          <div className="min-w-0">
            <p className={cn("flex items-center gap-1.5", s.name)}>
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
            <div key={stat.label}>
              <p className={cn("flex items-center gap-1.5", s.kpiValue)}>
                <span>{formatCompact(value)}</span>
                <TrendingUp className={cn("shrink-0 text-[#25D366]", s.kpiArrow)} aria-hidden />
              </p>
              <p className={cn("text-white/45", s.kpiLabel)}>{stat.label}</p>
              {stat.delta && (
                <p className={s.kpiDelta}>
                  {stat.delta}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---- 12-month area chart, line draws in on scroll ---- */}
      <div className={cn("relative", s.chartGap)}>
        <div className="relative">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
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

            {/* dashed gridlines */}
            {[0.25, 0.5, 0.75].map((t) => (
              <line
                key={t}
                x1={PAD_X}
                x2={VB_W - PAD_X}
                y1={PAD_TOP + (VB_H - PAD_TOP - PAD_BOTTOM) * t}
                y2={PAD_TOP + (VB_H - PAD_TOP - PAD_BOTTOM) * t}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 5"
              />
            ))}

            {/* gradient fill fades in after the line starts drawing */}
            <motion.path
              d={area}
              fill={`url(#${gradientId})`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: 0.85, ease: "easeOut" }}
            />

            {/* line draw left → right */}
            <motion.path
              d={line}
              fill="none"
              stroke={accentCfg.stroke}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1.7, ease: "easeInOut" }}
            />
          </svg>

          {/* End-of-line dot + glow ring. Rendered as an HTML overlay (not SVG)
              because the chart stretches via preserveAspectRatio="none" — an
              SVG circle would render as an oval on narrow screens. Positioned
              in % of the chart box so it tracks the line end at every width. */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute z-10"
            style={{
              left: `${(end.x / VB_W) * 100}%`,
              top: `${(end.y / VB_H) * 100}%`,
              x: "-50%",
              y: "-50%",
            }}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 1.5, duration: 0.35, ease: "easeOut" }}
          >
            <span
              className="absolute -inset-2 rounded-full"
              style={{ border: `2px solid ${accentCfg.stroke}`, opacity: 0.35 }}
            />
            <span
              className="block size-3 rounded-full border-2 border-[#0a0a0a]"
              style={{ background: accentCfg.stroke }}
            />
          </motion.span>
        </div>

        {/* month labels */}
        <div className="mt-2 flex justify-between px-0.5">
          {chart.map((_, i) => (
            <span
              key={i}
              className={s.monthLabel}
            >
              {MONTHS[i % MONTHS.length]}
            </span>
          ))}
        </div>
      </div>

      {/* ---- Headline growth stat ---- */}
      <div className={cn("relative", s.headlineGap)}>
        <p
          className={s.headline}
          style={{ color: accentCfg.stroke }}
        >
          {headline.prefix ?? ""}
          {formatCompact(headlineValue)}
        </p>
        <span
          className={cn(
            s.badge,
            accentCfg.badge,
          )}
        >
          {headline.badge}
        </span>
      </div>
    </motion.div>
  );
}
