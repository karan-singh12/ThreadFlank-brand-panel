import { redirect } from "next/navigation";

// Events now live as a tab on the Saved page; keep /events working for old links.
export default function EventsPage() {
  redirect("/saved?tab=events");
}
