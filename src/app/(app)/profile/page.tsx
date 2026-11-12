import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfileView } from "@/features/profile/ProfileView";

export const metadata: Metadata = { title: "Profile — Threadflank", robots: { index: false } };

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileView />
    </Suspense>
  );
}
