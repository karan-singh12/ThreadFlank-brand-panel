import fs from "node:fs";
import path from "node:path";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ShowcaseTabs, type Screen } from "./ShowcaseTabs";

const SCREENS = [
  { id: "dashboard", label: "Dashboard", icon: "analytics", caption: "Store views, try-ons and buy clicks at a glance." },
  { id: "catalog", label: "Catalog", icon: "layers", caption: "Hundreds of garments, filtered, sorted and grouped into collections." },
  { id: "drops", label: "Launch drops", icon: "calendar-heart", caption: "Schedule a drop and collect a waitlist before it goes live." },
  { id: "ai-studio", label: "AI Studio", icon: "wand-sparkles", caption: "Write descriptions, captions and announcements in seconds." },
  { id: "bidding", label: "Runway", icon: "crown", caption: "Bid for a featured slot on Discover." },
  { id: "settings", label: "Settings", icon: "settings", caption: "Store profile, try-on widget, team and security." },
] as const;

const EXTS = ["png", "webp", "jpg", "jpeg"];

/** Public path of the first matching file in /public/screens, or null when none was added yet. */
function find(name: string) {
  const dir = path.join(process.cwd(), "public", "screens");
  const ext = EXTS.find((e) => fs.existsSync(path.join(dir, `${name}.${e}`)));
  return ext ? `/screens/${name}.${ext}` : null;
}

/** "Inside the panel": real screenshots dropped into /public/screens, designed placeholders until then. */
export function AppShowcase() {
  const screens: Screen[] = SCREENS.map((s) => ({
    ...s,
    desktop: find(s.id),
    mobile: find(`${s.id}-mobile`),
  }));

  return (
    <section id="screens" className="pt-24 lg:pt-[140px]">
      <Container>
        <SectionHeading eyebrow="Inside the app" title="Inside the brand panel">
          <p className="mt-4 max-w-[640px] text-sm text-subtle sm:text-body">
            Manage your catalog, launch drops, AI tools and try-on widget from one place. Tap a tab to see each screen.
          </p>
        </SectionHeading>
        <ShowcaseTabs screens={screens} />
      </Container>
    </section>
  );
}
