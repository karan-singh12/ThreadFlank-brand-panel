/** Compact relative time for feed items: "just now", "5m", "3h", "2d". */
export function timeAgo(dateString?: string): string {
  if (!dateString) return "1h";
  const diffMins = Math.floor((Date.now() - new Date(dateString).getTime()) / (60 * 1000));
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}
