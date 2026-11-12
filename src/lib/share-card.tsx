import { ImageResponse } from "next/og";

/**
 * Branded share cards (feature #22), rendered on the server for looks and Discover posts.
 *  - whatsapp 1080×1350: portrait 4:5, survives WhatsApp compression and crops
 *  - story    1080×1920: Instagram Stories / Reels cover
 *  - og       1200×630:  link-preview image for the share pages
 * Branding stays a small corner mark so the card gets forwarded rather than cropped, and the
 * short link is printed on the card so it still leads back to the look when shared as an image.
 */
export const CARD_SIZES = { whatsapp: [1080, 1350], story: [1080, 1920], og: [1200, 630] } as const;
export type CardFormat = keyof typeof CARD_SIZES;

export const cardFormat = (value: string | null): CardFormat => (value && value in CARD_SIZES ? (value as CardFormat) : "whatsapp");

const C = {
  canvas: "#0b0a1f",
  panel: "#15132e",
  pearl: "#f6f1fb",
  lavender: "#c4b1fa",
  violet: "#7b61f0",
  muted: "#a9a3c9",
};

/**
 * Loads an image for the card as a JPEG data URI the renderer can always decode (WebP and
 * other uploads are converted with sharp). Returns null when it can't be loaded, so the card
 * still renders, just without the photo, instead of failing.
 */
export async function loadPhoto(url: string | null | undefined, maxWidth = 1200): Promise<string | null> {
  if (!url) return null;
  try {
    let bytes: Buffer;
    let type: string;
    if (url.startsWith("data:")) {
      const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(url);
      if (!match) return null;
      type = match[1];
      bytes = match[2] ? Buffer.from(match[3], "base64") : Buffer.from(decodeURIComponent(match[3]));
    } else {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (!res.ok) return null;
      type = res.headers.get("content-type")?.split(";")[0] ?? "";
      bytes = Buffer.from(await res.arrayBuffer());
    }
    try {
      const sharp = (await import("sharp")).default;
      const jpeg = await sharp(bytes).rotate().resize({ width: maxWidth, withoutEnlargement: true }).jpeg({ quality: 84 }).toBuffer();
      return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
    } catch {
      // sharp unavailable or couldn't decode: PNG and JPEG still render as they are.
      return /^image\/(png|jpe?g)$/.test(type) ? `data:${type};base64,${bytes.toString("base64")}` : null;
    }
  } catch {
    return null;
  }
}

type CardFont = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" };
let fontsPromise: Promise<CardFont[]> | null = null;

/**
 * Poppins (the wordmark's typeface) in the weights the card uses, fetched once per server
 * process. Offline or blocked, the card falls back to the renderer's built-in font.
 */
