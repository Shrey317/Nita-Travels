interface SectionHeadingProps {
  title: string;
  accentColor?: "blue" | "teal" | "warning" | "error";
}

const accentClasses = {
  blue: "bg-primary",
  teal: "bg-status-success",
  warning: "bg-warning",
  error: "bg-error",
};

/**
 * Standardized section heading with an optional left accent bar.
 * Used within pages to demarcate logical sections (tables, charts, etc.).
 */
export function SectionHeading({ title, accentColor = "blue" }: SectionHeadingProps) {
  return (
    <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white">
      <span className={`inline-block h-5 w-1 rounded-full ${accentClasses[accentColor]}`} aria-hidden="true" />
      {title}
    </h2>
  );
}
