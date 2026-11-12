import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/ui/LogoMark";
import { Wordmark } from "@/components/ui/Wordmark";
import { AuthShowcase } from "@/features/auth/components/AuthShowcase";
import { brand } from "@/data/landing-page";
import { authContent } from "@/data/auth-content";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-4 lg:p-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-240px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-accent/25 blur-[140px] lg:left-1/4" />
      </div>

      <div className="relative flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:min-h-0 lg:px-12 lg:py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-bright">
            <LogoMark className="size-9" />
            <Wordmark className="text-title font-medium text-white" />
          </Link>
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-full px-3 py-2 text-sm text-subtle transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            {authContent.backToHome}
          </Link>
        </div>

        <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12 lg:[@media(max-height:820px)]:py-6">{children}</main>

        <footer className="flex items-center justify-between text-xs text-muted">
          <span>{brand.copyright}</span>
          <nav className="flex gap-5" aria-label="Legal">
            <Link href="/disclaimer" className="transition-colors hover:text-white">
              {authContent.legal.privacy}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              {authContent.legal.terms}
            </Link>
          </nav>
        </footer>
      </div>

      <AuthShowcase />
    </div>
  );
}
