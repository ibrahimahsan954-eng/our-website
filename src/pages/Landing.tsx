import { Fragment, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
  Check,
  Clapperboard,
  Copy,
  Home,
  Instagram,
  Loader2,
  Mail,
  MessageCircle,
  Moon,
  Play,
  Sun,
  X,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   Config — swap these with your real links and numbers
   ============================================================ */

// Where "Book a Call" pills scroll to — keep as the on-page CTA section,
// or point at your real Cal.com link (e.g. "https://cal.com/ebadahsan").
const BOOKING_URL = "#request-cal";

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

// Hero portrait — fills the vertical pill window cutout through the name.
// Drop your photo at public/portrait.jpg (a square headshot works best; it is
// cropped to the pill). Falls back to a lime monogram tile until it exists.
const PORTRAIT_URL = "/portrait.jpg";

// Social proof avatar stack — small overlapping client photos under the hero
// portrait. Each falls back to a gradient monogram tile if the image can't load.
const CLIENT_AVATARS = [
  { src: "/assets/channels4_profile.jpg", label: "M" },
  { src: "/assets/channels4_profile__1_.jpg", label: "S" },
  { src: "/assets/channels4_profile__2_.jpg", label: "A" },
  { src: "/assets/channels4_profile__3_.jpg", label: "K" },
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

// Iframe-escape handler: forces the link to open at top-level. Inside the
// preview iframe (window.top !== window.self) we pop a fresh top-level window;
// on the real site we navigate directly. The <a href> stays as a backup.
function openWhatsApp(message: string) {
  return (e: ReactMouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const targetUrl = getWhatsAppHref(message);
    if (window.top !== window.self) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = targetUrl;
    }
  };
}

// Web3Forms — contact forms POST here so every submission lands straight in
// the owner's inbox (the access key is bound to the destination email on
// web3forms.com). The hidden-field equivalents of access_key/subject are sent
// in the JSON body so the SPA never navigates away from the page.
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WEB3FORMS_ACCESS_KEY = "29857f35-c5a0-46fb-b8a4-3d7930ace8b0";
const WEB3FORMS_SUBJECT = "New Portfolio Contact Submission!";

// POSTs form fields to Web3Forms and returns a clean result so raw provider
// error strings never reach the UI.
async function submitToWeb3Forms(
  payload: Record<string, string>,
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: WEB3FORMS_SUBJECT,
        ...payload,
      }),
    });
    const data = (await response.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
    } | null;
    if (!response.ok || !data?.success) {
      return { success: false, message: "Please try again in a moment." };
    }
    return { success: true };
  } catch {
    return { success: false, message: "Please try again in a moment." };
  }
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
  { value: 60, suffix: "+", label: "Happy clients" },
  { value: 90, suffix: "+", label: "Projects completed" },
  { value: 100, suffix: "K+", label: "Views" },
];

const FAQS = [
  {
    q: "What services do you offer?",
    a: "High-end motion design for brands that want clarity and impact. I create product launch videos, explainers, demos, short-form reels, VSLs, and keynote visuals — combining clean UI motion with strong storytelling to make ideas impossible to ignore.",
  },
  {
    q: "How long does a project usually take?",
    a: "Most builds take 3–7 days, depending on how much content you provide and any custom sections you want added. I keep the process smooth, fast, and collaborative.",
  },
  {
    q: "Is there a limit to revisions during the process?",
    a: "No compromises. We offer unlimited revisions at every stage — we'll keep refining your video until it's exactly how you want it.",
  },
  {
    q: "How do payments work?",
    a: "To keep things simple, I send a quick invoice to get started. Once that's paid, I begin working right away and keep you updated through the entire process. I accept PayPal and Payoneer invoices.",
  },
];

/* ============================================================
   Landing page — recreation of zakariahq.com
   ============================================================ */

