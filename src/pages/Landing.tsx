import { Fragment, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PROJECTS, type Project } from "@/data/projects";
import { getEmbedSrc, isDirectVideo } from "@/lib/embed-video";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import {
  ArrowUpRight,
  Check,
  Clapperboard,
  Home,
  Instagram,
  Linkedin,
  Loader2,
  MessageCircle,
  Play,
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
const SHOWREEL_THUMBNAIL = `https://i.ytimg.com/vi/${SHOWREEL_ID}/maxresdefault.jpg`;
const SHOWREEL_THUMBNAIL_FALLBACK = `https://i.ytimg.com/vi/${SHOWREEL_ID}/hqdefault.jpg`;

// Your portrait (square GIF/photo) — falls back to a monogram tile if it fails.
const AVATAR_URL =
  "https://framerusercontent.com/images/PJGkejOvzUY4nwrdSlLOKfS2jvE.gif?width=512&height=512";

// WhatsApp — this one is wired up and always shown.
const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=923136494619";

// Social profiles — paste your real profile URLs here. Any entry left as ""
// is treated as unset and hidden automatically from the contact chips and footer.
const SOCIALS = {
  discord: "",
  x: "",
  instagram: "",
  youtube: "",
  linkedin: "",
};

// Stats shown in the counters section (animated on scroll) — update to your real numbers
const STATS = [
  { value: 10, suffix: "+", label: "Happy clients" },
  { value: 10, suffix: "+", label: "Projects completed" },
  { value: 10, suffix: "M+", label: "Views" },
];

const CLIENTS = ["FanBasis", "MakeUGC", "ValeFi", "Memorae", "MalocFr", "Anyformat"];

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
    a: "To keep things simple, I send a quick invoice to get started. Once that's paid, I begin working right away and keep you updated through the entire process. I do accept crypto, PayPal, Stripe invoices, and Bank Transfer.",
  },
];

/* ============================================================
   Landing page — recreation of zakariahq.com
   ============================================================ */

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[70] bg-noise opacity-[0.03] mix-blend-overlay"
      />
      <Nav />
      <main>
        <Hero />
        <ClientMarquee />
        <Portfolio />
        <Stats />
        <Faqs />
        <FinalCta />
        <DmSection />
      </main>
      <Footer />
    </div>
  );
}

/* ---------------- Nav (floating pill) ---------------- */

function Nav() {
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
      <motion.nav className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur-md">
        <a
          href="#top"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
        >
          <Home className="size-[18px]" />
        </a>

        <span aria-hidden className="mx-1 h-4 w-px bg-white/15" />

        <NavIcon href="#work" label="Portfolio">
          <Clapperboard className="size-[18px]" />
        </NavIcon>
        <NavIcon href="#faqs" label="FAQs">
          <MessageCircle className="size-[18px]" />
        </NavIcon>

        <span aria-hidden className="mx-1 h-4 w-px bg-white/15" />

        <Button
          asChild
          size="sm"
          className="h-9 gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10"
        >
          <a href={BOOKING_URL}>
            Reserve a Spot
            <ArrowUpRight className="size-3.5" />
          </a>
        </Button>
      </motion.nav>
    </motion.header>
  );
}

