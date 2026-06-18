/**
 * Consistent page header used across every portal section.
 * Eyebrow + title + subtitle establishes clear hierarchy; optional action slot on the right.
 */
export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600 mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[1.65rem] leading-tight font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}
