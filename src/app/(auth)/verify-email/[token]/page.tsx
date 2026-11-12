import type { Metadata } from "next";
import { VerifyEmailView } from "@/features/auth/components/VerifyEmailView";

export const metadata: Metadata = { title: "Verify email — Threadflank", robots: { index: false } };

// The backend emails links of the form /verify-email/<token>.
export default async function VerifyEmailPage({ params }: PageProps<"/verify-email/[token]">) {
  const { token } = await params;
  return <VerifyEmailView token={token} />;
}