export default function Landing() {
  const [reserveOpen, setReserveOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[70] bg-noise opacity-[0.03] mix-blend-overlay"
      />
      <Nav onReserve={() => setReserveOpen(true)} />
      <main>
        <Hero onReserve={() => setReserveOpen(true)} />
        <Portfolio />
        <Stats />
        <Faqs />
        <FinalCta />
        <DmSection />
      </main>
      <Footer />

      <ReserveModal open={reserveOpen} onClose={() => setReserveOpen(false)} />

      {/* Floating contact cluster — WhatsApp + 1-tap copy-number fallback */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-center gap-3">
        <CopyNumberButton iconOnly />
        <motion.a
          href={getWhatsAppHref(WHATSAPP_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={openWhatsApp(WHATSAPP_MESSAGE)}
          aria-label="Chat on WhatsApp"
          title="Chat on WhatsApp"
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
      className="fixed inset-x-0 top-5 z-50 flex justify-center px-4 sm:top-6"
    >
      <motion.nav className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 p-2 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <a
          href="#top"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
          className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-black/5 text-black/60 backdrop-blur-md transition-colors hover:bg-black/10 hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Home className="size-[18px]" />
        </a>

        <span aria-hidden className="mx-1 h-4 w-px bg-black/15 dark:bg-white/15" />

        <NavIcon href="#work" label="Portfolio">
          <Clapperboard className="size-[18px]" />
        </NavIcon>
        <NavIcon href="#faqs" label="FAQs">
          <MessageCircle className="size-[18px]" />
        </NavIcon>

        <span aria-hidden className="mx-1 h-4 w-px bg-black/15 dark:bg-white/15" />

        <Button
          type="button"
          size="sm"
          onClick={onReserve}
          className="h-10 gap-2 rounded-full bg-[#71b25c] px-5 text-base font-semibold text-[#0b141a] shadow-[0_0_14px_rgba(113,178,92,0.55),0_0_30px_rgba(113,178,92,0.3)] transition-all duration-300 hover:bg-[#83c26f] hover:shadow-[0_0_22px_rgba(113,178,92,0.75),0_0_46px_rgba(113,178,92,0.4)]"
        >
          Reserve a Spot
          <ArrowUpRight className="size-3.5" />
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
      className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-black/5 text-black/60 transition-colors hover:bg-black/10 hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {dark ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
    </button>
  );
}

function NavIcon({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-black/60 transition-colors hover:bg-black/10 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {children}
    </a>
  );
}

/* ---------------- Hero ---------------- */

function Hero({ onReserve }: { onReserve?: () => void }) {
  return (
    <section id="top" className="relative overflow-hidden bg-[#e9e9e5] px-4 pb-16 pt-28 sm:pt-32 md:px-6 dark:bg-[#161616]">
      <div className="relative mx-auto w-full text-center">
        {/* Massive name composition — lime-green condensed type with the
            vertical pill portrait window cutting through the middle letters */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative mx-auto w-fit select-none"
        >
          <h1 className="font-condensed text-[#71b25c] drop-shadow-[0_0_30px_rgba(113,178,92,0.35)]">
            <span className="block text-[clamp(3.5rem,20vw,20rem)] leading-[0.85] tracking-[0.07em]">
              EBAD
            </span>
            <span className="block text-[clamp(3.5rem,20vw,20rem)] leading-[0.85] tracking-[-0.01em]">
              AHSAN
            </span>
          </h1>

          {/* Vertical pill window — portrait overlaps the middle of the letters */}
          <HeroPortrait />
        </motion.div>

        {/* Social proof — client avatar stack under the portrait */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.26, ease: "easeOut" }}
          className="mt-9 flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-2.5">
            {CLIENT_AVATARS.map((a) => (
              <ClientAvatar key={a.src} src={a.src} label={a.label} />
            ))}
          </div>
          <p className="text-sm font-medium tracking-[-0.01em] text-[#1b1b1e] sm:text-base dark:text-[#e6e6e9]">
            Trusted by <strong className="font-semibold text-[#101010] dark:text-white">80+</strong> Happy Clients
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-2xl text-lg font-normal leading-relaxed tracking-[-0.01em] text-[#4f4f56] sm:text-xl dark:text-[#8b8b91]"
        >
          <strong className="inline-flex items-center gap-1.5 font-semibold text-[#101010] dark:text-white">
            Grow on
            <YouTubeLogo className="size-[1.1em]" />
            YouTube
          </strong>
          <span aria-hidden className="mx-2 text-[#71b25c]">—</span>
          Become the <strong className="font-semibold text-[#101010] dark:text-white">best brand</strong> in your niche
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.42, ease: "easeOut" }}
          className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <span className="text-glow-green inline-flex items-center gap-2.5 rounded-full border border-emerald-500/40 bg-emerald-100/90 px-4 py-2 text-sm font-medium tracking-[-0.01em] text-[#71b25c] shadow-[0_0_18px_rgba(113,178,92,0.18)] backdrop-blur-md dark:border-emerald-500/30 dark:bg-emerald-950/40">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            3 spots left
          </span>
          <button
            type="button"
            onClick={onReserve}
            className="inline-flex h-12 items-center rounded-full bg-[#71b25c] px-7 text-base font-semibold text-[#0b141a] shadow-[0_0_20px_rgba(113,178,92,0.55),0_0_42px_rgba(113,178,92,0.3)] transition-all duration-300 hover:bg-[#83c26f] hover:shadow-[0_0_28px_rgba(113,178,92,0.75),0_0_60px_rgba(113,178,92,0.4)]"
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
      <span className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#e8e8e2] via-[#d9d9d2] to-[#c9c9c0] text-xs font-semibold text-[#71b25c] shadow-[0_0_12px_rgba(0,0,0,0.15)] dark:border-[#161616] dark:from-[#2c2f26] dark:via-[#1b1c14] dark:to-[#10110b] dark:shadow-[0_0_12px_rgba(0,0,0,0.4)]">
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
      className="size-9 rounded-full border-2 border-white object-cover shadow-[0_0_12px_rgba(0,0,0,0.15)] dark:border-[#161616] dark:shadow-[0_0_12px_rgba(0,0,0,0.4)]"
    />
  );
}

function HeroPortrait() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="absolute left-1/2 top-1/2 z-20 h-[clamp(8.5rem,36vw,36rem)] w-[clamp(2.75rem,11.5vw,11.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[999px] border border-black/10 bg-[#f7f7f4] shadow-[0_0_60px_rgba(0,0,0,0.25)] dark:border-white/15 dark:bg-[#0e0e0e] dark:shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {!failed ? (
        <img
          src={PORTRAIT_URL}
          alt="Ebad Ahsan"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#34362a] via-[#1a1b15] to-[#0c0d0a]">
          <span className="font-condensed text-[clamp(2.5rem,8vw,8rem)] leading-none text-[#71b25c]/85">
            E
          </span>
        </div>
      )}
    </div>
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
      className="relative mx-auto mt-8 w-full overflow-hidden rounded-2xl border border-black/10 bg-[#e6e6e2] sm:mt-10 dark:border-white/10 dark:bg-[#141414]"
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
            preload="auto"
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
          eyebrow="Portfolio"
          title="Our latest projects"
          sub="some case studies"
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
  const ytHostRef = useRef<HTMLDivElement>(null);
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

  // Chrome-free YouTube player for the facade: the captions module is unloaded
  // so subtitles can never appear (viewer preferences don't matter), and
  // destroying the player when the card scrolls out of view pauses playback.
  useChromeFreeYouTubePlayer(
    ytHostRef,
    ytId ?? "",
    showPlayer && !directSrc && Boolean(ytId),
  );

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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-2 pb-3 text-left transition-all duration-300 hover:border-[#71b25c]/60 hover:shadow-[0_0_28px_rgba(113,178,92,0.18)] dark:border-white/10 dark:bg-neutral-900/60 dark:backdrop-blur-sm dark:hover:shadow-[0_0_28px_rgba(113,178,92,0.12)]"
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
            <>
              <div ref={ytHostRef} key="yt-host" className="absolute inset-0 h-full w-full" />
              {/* Invisible overlay — blocks YouTube hover/click UI (title bar, share, overlays). */}
              <span aria-hidden className="absolute inset-0 z-10 cursor-default" />
            </>
          ) : (
            <>
              <iframe
                key={facadeSrc ?? "facade"}
                src={facadeSrc ?? undefined}
                title={`${project.title} — video player`}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              {/* Invisible overlay — blocks hover/click UI. */}
              <span aria-hidden className="absolute inset-0 z-10 cursor-default" />
            </>
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
            <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-white/60 group-hover:bg-white/35">
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
          <p className="mt-0.5 text-base leading-relaxed text-[#55555c] dark:text-[#86868b]">{project.category}</p>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-black/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#71b25c] dark:text-white/40" />
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
                className="hidden w-px self-center bg-black/10 sm:block dark:bg-white/20"
                style={{ height: 58 }}
              />
            )}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
              className="flex-1 px-8 text-center"
            >
              <p className="font-display text-6xl font-medium tracking-tight text-glow-metric sm:text-7xl">
                <Counter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-base font-medium tracking-[-0.01em] text-[#3a3a3e]/85 dark:text-[#f2f4f6]/80">{stat.label}</p>
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

/* ---------------- FAQs ---------------- */

function Faqs() {
  return (
    <section id="faqs" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_1.3fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            align="left"
            eyebrow="FAQs"
            title="Some of my frequently asked questions"
            sub="A quick collection of helpful answers so you can get clarity fast. If there's anything else you're wondering about, just reach out!"
          />
          <Button
            asChild
            variant="outline"
            className="mt-9 rounded-full border border-black/10 bg-black/5 text-black/80 backdrop-blur-md transition-colors hover:bg-black/10 hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
          >
            <a href={BOOKING_URL} className="gap-2">
              Request a Project
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {FAQS.map((faq, index) => (
            <AccordionItem
              key={faq.q}
              value={`item-${index}`}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white transition-colors data-[state=open]:border-[#71b25c]/60 dark:border-white/10 dark:bg-neutral-900/60 dark:backdrop-blur-sm dark:data-[state=open]:border-[#71b25c]/50"
            >
              <AccordionTrigger className="px-6 py-5 text-left font-display text-xl font-medium text-[#101010] hover:no-underline [&[data-state=open]]:text-[#71b25c] [&[data-state=open]]:drop-shadow-[0_0_8px_rgba(113,178,92,0.5)] dark:text-white">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent
                className={cn(
                  "px-6 pb-6 text-base leading-relaxed text-[#55555c] dark:text-[#86868b]",
                  faq.q === "How do payments work?" &&
                    "text-gray-800 dark:text-white",
                )}
              >
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCta() {
  return (
    <section id="request-cal" className="scroll-mt-24 px-4 pb-24 pt-8 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-black/10 bg-white/70 px-6 py-14 sm:px-10 sm:py-20 dark:border-white/10 dark:bg-neutral-900/40 dark:backdrop-blur-sm">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/3 h-72 w-[560px] rounded-full bg-[#5ca5ff]/[0.14] blur-[120px]" />
          <div className="absolute inset-0 bg-noise opacity-[0.04]" />
        </div>

        <div className="relative grid gap-12 lg:grid-cols-[1.1fr_1.1fr] lg:gap-16">
          <div className="flex flex-col items-start">
            <SectionHeading
              align="left"
              eyebrow="Booking"
              title={
                <>
                  Reserve a spot —{" "}
                  <span className="font-medium text-[#71b25c] text-glow-green">
                    let&apos;s discuss your project
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
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#25d366]/40 bg-[#25d366]/15 px-6 text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-[#25d366]/70 hover:bg-[#25d366]/25"
              >
                <WhatsAppIcon className="size-4" />
                Chat on WhatsApp
              </a>
              <CopyNumberButton />
            </div>
          </div>

          {CALENDAR_EMBED_URL ? (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900/60 dark:backdrop-blur-sm">
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
      const result = await submitToWeb3Forms({
        name: (formData.get("name") as string) ?? "",
        email: (formData.get("email") as string) ?? "",
        company: ((formData.get("company") as string) ?? "").trim(),
        project_type: niche,
        budget,
        timeline,
        reference: ((formData.get("reference") as string) ?? "").trim(),
        message: (formData.get("message") as string) ?? "",
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
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[#71b25c]/50 bg-[#e9f1e4] p-10 text-center dark:border-[#71b25c]/40 dark:bg-[#101810]"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-[#71b25c] text-[#0e0e0e]">
          <Check className="size-7" />
        </span>
        <h3 className="font-display text-3xl font-semibold text-[#101010] dark:text-white">Message sent successfully!</h3>
        <p className="max-w-sm text-base leading-relaxed text-[#55555c] dark:text-[#86868b]">
          I will get back to you soon.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="text-glow-green mt-2 rounded-full text-[#71b25c] hover:bg-[#71b25c]/10 hover:text-[#71b25c]"
          onClick={() => setStatus("idle")}
        >
          Send another request
        </Button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-black/10 bg-white p-6 sm:p-7 dark:border-white/10 dark:bg-neutral-900/60 dark:backdrop-blur-sm"
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
        <Field label="Your name" required>
          <input name="name" required maxLength={120} placeholder="Jane Doe" className={inputClass} />
        </Field>
        <Field label="Email" required>
          <input name="email" type="email" required placeholder="jane@company.com" className={inputClass} />
        </Field>
        <Field label="Company / Channel (optional)">
          <input name="company" maxLength={120} placeholder="Acme Inc. or @channelname" className={inputClass} />
        </Field>
        <Field label="Your niche" required>
          <input
            name="niche"
            required
            maxLength={120}
            placeholder="e.g., Tech, Finance, Gaming, Fitness"
            className={inputClass}
          />
        </Field>
        <SelectField
          label="Budget"
          name="budget"
          required
          placeholder="Select a range"
          options={BUDGET_RANGES}
          invalid={invalid.budget}
          errorMessage="Please select a budget range."
        />
        <SelectField
          label="Timeline"
          name="timeline"
          required
          placeholder="When do you need it?"
          options={TIMELINES}
          invalid={invalid.timeline}
          errorMessage="Please select your timeline."
        />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <Field label="Reference / Inspiration (optional)">
          <input
            name="reference"
            maxLength={500}
            placeholder="e.g., Links to videos, channels, or editing styles you like"
            className={inputClass}
          />
        </Field>
        <Field label="Tell me about your project" required>
          <textarea
            name="message"
            required
            rows={4}
            maxLength={4000}
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
            Request a Project
            <ArrowUpRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-[#101010] placeholder:text-black/35 outline-none transition-colors focus:border-[#71b25c]/70 focus:ring-2 focus:ring-[#71b25c]/20 dark:border-white/15 dark:bg-[#0d0d0d] dark:text-white dark:placeholder:text-white/35";

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
      <span className="text-sm font-medium text-[#5b5b62] dark:text-[#a1a1a6]">
        {label}
        {required && <span className="text-[#71b25c]"> *</span>}
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
            "focus:border-[#71b25c]/70 focus:ring-2 focus:ring-[#71b25c]/20",
            "data-[placeholder]:text-black/35 dark:data-[placeholder]:text-white/35",
            invalid && "border-red-500/60",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          className="z-[100] w-full rounded-lg border border-black/10 bg-white p-1.5 text-[#101010] shadow-[0_18px_44px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-[#151515] dark:text-white dark:shadow-[0_18px_44px_rgba(0,0,0,0.65)]"
        >
          {options.map((option) => (
            <SelectItem
              key={option}
              value={option}
              className="cursor-pointer rounded-md py-2.5 pl-3 pr-8 text-base text-black/85 transition-colors focus:bg-[#71b25c]/15 focus:text-black data-[highlighted]:bg-[#71b25c]/15 data-[highlighted]:text-black dark:text-white/90 dark:focus:text-white dark:data-[highlighted]:text-white"
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

/* ---------------- Reserve modal ---------------- */

const RESERVE_PROJECT_TYPES = [
  "Short-Form Content",
  "Long-Form / YouTube",
  "Commercial / Showreel",
  "Other",
];

function ReserveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [invalidProjectType, setInvalidProjectType] = useState(false);
  // Reset the form each time the modal opens — "adjust state when a value
  // changes" render-phase pattern (React bails out when nothing changed).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStatus("idle");
      setError(null);
      setInvalidProjectType(false);
    }
  }

  // Esc closes the modal; body scroll is locked while it's open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const projectType = (formData.get("projectType") as string) ?? "";
    if (!projectType) {
      setInvalidProjectType(true);
      return;
    }
    setInvalidProjectType(false);
    setStatus("loading");
    try {
      const result = await submitToWeb3Forms({
        name: (formData.get("name") as string) ?? "",
        email: (formData.get("email") as string) ?? "",
        project_type: projectType,
        message: (formData.get("message") as string) ?? "",
      });
      if (result.success) {
        setStatus("success");
      } else {
        // Clean, user-facing message — never a raw Convex/server error string.
        setError(result.message ?? "Please try again in a moment.");
        setStatus("error");
      }
    } catch (err) {
      console.error("Reservation submit error:", err);
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Reserve your video editing spot"
          className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center"
        >
          {/* Backdrop — click outside the panel to close */}
          <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-black/10 bg-[#fbfbf9] shadow-[0_24px_80px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-[#0e0e0e] dark:shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5 dark:border-white/10">
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-tight text-gradient-silver">
                  Reserve Your Video Editing Spot
                </h3>
                <p className="mt-1 text-base leading-relaxed text-[#55555c] dark:text-[#86868b]">
                  Fill in your project details and I&apos;ll get back to you
                  within 24 hours.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-black/60 transition-colors hover:bg-black/10 hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {status === "success" ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#71b25c]/50 bg-[#e9f1e4] px-6 py-12 text-center dark:border-[#71b25c]/40 dark:bg-[#101810]">
                <span className="flex size-14 items-center justify-center rounded-full bg-[#71b25c] text-[#0e0e0e]">
                  <Check className="size-7" />
                </span>
                <h4 className="font-display text-2xl font-semibold text-[#101010] dark:text-white">
                  Message sent successfully!
                </h4>
                <p className="max-w-sm text-base leading-relaxed text-[#55555c] dark:text-[#86868b]">
                  I will get back to you soon.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-glow-green mt-2 rounded-full text-[#71b25c] hover:bg-[#71b25c]/10 hover:text-[#71b25c]"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
                {/* Honeypot — hidden from humans, irresistible to bots. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-px w-px overflow-hidden"
                />
                <Field label="Full Name" required>
                  <input
                    name="name"
                    required
                    maxLength={120}
                    placeholder="Jane Doe"
                    className={inputClass}
                  />
                </Field>
                <Field label="Email Address" required>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="jane@company.com"
                    className={inputClass}
                  />
                </Field>
                <SelectField
                  label="Project Type"
                  name="projectType"
                  required
                  placeholder="Select a type"
                  options={RESERVE_PROJECT_TYPES}
                  invalid={invalidProjectType}
                  errorMessage="Please select a project type."
                />
                <Field label="Message / Project Brief" required>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    maxLength={4000}
                    placeholder="Tell me about your video, or paste a link to anything relevant…"
                    className={cn(inputClass, "min-h-24 resize-y")}
                  />
                </Field>

                {error && <p className="text-base text-red-400">{error}</p>}

                <Button
                  type="submit"
                  disabled={status === "loading"}
                  aria-busy={status === "loading"}
                  className="mt-1 h-12 w-full gap-2 rounded-full bg-[#2b7ced] text-white hover:bg-[#3d87f0]"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Submit Spot Request
                      <ArrowUpRight className="size-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-[#55555c] dark:text-[#86868b]">
                  Prefer direct chat?{" "}
                  <a
                    href={getWhatsAppHref(WHATSAPP_MESSAGE)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={openWhatsApp(WHATSAPP_MESSAGE)}
                    className="text-glow-green font-medium text-[#25d366] transition-colors hover:text-[#4be07f]"
                  >
                    Reach out on WhatsApp
                  </a>
                </p>
                <div className="flex justify-center">
                  <CopyNumberButton compact />
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Social / DM ---------------- */

function DmSection() {
  return (
    <section id="dm" className="scroll-mt-24 px-4 pb-24 pt-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Direct"
          title="Shoot me a DM, let's discuss your next project"
          sub="Fastest reply on WhatsApp — or catch me on your favorite platform."
        />

        <div className="mx-auto mt-10 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          <DmCard
            href={getWhatsAppHref(WHATSAPP_MESSAGE)}
            icon={<WhatsAppIcon className="size-5" />}
            label="WhatsApp"
            note="Fastest reply"
            onClick={openWhatsApp(WHATSAPP_MESSAGE)}
          />
          <DmCard
            href={SOCIALS.instagram}
            icon={<Instagram className="size-5" />}
            label="Instagram"
            note="DM me"
          />
          <DmCard
            href="mailto:onepunchman5005@gmail.com"
            icon={<Mail className="size-5" />}
            label="Gmail"
            note="Direct email"
          />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <CopyNumberButton />
          <Button
            size="lg"
            onClick={() =>
              document
                .getElementById("request-cal")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="h-11 gap-2 rounded-full bg-[#2b7ced] px-8 font-semibold text-white shadow-[0_4px_18px_rgba(43,124,237,0.28)] transition-all duration-300 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25"
          >
            Start Your Project
            <ArrowUpRight className="size-4" />
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
      <span className="flex size-12 items-center justify-center rounded-full border border-black/10 bg-black/5 text-black/80 transition-colors duration-300 group-hover:border-[#71b25c]/60 group-hover:text-[#71b25c] dark:border-white/10 dark:bg-white/5 dark:text-white">
        {icon}
      </span>
      <span className="font-display text-lg font-semibold text-[#101010] dark:text-white">{label}</span>
      <span className="text-sm text-[#55555c] dark:text-[#86868b]">{note}</span>
    </>
  );
  const classes =
    "group flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-white px-6 py-7 text-center transition-all duration-300 hover:border-[#71b25c]/60 hover:shadow-[0_0_28px_rgba(113,178,92,0.18)] dark:border-white/10 dark:bg-neutral-900/60 dark:backdrop-blur-sm dark:hover:shadow-[0_0_28px_rgba(113,178,92,0.12)]";
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
                <circle cx="12" cy="12" r="6.5" fill="none" stroke="#71b25c" strokeWidth="1.6" />
                <path d="M9.8 8.7 L9.8 15.3 L14.5 12 Z" fill="#71b25c" />
              </svg>
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-[#101010] dark:text-white">
              Ebad <span className="text-[#71b25c] text-glow-green">Ahsan</span>
            </span>
          </div>
          <p className="text-base leading-relaxed text-[#55555c] dark:text-[#86868b]">
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
        <p className="mt-10 text-center text-sm text-[#55555c]/60 dark:text-[#86868b]/60">
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
      className="flex size-9 items-center justify-center rounded-full border border-black/10 text-[#55555c] transition-colors hover:border-[#71b25c]/70 hover:text-[#71b25c] dark:border-white/10 dark:text-[#86868b]"
    >
      {children}
    </a>
  );
}

/* ---------------- Shared ---------------- */

function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
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
      className={cn("flex flex-col gap-4", align === "center" && "items-center text-center")}
    >
      <span className="text-glow-green text-xs font-medium uppercase tracking-[0.28em] text-[#71b25c]">
        {eyebrow}
      </span>
      <div className="relative max-w-3xl">
        {/* Ambient light behind the section title */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <h2 className="relative font-display text-4xl font-medium tracking-tight text-gradient-silver sm:text-5xl lg:text-6xl">
          {title}
        </h2>
      </div>
      {sub && <p className="max-w-xl text-base leading-relaxed text-[#55555c] dark:text-[#86868b]">{sub}</p>}
    </motion.div>
  );
}

/* ---------------- Copy WhatsApp number fallback ---------------- */

function CopyNumberButton({
  compact,
  iconOnly,
}: {
  compact?: boolean;
  iconOnly?: boolean;
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
        iconOnly ? "size-11" : compact ? "h-11 px-5 text-sm" : "h-11 px-6 text-base",
        copied
          ? "text-glow-green border-[#71b25c]/60 bg-[#71b25c]/15 text-[#71b25c]"
          : "border-zinc-400/70 bg-black/5 text-zinc-800 hover:bg-black/10 hover:text-black dark:border-zinc-700/60 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white",
      )}
    >
      {iconOnly ? (
        copied ? <Check className="size-5" /> : <Copy className="size-5" />
      ) : copied ? (
        <>
          <Check className="size-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="size-4" />
          Copy number
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
            ? "text-glow-green border-[#71b25c]/60 bg-[#71b25c]/15 text-[#71b25c] opacity-100"
            : "border-white/10 bg-black/80 text-[#a1a1a6] opacity-0 group-hover:opacity-100",
        )}
      >
        {copied ? "Copied!" : "Copy number"}
      </span>
    </span>
  );
}
