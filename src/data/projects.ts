export type Project = {
  id: string;
  title: string;
  category: string;
  /** Any YouTube, Vimeo, or direct MP4 URL. */
  videoUrl: string;
  /** Poster image shown on the card. */
  thumbnailUrl: string;
  /** Lower-res fallback if the primary thumbnail fails to load. */
  thumbnailFallbackUrl?: string;
  /** Featured projects span two columns on larger screens. */
  featured?: boolean;
};

const yt = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
const ytFallback = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const PROJECTS: Project[] = [
  {
    id: "project-1",
    title: "Project 1",
    category: "Short-Form",
    videoUrl: "https://youtu.be/nLwa6VAWIKg?si=mJK5TmqPPVh-wbm9",
    thumbnailUrl: yt("nLwa6VAWIKg"),
    thumbnailFallbackUrl: ytFallback("nLwa6VAWIKg"),
    featured: true,
  },
  {
    id: "project-2",
    title: "Project 2",
    category: "Talking Head",
    videoUrl: "https://youtu.be/_X9ruYli5Ek?si=pbiPkOjRKho-72Hv",
    thumbnailUrl: yt("_X9ruYli5Ek"),
    thumbnailFallbackUrl: ytFallback("_X9ruYli5Ek"),
  },
  {
    id: "project-3",
    title: "Project 3",
    category: "Reel",
    videoUrl: "https://youtu.be/xM_Zuwe8gtQ?si=zcX3iV-eh89DggGZ",
    thumbnailUrl: yt("xM_Zuwe8gtQ"),
    thumbnailFallbackUrl: ytFallback("xM_Zuwe8gtQ"),
  },
  {
    id: "project-4",
    title: "Project 4",
    category: "Motion Design",
    videoUrl: "https://youtu.be/tDfnjPnQ_GU?si=ULV9uzYEwqOPevC4",
    thumbnailUrl: yt("tDfnjPnQ_GU"),
    thumbnailFallbackUrl: ytFallback("tDfnjPnQ_GU"),
  },
];
