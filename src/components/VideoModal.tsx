import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { getEmbedSrc, isDirectVideo } from "@/lib/embed-video";

interface VideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  category?: string;
  videoUrl: string;
}

export function VideoModal({
  open,
  onOpenChange,
  title,
  category,
  videoUrl,
}: VideoModalProps) {
  const src = getEmbedSrc(videoUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden rounded-2xl border-white/10 bg-[#0d0d0d] p-0">
        <div className="relative aspect-video w-full bg-black">
          {src && isDirectVideo(src) ? (
            <video
              src={src}
              controls
              autoPlay
              playsInline
              className="h-full w-full bg-black object-contain"
            />
          ) : (
            <iframe
              src={src ?? undefined}
              title={`${title} — video player`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <DialogTitle className="font-display text-lg font-semibold text-white">
            {title}
          </DialogTitle>
          {category && (
            <span className="rounded-full border border-[#71b25c]/40 bg-[#71b25c]/15 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-widest text-[#71b25c]">
              {category}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
