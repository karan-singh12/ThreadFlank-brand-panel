import { Suspense } from "react";
import type { Metadata } from "next";
import { GuestOnly } from "@/features/auth/guards";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { FormSkeleton } from "@/features/auth/components/FormSkeleton";

export const metadata: Metadata = { title: "Log in — Threadflank" };

export default function LoginPage() {
  return (
    <Suspense fallback={<FormSkeleton fields={2} />}>
      <GuestOnly>
        <LoginForm />
      </GuestOnly>
    </Suspense>
  );
}
