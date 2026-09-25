/**
 * Piezas visuales reutilizables del ESG Hub (sobre los componentes shadcn que ya tienes).
 */
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Search, X, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { COMPANIES, type CompanyFilter } from "@/lib/constants";
import logoMsc from "@/assets/logo-msc.gif";
import logoMedlog from "@/assets/logo-medlog.gif";

/* ---------- Encabezado de página ---------- */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-esg-navy dark:text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Tarjeta KPI ---------- */
const tones = {
  navy: "border-l-esg-navy",
  teal: "border-l-esg-teal",
  gold: "border-l-esg-gold",
  taupe: "border-l-esg-taupe",
};
export function KpiCard({
  label, value, hint, icon: Icon, tone = "navy",
}: { label: string; value: ReactNode; hint?: string; icon?: LucideIcon; tone?: keyof typeof tones }) {
  return (
    <Card className={cn("border-l-4 py-0", tones[tone])}>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && <Icon className="size-5 shrink-0 text-muted-foreground" />}
      </CardContent>
    </Card>
  );
}

/* ---------- Filtro de empresa (All / MSC / MEDLOG) ---------- */
export function CompanyToggle({ value, onChange }: { value: CompanyFilter; onChange: (v: CompanyFilter) => void }) {
  const opts: { key: CompanyFilter; node: ReactNode }[] = [
    { key: "All", node: <span className="text-sm font-medium">All companies</span> },
    { key: "MSC", node: <img src={logoMsc} alt="MSC" className="h-5 object-contain" /> },
    { key: "MEDLOG", node: <img src={logoMedlog} alt="MEDLOG" className="h-5 object-contain" /> },
  ];
  return (
    <div className="inline-flex rounded-lg border bg-card p-1" role="radiogroup" aria-label="Company">
      {opts.map((o) => (
        <button
          key={o.key}
          role="radio"
          aria-checked={value === o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "flex h-9 min-w-24 items-center justify-center rounded-md px-3 transition-colors",
            value === o.key ? "bg-esg-gold/40 ring-1 ring-esg-gold" : "hover:bg-muted",
          )}
        >
          {o.node}
        </button>
      ))}
    </div>
  );
}
export function companyMatches(filter: CompanyFilter, companyText: string) {
  return filter === "All" || companyText.toUpperCase().includes(filter);
}
export { COMPANIES };

/* ---------- Buscador ---------- */
export function SearchBox({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9 pr-8" />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Clear">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/* ---------- Campo de formulario ---------- */
export function Field({ label, required, children, className }: { label: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-red-600">*</span>}
      </Label>
      {children}
    </div>
  );
}

/** Select nativo con estilo shadcn (más simple y robusto dentro de diálogos). */
export function NativeSelect({
  value, onChange, options, placeholder = "Select…", className,
}: { value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; placeholder?: string; className?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30",
        className,
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

/* ---------- Estados vacíos / carga ---------- */
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <p className="mt-3 font-medium">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function GridSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: n }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
    </div>
  );
}
