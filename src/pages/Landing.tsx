import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GrowthStatsCard } from "@/components/GrowthStatsCard";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECTS, type Project } from "@/data/projects";
import {
  getAutoplayEmbedSrc,
  getYouTubeId,
  isDirectVideo,
} from "@/lib/embed-video";
import { useChromeFreeYouTubePlayer } from "@/hooks/use-chrome-free-youtube";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  Clapperboard,
  Copy,
  HelpCircle,
  Home,
  Instagram,
  Layers,
  Loader2,
  Mail,
  MessageCircle,
  Moon,
  Play,
  Search,
  Send,
  Sun,
  TrendingUp,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   Config — swap these with your real links and numbers
   ============================================================ */


// Embedded calendar widget — paste your public Cal.com / Calendly booking URL
// here (e.g. "https://cal.com/ebadahsan/15min" or
// "https://calendly.com/ebadahsan/video-call") and the booking section will
// render the real dark-mode calendar instead of the request form.
const CALENDAR_EMBED_URL = "";

// Primary showreel — YouTube.
// Source: https://youtu.be/T7pNvhwRNBU?si=ogXx4LKdKcYi_YLx
const SHOWREEL_ID = "T7pNvhwRNBU";

// Local MP4 for the hero showreel (public/showreel.mp4) — the hero renders a
// native <video> player (muted, loop, autoplay, no controls, playsInline)
// instead of any YouTube facade. An MP4 uploaded from the dashboard overrides
// this.
const SHOWREEL_MP4 = "/showreel.mp4";

const SHOWREEL_THUMBNAIL = `https://i.ytimg.com/vi/${SHOWREEL_ID}/maxresdefault.jpg`;

// Hero portrait — rounded-square photo sitting between "EBAD" and "AHSAN"
// in the hero heading. Points at the profile photo in public/assets/ebu.png
// (a square headshot works best; it is cropped to a rounded square). Falls
// back to a dark monogram tile only if the image can't load.
const PORTRAIT_URL = "/assets/ebu.png?v=1";

// Social proof avatar stack — small overlapping client photos under the hero
// portrait. The four files below are the current client PFPs in public/assets/
// (swap the src paths to change them). Each falls back to a gradient monogram
// tile if the image can't load.
const CLIENT_AVATARS = [
  { src: "/assets/channels4_profile.jpg?v=2", label: "M" },
  { src: "/assets/channels4_profile__1_.jpg?v=2", label: "S" },
  { src: "/assets/channels4_profile__2_.jpg?v=2", label: "A" },
  { src: "/assets/channels4_profile__3_.jpg?v=2", label: "K" },
];

// WhatsApp — wired up everywhere. Every trigger is a plain native <a> link
// (target="_blank" rel="noopener noreferrer") — no JS navigation handlers.
const WHATSAPP_PHONE = "923136494619";
const WHATSAPP_MESSAGE =
  "Hi Ebad, I saw your portfolio and would like to discuss a project!";

// Copy-to-clipboard fallback for visitors whose network blocks WhatsApp.
const WHATSAPP_NUMBER_DISPLAY = "+92 313 6494619";

// Bulletproof href selection: direct web link (web.whatsapp.com/send — no
// redirect through the blocked API host) on desktop; on mobile, deep-link
// straight into the native app via the whatsapp:// scheme.
function getWhatsAppHref(message: string): string {
  const encoded = encodeURIComponent(message);
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return isMobile
    ? `whatsapp://send?phone=${WHATSAPP_PHONE}&text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encoded}`;
}

// External-link handler: WhatsApp links always open in a new browser tab
// (noopener, noreferrer). Kept as JS instead of relying purely on the
// anchor's target="_blank" because the sandboxed preview iframe can intercept
// plain _blank navigations — window.open from a click gesture is always
// allowed and lands outside the iframe. The <a href> stays as a no-JS backup.
function openWhatsApp(message: string) {
  return (e: ReactMouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(getWhatsAppHref(message), "_blank", "noopener,noreferrer");
  };
}

// Social profiles — paste your real profile URLs here. Any entry left as ""
// is treated as unset and hidden automatically from the contact chips and footer.
const SOCIALS = {
  discord: "",
  x: "",
  instagram: "https://www.instagram.com/editsbyebad/",
  youtube: "",
};

// Stats shown in the counters section (animated on scroll) — update to your real numbers
const STATS = [
  { value: 30, suffix: "+", label: "Happy Clients" },
  { value: 60, suffix: "+", label: "Projects Delivered" },
  { value: 300, suffix: "K+", label: "Views Generated" },
];

/* ============================================================
   Landing page — recreation of zakariahq.com
   ============================================================ */

export default function Landing() {
  const scrollToBooking = () => {
    document.getElementById("request-cal")?.scrollIntoView({
      behavior: "smooth",
    });
  };
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[70] bg-noise opacity-[0.03] mix-blend-overlay"
      />
      <Nav onReserve={scrollToBooking} />
      <main>
        <Hero onReserve={scrollToBooking} />
        <Portfolio />
        <Stats />
        <GrowthSection />
        <ProcessSection />
        <FinalCta />
        <DmSection />
      </main>
      <Footer />


      {/* Floating contact cluster — WhatsApp + 1-tap copy-number fallback */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-center gap-3">
        <CopyNumberButton iconOnly />
        <motion.a
          href={getWhatsAppHref(WHATSAPP_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={openWhatsApp(WHATSAPP_MESSAGE)}
          aria-label="Chat On WhatsApp"
          title="Chat On WhatsApp"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 1.2, ease: "easeOut" }}
          className="flex size-14 items-center justify-center rounded-full bg-[#25D366] text-[#0b141a] shadow-[0_8px_30px_rgba(37,211,102,0.35)] transition-transform duration-300 hover:scale-110 hover:shadow-[0_8px_34px_rgba(37,211,102,0.5)]"
        >
          <WhatsAppIcon className="size-7" />
        </motion.a>
      </div>
    </div>
  );
}

/* ---------------- Nav (floating pill) ---------------- */

