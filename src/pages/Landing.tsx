import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowUpRight,
  Instagram,
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

const BOOKING_URL = "https://cal.com/zakariahq"; // ← your booking link (Cal.com)

const SOCIALS = {
  x: "https://x.com/1zakariahq",
  instagram: "https://instagram.com/1zakariahq",
  youtube: "https://youtube.com/@zakariahq",
  // Telegram DM — replace with your real handle:
  telegram: "#",
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

const AVATARS = [
  { initials: "FB", from: 192, to: 214 },
  { initials: "MU", from: 262, to: 284 },
  { initials: "MR", from: 316, to: 334 },
  { initials: "VL", from: 158, to: 176 },
  { initials: "AF", from: 212, to: 232 },
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
        className="pointer-events-none fixed inset-0 z-[70] bg-noise opacity-[0.04] mix-blend-overlay"
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

/* ---------------- Nav ---------------- */

function Nav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand font-display text-lg font-black text-brand-foreground shadow-[0_0_24px_-6px_var(--brand)]">
            Z
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Zakaria<span className="text-brand">HQ</span>
          </span>
        </a>
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="#work"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Work
          </a>
          <a
            href="#faqs"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            FAQs
          </a>
          <Button asChild size="sm" className="gap-2 rounded-full">
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              Book a Call
              <ArrowUpRight className="size-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-4 pb-20 pt-36 sm:px-6 sm:pt-44">
      {/* Background: grid + soft brand glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[540px] w-[860px] -translate-x-1/2 rounded-full bg-brand/15 blur-[150px]" />
        <div className="absolute -left-40 top-48 h-80 w-80 rounded-full bg-sky-400/10 blur-[120px]" />
        <div className="absolute -right-32 top-80 h-96 w-96 rounded-full bg-violet-400/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-brand" />
            </span>
            3 spots left in August
          </span>
        </motion.div>

        <h1 className="mt-8 font-display text-[2.75rem] font-bold leading-[1.04] tracking-tight sm:text-7xl lg:text-8xl">
          <WordReveal delay={0.12}>Motion that makes</WordReveal>
          <WordReveal delay={0.24}>
            brands{" "}
            <em className="font-serif font-normal italic text-brand">unforgettable</em>
          </WordReveal>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          {"Your product's story — told in one powerful minute."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.62 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg" className="group w-full gap-2 rounded-full sm:w-auto">
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              Book a Call
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full rounded-full sm:w-auto">
            <a href="#work" className="gap-2">
              <Play className="size-4 fill-current" />
              See our work
            </a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 flex flex-col items-center gap-3"
        >
          <div className="flex -space-x-3">
            {AVATARS.map((a) => (
              <span
                key={a.initials}
                className="flex size-10 items-center justify-center rounded-full border-2 border-background text-[11px] font-bold text-black/80"
                style={{
                  background: `linear-gradient(135deg, hsl(${a.from} 80% 60%), hsl(${a.to} 80% 45%))`,
                }}
              >
                {a.initials}
              </span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">40+ companies</span> trust us
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function WordReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <span className="block overflow-hidden pb-1">
      <motion.span
        className="block"
        initial={{ y: "112%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ---------------- Client marquee ---------------- */

function ClientMarquee() {
  return (
    <section className="relative border-y border-white/5 bg-white/[0.02] py-10">
      <p className="mb-7 text-center font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
        40+ Companies trust us
      </p>
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]">
        <div className="flex w-max animate-marquee items-center">
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="flex items-center">
              {CLIENTS.map((client) => (
                <span
                  key={`${copy}-${client}`}
                  className="flex items-center whitespace-nowrap font-display text-xl font-bold tracking-tight text-white/35"
                >
                  <span className="px-8 transition-colors hover:text-white/80">{client}</span>
                  <span className="text-sm text-brand/70">✦</span>
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
    <section id="work" className="scroll-mt-24 px-4 py-24 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Portfolio"
          title="Our latest projects"
          sub="Selected case studies — product stories told in motion."
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
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.09, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card transition-colors duration-300 hover:border-white/25",
        featured && "sm:col-span-2",
      )}
    >
      {/* Stylized video thumbnail */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: featured ? "16 / 9" : "4 / 3" }}
      >
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]"
          style={{
            background: `radial-gradient(130% 130% at 18% 0%, hsl(${project.hue} 85% 60% / 0.3), transparent 62%)`,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(6,7,10,0.72))]" />
        <span className="absolute left-5 top-4 font-display text-6xl font-black tracking-tight text-white/90 drop-shadow-sm sm:text-7xl">
          {project.name[0]}
        </span>
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-14 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-white/50 group-hover:bg-white/20">
            <Play className="size-5 fill-white text-white" />
          </span>
        </div>
        {/* Fake editor timeline */}
        <div className="absolute inset-x-4 bottom-3 flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm">
          <span className="size-1.5 shrink-0 rounded-full bg-white/70" />
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full w-2/3 rounded-full"
              style={{ background: `hsl(${project.hue} 85% 65%)` }}
            />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/70">
            00:0{index + 1}
          </span>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <h3 className="font-display text-lg font-bold">{project.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {project.tagline}
          </p>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </motion.a>
  );
}

function CtaCard() {
  return (
    <motion.a
      href={BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
      className="group relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-dashed border-white/20 p-10 text-center transition-colors duration-300 hover:border-brand/60 sm:col-span-2"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(80% 90% at 50% 100%, hsl(205 85% 60% / 0.12), transparent 70%)",
        }}
      />
      <span className="flex size-14 items-center justify-center rounded-full border border-white/20 transition-colors duration-300 group-hover:border-brand/70">
        <Plus className="size-6" />
      </span>
      <div className="relative">
        <h3 className="font-display text-2xl font-bold">Your project could be next</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          One powerful minute for your product. Let&apos;s make it.
        </p>
      </div>
      <span className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
        Request a project
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </motion.a>
  );
}

/* ---------------- Stats ---------------- */

function Stats() {
  return (
    <section className="relative border-y border-white/5 bg-white/[0.02] px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12 text-center sm:grid-cols-3">
        {STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
          >
            <p className="font-display text-6xl font-bold tracking-tight text-foreground sm:text-7xl">
              <Counter value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-3 font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              {stat.label}
            </p>
          </motion.div>
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
    <section id="faqs" className="scroll-mt-24 px-4 py-24 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.35fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            align="left"
            eyebrow="FAQs"
            title="Some of my frequently asked questions"
            sub="A quick collection of helpful answers so you can get clarity fast. If there's anything else you're wondering about, just reach out!"
          />
          <Button asChild variant="outline" className="mt-9 rounded-full">
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="gap-2">
              Request a Project
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, index) => (
            <AccordionItem key={faq.q} value={`item-${index}`} className="border-white/10">
              <AccordionTrigger className="py-6 font-display text-lg font-semibold text-foreground hover:no-underline [&[data-state=open]]:text-brand">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-[15px] leading-relaxed text-muted-foreground">
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
    <section className="px-4 pb-24 pt-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card px-6 py-16 text-center sm:px-12 sm:py-24">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-36 left-1/2 h-72 w-[680px] -translate-x-1/2 rounded-full bg-brand/20 blur-[130px]" />
            <div className="absolute inset-0 bg-noise opacity-[0.05]" />
          </div>

          <div className="relative">
            <SectionHeading
              eyebrow="Request a Project"
              title={
                <>
                  Let&apos;s talk scope, timeline &amp; budget —{" "}
                  <em className="font-serif font-normal italic text-brand">no fluff</em>
                </>
              }
              sub="Shoot me a DM, let's discuss your next project."
            />

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <SocialChip href={SOCIALS.x} icon={<MessageCircle className="size-4" />} label="@1zakariahq" />
              <SocialChip
                href={SOCIALS.instagram}
                icon={<Instagram className="size-4" />}
                label="@1zakariahq"
              />
              <SocialChip href={SOCIALS.telegram} icon={<Send className="size-4" />} label="@zakaria" />
            </div>

            <Button asChild size="lg" className="mt-10 gap-2 rounded-full">
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Schedule a Call
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
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
  const external = href !== "#";
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground/90 backdrop-blur transition-colors hover:border-brand/60 hover:text-brand"
    >
      {icon}
      {label}
    </a>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="border-t border-white/5 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand font-display text-base font-black text-brand-foreground">
              Z
            </span>
            <span className="font-display font-bold tracking-tight">
              Zakaria<span className="text-brand">HQ</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
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
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground/70">
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
      className="flex size-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-brand/60 hover:text-brand"
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
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-brand">
        {eyebrow}
      </span>
      <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h2>
      {sub && <p className="max-w-xl leading-relaxed text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}
