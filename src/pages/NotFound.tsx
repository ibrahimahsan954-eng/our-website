import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Clapperboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="flex size-16 items-center justify-center rounded-[22px] border border-white/10 bg-[#212121]"
        >
          <Clapperboard className="size-7 text-white/70" />
        </motion.div>

        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.3em] text-[#25D366]">
          Error 404
        </p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-white sm:text-6xl">
          Scene not found
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-[#86868b]">
          This frame didn&apos;t make the cut. Let&apos;s get you back to the showreel.
        </p>

        <Button
          asChild
          className="mt-8 h-12 gap-2 rounded-full bg-[#212121] px-7 text-white hover:bg-[#2e2e2e]"
        >
          <a href="/">
            <ArrowLeft className="size-4" />
            Back to the site
          </a>
        </Button>
      </motion.div>
    </div>
  );
}