function Nav({ onReserve }: { onReserve?: () => void }) {
  const scrollToTop = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="gpu-crisp fixed inset-x-0 top-5 z-50 flex justify-center px-4 sm:top-6"
    >
      <motion.nav className="flex items-center gap-3 rounded-full border border-black/10 bg-white/80 px-4 py-3 sm:gap-4 sm:px-6 dark:border-white/10 dark:bg-white/5">
        <a
          href="#top"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
          className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-black/5 text-black/60 transition-colors hover:bg-black/10 hover:text-black sm:size-10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Home className="size-6" />
        </a>

        <span aria-hidden className="h-5 w-px bg-black/15 dark:bg-white/15" />

        <NavIcon href="#work" label="Portfolio">
          <Clapperboard className="size-6" />
        </NavIcon>
        <NavIcon href="#process" label="Process">
          <Layers className="size-6" />
        </NavIcon>

        <span aria-hidden className="h-5 w-px bg-black/15 dark:bg-white/15" />

        <Button
          type="button"
          onClick={onReserve}
          className="h-auto gap-2 rounded-full bg-[#25D366] px-3 py-2.5 text-base font-bold text-[#0b141a] shadow-[0_0_14px_rgba(37,211,102,0.55),0_0_30px_rgba(37,211,102,0.3)] transition-all duration-300 hover:bg-[#25D366]/90 hover:shadow-[0_0_22px_rgba(37,211,102,0.75),0_0_46px_rgba(37,211,102,0.4)] sm:px-5 md:text-lg"
        >
          <span className="hidden sm:inline">Reserve a Spot</span>
          <ArrowUpRight className="size-4" />
        </Button>

        <ThemeToggle />
      </motion.nav>
    </motion.header>
  );
}

/** Dark/Light mode toggle — defaults to dark; persists the choice locally. */
function ThemeToggle() {
  // Lazy init from the persisted preference (default dark). The <html> class
  // is already applied pre-paint by the inline script in index.html, so the
  // button only mirrors the current state.
  const [dark, setDark] = useState(() => {
    try {
      return (localStorage.getItem("theme") ?? "dark") === "dark";
    } catch {
      return true;
    }
  });

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable — in-memory theme still works */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-black/5 text-black/60 transition-colors hover:bg-black/10 hover:text-black sm:size-10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
    >
      {dark ? <Moon className="size-6" /> : <Sun className="size-6" />}
    </button>
  );
}

function NavIcon({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-black/60 transition-colors hover:bg-black/10 hover:text-black sm:size-10 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
    >
      {children}
    </a>
  );
}

/* ---------------- Hero ---------------- */

function Hero({ onReserve }: { onReserve?: () => void }) {
  return (
    <section id="top" className="relative overflow-hidden bg-[#e9e9e5] px-4 pb-16 pt-28 sm:pt-32 md:px-6 dark:bg-black">
      <div className="relative mx-auto w-full text-center">
        {/* Massive name composition — lime-green condensed type with the
            profile photo sitting between "EBAD" and "AHSAN" on one line */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="gpu-crisp mx-auto w-fit select-none"
        >
          <h1 className="font-condensed leading-[0.85] text-[#25D366]">
            <span className="flex items-center justify-center gap-[0.3em] whitespace-nowrap text-[clamp(2.75rem,15vw,20rem)]">
              <span className="tracking-[0.07em]">EBAD</span>
              <HeroPortrait />
              <span className="tracking-[-0.01em]">AHSAN</span>
            </span>
          </h1>
        </motion.div>

        {/* Social proof — client avatar stack under the portrait */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.26, ease: "easeOut" }}
          className="mt-9 flex flex-wrap items-center justify-center gap-x-3 gap-y-2"
        >
          <div className="flex -space-x-3">
            {CLIENT_AVATARS.map((a) => (
              <ClientAvatar key={a.src} src={a.src} label={a.label} />
            ))}
          </div>
          <p className="text-sm font-medium capitalize tracking-[-0.01em] text-[#1b1b1e] sm:text-base dark:text-[#e6e6e9]">
            Trusted by <strong className="font-semibold text-[#101010] dark:text-white">80+</strong> Happy Clients
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32, ease: "easeOut" }}
          className="gpu-crisp mx-auto mt-6 max-w-2xl text-lg font-medium capitalize leading-relaxed tracking-[-0.01em] text-[#4f4f56] sm:text-xl dark:text-[#F3F4F6]"
        >
          <strong className="inline-flex items-center gap-1.5 font-semibold text-[#101010] dark:text-white">
            Grow On
            <YouTubeLogo className="size-[1.1em]" />
            YouTube
          </strong>
          <span aria-hidden className="mx-2 text-[#25D366]">—</span>
          Become The <strong className="font-semibold text-[#101010] dark:text-white">Best Brand</strong> In Your Niche
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.42, ease: "easeOut" }}
          className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[#25D366] bg-[#25D366]/15 px-5 py-2.5 text-base font-bold text-[#064E3B] shadow-sm dark:text-[#25D366]">
            <span className="size-3 animate-pulse rounded-full bg-[#25D366]" />
            3 Spots Left
          </span>
          <button
            type="button"
            onClick={onReserve}
            className="inline-flex items-center rounded-full bg-[#25D366] px-7 py-3 text-lg font-bold text-[#0b141a] shadow-[0_0_20px_rgba(37,211,102,0.55),0_0_42px_rgba(37,211,102,0.3)] transition-all duration-300 hover:bg-[#25D366]/90 hover:shadow-[0_0_28px_rgba(37,211,102,0.75),0_0_60px_rgba(37,211,102,0.4)]"
          >
            Reserve a Spot
          </button>
        </motion.div>

        <Showreel />
      </div>
    </section>
  );
}

/** Official YouTube logo — filled red (#FF0000) rounded square + white play
 *  triangle, sized inline with surrounding text. */
function YouTubeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19 31.64 31.64 0 0 0 0 12a31.64 31.64 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.64 31.64 0 0 0 24 12a31.64 31.64 0 0 0-.5-5.81Z"
        fill="#FF0000"
      />
      <path d="m9.55 15.57 6-3.57-6-3.57v7.14Z" fill="#FFFFFF" />
    </svg>
  );
}

