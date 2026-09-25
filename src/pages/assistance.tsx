/**
 * Assistance: participación de colaboradores/voluntarios por proyecto.
 * KPIs de colaboradores únicos (total / activos / inactivos), filtro por proyecto y búsqueda.
 */
import { useMemo, useState } from "react";
import { Plus, Users, UserCheck, UserX, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Field, KpiCard, NativeSelect, PageHeader, SearchBox } from "@/components/esg/ui-kit";
import { useAssistance, useDelete, useProjects, useSave, type Row } from "@/hooks/use-lists";
import { matches, personEmail, str, toLookup, toPerson } from "@/lib/sp";

export default function AssistancePage() {
  const { data: rows = [], isLoading } = useAssistance();
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState("");
  const [state, setState] = useState<"" | "active" | "inactive">("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: String(p.ID), label: str(p.Title) })).sort((a, b) => a.label.localeCompare(b.label)),
    [projects],
  );

  const kpi = useMemo(() => {
    const uniq = (list: Row[]) => new Set(list.map((r) => personEmail(r.Colaborator)).filter(Boolean)).size;
    return { total: uniq(rows), active: uniq(rows.filter((r) => r.Active === true)), inactive: uniq(rows.filter((r) => r.Active === false)) };
  }, [rows]);

  const filtered = useMemo(() => rows.filter((r) =>
    (!projectId || String(r.Project?.Id) === projectId)
    && (!state || (state === "active" ? r.Active === true : r.Active === false))
    && matches(search, r.Colaborator?.DisplayName, r.Colaborator?.Email, r.Department, r.Activity),
  ), [rows, projectId, state, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistance"
        subtitle="Collaborator participation in ESG projects and activities."
        actions={<Button onClick={() => setEditing("new")} className="bg-esg-teal hover:bg-esg-teal/90"><Plus className="size-4" /> Add collaborator</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total collaborators" value={kpi.total} icon={Users} />
        <KpiCard label="Active" value={kpi.active} icon={UserCheck} tone="teal" />
        <KpiCard label="Inactive" value={kpi.inactive} icon={UserX} tone="taupe" />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center">
        <NativeSelect value={projectId} onChange={setProjectId} options={projectOptions} placeholder="All projects" className="lg:w-72" />
        <NativeSelect value={state} onChange={(v) => setState(v as typeof state)}
          options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} placeholder="Any status" className="lg:w-36" />
        <div className="lg:ml-auto"><SearchBox value={search} onChange={setSearch} placeholder="Name, email or department…" /></div>
      </div>

      {isLoading ? <Skeleton className="h-80 rounded-xl" /> : filtered.length === 0 ? (
        <EmptyState title="No records" text="Nobody matches this filter yet." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Collaborator</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.ID} className="cursor-pointer" onClick={() => setEditing(r)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-esg-gold/40 text-xs font-semibold">
                        {str(r.Colaborator?.DisplayName).split(" ").map((s) => s[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{str(r.Colaborator?.DisplayName) || "—"}</p>
                        <p className="truncate text-xs text-muted-foreground">{str(r.Colaborator?.Email)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{str(r.Department) || "—"}</TableCell>
                  <TableCell className="max-w-56 truncate">{str(r.Project) || "—"}</TableCell>
                  <TableCell className="max-w-64 truncate">{str(r.Activity) || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={r.Active ? "border-esg-teal/40 bg-esg-teal/10 text-esg-teal" : "text-muted-foreground"}>
                      {r.Active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && <AssistanceForm row={editing === "new" ? null : editing} projects={projectOptions} onClose={() => setEditing(null)} />}
    </div>
  );
}

function AssistanceForm({ row, projects, onClose }: { row: Row | null; projects: { value: string; label: string }[]; onClose: () => void }) {
  const save = useSave("assistance", "Record");
  const del = useDelete("assistance", "Record");
  const [f, setF] = useState({
    Project: row?.Project?.Id ? String(row.Project.Id) : "",
    Name: str(row?.Colaborator?.DisplayName),
    Email: str(row?.Colaborator?.Email),
    Department: str(row?.Department),
    Activity: str(row?.Activity),
    Active: row ? row.Active === true : true,
  });
  const set = (k: keyof typeof f) => (v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  function submit() {
    save.mutate({
      id: row?.ID,
      values: {
        Project: toLookup(Number(f.Project) || null, projects.find((p) => p.value === f.Project)?.label),
        Colaborator: toPerson(f.Email, f.Name),
        Department: f.Department,
        Activity: f.Activity,
        Active: f.Active,
      },
    }, { onSuccess: onClose });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? "Edit participation" : "Add collaborator"}</DialogTitle>
          <DialogDescription>Link a collaborator to a project activity.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project" className="sm:col-span-2"><NativeSelect value={f.Project} onChange={set("Project")} options={projects} /></Field>
          <Field label="Collaborator name"><Input value={f.Name} onChange={(e) => set("Name")(e.target.value)} /></Field>
          <Field label="Collaborator email" required><Input type="email" value={f.Email} onChange={(e) => set("Email")(e.target.value)} placeholder="name@msc.com" /></Field>
          <Field label="Department" className="sm:col-span-2"><Input value={f.Department} onChange={(e) => set("Department")(e.target.value)} /></Field>
          <Field label="Activity" className="sm:col-span-2"><Textarea rows={3} value={f.Activity} onChange={(e) => set("Activity")(e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox checked={f.Active} onCheckedChange={(v) => set("Active")(v === true)} /> Active collaborator
          </label>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {row ? (
            <Button variant="ghost" className="text-red-600 hover:text-red-700"
              onClick={() => { if (confirm("Delete this record?")) del.mutate(row.ID!, { onSuccess: onClose }); }}>
              <Trash2 className="size-4" /> Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending || !f.Email} className="bg-esg-teal hover:bg-esg-teal/90">Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
