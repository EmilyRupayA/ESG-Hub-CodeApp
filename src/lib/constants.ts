export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const currentMonthName = () => MONTHS[new Date().getMonth()];

/** Empresas del filtro superior (en la lista se guardan como "MSC; MEDLOG"). */
export const COMPANIES = ["MSC", "MEDLOG"] as const;
export type CompanyFilter = "All" | (typeof COMPANIES)[number];

/**
 * Valores de Status. Si tus columnas Choice tienen otros valores,
 * cámbialos aquí (deben coincidir EXACTO con SharePoint).
 */
export const PROJECT_STATUS = ["Not Started", "In Progress", "Completed", "On Hold"];
export const TRACKING_STATUS = ["Pending", "In Progress", "Completed"];

/** Categorías de la lista Referentials usadas por los combos. */
export const REF_CATEGORIES = {
  scope: "Scope of Action",
  subarea: "Subarea",
  company: "Company",
  location: "Location",
} as const;

/** Reporte Power BI de la pantalla Dashboard. */
export const POWER_BI_URL =
  "https://app.powerbi.com/reportEmbed?reportId=aadbba88-acb2-4518-946f-fd843b21393e&autoAuth=true&ctid=088e9b00-ffd0-458e-bfa1-acf4c596d3cb";

export const POWER_BI_OPEN_URL =
  "https://app.powerbi.com/groups/me/reports/aadbba88-acb2-4518-946f-fd843b21393e";

/** Color por estado (clases Tailwind). */
export function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("complet") || s.includes("done") || s.includes("closed"))
    return "bg-esg-teal/15 text-esg-teal border-esg-teal/30";
  if (s.includes("progress") || s.includes("active"))
    return "bg-esg-navy/10 text-esg-navy border-esg-navy/30 dark:text-blue-200";
  if (s.includes("hold") || s.includes("cancel"))
    return "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-300";
  return "bg-esg-gold/30 text-amber-900 border-esg-gold dark:text-amber-200";
}
