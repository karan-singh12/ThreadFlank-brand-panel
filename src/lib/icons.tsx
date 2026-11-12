import {
  House,
  Sparkles,
  File,
  FileText,
  FileImage,
  FileType,
  FileChartColumn,
  FileVideo,
  Folder,
  FolderOpen,
  Calendar,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Settings,
  Star,
  MessageSquare,
  Asterisk,
  Feather,
  Box,
  TreePine,
  Shapes,
  Hexagon,
  Send,
  Maximize2,
  AppWindow,
  Type,
  SunDim,
  ChartLine,
  TrendingUp,
  Plus,
  X,
  Puzzle,
  ChartColumnBig,
  RefreshCw,
  Wind,
  Command,
  Grip,
  SquareDashedMousePointer,
  Zap,
  Waypoints,
  Ellipsis,
  ChevronsRight,
  Shirt,
  ShoppingBag,
  Glasses,
  Gem,
  Footprints,
  Watch,
  Store,
  Link,
  Camera,
  Users,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Palette,
  WandSparkles,
  ScanFace,
  Ruler,
  CalendarHeart,
  Share2,
  Layers,
  Compass,
  MessageCircle,
  Tag,
  Code,
  Repeat,
  ShieldCheck,
  Sun,
  Building2,
  PartyPopper,
  Briefcase,
  Coffee,
  Wallet,
  Timer,
  Crown,
  Scissors,
  Flame,
  Plane,
  Film,
  Handshake,
  Receipt,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import type { SVGProps } from "react";

const REGISTRY: Record<string, LucideIcon> = {
  home: House,
  sparkles: Sparkles,
  file: File,
  "file-text": FileText,
  "file-image": FileImage,
  "file-type": FileType,
  "file-chart": FileChartColumn,
  "file-video": FileVideo,
  folder: Folder,
  "folder-image": FolderOpen,
  "folder-video": Folder,
  calendar: Calendar,
  "calendar-grid": CalendarDays,
  analytics: ChartNoAxesColumnIncreasing,
  settings: Settings,
  star: Star,
  message: MessageSquare,
  asterisk: Asterisk,
  feather: Feather,
  box: Box,
  trees: TreePine,
  shapes: Shapes,
  hexagon: Hexagon,
  send: Send,
  expand: Maximize2,
  "code-window": AppWindow,
  type: Type,
  "sun-dim": SunDim,
  "line-chart": ChartLine,
  trend: TrendingUp,
  "plus-bold": Plus,
  "x-bold": X,
  puzzle: Puzzle,
  "chart-square": ChartColumnBig,
  refresh: RefreshCw,
  wind: Wind,
  command: Command,
  "grid-dots": Grip,
  scale: SquareDashedMousePointer,
  zap: Zap,
  nodes: Waypoints,
  dots: Ellipsis,
  chevrons: ChevronsRight,
  // Fashion / product icons used by the landing page.
  "shirt": Shirt,
  "shopping-bag": ShoppingBag,
  "glasses": Glasses,
  "gem": Gem,
  "footprints": Footprints,
  "watch": Watch,
  "store": Store,
  "link": Link,
  "camera": Camera,
  "users": Users,
  "heart": Heart,
  "thumbs-up": ThumbsUp,
  "thumbs-down": ThumbsDown,
  "palette": Palette,
  "wand-sparkles": WandSparkles,
  "scan-face": ScanFace,
  "ruler": Ruler,
  "calendar-heart": CalendarHeart,
  "share-2": Share2,
  "layers": Layers,
  "compass": Compass,
  "message-circle": MessageCircle,
  "tag": Tag,
  "code": Code,
  "repeat": Repeat,
  "shield-check": ShieldCheck,
  "sun": Sun,
  "building-2": Building2,
  "party-popper": PartyPopper,
  "briefcase": Briefcase,
  "coffee": Coffee,
  "wallet": Wallet,
  "timer": Timer,
  "crown": Crown,
  "scissors": Scissors,
  "flame": Flame,
  "plane": Plane,
  "film": Film,
  "handshake": Handshake,
  "receipt": Receipt,
  leaf: Leaf,
};

export function Icon({
  name,
  className,
  strokeWidth = 2,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Cmp = REGISTRY[name] ?? Sparkles;
  return <Cmp className={className} strokeWidth={strokeWidth} aria-hidden />;
}

type SocialProps = SVGProps<SVGSVGElement> & { name: string };

export function SocialIcon({ name, ...props }: SocialProps) {
  if (name === "x-social") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
        <path d="M17.75 3h3.07l-6.72 7.68L22 21h-6.19l-4.85-6.34L5.41 21H2.34l7.19-8.21L2 3h6.35l4.38 5.79L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z" />
      </svg>
    );
  }
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.27 5.33A16.6 16.6 0 0 0 15.1 4l-.2.4a15.3 15.3 0 0 1 3.7 1.86 13.6 13.6 0 0 0-11.2 0A15.3 15.3 0 0 1 11.1 4.4L10.9 4a16.6 16.6 0 0 0-4.17 1.33C4.1 9.24 3.38 13.05 3.74 16.8a16.8 16.8 0 0 0 5.1 2.58l1.1-1.5a10.8 10.8 0 0 1-1.73-.83l.42-.33a11.9 11.9 0 0 0 10.74 0l.42.33c-.55.33-1.13.6-1.73.83l1.1 1.5a16.8 16.8 0 0 0 5.1-2.58c.43-4.35-.73-8.12-3-11.47ZM9.5 14.5c-.99 0-1.8-.9-1.8-2s.8-2 1.8-2 1.81.9 1.8 2c0 1.1-.8 2-1.8 2Zm5 0c-.99 0-1.8-.9-1.8-2s.8-2 1.8-2 1.81.9 1.8 2c0 1.1-.8 2-1.8 2Z" />
    </svg>
  );
}
