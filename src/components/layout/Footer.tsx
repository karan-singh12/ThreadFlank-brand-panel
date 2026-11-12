import { ArrowUp } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { LogoMark } from "@/components/ui/LogoMark";
import { Wordmark } from "@/components/ui/Wordmark";
import { SocialIcon } from "@/lib/icons";
import { brand, footer } from "@/data/landing-page";
import { NewsletterForm } from "./NewsletterForm";

const social = footer.social.filter((s) => s.href);

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <Container>
        <div className="grid gap-12 pt-16 lg:grid-cols-[1fr_167px_191px_397px] lg:gap-0">
          <div className="flex items-start gap-4 lg:flex-col lg:gap-3">
            <a href="#top" className="flex items-center gap-3">
              <LogoMark className="size-10" />
              <Wordmark className="text-title text-white" />
            </a>
            <p className="pt-2 text-sm text-muted lg:pt-0 lg:text-body">{brand.copyright}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:contents">
            {footer.columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="text-title text-white">{col.title}</p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-body text-subtle transition-colors hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <NewsletterForm />
        </div>

        <div className="mt-16 flex items-center justify-between border-t border-white/10 py-8 lg:mt-[110px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            {social.length > 0 && <p className="text-body text-muted">{footer.followLabel}</p>}
            <div className="flex gap-3">
              {social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-12 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/50"
                >
                  <SocialIcon name={s.icon} className="size-5" />
                </a>
              ))}
            </div>
          </div>
          <a
            href="#top"
            aria-label={footer.backToTop}
            className="flex size-[84px] items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            <ArrowUp className="size-8" strokeWidth={1} />
          </a>
        </div>
      </Container>
    </footer>
  );
}
