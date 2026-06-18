import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  eyebrow?: string;
}) {
  return (
    <header className="mb-6 border-b border-slate-200 pb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          {Icon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gov-primary/15 bg-gov-primary/10 text-gov-primary">
              <Icon className="h-[22px] w-[22px]" strokeWidth={2.1} />
            </span>
          ) : (
            <span aria-hidden className="mt-1.5 h-8 w-1.5 shrink-0 rounded-full bg-gov-primary" />
          )}
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-gov-primary/80">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-gov-text sm:text-[1.7rem]">
              {title}
            </h2>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm text-gov-muted">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
