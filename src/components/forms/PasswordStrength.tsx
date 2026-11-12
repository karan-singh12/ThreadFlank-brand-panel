import { cn } from "@/lib/utils";

const LEVELS = [
  { label: "Too weak", bar: "bg-red-400" },
  { label: "Weak", bar: "bg-orange-400" },
  { label: "Fair", bar: "bg-yellow-300" },
  { label: "Good", bar: "bg-cyan" },
  { label: "Strong", bar: "bg-green" },
];

export function scorePassword(value: string) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(score, 4);
}

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const score = scorePassword(value);
  const level = LEVELS[score];

  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i < Math.max(score, 1) ? level.bar : "bg-white/10")}
          />
        ))}
      </div>
      <span className="w-16 text-right text-xs text-muted">{level.label}</span>
    </div>
  );
}
