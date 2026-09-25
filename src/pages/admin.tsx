/**
 * Admin Panel: mantenedor de la lista Referentials (Category / Title / Order).
 * Estas opciones alimentan los combos de Projects (Scope of Action, Subarea, Company, Location).
 * Requiere agregar la lista Referentials como data source (ver GUIA.md).
 */
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState, Field, PageHeader, SearchBox } from "@/components/esg/ui-kit";
import { useDelete, useReferentials, useSave, type Row } from "@/hooks/use-lists";
import { matches, str } from "@/lib/sp";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { data: rows = [], isLoading, fetchStatus } = useReferentials();
  const del = useDelete("referentials", "Item");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  const categories = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(str(r.Category), (m.get(str(r.Category)) ?? 0) + 1));
    return [...m.entries()].filter(([c]) => c && matches(search, c)).sort(([a], [b]) => a.localeCompare(b));
  }, [rows, search]);
  const active = cat || categories[0]?.[0] || "";
  const items = rows.filter((r) => str(r.Category) === active)
    .sort((a, b) => Number(a.Order ?? 0) - Number(b.Order ?? 0) || str(a.Title).localeCompare(str(b.Title)));

  if (fetchStatus === "idle" && !isLoading && rows.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Panel" subtitle="Referential values used across the app." />
        <EmptyState title="Referentials list not connected" text="Add the SharePoint list 'Referentials' as a data source and enable it in src/hooks/use-lists.ts (see GUIA.md)." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        subtitle="Referential values used across the app."
        actions={<Button onClick={() => setEditing("new")} className="bg-esg-teal hover:bg-esg-teal/90"><Plus className="size-4" /> Add item</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3 rounded-xl border bg-card p-3">
          <SearchBox value={search} onChange={setSearch} placeholder="Search category" />
          <div className="space-y-1">
            {categories.map(([c, n]) => (
              <button key={c} onClick={() => setCat(c)}
                className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                  c === active ? "bg-esg-navy text-white" : "hover:bg-muted")}>
                <span className="flex items-center gap-2"><Tags className="size-4" />{c}</span>
                <span className={cn("rounded-full px-2 text-xs", c === active ? "bg-white/20" : "bg-muted")}>{n}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 font-medium">{active || "—"}</div>
          <ul className="divide-y">
            {items.map((r) => (
              <li key={r.ID} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-sm">{str(r.Title)}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(r)} aria-label="Edit"><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-red-600" aria-label="Delete"
                    onClick={() => confirm("Delete this item?") && del.mutate(r.ID!)}><Trash2 className="size-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {editing && <RefForm row={editing === "new" ? null : editing} defaultCategory={active} onClose={() => setEditing(null)} />}
    </div>
  );
}

function RefForm({ row, defaultCategory, onClose }: { row: Row | null; defaultCategory: string; onClose: () => void }) {
  const save = useSave("referentials", "Item");
  const [category, setCategory] = useState(str(row?.Category) || defaultCategory);
  const [title, setTitle] = useState(str(row?.Title));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{row ? "Edit item" : "New item"}</DialogTitle></DialogHeader>
        <Field label="Category" required><Input value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
        <Field label="Name" required><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!category || !title || save.isPending} className="bg-esg-teal hover:bg-esg-teal/90"
            onClick={() => save.mutate({ id: row?.ID, values: { Category: category.trim(), Title: title.trim() } }, { onSuccess: onClose })}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
