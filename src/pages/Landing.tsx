import { Fragment, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clapperboard,
  Home,
  Instagram,
  Linkedin,
  Loader2,
  MessageCircle,
  Play,
  Plus,
  Send,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   Config — swap these with your real links and numbers
   ============================================================ */

// Where "Book a Call" pills scroll to — keep as the on-page CTA section,
// or point at your real Cal.com link (e.g. "https://cal.com/zakariahq").
const BOOKING_URL = "#request-cal";

// Public showreel from zakariahq.com — replace with your own video URL.
const SHOWREEL_URL =
  "https://res.cloudinary.com/dqtjfwyak/video/upload/v1775838949/1920_g6doeu.mp4";

// Your portrait (square GIF/photo) — falls back to a monogram tile if it fails.
const AVATAR_URL =
  "https://framerusercontent.com/images/PJGkejOvzUY4nwrdSlLOKfS2jvE.gif?width=512&height=512";

const SOCIALS = {
  x: "https://x.com/1zakariahq/",
  instagram: "https://instagram.com/1zakariahq",
  youtube: "https://youtube.com/@zakariahq",
  linkedin: "https://www.linkedin.com/in/zakaria-nourine-396b3533b/",
};

// Stats shown in the counters section (animated on scroll) — update to your real numbers
const STATS = [
  { value: 60, suffix: "+", label: "Projects Completed" },
  { value: 40, suffix: "+", label: "Satisfied Clients" },
  { value: 100, suffix: "M+", label: "Views" },
];

const PROJECTS = [
  {
    name: "FanBasis",
    tagline: "Operating System for Modern Digital Businesses",
    hue: 192,
    featured: true,
  },
  { name: "MakeUGC", tagline: "Platform to Create AI UGC", hue: 262 },
  { name: "MalocFr", tagline: "Cars Marketplace", hue: 24 },
  { name: "ValeFi", tagline: "DeFi platform", hue: 158 },
  { name: "Memorae", tagline: "AI agent that remembers everything for you", hue: 316 },
  { name: "Anyformat", tagline: "Agentic Document Intelligence", hue: 212 },
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
            Book a Call
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
        className="pointer-events-none absolute inset-x-0 top-14 select-none text-center font-display text-[15vw] font-semibold leading-[0.92] tracking-tighter text-white/[0.03] sm:top-10 sm:text-[9rem]"
      >
        Zakaria
        <br />
        Nourine
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
          className="mt-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#71b25c]/30 bg-[#71b25c]/15 px-4 py-1.5 text-[13px] font-medium tracking-[-0.01em] text-[#71b25c] backdrop-blur-md">
            <span className="size-1.5 animate-pulse rounded-full bg-[#71b25c]" />
            3 spots left in August
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.44, ease: "easeOut" }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="group h-12 w-full gap-2 rounded-full border border-white/10 bg-white/5 px-8 text-white backdrop-blur-md transition-colors hover:bg-white/10 sm:w-auto"
          >
            <a href={BOOKING_URL}>
              Book a Call
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 w-full gap-2 rounded-full border border-white/10 px-6 text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            <a href="#work">
              <Play className="size-4 fill-current" />
              See our work
            </a>
          </Button>
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
          <span className="font-display text-6xl font-bold text-white/85">Z</span>
        </div>
        {!failed && (
          <img
            src={AVATAR_URL}
            alt="Zakaria Nourine"
            onError={() => setFailed(true)}
            className="relative h-full w-full object-cover"
          />
        )}
      </motion.div>
    </motion.div>
  );
}

function Showreel() {
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
      <video
        className="relative aspect-video w-full object-cover"
        src={SHOWREEL_URL}
        autoPlay
        muted
        loop
        playsInline
      />
      <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/80 backdrop-blur">
        Showreel · 1:00
      </span>
    </motion.div>
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

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project, index) => (
            <ProjectCard key={project.name} project={project} index={index} />
          ))}
          <CtaCard />
        </div>
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
}) {
  const featured = project.featured;
  return (
    <motion.a
      href={BOOKING_URL}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.09, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 p-2 pb-3 backdrop-blur-sm transition-all duration-300 hover:border-[#71b25c]/60 hover:shadow-[0_0_28px_rgba(113,178,92,0.12)]",
        featured && "sm:col-span-2",
      )}
    >
      {/* Stylized video thumbnail */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ aspectRatio: featured ? "16 / 9" : "16 / 10" }}
      >
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]"
          style={{
            background: `radial-gradient(130% 130% at 18% 0%, hsl(${project.hue} 60% 45% / 0.55), transparent 62%)`,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_52%,rgba(10,10,10,0.8))]" />
        <span className="absolute left-5 top-3 font-display text-6xl font-bold tracking-tight text-white/85 drop-shadow-sm sm:text-7xl">
          {project.name[0]}
        </span>
        {/* Fake editor timeline */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm">
          <span className="size-1.5 shrink-0 rounded-full bg-white/70" />
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full w-2/3 rounded-full"
              style={{ background: `hsl(${project.hue} 70% 60%)` }}
            />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/70">
            00:0{index + 1}
          </span>
        </div>
        {/* Green play button */}
        <span className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-[#71b25c] text-[#0e0e0e] shadow-[0_4px_14px_rgba(113,178,92,0.4)] transition-transform duration-300 group-hover:scale-110">
          <Play className="size-3.5 fill-current" />
        </span>
      </div>

      <div className="flex items-start justify-between gap-4 px-2 pt-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">{project.name}</h3>
          <p className="mt-0.5 text-sm leading-relaxed text-[#86868b]">
            {project.tagline}
          </p>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-white/35 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
      </div>
    </motion.a>
  );
}