function NavIcon({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </a>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 sm:pt-36">
      {/* Giant watermark name behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-14 select-none text-center font-display text-[15vw] font-semibold uppercase leading-[0.92] tracking-tighter text-white/[0.03] sm:top-10 sm:text-[9rem]"
      >
        Ebad
        <br />
        Ahsan
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <Avatar />

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
          className="mt-10 font-display text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-white sm:mt-12 sm:text-5xl"
        >
          Motion That Makes Brands Unforgettable
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
          className="mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-[#cccccc] sm:text-lg"
        >
          Your product&apos;s story — told in <strong className="font-medium text-white">one powerful minute</strong>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32, ease: "easeOut" }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#71b25c]/30 bg-[#71b25c]/15 px-4 py-2 text-[13px] font-medium tracking-[-0.01em] text-[#71b25c] backdrop-blur-md">
            <span className="size-1.5 animate-pulse rounded-full bg-[#71b25c]" />
            3 spots left in August
          </span>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2.5 rounded-full border border-[#25d366]/40 bg-[#25d366]/15 px-6 text-sm font-semibold text-[#25d366] backdrop-blur-md transition-all duration-300 hover:border-[#25d366]/70 hover:bg-[#25d366]/25 hover:shadow-[0_0_24px_rgba(37,211,102,0.2)]"
          >
            <WhatsAppIcon className="size-4" />
            Reserve a Spot
          </a>
        </motion.div>

        <Showreel />
      </div>
    </section>
  );
}

function Avatar() {
  const [failed, setFailed] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative mx-auto w-fit"
      style={{ perspective: 800 }}
    >
      <motion.div
        whileHover={{ rotateX: 8, rotateY: -8, scale: 1.03 }}
        transition={{ type: "spring", stiffness: 240, damping: 18 }}
        className="relative size-40 overflow-hidden rounded-[50px] border border-white/10 sm:size-48"
      >
        {/* Fallback monogram tile */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#3a3a3a] via-[#212121] to-[#101010]">
          <span className="font-display text-6xl font-bold text-white/85">E</span>
        </div>
        {!failed && (
          <img
            src={AVATAR_URL}
            alt="Ebad Ahsan"
            onError={() => setFailed(true)}
            className="relative h-full w-full object-cover"
          />
        )}
      </motion.div>
    </motion.div>
  );
}

function Showreel() {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.56, ease: "easeOut" }}
      className="relative mx-auto mt-14 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#141414]"
    >
      {/* Fallback gradient behind the video */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_0%,#1c2b1e_0%,#0e0e0e_62%)]"
      />

      <div className="relative aspect-video w-full">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${SHOWREEL_ID}?autoplay=1&rel=0&playsinline=1&color=white`}
            title="Ebad Ahsan — Showreel"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Play showreel"
            className="group absolute inset-0 block h-full w-full cursor-pointer overflow-hidden text-left"
          >
            <img
              src={thumbFailed ? SHOWREEL_THUMBNAIL_FALLBACK : SHOWREEL_THUMBNAIL}
              onError={() => setThumbFailed(true)}
              alt="Showreel thumbnail"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.3),transparent_35%,transparent_60%,rgba(10,10,10,0.55))]"
            />
            {/* Center play button */}
            <span className="absolute left-1/2 top-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#71b25c]/25 [animation-duration:2.2s]" />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-[#71b25c] text-[#0e0e0e] shadow-[0_8px_32px_rgba(113,178,92,0.45)] transition-transform duration-300 group-hover:scale-110">
                <Play className="ml-0.5 size-7 fill-current" />
              </span>
            </span>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-black/55 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/85 backdrop-blur transition-colors group-hover:border-[#71b25c]/60 group-hover:text-[#71b25c]">
              Click to play · Full quality
            </span>
          </button>
        )}
      </div>

      {/* Showreel badge */}
      <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/80 backdrop-blur">
        Showreel - 1:00
      </span>
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

/* ---------------- Client marquee ---------------- */

function ClientMarquee() {
  return (
    <section className="relative py-10">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-7 text-center font-display text-xl font-medium text-white"
      >
        40+ Companies trust us
      </motion.p>
      <div className="overflow-hidden opacity-40 [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]">
        <div className="flex w-max animate-marquee items-center">
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="flex items-center">
              {CLIENTS.map((client) => (
                <span
                  key={`${copy}-${client}`}
                  className="flex items-center whitespace-nowrap font-display text-xl font-bold tracking-tight text-white/70"
                >
                  <span className="px-8 transition-colors hover:text-white">{client}</span>
                  <span className="text-sm text-brand/60">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Portfolio ---------------- */

function Portfolio() {
  return (
    <section id="work" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Portfolio"
          title="Our latest projects"
          sub="some case studies"
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
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
  const thumbnails = [project.thumbnailUrl, project.thumbnailFallbackUrl].filter(
    Boolean,
  ) as string[];
  const embedSrc = getEmbedSrc(project.videoUrl);

  return (
    <motion.div
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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 p-2 pb-3 text-left backdrop-blur-sm transition-all duration-300 hover:border-[#71b25c]/60 hover:shadow-[0_0_28px_rgba(113,178,92,0.12)]"
    >
      {/* Media area — fixed 16:9 frame; the thumbnail swaps for the player in place. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {playing && embedSrc ? (
          isDirectVideo(embedSrc) ? (
            <video
              src={embedSrc}
              controls
              autoPlay
              playsInline
              className="h-full w-full bg-black object-contain"
            />
          ) : (
            <iframe
              src={embedSrc}
              title={`${project.title} — video player`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )
        ) : (
          <>
            {thumbStep < thumbnails.length ? (
              <img
                src={thumbnails[thumbStep]}
                onError={() => setThumbStep((step) => step + 1)}
                alt={`${project.title} video thumbnail`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_18%_0%,#1c2b1e_0%,#0e0e0e_62%)]" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.15),transparent_45%,rgba(10,10,10,0.72))]" />
            <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white/85 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
              Watch
            </span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 px-2 pt-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold text-white">
            {project.title}
          </h3>
          <p className="mt-0.5 text-sm leading-relaxed text-[#86868b]">{project.category}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#71b25c] text-[#0e0e0e] shadow-[0_4px_18px_rgba(113,178,92,0.45)] transition-transform duration-300 group-hover:scale-110">
          <Play className="ml-0.5 size-4 fill-current" />
        </span>
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
                className="hidden w-px self-center bg-white/20 sm:block"
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
              <p className="font-display text-6xl font-medium tracking-tight text-white sm:text-7xl">
                <Counter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-sm font-medium text-[#f2f4f6]/80">{stat.label}</p>
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
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.35fr]">
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
            className="mt-9 rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
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
              className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm transition-colors data-[state=open]:border-[#71b25c]/50"
            >
              <AccordionTrigger className="px-6 py-5 text-left font-display text-lg font-medium text-white hover:no-underline [&[data-state=open]]:text-[#71b25c]">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-[15px] leading-relaxed text-[#86868b]">
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
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/40 px-6 py-14 backdrop-blur-sm sm:px-10 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/3 h-72 w-[560px] rounded-full bg-[#5ca5ff]/[0.14] blur-[120px]" />
          <div className="absolute inset-0 bg-noise opacity-[0.04]" />
        </div>

        <div className="relative grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div className="flex flex-col items-start">
            <SectionHeading
              align="left"
              eyebrow="Booking"
              title={
                <>
                  Reserve a spot —{" "}
                  <span className="font-medium text-[#71b25c]">
                    let&apos;s discuss your video project
                  </span>
                </>
              }
              sub="Tell me about your product and I'll get back to you within 24h with next steps. Prefer to chat? Message me on WhatsApp."
            />

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#25d366]/40 bg-[#25d366]/15 px-5 py-2.5 text-sm font-medium text-[#25d366] backdrop-blur-md transition-colors hover:border-[#25d366]/70 hover:bg-[#25d366]/25"
            >
              <WhatsAppIcon className="size-4" />
              WhatsApp
            </a>
          </div>

          {CALENDAR_EMBED_URL ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm">
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

const PROJECT_TYPES = [
  "Product launch video",
  "Explainer video",
  "Product demo",
  "Short-form reel / UGC",
  "VSL (video sales letter)",
  "Keynote / presentation visuals",
  "Something else",
];

const BUDGET_RANGES = ["$1k – $3k", "$3k – $7k", "$7k – $15k", "$15k+", "Not sure yet"];

const TIMELINES = ["ASAP", "1 – 2 weeks", "3 – 4 weeks", "Next month", "Flexible"];

function RequestForm() {
  const submitInquiry = useMutation(api.inquiries.submitInquiry);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const result = await submitInquiry({
        name: (formData.get("name") as string) ?? "",
        email: (formData.get("email") as string) ?? "",
        company: ((formData.get("company") as string) ?? "").trim() || undefined,
        projectType: (formData.get("projectType") as string) ?? "",
        budget: ((formData.get("budget") as string) ?? "") || undefined,
        timeline: ((formData.get("timeline") as string) ?? "") || undefined,
        message: (formData.get("message") as string) ?? "",
        website: (formData.get("website") as string) ?? "",
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
        className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[#71b25c]/40 bg-[#101810] p-10 text-center"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-[#71b25c] text-[#0e0e0e]">
          <Check className="size-7" />
        </span>
        <h3 className="font-display text-2xl font-semibold text-white">Request received</h3>
        <p className="max-w-sm text-sm leading-relaxed text-[#86868b]">
          Thanks for reaching out — I&apos;ll get back to you within 24 hours to talk scope,
          timeline, and budget.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 rounded-full text-[#71b25c] hover:bg-[#71b25c]/10 hover:text-[#71b25c]"
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
      className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-7"
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
        <Field label="Company (optional)">
          <input name="company" maxLength={120} placeholder="Acme Inc." className={inputClass} />
        </Field>
        <Field label="Project type" required>
          <select name="projectType" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select a type
            </option>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Budget (optional)">
          <select name="budget" defaultValue="" className={inputClass}>
            <option value="">Select a range</option>
            {BUDGET_RANGES.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Timeline (optional)">
          <select name="timeline" defaultValue="" className={inputClass}>
            <option value="">When do you need it?</option>
            {TIMELINES.map((timeline) => (
              <option key={timeline} value={timeline}>
                {timeline}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
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

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <Button
        type="submit"
        disabled={status === "loading"}
        aria-busy={status === "loading"}
        className="mt-5 h-12 w-full gap-2 rounded-full bg-[#2b7ced] text-white hover:bg-[#3d87f0]"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
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
  "w-full rounded-xl border border-white/15 bg-[#0d0d0d] px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#71b25c]/70 focus:ring-2 focus:ring-[#71b25c]/20 [&>option]:bg-[#1a1a1a]";

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
      <span className="text-xs font-medium text-[#a1a1a6]">
        {label}
        {required && <span className="text-[#71b25c]"> *</span>}
      </span>
      {children}
    </label>
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

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DmCard
            href={WHATSAPP_URL}
            icon={<WhatsAppIcon className="size-5" />}
            label="WhatsApp"
            note="Fastest reply"
          />
          <DmCard
            href={SOCIALS.x}
            icon={<MessageCircle className="size-5" />}
            label="X / Twitter"
            note={SOCIALS.x ? "DM me" : "Link coming soon"}
          />
          <DmCard
            href={SOCIALS.instagram}
            icon={<Instagram className="size-5" />}
            label="Instagram"
            note={SOCIALS.instagram ? "DM me" : "Link coming soon"}
          />
          <DmCard
            href={SOCIALS.linkedin}
            icon={<Linkedin className="size-5" />}
            label="LinkedIn"
            note={SOCIALS.linkedin ? "Connect" : "Link coming soon"}
          />
        </div>

        <div className="mt-12 flex justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 rounded-full bg-[#2b7ced] px-8 text-white hover:bg-[#3d87f0]"
          >
            <a href={BOOKING_URL}>
              Schedule a Call
              <ArrowUpRight className="size-4" />
            </a>
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
}: {
  href: string;
  icon: ReactNode;
  label: string;
  note: string;
}) {
  const card = (
    <>
      <span className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors duration-300 group-hover:border-[#71b25c]/60 group-hover:text-[#71b25c]">
        {icon}
      </span>
      <span className="font-display text-base font-semibold text-white">{label}</span>
      <span className="text-xs text-[#86868b]">{note}</span>
    </>
  );
  const classes =
    "group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/60 px-6 py-7 text-center backdrop-blur-sm transition-all duration-300 hover:border-[#71b25c]/60 hover:shadow-[0_0_28px_rgba(113,178,92,0.12)]";
  if (!href) {
    return <div className={cn(classes, "cursor-not-allowed opacity-45")}>{card}</div>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {card}
    </a>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#212121]">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <circle cx="12" cy="12" r="6.5" fill="none" stroke="#71b25c" strokeWidth="1.6" />
                <path d="M9.8 8.7 L9.8 15.3 L14.5 12 Z" fill="#71b25c" />
              </svg>
            </span>
            <span className="font-display font-semibold tracking-tight text-white">
              Ebad <span className="text-[#71b25c]">Ahsan</span>
            </span>
          </div>
          <p className="text-sm text-[#86868b]">
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
              {SOCIALS.linkedin && (
                <FooterIcon href={SOCIALS.linkedin} label="LinkedIn">
                  <Linkedin className="size-4" />
                </FooterIcon>
              )}
            </div>
          )}
        </div>
        <p className="mt-10 text-center text-xs text-[#86868b]/60">
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
      className="flex size-9 items-center justify-center rounded-full border border-white/10 text-[#86868b] transition-colors hover:border-[#71b25c]/70 hover:text-[#71b25c]"
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
      <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#71b25c]">
        {eyebrow}
      </span>
      <h2 className="max-w-2xl font-display text-4xl font-medium tracking-tight text-white sm:text-5xl">
        {title}
      </h2>
      {sub && <p className="max-w-xl leading-relaxed text-[#86868b]">{sub}</p>}
    </motion.div>
  );
}
