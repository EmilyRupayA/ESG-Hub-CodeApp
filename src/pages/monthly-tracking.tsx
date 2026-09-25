/**
 * Monthly Tracking: seguimiento mensual de actividades por proyecto.
 * Filtros: empresa, proyecto, año, mes (chips) y búsqueda. Tabla + diálogo de edición.
 * (Incluye los KPIs que estaban en la pantalla "Performance Tracking").
 */
import { useMemo, useState } from "react";
import { Plus, Users, CheckCircle2, HeartHandshake, Wallet, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  CompanyToggle, EmptyState, Field, KpiCard, NativeSelect, PageHeader, SearchBox, companyMatches,
} from "@/components/esg/ui-kit";
import { Skeleton } from "@/components/ui/skeleton";
import { useDelete, useProjects, useSave, useTracking, type Row } from "@/hooks/use-lists";
import { MONTHS, TRACKING_STATUS, statusTone, type CompanyFilter } from "@/lib/constants";
import { fmtMoney, fmtNum, matches, num, str, toChoice, toLookup } from "@/lib/sp";
import { cn } from "@/lib/utils";

export default function MonthlyTrackingPage() {
  const { data: rows = [], isLoading } = useTracking();
  const { data: projects = [] } = useProjects();
  const [company, setCompany] = useState<CompanyFilter>("All");
  const [projectId, setProjectId] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(""); // "" = todos
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.ID!, p])), [projects]);
  const years = useMemo(
    () => Array.from(new Set([String(new Date().getFullYear()), ...rows.map((r) => str(r.Year)).filter(Boolean)])).sort().reverse(),
    [rows],
  );

  const base = useMemo(() => rows.filter((r) => {
    const p = projectById.get(r.ProjectName?.Id);
    return companyMatches(company, str(p?.Company0))
      && (!projectId || String(r.ProjectName?.Id) === projectId)
      && (!year || str(r.Year) === year)
      && matches(search, r.Actividad, r.ActivityDetails, r.ProjectName, r.Beneficiariesoftheactivity);
  }), [rows, projectById, company, projectId, year, search]);

  const filtered = useMemo(
    () => base.filter((r) => !month || str(r.Month) === month)
      .sort((a, b) => MONTHS.indexOf(str(a.Month) as never) - MONTHS.indexOf(str(b.Month) as never) || str(a.ProjectName).localeCompare(str(b.ProjectName))),
    [base, month],
  );
  const countByMonth = useMemo(() => {
    const m = new Map<string, number>();
    base.forEach((r) => m.set(str(r.Month), (m.get(str(r.Month)) ?? 0) + 1));
    return m;
  }, [base]);

  const k = useMemo(() => ({
    done: filtered.filter((r) => /complet/i.test(str(r.Status))).length,
    direct: filtered.reduce((s, r) => s + num(r.OData__x004b_PI1), 0),
    volunteers: filtered.reduce((s, r) => s + num(r.KPI4Target) + num(r.OData__x0023_Volunteers_x0028_Family_x), 0),
    cost: filtered.reduce((s, r) => s + num(r.KPI6Target || r.ActivityCost), 0),
  }), [filtered]);

  const projectOptions = projects
    .filter((p) => companyMatches(company, str(p.Company0)))
    .map((p) => ({ value: String(p.ID), label: str(p.Title) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Tracking"
        subtitle="Monitor project activities against KPIs and targets."
        actions={<Button onClick={() => setEditing("new")} className="bg-esg-teal hover:bg-esg-teal/90"><Plus className="size-4" /> New activity</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Activities" value={fmtNum(filtered.length)} hint={`${k.done} completed`} icon={CheckCircle2} />
        <KpiCard label="Direct beneficiaries" value={fmtNum(k.direct)} icon={Users} tone="teal" />
        <KpiCard label="Volunteers" value={fmtNum(k.volunteers)} hint="Collaborators + family" icon={HeartHandshake} tone="gold" />
        <KpiCard label="Executed" value={fmtMoney(k.cost)} icon={Wallet} tone="taupe" />
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <CompanyToggle value={company} onChange={(c) => { setCompany(c); setProjectId(""); }} />
          <NativeSelect value={projectId} onChange={setProjectId} options={projectOptions} placeholder="All projects" className="lg:w-64" />
          <NativeSelect value={year} onChange={setYear} options={years} placeholder="All years" className="lg:w-32" />
          <div className="lg:ml-auto"><SearchBox value={search} onChange={setSearch} placeholder="Search activity…" /></div>
        </div>
        {/* Chips de meses */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <MonthChip label="All" count={base.length} active={!month} onClick={() => setMonth("")} />
          {MONTHS.map((m) => (
            <MonthChip key={m} label={m.slice(0, 3)} count={countByMonth.get(m) ?? 0} active={month === m} onClick={() => setMonth(m)} />
          ))}
        </div>
      </div>

      {isLoading ? <Skeleton className="h-80 rounded-xl" /> : filtered.length === 0 ? (
        <EmptyState title="No activities for this filter" text="Change month, year or project — or add a new activity." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Project</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Direct ben.</TableHead>
                <TableHead className="text-right">Volunteers</TableHead>
                <TableHead className="text-right">Executed</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.ID} className="cursor-pointer" onClick={() => setEditing(r)}>
                  <TableCell className="max-w-56 truncate font-medium">{str(r.ProjectName)}</TableCell>
                  <TableCell className="max-w-72">
                    <p className="truncate">{str(r.Actividad) || <span className="italic text-muted-foreground">Pending to fill</span>}</p>
                    {str(r.ActivityDetails) && <p className="truncate text-xs text-muted-foreground">{str(r.ActivityDetails)}</p>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{str(r.Month).slice(0, 3)} {str(r.Year)}</TableCell>
                  <TableCell>{str(r.Status) ? <Badge variant="outline" className={statusTone(str(r.Status))}>{str(r.Status)}</Badge> : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(num(r.OData__x004b_PI1))}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(num(r.KPI4Target) + num(r.OData__x0023_Volunteers_x0028_Family_x))}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(num(r.KPI6Target || r.ActivityCost))}</TableCell>
                  <TableCell><Pencil className="size-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && <TrackingForm row={editing === "new" ? null : editing} projects={projectOptions} onClose={() => setEditing(null)} />}
    </div>
  );
}

function MonthChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
        active ? "border-esg-navy bg-esg-navy text-white" : "hover:bg-muted", count === 0 && !active && "opacity-50")}>
      {label}<span className={cn("rounded-full px-1.5 text-xs", active ? "bg-white/20" : "bg-muted")}>{count}</span>
    </button>
  );
}