function ClientAvatar({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="flex size-12 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#e8e8e2] via-[#d9d9d2] to-[#c9c9c0] text-sm font-semibold text-[#25D366] shadow-[0_0_12px_rgba(0,0,0,0.15)] dark:border-black dark:from-[#2c2f26] dark:via-[#1b1c14] dark:to-[#10110b] dark:shadow-[0_0_12px_rgba(0,0,0,0.4)]">
        {label}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="size-12 rounded-full border-2 border-white object-cover shadow-[0_0_12px_rgba(0,0,0,0.15)] dark:border-black dark:shadow-[0_0_12px_rgba(0,0,0,0.4)]"
    />
  );
}

function HeroPortrait() {
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-black/10 bg-[#f7f7f4] shadow-[0_8px_30px_rgba(0,0,0,0.25)] dark:border-white/15 dark:bg-[#080808] dark:shadow-[0_8px_30px_rgba(0,0,0,0.55)]">
      {!failed ? (
        <img
          src={PORTRAIT_URL}
          alt="Ebad Ahsan"
          onError={() => setFailed(true)}
          className="h-[0.9em] w-[0.9em] object-cover"
        />
      ) : (
        <span className="flex h-[0.9em] w-[0.9em] items-center justify-center bg-gradient-to-br from-[#34362a] via-[#1a1b15] to-[#0c0d0a]">
          <span className="font-condensed text-[0.55em] leading-none text-[#25D366]/85">
            E
          </span>
        </span>
      )}
    </span>
  );
}

function Showreel() {
  const media = useQuery(api.videoAssets.listVideoOverrides);
  const ytHostRef = useRef<HTMLDivElement>(null);
  // Use the uploaded MP4 when one exists; otherwise build a fully chrome-free
  // YouTube player (captions module unloaded — subtitles can never appear).
  const showreelMp4 = media?.showreel?.url ?? SHOWREEL_MP4;
  useChromeFreeYouTubePlayer(ytHostRef, SHOWREEL_ID, !showreelMp4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.56, ease: "easeOut" }}
      className="gpu-crisp relative mx-auto mt-8 w-full overflow-hidden rounded-2xl border border-black/10 bg-[#e6e6e2] sm:mt-10 dark:border-white/10 dark:bg-[#141414]"
    >
      {/* Fallback gradient behind the video */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[#deded8] dark:bg-[radial-gradient(120%_120%_at_20%_0%,#1c2b1e_0%,#0e0e0e_62%)]"
      />

      {/* Autoplay on load: muted + loop + playsinline so browsers allow it */}
      <div className="relative aspect-video w-full">
        {showreelMp4 ? (
          <video
            key={showreelMp4}
            src={showreelMp4}
            poster={SHOWREEL_THUMBNAIL}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            controlsList="nodownload"
            onContextMenu={(event) => event.preventDefault()}
            className="absolute inset-0 h-full w-full rounded-2xl bg-black object-cover"
          />
        ) : (
          <>
            <div ref={ytHostRef} key="yt-host" className="absolute inset-0 h-full w-full" />
            {/* Invisible overlay — blocks hover/click events from reaching
                YouTube so its title bar, share buttons, and overlays never appear. */}
            <span aria-hidden className="absolute inset-0 z-10 cursor-default" />
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------- Brand icons ---------------- */

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

/* ---------------- Portfolio ---------------- */

function Portfolio() {
  return (
    <section id="work" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          eyebrow={<PillBadge icon={<Home className="size-5" />} label="Portfolio" />}
          title="My Latest Projects"
          sub="Some Case Studies"
        />

        <div className="mt-14 grid w-full gap-6 sm:grid-cols-2">
          {PROJECTS.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [playing, setPlaying] = useState(false);
  const [thumbStep, setThumbStep] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const media = useQuery(api.videoAssets.listVideoOverrides);
  const thumbnails = [project.thumbnailUrl, project.thumbnailFallbackUrl].filter(
    Boolean,
  ) as string[];
  // Native HTML5 video source: an MP4 uploaded from the dashboard (slot
  // override) wins, then an explicit videoFile, then a direct video URL. When
  // none exists, fall back to the chrome-free YouTube/Vimeo facade.
  const directSrc =
    media?.[project.id]?.url ??
    project.videoFile ??
    (isDirectVideo(project.videoUrl) ? project.videoUrl : null);
  const facadeSrc = directSrc ? null : getAutoplayEmbedSrc(project.videoUrl);
  const ytId = getYouTubeId(project.videoUrl);

  // Video facade / lazy loading: the lightweight thumbnail <img> is fetched
  // only once the card scrolls within 200px of the viewport (Intersection
  // Observer). The actual video player is NOT mounted until the user clicks.
  const nearView = useInView(cardRef, { margin: "200px", once: true });

  // Player mounts only on interaction — nothing heavy loads at page load.
  const showPlayer = playing && Boolean(directSrc || facadeSrc);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 2) * 0.09, ease: "easeOut" }}
      role="button"
      tabIndex={0}
      aria-label={playing ? `${project.title} — now playing` : `Play ${project.title}`}
      onClick={() => !playing && setPlaying(true)}
      onKeyDown={(event) => {
        if (!playing && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          setPlaying(true);
        }
      }}
      className="gpu-crisp group relative flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-2 pb-3 text-left transition-all duration-300 hover:border-[#25D366]/60 hover:shadow-[0_0_28px_rgba(37,211,102,0.18)] dark:border-white/10 dark:bg-[#080808] dark:hover:shadow-[0_0_28px_rgba(37,211,102,0.12)]"
    >
      {/* Media area — fixed 16:9 frame; auto-plays muted while in view. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {showPlayer ? (
          directSrc ? (
            <video
              key={directSrc}
              src={directSrc}
              poster={project.thumbnailUrl}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              controlsList="nodownload"
              onContextMenu={(event) => event.preventDefault()}
              className="h-full w-full rounded-2xl bg-black object-cover"
            />
          ) : ytId ? (
            <iframe
              key={ytId}
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&color=white`}
              title={`${project.title} — video player`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <iframe
              key={facadeSrc ?? "facade"}
              src={facadeSrc ?? undefined}
              title={`${project.title} — video player`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )
        ) : (
          <>
            {nearView && thumbStep < thumbnails.length ? (
              <img
                key={thumbnails[thumbStep]}
                src={thumbnails[thumbStep]}
                loading="lazy"
                decoding="async"
                onError={() => setThumbStep((step) => step + 1)}
                alt={`${project.title} video thumbnail`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="absolute inset-0 bg-[#deded8] dark:bg-[radial-gradient(120%_120%_at_18%_0%,#1c2b1e_0%,#0e0e0e_62%)]" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.2),transparent_50%,rgba(10,10,10,0.4))]" />
            {/* Centered minimal play button — clicking anywhere on the card starts playback */}
            <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white transition-all duration-300 group-hover:scale-110 group-hover:border-white/60 group-hover:bg-white/35">
              <Play className="ml-0.5 size-6 fill-current" />
            </span>
          </>
        )}
      </div>

      <div className="flex items-end justify-between gap-4 px-2 pt-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl font-semibold text-[#101010] dark:text-white">
            {project.title}
          </h3>
          <p className="mt-0.5 text-base leading-relaxed text-[#55555c] dark:text-[#E5E7EB]">{project.category}</p>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-black/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#25D366] dark:text-white/80" />
      </div>
    </motion.div>
  );
}