function CtaCard() {
  return (
    <motion.a
      href={BOOKING_URL}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
      className="group relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 p-10 text-center backdrop-blur-sm transition-all duration-300 hover:border-[#71b25c]/60 hover:shadow-[0_0_28px_rgba(113,178,92,0.12)] sm:col-span-2"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(80% 90% at 50% 100%, rgb(113 178 92 / 0.12), transparent 70%)",
        }}
      />
      <span className="flex size-14 items-center justify-center rounded-full border border-white/20 transition-colors duration-300 group-hover:border-[#71b25c]/70">
        <Plus className="size-6" />
      </span>
      <div className="relative">
        <h3 className="font-display text-2xl font-semibold text-white">
          Your project could be next
        </h3>
        <p className="mt-2 text-sm text-[#86868b]">
          One powerful minute for your product. Let&apos;s make it.
        </p>
      </div>
      <span className="relative inline-flex items-center gap-1.5 text-sm font-medium text-[#71b25c]">
        Request a project
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </motion.a>
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

        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, index) => (
            <AccordionItem
              key={faq.q}
              value={`item-${index}`}
              className="border-white/10"
            >
              <AccordionTrigger className="py-6 text-left font-display text-lg font-medium text-white hover:no-underline [&[data-state=open]]:text-[#71b25c]">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-[15px] leading-relaxed text-[#86868b]">
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
              eyebrow="Request a project"
              title={
                <>
                  Let&apos;s talk scope, timeline &amp; budget —{" "}
                  <span className="font-medium text-[#71b25c]">no fluff, just clarity</span>
                </>
              }
              sub="Tell me about your product and I'll get back to you within 24h with next steps. Prefer to chat? Shoot me a DM directly."
            />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <SocialChip href={SOCIALS.x} icon={<MessageCircle className="size-4" />} label="@1zakariahq" />
              <SocialChip
                href={SOCIALS.instagram}
                icon={<Instagram className="size-4" />}
                label="@1zakariahq"
              />
              <SocialChip href={SOCIALS.x} icon={<Send className="size-4" />} label="@zakaria" />
            </div>
          </div>

          <RequestForm />
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
      await submitInquiry({
        name: (formData.get("name") as string) ?? "",
        email: (formData.get("email") as string) ?? "",
        company: ((formData.get("company") as string) ?? "").trim() || undefined,
        projectType: (formData.get("projectType") as string) ?? "",
        budget: ((formData.get("budget") as string) ?? "") || undefined,
        timeline: ((formData.get("timeline") as string) ?? "") || undefined,
        message: (formData.get("message") as string) ?? "",
        website: (formData.get("website") as string) ?? "",
      });
      setStatus("success");
    } catch (err) {
      console.error("Inquiry submit error:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
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

function SocialChip({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:border-[#71b25c]/60 hover:bg-white/10 hover:text-[#71b25c]"
    >
      {icon}
      {label}
    </a>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#212121] font-display text-base font-bold text-white">
              Z
            </span>
            <span className="font-display font-semibold tracking-tight text-white">
              Zakaria<span className="text-[#71b25c]">HQ</span>
            </span>
          </div>
          <p className="text-sm text-[#86868b]">
            Premium motion content for brands that move fast.
          </p>
          <div className="flex items-center gap-3">
            <FooterIcon href={SOCIALS.x} label="X">
              <MessageCircle className="size-4" />
            </FooterIcon>
            <FooterIcon href={SOCIALS.instagram} label="Instagram">
              <Instagram className="size-4" />
            </FooterIcon>
            <FooterIcon href={SOCIALS.youtube} label="YouTube">
              <Youtube className="size-4" />
            </FooterIcon>
            <FooterIcon href={SOCIALS.linkedin} label="LinkedIn">
              <Linkedin className="size-4" />
            </FooterIcon>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-[#86868b]/60">
          © {new Date().getFullYear()} ZakariaHQ. All rights reserved.
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
