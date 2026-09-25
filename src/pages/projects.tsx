/**
 * Projects (reemplaza la pantalla "My Projects").
 * - Filtros: empresa (All/MSC/MEDLOG), estado y búsqueda en 8 campos.
 * - Tarjetas con avance de actividades y presupuesto.
 * - Panel de detalle + formulario crear/editar en un diálogo.
 * - Al guardar, crea las filas faltantes en Monthly Tracking (# Planned Activities).
 */
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, MapPin, User, Building2, Pencil, Trash2, CalendarRange, Users, Wallet, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  CompanyToggle, EmptyState, Field, GridSkeleton, KpiCard, NativeSelect, PageHeader, SearchBox, companyMatches,
} from "@/components/esg/ui-kit";
import { ensureTrackingRows, useDelete, useProjects, useRefOptions, useSave, useTracking, type Row } from "@/hooks/use-lists";
import { useCurrentUser } from "@/hooks/use-user";
import { COMPANIES, PROJECT_STATUS, REF_CATEGORIES, statusTone, type CompanyFilter } from "@/lib/constants";
import { fmtDate, fmtMoney, fmtNum, matches, num, str, toChoice, toDateInput } from "@/lib/sp";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tracking = [] } = useTracking();
  const [company, setCompany] = useState<CompanyFilter>("All");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  const statuses = useMemo(
    () => Array.from(new Set([...PROJECT_STATUS, ...projects.map((p) => str(p.Status)).filter(Boolean)])),
    [projects],
  );

  // Actividades completadas por proyecto (desde Monthly Tracking)
  const progress = useMemo(() => {
    const m = new Map<number, { total: number; done: number }>();
    for (const t of tracking) {
      const id = t.ProjectName?.Id as number | undefined;
      if (!id) continue;
      const e = m.get(id) ?? { total: 0, done: 0 };
      e.total++;
      if (/complet/i.test(str(t.Status))) e.done++;
      m.set(id, e);
    }
    return m;
  }, [tracking]);

  const filtered = useMemo(
    () =>
      projects
        .filter((p) => companyMatches(company, str(p.Company0)))
        .filter((p) => !status || str(p.Status) === status)
        .filter((p) =>
          matches(search, p.Title, p.Subarea, p.Partner, p.BeneficiaryOrganization, p.ProjectLeader, p.ScopeofAction, p.Location, p.Company0),
        )
        .sort((a, b) => str(a.Title).localeCompare(str(b.Title))),
    [projects, company, status, search],
  );

  const totals = useMemo(() => ({
    allocated: filtered.reduce((s, p) => s + num(p.AllocatedBudget), 0),
    executed: filtered.reduce((s, p) => s + num(p.ExecutedBudget), 0),
    beneficiaries: filtered.reduce((s, p) => s + num(p.OData__x0023_Beneficiaries), 0),
  }), [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Create, manage and monitor social initiatives."
        actions={<Button onClick={() => setEditing("new")} className="bg-esg-teal hover:bg-esg-teal/90"><Plus className="size-4" /> New project</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Projects" value={fmtNum(filtered.length)} icon={ListChecks} />
        <KpiCard label="Potential beneficiaries" value={fmtNum(totals.beneficiaries)} icon={Users} tone="teal" />
        <KpiCard label="Allocated budget" value={fmtMoney(totals.allocated)} icon={Wallet} tone="gold" />
        <KpiCard label="Executed budget" value={fmtMoney(totals.executed)}
          hint={totals.allocated ? `${Math.round((totals.executed / totals.allocated) * 100)}% execution` : undefined}
          icon={Wallet} tone="taupe" />
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center">
        <CompanyToggle value={company} onChange={setCompany} />
        <NativeSelect value={status} onChange={setStatus} options={statuses} placeholder="All statuses" className="lg:w-44" />
        <div className="lg:ml-auto"><SearchBox value={search} onChange={setSearch} placeholder="Search project, partner, leader…" /></div>
      </div>

      {/* Tarjetas */}
      {isLoading ? <GridSkeleton /> : filtered.length === 0 ? (
        <EmptyState title="No projects found" text="Try another filter or create a new project."
          action={<Button variant="outline" onClick={() => setEditing("new")}><Plus className="size-4" /> New project</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const pr = progress.get(p.ID!) ?? { total: 0, done: 0 };
            const planned = num(p.OData__x0023_ActivitiesCompleted) || pr.total;
            const pct = planned ? Math.round((pr.done / planned) * 100) : 0;
            return (
              <button key={p.ID} onClick={() => setSelected(p)} className="text-left">
                <Card className="h-full py-0 transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 font-semibold">{str(p.Title)}</p>
                      {str(p.Status) && <Badge variant="outline" className={cn("shrink-0", statusTone(str(p.Status)))}>{str(p.Status)}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {str(p.ScopeofAction) && <Badge variant="secondary">{str(p.ScopeofAction)}</Badge>}
                      {str(p.Subarea) && <Badge variant="secondary">{str(p.Subarea)}</Badge>}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2"><Building2 className="size-3.5" />{str(p.BeneficiaryOrganization) || "—"}</p>
                      <p className="flex items-center gap-2"><User className="size-3.5" />{str(p.ProjectLeader) || "—"}</p>
                      <p className="flex items-center gap-2"><MapPin className="size-3.5" />{[str(p.Location), str(p.Country)].filter(Boolean).join(", ") || "—"}</p>
                    </div>
                    <div className="mt-auto space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Activities {pr.done}/{planned}</span><span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5 [&>*]:bg-esg-teal" />
                    </div>
                    <div className="flex items-center justify-between border-t pt-3 text-xs">
                      <span className="font-medium">{str(p.Company0) || "—"}</span>
                      <span className="text-muted-foreground">{fmtMoney(num(p.ExecutedBudget))} / {fmtMoney(num(p.AllocatedBudget))}</span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <ProjectDetail project={selected} onClose={() => setSelected(null)} onEdit={(p) => { setSelected(null); setEditing(p); }} />
      {editing && <ProjectForm project={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

/* ================= Detalle ================= */
function ProjectDetail({ project: p, onClose, onEdit }: { project: Row | null; onClose: () => void; onEdit: (p: Row) => void }) {
  const del = useDelete("projects", "Project");
  if (!p) return null;
  const allocated = num(p.AllocatedBudget), executed = num(p.ExecutedBudget);
  const pct = allocated ? Math.round((executed / allocated) * 100) : 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            {str(p.Status) && <Badge variant="outline" className={statusTone(str(p.Status))}>{str(p.Status)}</Badge>}
            <Badge variant="secondary">{str(p.Company0)}</Badge>
          </div>
          <DialogTitle className="text-xl">{str(p.Title)}</DialogTitle>
          <DialogDescription>{str(p.ProjectDescription) || "No description."}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Info label="Scope of action" value={str(p.ScopeofAction)} />
          <Info label="Subarea" value={str(p.Subarea)} />
          <Info label="Beneficiary organization" value={str(p.BeneficiaryOrganization)} />
          <Info label="Partner" value={str(p.Partner)} />
          <Info label="Project leader" value={str(p.ProjectLeader)} />
          <Info label="Location" value={[str(p.Location), str(p.Country)].filter(Boolean).join(", ")} />
          <Info label="Dates" value={`${fmtDate(p.StartDate)} → ${fmtDate(p.ActualEndDate)}`} icon={CalendarRange} />
          <Info label="Planned activities" value={fmtNum(num(p.OData__x0023_ActivitiesCompleted))} />
          <Info label="Potential direct beneficiaries" value={fmtNum(num(p.OData__x0023_Beneficiaries))} />
          <Info label="Potential indirect beneficiaries" value={fmtNum(num(p.OData__x0023_IndirectBeneficiary))} />
        </div>

        <Separator />
        <div>
          <div className="flex justify-between text-sm"><span>Budget execution</span><span className="font-medium">{pct}%</span></div>
          <Progress value={Math.min(pct, 100)} className="mt-2 h-2 [&>*]:bg-esg-gold" />
          <p className="mt-1 text-xs text-muted-foreground">{fmtMoney(executed)} executed of {fmtMoney(allocated)}</p>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" className="text-red-600 hover:text-red-700"
            onClick={() => { if (confirm("Delete this project?")) del.mutate(p.ID!, { onSuccess: onClose }); }}>
            <Trash2 className="size-4" /> Delete
          </Button>
          <Button onClick={() => onEdit(p)} className="bg-esg-navy hover:bg-esg-navy/90"><Pencil className="size-4" /> Edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">{Icon && <Icon className="size-3.5" />}{value || "—"}</p>
    </div>
  );
}

/* ================= Formulario ================= */
function ProjectForm({ project, onClose }: { project: Row | null; onClose: () => void }) {
  const qc = useQueryClient();
  const save = useSave("projects", "Project");
  const { data: user } = useCurrentUser();
  const scopes = useRefOptions(REF_CATEGORIES.scope);
  const subareas = useRefOptions(REF_CATEGORIES.subarea);
  const companies = useRefOptions(REF_CATEGORIES.company, [...COMPANIES]);
  const locations = useRefOptions(REF_CATEGORIES.location);

  const [f, setF] = useState(() => ({
    Title: str(project?.Title),
    ProjectDescription: str(project?.ProjectDescription),
    ScopeofAction: str(project?.ScopeofAction),
    Status: str(project?.Status) || PROJECT_STATUS[0],
    Partner: str(project?.Partner),
    BeneficiaryOrganization: str(project?.BeneficiaryOrganization),
    Subarea: str(project?.Subarea),
    ProjectLeader: str(project?.ProjectLeader) || user?.fullName || "",
    Company: str(project?.Company0).split(";").map((s) => s.trim()).filter(Boolean),
    Country: str(project?.Country),
    Location: str(project?.Location),
    AllocatedBudget: str(project?.AllocatedBudget),
    ExecutedBudget: str(project?.ExecutedBudget),
    StartDate: toDateInput(project?.StartDate),
    ActualEndDate: toDateInput(project?.ActualEndDate),
    Beneficiaries: str(project?.OData__x0023_Beneficiaries),
    Indirect: str(project?.OData__x0023_IndirectBeneficiary),
    Planned: str(project?.OData__x0023_ActivitiesCompleted),
  }));
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const [busy, setBusy] = useState(false);

  const missing = [
    !f.Title && "Title", !f.ScopeofAction && "Scope of action", !f.Status && "Status",
    !f.BeneficiaryOrganization && "Beneficiary organization", !f.Subarea && "Subarea",
    !f.ProjectLeader && "Project leader", !f.Company.length && "Company",
  ].filter(Boolean) as string[];

  async function submit() {
    if (missing.length) { toast.error(`Required: ${missing.join(", ")}`); return; }
    setBusy(true);
    // Mantiene el orden de empresas definido en Referentials (como el Concat del Canvas)
    const companyText = companies.filter((c) => f.Company.includes(c)).join("; ");
    const values: Row = {
      Title: f.Title.trim(),
      ProjectDescription: f.ProjectDescription,
      ScopeofAction: f.ScopeofAction,
      Status: toChoice(f.Status),
      Partner: f.Partner,
      BeneficiaryOrganization: f.BeneficiaryOrganization,
      Subarea: f.Subarea,
      ProjectLeader: f.ProjectLeader,
      Company0: companyText,
      Country: f.Country,
      Location: f.Location,
      AllocatedBudget: f.AllocatedBudget === "" ? null : Number(f.AllocatedBudget),
      ExecutedBudget: f.ExecutedBudget === "" ? null : Number(f.ExecutedBudget),
      StartDate: f.StartDate || null,
      ActualEndDate: f.ActualEndDate || null,
      OData__x0023_Beneficiaries: f.Beneficiaries === "" ? null : Number(f.Beneficiaries),
      OData__x0023_IndirectBeneficiary: f.Indirect === "" ? null : Number(f.Indirect),
      OData__x0023_ActivitiesCompleted: f.Planned === "" ? null : Number(f.Planned),
    };
    try {
      const saved = await save.mutateAsync({ id: project?.ID, values });
      const created = await ensureTrackingRows({ ...values, ...saved, ID: saved?.ID ?? project?.ID }, num(f.Planned));
      if (created) {
        toast.info(`${created} monthly tracking row(s) created`);
        qc.invalidateQueries({ queryKey: ["tracking"] });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>Fields marked with * are required.</DialogDescription>
        </DialogHeader>

        <Section title="General">
          <Field label="Project name" required className="sm:col-span-2"><Input value={f.Title} onChange={(e) => set("Title")(e.target.value)} /></Field>
          <Field label="Description" className="sm:col-span-2"><Textarea rows={3} value={f.ProjectDescription} onChange={(e) => set("ProjectDescription")(e.target.value)} /></Field>
          <Field label="Scope of action" required><NativeSelect value={f.ScopeofAction} onChange={set("ScopeofAction")} options={withCurrent(scopes, f.ScopeofAction)} /></Field>
          <Field label="Subarea" required><NativeSelect value={f.Subarea} onChange={set("Subarea")} options={withCurrent(subareas, f.Subarea)} /></Field>
          <Field label="Status" required><NativeSelect value={f.Status} onChange={set("Status")} options={withCurrent(PROJECT_STATUS, f.Status)} /></Field>
          <Field label="Company" required>
            <div className="flex h-9 items-center gap-4">
              {companies.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={f.Company.includes(c)}
                    onCheckedChange={(v) => set("Company")(v ? [...f.Company, c] : f.Company.filter((x) => x !== c))} />
                  {c}
                </label>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="People & place">
          <Field label="Beneficiary organization" required><Input value={f.BeneficiaryOrganization} onChange={(e) => set("BeneficiaryOrganization")(e.target.value)} /></Field>
          <Field label="Partner"><Input value={f.Partner} onChange={(e) => set("Partner")(e.target.value)} /></Field>
          <Field label="Project leader" required><Input value={f.ProjectLeader} onChange={(e) => set("ProjectLeader")(e.target.value)} /></Field>
          <Field label="Country"><Input value={f.Country} onChange={(e) => set("Country")(e.target.value)} /></Field>
          <Field label="Location"><NativeSelect value={f.Location} onChange={set("Location")} options={withCurrent(locations, f.Location)} /></Field>
        </Section>

        <Section title="Plan, budget & impact">
          <Field label="Start date"><Input type="date" value={f.StartDate} onChange={(e) => set("StartDate")(e.target.value)} /></Field>
          <Field label="Actual end date"><Input type="date" value={f.ActualEndDate} onChange={(e) => set("ActualEndDate")(e.target.value)} /></Field>
          <Field label="Allocated budget (USD)"><Input type="number" min={0} value={f.AllocatedBudget} onChange={(e) => set("AllocatedBudget")(e.target.value)} /></Field>
          <Field label="Executed budget (USD)"><Input type="number" min={0} value={f.ExecutedBudget} onChange={(e) => set("ExecutedBudget")(e.target.value)} /></Field>
          <Field label="# Potential direct beneficiaries"><Input type="number" min={0} value={f.Beneficiaries} onChange={(e) => set("Beneficiaries")(e.target.value)} /></Field>
          <Field label="# Potential indirect beneficiaries"><Input type="number" min={0} value={f.Indirect} onChange={(e) => set("Indirect")(e.target.value)} /></Field>
          <Field label="# Planned activities" className="sm:col-span-2">
            <Input type="number" min={0} value={f.Planned} onChange={(e) => set("Planned")(e.target.value)} />
            <p className="text-xs text-muted-foreground">One Monthly Tracking row is created per planned activity.</p>
          </Field>
        </Section>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-esg-teal hover:bg-esg-teal/90">{busy ? "Saving…" : "Save project"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold text-esg-navy dark:text-foreground">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Asegura que el valor actual aparezca aunque no esté en Referentials. */
const withCurrent = (opts: string[], current: string) => (current && !opts.includes(current) ? [current, ...opts] : opts);
