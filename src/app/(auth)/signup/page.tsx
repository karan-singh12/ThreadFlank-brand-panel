import { Suspense } from "react";
import type { Metadata } from "next";
import { GuestOnly } from "@/features/auth/guards";
import { SignupForm } from "@/features/auth/components/SignupForm";
import { FormSkeleton } from "@/features/auth/components/FormSkeleton";

export const metadata: Metadata = {
  title: "List Your Brand — Threadflank",
  description: "List your brand on Threadflank and let shoppers try on every piece in your catalog before they buy.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return (
    <Suspense fallback={<FormSkeleton fields={4} />}>
      <GuestOnly>
        <SignupForm />
      </GuestOnly>
    </Suspense>
  );
}
