import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = { title: "Choose a new password — Threadflank", robots: { index: false } };

// The backend emails links of the form /reset-password/<token>.
export default async function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
