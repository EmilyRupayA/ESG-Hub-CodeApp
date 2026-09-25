/**
 * Dashboard: incrusta el mismo reporte Power BI que usaba el control PowerBI del Canvas.
 * Si el iframe queda en blanco, revisa la CSP de Code Apps (frame-src app.powerbi.com) — ver GUIA.md.
 */
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/esg/ui-kit";
import { POWER_BI_OPEN_URL, POWER_BI_URL } from "@/lib/constants";

export default function DashboardPage() {
  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col gap-4">
      <PageHeader
        title="Dashboard"
        subtitle="Sustainability KPIs, budget execution and impact results."
        actions={
          <Button variant="outline" asChild>
            <a href={POWER_BI_OPEN_URL} target="_blank" rel="noreferrer">
              Open in Power BI <ExternalLink className="size-4" />
            </a>
          </Button>
        }
      />
      <div className="flex-1 overflow-hidden rounded-xl border bg-card">
        <iframe title="ESG Dashboard" src={POWER_BI_URL} className="size-full" allowFullScreen />
      </div>
    </div>
  );
}