/* ---------------- Stats ---------------- */

function Stats() {
  return (
    <section className="relative px-4 py-16 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col items-stretch justify-center gap-10 sm:flex-row sm:gap-0">
        {STATS.map((stat, index) => (
          <Fragment key={stat.label}>
            {index > 0 && (
              <span
                aria-hidden
                className="hidden h-14 w-[1.5px] self-center bg-black/15 sm:block dark:bg-white/90"
              />
            )}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
              className="gpu-crisp flex-1 px-8 text-center"
            >
              <p className="font-display text-5xl font-extrabold tracking-tight text-[#25D366] md:text-6xl">
                <Counter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-base font-semibold text-[#3a3a3e] md:text-lg dark:text-gray-100">{stat.label}</p>
            </motion.div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/* ---------------- Client Growth ---------------- */

// Example growth cards — swap in real clients, avatars, and numbers. Each
// entry maps 1:1 to a <GrowthStatsCard /> (see src/components/GrowthStatsCard.tsx).
const GROWTH_CARDS = [
  {
    name: "FlowSavvy",
    subtitle: "168K subscribers",
    avatar: "/assets/channels4_profile.jpg?v=2",
    verified: true,
    accent: "green" as const,
    stats: {
      views: { label: "Views", value: 1_420_000, delta: "+38%" },
      watchTime: { label: "Watch Time", value: 92_400, delta: "+41%" },
      subscribers: { label: "Subscribers", value: 168_000, delta: "+52%" },
    },
    // 12 monthly points (Jan → Dec), any scale — normalized for the chart.
    chart: [4200, 4700, 5100, 5900, 6400, 7100, 7800, 8600, 9500, 11000, 12500, 14200],
    headline: { value: 168_000, badge: "Subscribers added in 12 months" },
  },
  {
    name: "Dragon Fruit Media",
    subtitle: "24.6K subscribers",
    avatar: "/assets/channels4_profile__2_.jpg?v=2",
    verified: true,
    accent: "red" as const,
    stats: {
      views: { label: "Views", value: 2_100_000, delta: "+64%" },
      watchTime: { label: "Watch Time", value: 148_000, delta: "+57%" },
      subscribers: { label: "Subscribers", value: 24_600, delta: "+73%" },
    },
    chart: [1800, 2100, 2600, 3300, 4100, 5200, 6100, 7900, 9800, 12400, 15800, 21000],
    headline: { value: 2_100_000, badge: "Views generated in 12 months" },
  },
];

function GrowthSection() {
  return (
    <section className="relative px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={<PillBadge icon={<TrendingUp className="size-5" />} label="Results" />}
          title={
            <>
              Client Growth, <span className="text-[#25D366]">By The Numbers</span>
            </>
          }
          sub="Real channels I've helped grow — views, watch time, and subscribers heading up month after month."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {GROWTH_CARDS.map((card) => (
            <GrowthStatsCard key={card.name} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Our Process ---------------- */

const PROCESS_STEPS = [
  {
    num: "1",
    title: "Brand Strategy And Growth Plan",
    desc: "I use analytics and competitive research to build out your YouTube branding, positioning, and long-term growth plan, with viral trends and already tried and tested methods used on multiple channels and brands.",
  },
  {
    num: "2",
    title: "Creative Production",
    desc: "We produce your content end-to-end, from suggesting new ideas, brand strategy, executing on optimized titles, thumbnails, video outlines, filming support, premium editing, and publication for continuous growth.",
  },
];

function ProcessSection() {
  const [active, setActive] = useState(0);
  return (
    <section id="process" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={<PillBadge icon={<HelpCircle className="size-5" />} label="Process" />}
          title="My Process"
          sub="You bring the expertise. I will do the rest with two focused phases."
        />

        <div className="mt-12 flex min-h-[460px] flex-col gap-2.5 sm:h-[460px] sm:min-h-0 sm:flex-row">
          {PROCESS_STEPS.map((step, index) => {
            const isActive = index === active;
            return (
              <motion.button
                key={step.num}
                type="button"
                onClick={() => setActive(index)}
                aria-expanded={isActive}
                className={cn(
                  "gpu-crisp group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ease-in-out sm:p-6",
                  isActive
                    ? "flex-[3] border-[#25D366]/70 bg-[#000000] shadow-[0_0_34px_rgba(37,211,102,0.18)]"
                    : "w-16 flex-none border-white/10 bg-[#080808] hover:border-[#25D366]/40 sm:w-20",
                  isActive ? "items-start justify-start gap-6" : "items-center justify-center",
                )}
              >
                <span
                  className={cn(
                    "font-display font-black tracking-tight transition-all duration-300",
                    isActive
                      ? "text-6xl text-[#25D366] drop-shadow-[0_0_14px_rgba(37,211,102,0.45)] sm:text-7xl"
                      : "text-xl text-white/70 group-hover:text-[#25D366] sm:text-3xl",
                  )}
                >
                  {step.num}
                </span>

                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
                    className="flex w-full flex-col space-y-6"
                  >
                    <h3 className="font-display text-3xl font-extrabold capitalize leading-tight text-white sm:text-4xl">
                      {step.title}
                    </h3>
                    <p className="max-w-2xl text-lg leading-relaxed text-[#D1D5DB] sm:text-xl">
                      {step.desc}
                    </p>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCta() {
  return (
    <section id="request-cal" className="scroll-mt-24 px-4 pb-24 pt-8 sm:px-6">
      <div className="gpu-crisp relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-black/10 bg-white/70 px-5 py-12 sm:px-10 sm:py-20 dark:border-white/10 dark:bg-[#080808]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/3 h-72 w-[560px] rounded-full bg-[#5ca5ff]/[0.14] blur-[120px]" />
          <div className="absolute inset-0 bg-noise opacity-[0.04]" />
        </div>

        <div className="relative grid gap-12 lg:grid-cols-[1.1fr_1.1fr] lg:gap-16">
          <div className="flex flex-col items-start">
            <SectionHeading
              align="left"
              eyebrow={<PillBadge icon={<Calendar className="size-5" />} label="Booking" />}
              title={
                <>
                  <span className="inline-block rounded-lg bg-[#25D366] px-3.5 py-1 align-baseline font-extrabold leading-none text-black mr-2">
                    Reserve
                  </span>
                  <span className="whitespace-nowrap">A Spot —</span>
                  <br />
                  <span className="font-bold text-[#25D366]">
                    Let&apos;s Discuss Your Project
                  </span>
                </>
              }
              sub="Tell me about your product and I'll get back to you within 24h with next steps. Prefer to chat? Message me on WhatsApp."
            />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={getWhatsAppHref(WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={openWhatsApp(WHATSAPP_MESSAGE)}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/15 px-6 text-base font-semibold text-[#0B4F37] transition-all duration-300 hover:border-[#25D366]/70 hover:bg-[#25D366]/25 hover:text-[#064a30] dark:text-white dark:hover:text-white dark:hover:bg-[#25D366]/30"
              >
                <WhatsAppIcon className="size-4" />
                Chat on WhatsApp
              </a>
              <CopyNumberButton />
            </div>
          </div>

          {CALENDAR_EMBED_URL ? (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-[#080808]">
              <iframe
                src={CALENDAR_EMBED_URL}
                title="Schedule a call"
                className="h-[660px] w-full"
                loading="lazy"
                style={{ border: 0 }}
              />
            </div>
          ) : (
            <RequestForm />
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Request form ---------------- */

const BUDGET_RANGES = ["$1k – $3k", "$3k – $7k", "$7k – $15k", "$15k+", "Not sure yet"];

const TIMELINES = ["ASAP", "1 – 2 weeks", "3 – 4 weeks", "Next month", "Flexible"];

// Public booking-form endpoint — a Convex HTTP action (src/convex/http.ts)
// that rate-limits per IP (3 submissions/hour) and validates server-side
// before anything is stored. Convex serves HTTP actions at the site URL:
// <deployment>.convex.site in production, or the same local URL as
// VITE_CONVEX_URL during local dev (where the ".cloud" replacement is a no-op).
const CONVEX_URL = (import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "";
const INQUIRY_ENDPOINT = `${CONVEX_URL.replace(".cloud", ".site")}/inquiry`;

// POSTs the form to the HTTP action and returns a clean result so raw
// provider/server error strings never reach the UI.
async function submitInquiry(
  payload: Record<string, string | undefined>,
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(INQUIRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
    } | null;
    if (!data || data.success !== true) {
      return {
        success: false,
        message: data?.message ?? "Please try again in a moment.",
      };
    }
    return { success: true };
  } catch {
    return { success: false, message: "Please try again in a moment." };
  }
}

function RequestForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<{
    budget?: boolean;
    timeline?: boolean;
  }>({});

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const niche = ((formData.get("niche") as string) ?? "").trim();
    const budget = (formData.get("budget") as string) ?? "";
    const timeline = (formData.get("timeline") as string) ?? "";
    const nextInvalid: typeof invalid = {};
    if (!budget) nextInvalid.budget = true;
    if (!timeline) nextInvalid.timeline = true;
    setInvalid(nextInvalid);
    if (Object.keys(nextInvalid).length > 0) return;

    setStatus("loading");
    try {
      const result = await submitInquiry({
        name: (formData.get("name") as string) ?? "",
        email: (formData.get("email") as string) ?? "",
        company: ((formData.get("company") as string) ?? "").trim(),
        phone: ((formData.get("phone") as string) ?? "").trim(),
        projectType: niche,
        budget,
        timeline,
        reference: ((formData.get("reference") as string) ?? "").trim(),
        message: (formData.get("message") as string) ?? "",
        // Honeypot — hidden field bots fill; the server discards those.
        website: ((formData.get("website") as string) ?? "").trim(),
      });
      if (result.success) {
        setStatus("success");
      } else {
        // Clean, user-facing message — never a raw Convex/server error string.
        setError(result.message ?? "Please try again in a moment.");
        setStatus("error");
      }
    } catch (err) {
      console.error("Inquiry submit error:", err);
      // Keep raw Convex error strings (e.g. "[CONVEX M...]") out of the UI.
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="gpu-crisp flex flex-col items-center justify-center gap-4 rounded-2xl border border-[#25D366]/50 bg-[#25D366]/15 p-10 text-center dark:border-[#25D366]/40 dark:bg-[#25D366]/10"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-[#25D366] text-[#0e0e0e]">
          <Check className="size-7" />
        </span>
        <h3 className="font-display text-3xl font-semibold text-[#101010] dark:text-white">Message Sent Successfully!</h3>
        <p className="max-w-sm text-base leading-relaxed text-[#55555c] dark:text-[#E5E7EB]">
          I will get back to you soon.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="text-glow-green mt-2 rounded-full text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
          onClick={() => setStatus("idle")}
        >
          Send Another Request
        </Button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="gpu-crisp rounded-2xl border border-black/10 bg-white p-6 sm:p-7 dark:border-white/10 dark:bg-[#080808]"
    >
      {/* Honeypot — hidden from humans, irresistible to bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your Name" required>
          <input name="name" required maxLength={100} placeholder="Jane Doe" className={inputClass} />
        </Field>
        <Field label="Email" required>
          <input name="email" type="email" required placeholder="jane@company.com" className={inputClass} />
        </Field>
        <Field label="Company / Channel (Optional)">
          <input name="company" maxLength={100} placeholder="Acme Inc. or @channelname" className={inputClass} />
        </Field>
        <PhoneNumberField />
        <Field label="Your Niche" required>
          <input
            name="niche"
            required
            maxLength={100}
            placeholder="e.g., Tech, Finance, Gaming, Fitness"
            className={inputClass}
          />
        </Field>
        <SelectField
          label="Budget"
          name="budget"
          required
          placeholder="Select A Range"
          options={BUDGET_RANGES}
          invalid={invalid.budget}
          errorMessage="Please select a budget range."
        />
        <SelectField
          label="Timeline"
          name="timeline"
          required
          placeholder="When Do You Need It?"
          options={TIMELINES}
          invalid={invalid.timeline}
          errorMessage="Please select your timeline."
        />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <Field label="Reference / Inspiration (Optional)">
          <input
            name="reference"
            maxLength={500}
            placeholder="e.g., Links to videos, channels, or editing styles you like"
            className={inputClass}
          />
        </Field>
        <Field label="Tell Me About Your Project" required>
          <textarea
            name="message"
            required
            rows={4}
            maxLength={2000}
            placeholder="Your product, the story you want to tell, links to anything relevant…"
            className={cn(inputClass, "min-h-28 resize-y")}
          />
        </Field>
      </div>

      {error && <p className="mt-3 text-base text-red-400">{error}</p>}

      <Button
        type="submit"
        disabled={status === "loading"}
        aria-busy={status === "loading"}
        className="mt-5 h-12 w-full gap-2 rounded-full bg-[#2b7ced] text-white hover:bg-[#3d87f0]"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Request A Project
            <ArrowUpRight className="size-4" />
          </>
        )}
      </Button>

      <p className="mt-3 text-center text-xs font-medium text-black/45 dark:text-white/45">
        Your information stays private and is only used to discuss your project.
      </p>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-[#101010] placeholder:capitalize placeholder:text-black/35 outline-none transition-colors focus:border-[#25D366]/70 focus:ring-2 focus:ring-[#25D366]/20 dark:border-white/15 dark:bg-[#0d0d0d] dark:text-white dark:placeholder:text-white/70";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium capitalize text-[#5b5b62] dark:text-[#E5E7EB]">
        {label}
        {required && <span className="text-[#25D366]"> *</span>}
      </span>
      {children}
    </label>
  );
}

/** Custom dark dropdown — Radix/shadcn Select popover. A hidden input carries
 *  the value into FormData so the existing submit flow keeps working. */
function SelectField({
  label,
  name,
  required,
  placeholder,
  options,
  invalid,
  errorMessage,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder: string;
  options: string[];
  invalid?: boolean;
  errorMessage?: string;
}) {
  const [value, setValue] = useState("");

  return (
    <Field label={label} required={required}>
      <input type="hidden" name={name} value={value} />
      <Select value={value || undefined} onValueChange={setValue}>
        <SelectTrigger
          className={cn(
            "h-auto w-full rounded-xl border px-4 py-3 text-base transition-colors",
            "border-black/10 bg-white text-[#101010] outline-none dark:border-white/15 dark:bg-[#0d0d0d] dark:text-white",
            "focus:border-[#25D366]/70 focus:ring-2 focus:ring-[#25D366]/20",
            "data-[placeholder]:text-black/35 dark:data-[placeholder]:text-white/70",
            invalid && "border-red-500/60",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          className="z-[100] w-full rounded-lg border border-black/10 bg-white p-1.5 text-[#101010] shadow-[0_18px_44px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-[#080808] dark:text-white dark:shadow-[0_18px_44px_rgba(0,0,0,0.65)]"
        >
          {options.map((option) => (
            <SelectItem
              key={option}
              value={option}
              className="cursor-pointer rounded-md py-2.5 pl-3 pr-8 text-base text-black/85 transition-colors focus:bg-[#25D366]/15 focus:text-black data-[highlighted]:bg-[#25D366]/15 data-[highlighted]:text-black dark:text-white/90 dark:focus:text-white dark:data-[highlighted]:text-white"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {invalid && errorMessage && (
        <p className="mt-1.5 text-sm text-red-400">{errorMessage}</p>
      )}
    </Field>
  );
}

/* ---------------- Phone input with searchable country picker ---------------- */

const COUNTRIES = [
  { name: "Pakistan", flag: "🇵🇰", code: "+92" },
  { name: "United States", flag: "🇺🇸", code: "+1" },
  { name: "United Kingdom", flag: "🇬🇧", code: "+44" },
  { name: "Afghanistan", flag: "🇦🇫", code: "+93" },
  { name: "Albania", flag: "🇦🇱", code: "+355" },
  { name: "Algeria", flag: "🇩🇿", code: "+213" },
  { name: "Argentina", flag: "🇦🇷", code: "+54" },
  { name: "Australia", flag: "🇦🇺", code: "+61" },
  { name: "Austria", flag: "🇦🇹", code: "+43" },
  { name: "Bangladesh", flag: "🇧🇩", code: "+880" },
  { name: "Belgium", flag: "🇧🇪", code: "+32" },
  { name: "Brazil", flag: "🇧🇷", code: "+55" },
  { name: "Canada", flag: "🇨🇦", code: "+1" },
  { name: "China", flag: "🇨🇳", code: "+86" },
  { name: "Czechia", flag: "🇨🇿", code: "+420" },
  { name: "Denmark", flag: "🇩🇰", code: "+45" },
  { name: "Egypt", flag: "🇪🇬", code: "+20" },
  { name: "Finland", flag: "🇫🇮", code: "+358" },
  { name: "France", flag: "🇫🇷", code: "+33" },
  { name: "Germany", flag: "🇩🇪", code: "+49" },
  { name: "Greece", flag: "🇬🇷", code: "+30" },
  { name: "Hong Kong", flag: "🇭🇰", code: "+852" },
  { name: "India", flag: "🇮🇳", code: "+91" },
  { name: "Indonesia", flag: "🇮🇩", code: "+62" },
  { name: "Ireland", flag: "🇮🇪", code: "+353" },
  { name: "Italy", flag: "🇮🇹", code: "+39" },
  { name: "Japan", flag: "🇯🇵", code: "+81" },
  { name: "Malaysia", flag: "🇲🇾", code: "+60" },
  { name: "Mexico", flag: "🇲🇽", code: "+52" },
  { name: "Morocco", flag: "🇲🇦", code: "+212" },
  { name: "Netherlands", flag: "🇳🇱", code: "+31" },
  { name: "New Zealand", flag: "🇳🇿", code: "+64" },
  { name: "Nigeria", flag: "🇳🇬", code: "+234" },
  { name: "Norway", flag: "🇳🇴", code: "+47" },
  { name: "Philippines", flag: "🇵🇭", code: "+63" },
  { name: "Poland", flag: "🇵🇱", code: "+48" },
  { name: "Portugal", flag: "🇵🇹", code: "+351" },
  { name: "Qatar", flag: "🇶🇦", code: "+974" },
  { name: "Romania", flag: "🇷🇴", code: "+40" },
  { name: "Russia", flag: "🇷🇺", code: "+7" },
  { name: "Saudi Arabia", flag: "🇸🇦", code: "+966" },
  { name: "Singapore", flag: "🇸🇬", code: "+65" },
  { name: "South Africa", flag: "🇿🇦", code: "+27" },
  { name: "South Korea", flag: "🇰🇷", code: "+82" },
  { name: "Spain", flag: "🇪🇸", code: "+34" },
  { name: "Sweden", flag: "🇸🇪", code: "+46" },
  { name: "Switzerland", flag: "🇨🇭", code: "+41" },
  { name: "Turkey", flag: "🇹🇷", code: "+90" },
  { name: "UAE", flag: "🇦🇪", code: "+971" },
  { name: "Ukraine", flag: "🇺🇦", code: "+380" },
  { name: "Vietnam", flag: "🇻🇳", code: "+84" },
];

function PhoneNumberField() {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [local, setLocal] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          c.code.includes(query.trim()),
      ),
    [query],
  );

  const fullValue = `${country.code}${local ? " " : ""}${local}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Never lose the dial code — if the user cleared it, re-anchor it.
    if (!value.startsWith(country.code)) {
      value = `${country.code} ${value.replace(/^[^0-9]*/, "")}`;
    }
    const localPart = value
      .slice(country.code.length)
      .replace(/[^0-9\s-]/g, "")
      .trim();
    setLocal(localPart);
  };

  const handleSelect = (c: (typeof COUNTRIES)[number]) => {
    setCountry(c);
    setOpen(false);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <Field label="Phone Number (Optional)">
      {/* Hidden input carries the full dial code + number into FormData */}
      <input type="hidden" name="phone" value={fullValue.replace(/\s/g, "")} />
      <div className="flex w-full gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Country code: ${country.name} ${country.code}`}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-3 text-base text-[#101010] outline-none transition-colors hover:border-[#25D366]/50 focus:border-[#25D366]/70 focus:ring-2 focus:ring-[#25D366]/20 dark:border-white/15 dark:bg-[#0d0d0d] dark:text-white"
            >
              <span className="text-lg leading-none">{country.flag}</span>
              <span className="font-medium tabular-nums">{country.code}</span>
              <ChevronDown
                className={cn(
                  "size-4 text-black/40 transition-transform duration-200 dark:text-white/50",
                  open && "rotate-180",
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="z-[100] w-72 rounded-xl border border-black/10 bg-white p-2 text-[#101010] shadow-[0_18px_44px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-[#080808] dark:text-white dark:shadow-[0_18px_44px_rgba(0,0,0,0.65)]"
          >
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/35 dark:text-white/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Country..."
                autoFocus
                className="w-full rounded-lg border border-black/10 bg-black/5 py-2 pl-9 pr-3 text-sm text-[#101010] placeholder:text-black/35 outline-none focus:border-[#25D366]/70 focus:ring-2 focus:ring-[#25D366]/20 dark:border-white/15 dark:bg-[#0d0d0d] dark:text-white dark:placeholder:text-white/50"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-3 py-2.5 text-sm text-black/50 dark:text-white/50">
                  No countries found
                </li>
              )}
              {filtered.map((c) => (
                <li key={`${c.code}-${c.name}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-[#25D366]/10",
                      c === country && "bg-[#25D366]/10 font-semibold",
                    )}
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="tabular-nums text-black/45 dark:text-white/45">
                      {c.code}
                    </span>
                    {c === country && <Check className="size-4 shrink-0 text-[#25D366]" />}
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        <input
          ref={inputRef}
          type="tel"
          value={fullValue}
          onChange={handleChange}
          placeholder="+92 3xx xxxxxxx"
          inputMode="tel"
          autoComplete="tel"
          aria-label="Phone number"
          className={cn(inputClass, "min-w-0 flex-1")}
        />
      </div>
    </Field>
  );
}

/* ---------------- Social / DM ---------------- */

function DmSection() {
  return (
    <section id="dm" className="scroll-mt-24 px-4 pb-24 pt-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={<PillBadge icon={<Send className="size-5" />} label="Direct" />}
          title="Shoot Me A DM, Let's Discuss Your Next Project"
          sub="Fastest Reply On WhatsApp — Or Catch Me On Your Favorite Platform."
        />

        <div className="mx-auto mt-10 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          <DmCard
            href={getWhatsAppHref(WHATSAPP_MESSAGE)}
            icon={<WhatsAppIcon className="size-5" />}
            label="WhatsApp"
            note="Fastest Reply"
            onClick={openWhatsApp(WHATSAPP_MESSAGE)}
          />
          <DmCard
            href={SOCIALS.instagram}
            icon={<Instagram className="size-5" />}
            label="Instagram"
            note="DM Me"
          />
          <DmCard
            href="mailto:onepunchman5005@gmail.com"
            icon={<Mail className="size-5" />}
            label="Gmail"
            note="Direct Email"
          />
        </div>

        <div className="mx-auto mt-12 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          <CopyNumberButton large className="w-full" />
          <Button
            size="lg"
            onClick={() =>
              document
                .getElementById("request-cal")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="h-12 w-full gap-2 rounded-full bg-[#2b7ced] px-8 text-lg font-bold text-white shadow-[0_4px_18px_rgba(43,124,237,0.28)] transition-all duration-300 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25"
          >
            Start Your Project
            <ArrowUpRight className="size-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function DmCard({
  href,
  icon,
  label,
  note,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  note: string;
  onClick?: (e: ReactMouseEvent<HTMLAnchorElement>) => void;
}) {
  const card = (
    <>
      <span className="flex size-12 items-center justify-center rounded-full border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] transition-all duration-300 group-hover:border-[#25D366]/60 group-hover:shadow-[0_0_14px_rgba(37,211,102,0.25)]">
        {icon}
      </span>
      <span className="font-display text-lg font-semibold text-[#101010] dark:text-white">{label}</span>
      <span className="text-base font-medium capitalize text-[#25D366]">{note}</span>
    </>
  );
  const classes =
    "gpu-crisp group flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-white px-6 py-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#25D366]/50 hover:shadow-[0_0_25px_rgba(37,211,102,0.15)] dark:border-white/10 dark:bg-[#080808]";
  if (!href) {
    return <div className={cn(classes, "cursor-not-allowed opacity-45")}>{card}</div>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={classes}
    >
      {card}
    </a>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="border-t border-black/10 px-4 py-12 sm:px-6 dark:border-white/10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#e4e4e0] dark:bg-[#212121]">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <circle cx="12" cy="12" r="6.5" fill="none" stroke="#25D366" strokeWidth="1.6" />
                <path d="M9.8 8.7 L9.8 15.3 L14.5 12 Z" fill="#25D366" />
              </svg>
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-[#101010] dark:text-white">
              Ebad <span className="text-[#25D366] text-glow-green">Ahsan</span>
            </span>
          </div>
          <p className="text-base capitalize leading-relaxed text-[#55555c] dark:text-[#E5E7EB]">
            Premium motion content for brands that move fast.
          </p>
          {Object.values(SOCIALS).some(Boolean) && (
            <div className="flex items-center gap-3">
              {SOCIALS.discord && (
                <FooterIcon href={SOCIALS.discord} label="Discord">
                  <DiscordIcon className="size-4" />
                </FooterIcon>
              )}
              {SOCIALS.x && (
                <FooterIcon href={SOCIALS.x} label="X">
                  <MessageCircle className="size-4" />
                </FooterIcon>
              )}
              {SOCIALS.instagram && (
                <FooterIcon href={SOCIALS.instagram} label="Instagram">
                  <Instagram className="size-4" />
                </FooterIcon>
              )}
              {SOCIALS.youtube && (
                <FooterIcon href={SOCIALS.youtube} label="YouTube">
                  <Youtube className="size-4" />
                </FooterIcon>
              )}
            </div>
          )}
        </div>
        <p className="mt-10 text-center text-base text-[#55555c]/80 dark:text-[#E5E7EB]">
          © {new Date().getFullYear()} Ebad Ahsan. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full border border-black/10 text-[#55555c] transition-colors hover:border-[#25D366]/70 hover:text-[#25D366] dark:border-white/10 dark:text-[#E5E7EB]"
    >
      {children}
    </a>
  );
}

/* ---------------- Shared ---------------- */

function PillBadge({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <span className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-5 py-2 text-base font-bold normal-case tracking-wide text-[#25D366] shadow-[0_0_15px_rgba(37,211,102,0.25)]">
      {icon}
      {label}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={cn("gpu-crisp flex flex-col gap-4", align === "center" && "items-center text-center")}
    >
      <span className="text-glow-green text-xs font-medium uppercase tracking-[0.28em] text-[#25D366]">
        {eyebrow}
      </span>
      <div className="relative max-w-3xl">
        {/* Ambient light behind the section title */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#25D366]/10 blur-3xl"
        />
        <h2 className="relative font-display text-4xl font-semibold capitalize tracking-tight text-gradient-silver sm:text-5xl lg:text-6xl">
          {title}
        </h2>
      </div>
      {sub && <p className="max-w-xl text-base capitalize leading-relaxed text-[#55555c] dark:text-[#E5E7EB]">{sub}</p>}
    </motion.div>
  );
}

/* ---------------- Copy WhatsApp number fallback ---------------- */

function CopyNumberButton({
  compact,
  iconOnly,
  large,
  className,
}: {
  compact?: boolean;
  iconOnly?: boolean;
  large?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      // Preferred API — fails silently in non-secure contexts.
      await navigator.clipboard.writeText(WHATSAPP_NUMBER_DISPLAY);
    } catch {
      // Fallback: hidden textarea + execCommand for older browsers / http.
      const textarea = document.createElement("textarea");
      textarea.value = WHATSAPP_NUMBER_DISPLAY;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const button = (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      aria-label={copied ? "Number copied" : "Copy WhatsApp number"}
      title={copied ? "Number copied" : "Copy WhatsApp number"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border font-semibold transition-all duration-300",
        iconOnly
          ? "size-11"
          : large
            ? "h-12 px-8 text-lg font-bold"
            : compact
              ? "h-11 px-5 text-sm"
              : "h-11 px-6 text-base",
        copied
          ? "text-glow-green border-[#25D366]/60 bg-[#25D366]/15 text-[#25D366]"
          : "border-zinc-400/70 bg-black/5 text-zinc-800 hover:bg-black/10 hover:text-black dark:border-zinc-700/60 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white",
        className,
      )}
    >
      {iconOnly ? (
        copied ? <Check className="size-5" /> : <Copy className="size-5" />
      ) : copied ? (
        <>
          <Check className={large ? "size-5" : "size-4"} />
          Copied!
        </>
      ) : (
        <>
          <Copy className={large ? "size-5" : "size-4"} />
          Copy Number
        </>
      )}
    </button>
  );

  if (!iconOnly) return button;

  // Icon-only (floating) variant: hover tooltip, green "Copied!" tooltip on copy.
  return (
    <span className="group relative inline-flex">
      {button}
      <span
        className={cn(
          "pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all duration-200",
          copied
            ? "text-glow-green border-[#25D366]/60 bg-[#25D366]/15 text-[#25D366] opacity-100"
            : "border-white/10 bg-black/80 text-[#E5E7EB] opacity-0 group-hover:opacity-100",
        )}
      >
        {copied ? "Copied!" : "Copy Number"}
      </span>
    </span>
  );
}
