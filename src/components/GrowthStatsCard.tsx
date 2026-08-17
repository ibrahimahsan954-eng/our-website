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
  /** Oversized headline number (raw value, formatted like 9M / 168K) + period badge. */
  headline: { value: number; badge: string };
  className?: string;
}

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

/** rAF count-up from 0 → target, starting once `active` flips true. */
function useCountUp(target: number, active: boolean, duration = 1500) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
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
  className,
}: GrowthStatsCardProps) {
  const accentCfg = ACCENTS[accent];
  const gradientId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const { pts, line, area } = chartGeometry(chart);
  const end = pts[pts.length - 1];

  const views = useCountUp(stats.views.value, inView);
  const watchTime = useCountUp(stats.watchTime.value, inView);
  const subscribers = useCountUp(stats.subscribers.value, inView);
  const headlineValue = useCountUp(headline.value, inView);

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
        "relative overflow-hidden rounded-3xl border bg-[#0a0a0a] p-5 text-white transition-colors duration-300 sm:p-7",
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
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="relative shrink-0">
            <img
              src={avatar}
              alt={name}
              loading="lazy"
              className="size-12 rounded-full border border-white/10 object-cover sm:size-14"
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[#0a0a0a] bg-[#25D366]"
              aria-hidden
            />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-lg font-bold sm:text-xl">
              <span className="truncate">{name}</span>
              {verified && (
                <BadgeCheck className={cn("size-5 shrink-0", accentCfg.text)} aria-label="Verified" />
              )}
            </p>
            <p className="truncate text-sm text-white/50">{subtitle}</p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-6 sm:gap-8">
          {statsList.map(({ stat, value }) => (
            <div key={stat.label}>
              <p className="flex items-center gap-1.5 text-lg font-bold sm:text-2xl">
                <span>{formatCompact(value)}</span>
                <TrendingUp className="size-4 shrink-0 text-[#25D366]" aria-hidden />
              </p>
              <p className="mt-1 text-xs text-white/45 sm:text-sm">{stat.label}</p>
              {stat.delta && (
                <p className="mt-0.5 text-[11px] font-semibold text-[#25D366]">
                  {stat.delta}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---- 12-month area chart, line draws in on scroll ---- */}
      <div className="relative mt-7">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`12-month growth chart for ${name}`}
          className="h-36 w-full sm:h-44"
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

          {/* end-of-line dot + glow ring */}
          <motion.circle
            cx={end.x}
            cy={end.y}
            r={4}
            fill={accentCfg.stroke}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 1.5, duration: 0.3 }}
          />
          <motion.circle
            cx={end.x}
            cy={end.y}
            r={9}
            fill="none"
            stroke={accentCfg.stroke}
            strokeOpacity={0.35}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 1.6, duration: 0.4 }}
          />
        </svg>

        {/* month labels */}
        <div className="mt-2 flex justify-between px-0.5">
          {chart.map((_, i) => (
            <span
              key={i}
              className="text-[10px] font-medium tracking-wide text-white/35"
            >
              {MONTHS[i % MONTHS.length]}
            </span>
          ))}
        </div>
      </div>

      {/* ---- Headline growth stat ---- */}
      <div className="relative mt-7 border-t border-white/10 pt-6">
        <p
          className="font-condensed text-6xl leading-none tracking-wide sm:text-7xl md:text-8xl"
          style={{ color: accentCfg.stroke }}
        >
          {formatCompact(headlineValue)}
        </p>
        <span
          className={cn(
            "mt-3 inline-block rounded-full border px-3.5 py-1.5 text-xs font-semibold sm:text-sm",
            accentCfg.badge,
          )}
        >
          {headline.badge}
        </span>
      </div>
    </motion.div>
  );
}
