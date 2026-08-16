export type Project = {
  id: string;
  title: string;
  category: string;
  /** Any YouTube, Vimeo, Cloudinary player embed, or direct MP4 URL. */
  videoUrl: string;
  /**
   * Optional direct MP4/WebM file. When set, the card renders a native
   * <video> element (muted, loop, autoplay, no controls) instead of the
   * YouTube/Vimeo facade. Drop your exported file here, e.g.
   * "https://cdn.example.com/projects/project-1.mp4".
   */
  videoFile?: string;
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
    id: "project-5",
    title: "Demo For MDMZ",
    category: "Client Work",
    videoUrl: "https://player.vimeo.com/video/1218698436",
    thumbnailUrl: "https://vumbnail.com/1218698436.jpg",
  },
  {
    id: "project-4",
    title: "Demo For Dragon Fruit Media",
    category: "Client Work",
    videoUrl: "https://youtu.be/tDfnjPnQ_GU?si=ULV9uzYEwqOPevC4",
    thumbnailUrl: yt("tDfnjPnQ_GU"),
    thumbnailFallbackUrl: ytFallback("tDfnjPnQ_GU"),
  },
  {
    id: "project-1",
    title: "Dubai Real Estate Talking Head Video",
    category: "Talking Head",
    videoUrl: "https://youtu.be/nLwa6VAWIKg?si=mJK5TmqPPVh-wbm9",
    thumbnailUrl: yt("nLwa6VAWIKg"),
    thumbnailFallbackUrl: ytFallback("nLwa6VAWIKg"),
    featured: true,
  },
  {
    id: "project-2",
    title: "Talking Head Video — Adam Del Duca",
    category: "Talking Head",
    videoUrl: "https://youtu.be/_X9ruYli5Ek?si=pbiPkOjRKho-72Hv",
    thumbnailUrl: yt("_X9ruYli5Ek"),
    thumbnailFallbackUrl: ytFallback("_X9ruYli5Ek"),
  },
  {
    id: "project-3",
    title: "Apple Style VSL Animation",
    category: "VSL · Motion Design",
    videoUrl: "https://youtu.be/xM_Zuwe8gtQ?si=zcX3iV-eh89DggGZ",
    thumbnailUrl: yt("xM_Zuwe8gtQ"),
    thumbnailFallbackUrl: ytFallback("xM_Zuwe8gtQ"),
  },
  {
    id: "project-6",
    title: "Best AI Auto Scheduling App? (FlowSavvy Review)",
    category: "Talking Head · Review",
    videoUrl: "https://www.youtube.com/watch?v=I4JhvvJ3XXk&t",
    thumbnailUrl: yt("I4JhvvJ3XXk"),
    thumbnailFallbackUrl: ytFallback("I4JhvvJ3XXk"),
  },
];
