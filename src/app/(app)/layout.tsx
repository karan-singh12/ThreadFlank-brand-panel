import { redirect } from "next/navigation";

/**
 * The shopper pages (discover, wardrobe, profile, …) stay in this repo in sync with User-Panel,
 * but they are not part of the brand site: a brand token can't call the shopper API, and a brand
 * should never see the shopper app. Every visit goes to the dashboard, which asks guests to log in.
 */
export default function AppLayout() {
  redirect("/dashboard");
}