/* ================= Formulario ================= */
function TrackingForm({ row, projects, onClose }: { row: Row | null; projects: { value: string; label: string }[]; onClose: () => void }) {
  const save = useSave("tracking", "Activity");
  const del = useDelete("tracking", "Activity");
  const now = new Date();
  const [f, setF] = useState({
    Project: row?.ProjectName?.Id ? String(row.ProjectName.Id) : "",
    Status: str(row?.Status),
    Actividad: str(row?.Actividad),
    ActivityDetails: str(row?.ActivityDetails),
    Beneficiaries: str(row?.Beneficiariesoftheactivity),
    ActivityCost: str(row?.ActivityCost),
    Month: str(row?.Month) || MONTHS[now.getMonth()],
    Year: str(row?.Year) || String(now.getFullYear()),
    Direct: str(row?.OData__x004b_PI1),
    Indirect: str(row?.OData__x0023_IndirectBeneficiary),
    VolCollab: str(row?.KPI4Target),
    VolFamily: str(row?.OData__x0023_Volunteers_x0028_Family_x),
    Executed: str(row?.KPI6Target),
  });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const n = (v: string) => (v === "" ? null : Number(v));

  function submit() {
    const projectLabel = projects.find((p) => p.value === f.Project)?.label ?? "";
    save.mutate({
      id: row?.ID,
      values: {
        ProjectName: toLookup(Number(f.Project) || null, projectLabel),
        Status: toChoice(f.Status),
        Actividad: f.Actividad,
        ActivityDetails: f.ActivityDetails,
        Beneficiariesoftheactivity: f.Beneficiaries,
        ActivityCost: n(f.ActivityCost),
        Month: f.Month,
        Year: n(f.Year),
        OData__x004b_PI1: n(f.Direct),
        OData__x0023_IndirectBeneficiary: n(f.Indirect),
        KPI4Target: n(f.VolCollab),
        OData__x0023_Volunteers_x0028_Family_x: n(f.VolFamily),
        KPI6Target: n(f.Executed),
      },
    }, { onSuccess: onClose });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row ? "Activity" : "New activity"}</DialogTitle>
          <DialogDescription>{row ? str(row.ProjectName) : "Register an activity for a project."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project" className="sm:col-span-2"><NativeSelect value={f.Project} onChange={set("Project")} options={projects} /></Field>
          <Field label="Month"><NativeSelect value={f.Month} onChange={set("Month")} options={[...MONTHS]} /></Field>
          <Field label="Year"><Input type="number" value={f.Year} onChange={(e) => set("Year")(e.target.value)} /></Field>
          <Field label="Activity" className="sm:col-span-2"><Input value={f.Actividad} onChange={(e) => set("Actividad")(e.target.value)} /></Field>
          <Field label="Activity details" className="sm:col-span-2"><Textarea rows={3} value={f.ActivityDetails} onChange={(e) => set("ActivityDetails")(e.target.value)} /></Field>
          <Field label="Status"><NativeSelect value={f.Status} onChange={set("Status")} options={TRACKING_STATUS.includes(f.Status) || !f.Status ? TRACKING_STATUS : [f.Status, ...TRACKING_STATUS]} /></Field>
          <Field label="Beneficiaries of the activity"><Input value={f.Beneficiaries} onChange={(e) => set("Beneficiaries")(e.target.value)} /></Field>
          <Field label="# Direct beneficiaries"><Input type="number" min={0} value={f.Direct} onChange={(e) => set("Direct")(e.target.value)} /></Field>
          <Field label="# Indirect beneficiaries"><Input type="number" min={0} value={f.Indirect} onChange={(e) => set("Indirect")(e.target.value)} /></Field>
          <Field label="# Volunteers (collaborators)"><Input type="number" min={0} value={f.VolCollab} onChange={(e) => set("VolCollab")(e.target.value)} /></Field>
          <Field label="# Volunteers (family)"><Input type="number" min={0} value={f.VolFamily} onChange={(e) => set("VolFamily")(e.target.value)} /></Field>
          <Field label="Activity cost (USD)"><Input type="number" min={0} value={f.ActivityCost} onChange={(e) => set("ActivityCost")(e.target.value)} /></Field>
          <Field label="Executed budget (USD)"><Input type="number" min={0} value={f.Executed} onChange={(e) => set("Executed")(e.target.value)} /></Field>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {row ? (
            <Button variant="ghost" className="text-red-600 hover:text-red-700"
              onClick={() => { if (confirm("Delete this activity?")) del.mutate(row.ID!, { onSuccess: onClose }); }}>
              <Trash2 className="size-4" /> Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending} className="bg-esg-teal hover:bg-esg-teal/90">{save.isPending ? "Saving…" : "Save"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
