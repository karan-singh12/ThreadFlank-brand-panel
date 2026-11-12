import fs from "node:fs";
import path from "node:path";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ShowcaseTabs, type Screen } from "./ShowcaseTabs";

const SCREENS = [
  { id: "drape", label: "Drape studio", icon: "shirt", caption: "Your selfie, any outfit, the scene you pick." },
  { id: "discover", label: "Discover", icon: "compass", caption: "Fresh drops from brands, one tap from trying on." },
  { id: "brands", label: "Brands", icon: "store", caption: "Open a store and drape its pieces on yourself." },
  { id: "wardrobe", label: "Wardrobe", icon: "layers", caption: "Your closet, with cost per wear for every piece." },
  { id: "planner", label: "Outfit Planner", icon: "wand-sparkles", caption: "Looks for the occasion, from what you own." },
  { id: "messages", label: "Messages", icon: "message-circle", caption: "Share looks and decide together." },
] as const;

const EXTS = ["png", "webp", "jpg", "jpeg"];

/** Public path of the first matching file in /public/screens, or null when none was added yet. */
function find(name: string) {
  const dir = path.join(process.cwd(), "public", "screens");
  const ext = EXTS.find((e) => fs.existsSync(path.join(dir, `${name}.${e}`)));
  return ext ? `/screens/${name}.${ext}` : null;
}

/** "Inside the app": real screenshots dropped into /public/screens, designed placeholders until then. */
export function AppShowcase() {
  const screens: Screen[] = SCREENS.map((s) => ({
    ...s,
    desktop: find(s.id),
    mobile: find(`${s.id}-mobile`),
  }));

  return (
    <section id="screens" className="pt-24 lg:pt-[140px]">
      <Container>
        <SectionHeading eyebrow="Inside the app" title="See Threadflank at work">
          <p className="mt-4 max-w-[640px] text-sm text-subtle sm:text-body">
            Browse brands, drape any outfit on yourself, plan looks for every occasion and decide with your circle. Tap a tab to see each screen.
          </p>
        </SectionHeading>
        <ShowcaseTabs screens={screens} />
      </Container>
    </section>
  );
}
