import { Link } from "react-router-dom";
import { ArrowRight, FolderKanban, Users, Wallet, CalendarCheck, LayoutDashboard, HandHelping } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { KpiCard } from "@/components/esg/ui-kit";
import { useAssistance, useProjects, useTracking } from "@/hooks/use-lists";
import { useCurrentUser } from "@/hooks/use-user";
import { fmtMoney, fmtNum, num, personEmail, str } from "@/lib/sp";

const MODULES = [
  { to: "/dashboard", title: "Dashboard", icon: LayoutDashboard, color: "bg-esg-navy",
    text: "Track sustainability KPIs, project progress, budget execution and impact through interactive analytics." },
  { to: "/projects", title: "Projects", icon: FolderKanban, color: "bg-esg-teal",
    text: "Create, manage and monitor social initiatives: beneficiaries, scope, KPIs and budget." },
  { to: "/monthly-tracking", title: "Monthly Tracking", icon: CalendarCheck, color: "bg-esg-taupe",
    text: "Monthly monitoring of each project's activities against defined KPIs and targets." },
  { to: "/assistance", title: "Assistance", icon: HandHelping, color: "bg-amber-500",
    text: "Volunteer and collaborator participation across ESG projects and activities." },
];

export default function HomePage() {
  const { data: user } = useCurrentUser();
  const { data: projects = [] } = useProjects();
  const { data: tracking = [] } = useTracking();
  const { data: assistance = [] } = useAssistance();

  const allocated = projects.reduce((s, p) => s + num(p.AllocatedBudget), 0);
  const executed = projects.reduce((s, p) => s + num(p.ExecutedBudget), 0);
  const beneficiaries = tracking.reduce((s, t) => s + num(t.OData__x004b_PI1), 0);
  const volunteers = new Set(assistance.map((a) => personEmail(a.Colaborator)).filter(Boolean)).size;
  const active = projects.filter((p) => /progress|active/i.test(str(p.Status))).length;
  const execPct = allocated ? Math.round((executed / allocated) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Bienvenida */}
      <section className="relative overflow-hidden rounded-2xl bg-esg-navy p-6 text-white sm:p-8">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-esg-gold/20" />
        <div className="absolute -bottom-20 right-24 size-48 rounded-full bg-esg-teal/40" />
        <div className="relative">
          <p className="text-sm text-white/70">ESG Hub</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Welcome, {user?.fullName ?? "…"}</h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            Environmental, Social and Governance initiatives for MSC and MEDLOG in one place.
          </p>
          <div className="mt-6 max-w-md">
            <div className="flex justify-between text-xs text-white/80">
              <span>Budget execution</span><span>{execPct}%</span>
            </div>
            <Progress value={Math.min(execPct, 100)} className="mt-1.5 h-2 bg-white/20 [&>*]:bg-esg-gold" />
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Projects" value={fmtNum(projects.length)} hint={`${active} in progress`} icon={FolderKanban} tone="navy" />
        <KpiCard label="Direct beneficiaries" value={fmtNum(beneficiaries)} hint="From monthly tracking" icon={Users} tone="teal" />
        <KpiCard label="Budget executed" value={fmtMoney(executed)} hint={`of ${fmtMoney(allocated)} allocated`} icon={Wallet} tone="gold" />
        <KpiCard label="Collaborators" value={fmtNum(volunteers)} hint="Unique volunteers" icon={HandHelping} tone="taupe" />
      </section>

      {/* Módulos */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Modules</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {MODULES.map((m) => (
            <Link key={m.to} to={m.to} className="group">
              <Card className="h-full py-0 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className={`grid size-11 place-items-center rounded-xl text-white ${m.color}`}>
                    <m.icon className="size-5" />
                  </div>
                  <p className="mt-4 font-semibold">{m.title}</p>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{m.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-esg-teal">
                    Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
