interface SectionHeadingProps {
  title: string;
  accentColor?: "blue" | "teal" | "warning" | "error";
}

const accentClasses = {
  blue: "bg-brand-blue",
  teal: "bg-gradient-to-b from-teal to-teal-light",
  warning: "bg-status-warning",
  error: "bg-status-error",
};

/**
 * Standardized section heading with an optional left accent bar.
 * Used within pages to demarcate logical sections (tables, charts, etc.).
 */
export function SectionHeading({ title, accentColor = "blue" }: SectionHeadingProps) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
      <span className={`inline-block h-5 w-1 rounded-full ${accentClasses[accentColor]}`} aria-hidden="true" />
      {title}
    </h2>
  );
}
