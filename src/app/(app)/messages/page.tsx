import type { Metadata } from "next";
import { MessagesView } from "@/features/messages/MessagesView";

export const metadata: Metadata = { title: "Messages — Threadflank", robots: { index: false } };

export default function MessagesPage() {
  return <MessagesView />;
}