function loadFonts(): Promise<CardFont[]> {
  fontsPromise ??= Promise.all(
    ([400, 600, 700] as const).map(async (weight) => {
      const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Poppins:wght@${weight}`, { signal: AbortSignal.timeout(5000) })).text();
      const url = /src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
      if (!url) throw new Error("No TTF in the font stylesheet");
      const data = await (await fetch(url, { signal: AbortSignal.timeout(5000) })).arrayBuffer();
      return { name: "Poppins", data, weight, style: "normal" as const };
    })
  ).catch(() => {
    fontsPromise = null;
    return [];
  });
  return fontsPromise;
}

export type CardContent = {
  /** Data URI from `loadPhoto`, or null for the placeholder. */
  photo: string | null;
  /** Data URI of the logo mark, or null for a lettermark. */
  logo: string | null;
  brandName: string;
  /** Small line above the title, e.g. "Styled by Karan · Festive". */
  eyebrow: string;
  title: string;
  /** Up to three short chips (pieces, tagged products). */
  chips: string[];
  /** Call to action, e.g. "Try it on your own twin". */
  cta: string;
  /** Short link printed on the card, without the protocol. */
  link: string;
};

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

function LogoPill({ logo, brandName, scale }: { logo: string | null; brandName: string; scale: number }) {
  const size = Math.round(34 * scale);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: Math.round(12 * scale),
        padding: `${Math.round(10 * scale)}px ${Math.round(20 * scale)}px ${Math.round(10 * scale)}px ${Math.round(12 * scale)}px`,
        borderRadius: 999,
        background: "rgba(11,10,31,0.62)",
        border: "1px solid rgba(196,177,250,0.35)",
        fontSize: Math.round(26 * scale),
        fontWeight: 600,
        color: C.pearl,
      }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser
        <img src={logo} width={size} height={size} alt="" style={{ borderRadius: 999 }} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: 999, background: C.violet, fontSize: Math.round(20 * scale) }}>
          {brandName.charAt(0)}
        </div>
      )}
      {brandName}
    </div>
  );
}

function Photo({ photo, logo, radius }: { photo: string | null; logo: string | null; radius: number }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser
    return <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", borderRadius: radius }} />;
  }
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius,
        backgroundImage: "radial-gradient(circle at 30% 20%, rgba(196,177,250,0.45), transparent 55%), radial-gradient(circle at 80% 90%, rgba(123,97,240,0.55), transparent 60%)",
        backgroundColor: C.panel,
      }}
    >
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser
        <img src={logo} width={180} height={180} alt="" style={{ opacity: 0.55, borderRadius: 999 }} />
      )}
    </div>
  );
}

function Chips({ chips, scale }: { chips: string[]; scale: number }) {
  if (chips.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: Math.round(10 * scale) }}>
      {chips.slice(0, 3).map((chip) => (
        <div
          key={chip}
          style={{
            display: "flex",
            padding: `${Math.round(8 * scale)}px ${Math.round(18 * scale)}px`,
            borderRadius: 999,
            background: "rgba(196,177,250,0.14)",
            border: "1px solid rgba(196,177,250,0.4)",
            color: C.pearl,
            fontSize: Math.round(24 * scale),
          }}
        >
          {clip(chip, 28)}
        </div>
      ))}
    </div>
  );
}

/** CTA and the printed short link; `stacked` puts them on two lines for the narrow link-preview column. */
function Footer({ cta, link, scale, stacked = false }: { cta: string; link: string; scale: number; stacked?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: Math.round(22 * scale) }}>
      <div style={{ display: "flex", height: 1, backgroundImage: "linear-gradient(90deg, rgba(196,177,250,0.05), rgba(196,177,250,0.45), rgba(196,177,250,0.05))" }} />
      <div
        style={{
          display: "flex",
          flexDirection: stacked ? "column" : "row",
          alignItems: stacked ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: stacked ? 6 : 24,
          fontSize: Math.round(26 * scale),
        }}
      >
        <div style={{ display: "flex", color: C.muted }}>{`${cta} →`}</div>
        <div style={{ display: "flex", color: C.lavender, fontWeight: 600, fontSize: Math.round((stacked ? 22 : 26) * scale) }}>{link}</div>
      </div>
    </div>
  );
}

export async function renderShareCard(content: CardContent, format: CardFormat) {
  const [width, height] = CARD_SIZES[format];
  const fonts = await loadFonts();
  const fontFamily = fonts.length ? "Poppins" : undefined;
  const background = `radial-gradient(circle at 0% 0%, rgba(196,177,250,0.22), transparent 45%), radial-gradient(circle at 100% 100%, rgba(123,97,240,0.35), transparent 55%), linear-gradient(170deg, #1a1540 0%, ${C.canvas} 65%)`;

  const card =
    format === "og" ? (
      <div style={{ width: "100%", height: "100%", display: "flex", gap: 44, padding: 40, backgroundImage: background, color: C.pearl, fontFamily }}>
        <div style={{ display: "flex", width: 440, height: "100%", borderRadius: 32, border: "2px solid rgba(196,177,250,0.35)", overflow: "hidden" }}>
          <Photo photo={content.photo} logo={content.logo} radius={30} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", paddingTop: 6 }}>
          <div style={{ display: "flex" }}>
            <LogoPill logo={content.logo} brandName={content.brandName} scale={0.85} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: C.lavender }}>{clip(content.eyebrow, 48)}</div>
            <div style={{ display: "flex", fontSize: 52, fontWeight: 700, lineHeight: 1.08 }}>{clip(content.title, 54)}</div>
            <Chips chips={content.chips} scale={0.85} />
          </div>
          <Footer cta={content.cta} link={content.link} scale={0.85} stacked />
        </div>
      </div>
    ) : (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: format === "story" ? 56 : 44, gap: format === "story" ? 40 : 30, backgroundImage: background, color: C.pearl, fontFamily }}>
        <div style={{ display: "flex", position: "relative", flex: 1, borderRadius: 44, border: "2px solid rgba(196,177,250,0.35)", overflow: "hidden" }}>
          <Photo photo={content.photo} logo={content.logo} radius={42} />
          <div style={{ display: "flex", position: "absolute", top: 28, left: 28 }}>
            <LogoPill logo={content.logo} brandName={content.brandName} scale={1} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: format === "story" ? 22 : 16 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: C.lavender }}>{clip(content.eyebrow, 56)}</div>
          <div style={{ display: "flex", fontSize: format === "story" ? 76 : 62, fontWeight: 700, lineHeight: 1.06 }}>{clip(content.title, format === "story" ? 60 : 48)}</div>
          <Chips chips={content.chips} scale={1} />
        </div>
        <Footer cta={content.cta} link={content.link} scale={1} />
      </div>
    );

  return new ImageResponse(card, { width, height, fonts: fonts.length ? fonts : undefined, headers: { "Cache-Control": "public, max-age=600, s-maxage=600" } });
}
