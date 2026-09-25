/**
 * Capa de datos: un hook de React Query por lista de SharePoint.
 * Las páginas nunca llaman a los servicios generados directamente.
 *
 * ⚠️ Referentials: esta lista aún no está en tu carpeta src/generated.
 *    Agrégala con `pac code add-data-source` (ver GUIA.md) y descomenta
 *    las líneas marcadas con [REFERENTIALS].
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProjectsService } from "@/generated/services/ProjectsService";
import { MonthlyTrackingService } from "@/generated/services/MonthlyTrackingService";
import { AssistanceService } from "@/generated/services/AssistanceService";
import { ReferentialsService } from "@/generated/services/ReferentialsService"; // [REFERENTIALS]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any> & { ID?: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Service = any;

/** Normaliza la respuesta { data, error } de los servicios generados. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "error" in res && res.error) {
    throw new Error(res.error?.message ?? String(res.error));
  }
  return (res && typeof res === "object" && "data" in res ? res.data : res) as T;
}

const LISTS = {
  projects: ProjectsService as Service,
  tracking: MonthlyTrackingService as Service,
  assistance: AssistanceService as Service,
  referentials: ReferentialsService as Service,
};
export type ListKey = keyof typeof LISTS;

/* ---------------- Lectura ---------------- */

export function useList(key: ListKey) {
  return useQuery({
    queryKey: [key],
    enabled: !!LISTS[key],
    staleTime: 60_000,
    queryFn: async () => {
      const res = await LISTS[key].getAll({ top: 5000 });
      return unwrap<Row[]>(res) ?? [];
    },
  });
}

export const useProjects = () => useList("projects");
export const useTracking = () => useList("tracking");
export const useAssistance = () => useList("assistance");
export const useReferentials = () => useList("referentials");

/** Opciones de un combo desde Referentials (Category = X), ordenadas y sin duplicados. */
export function useRefOptions(category: string, fallback: string[] = []) {
  const { data } = useReferentials();
  if (!data?.length) return fallback;
  const rows = data.filter((r) => r.Category === category || r.Category?.Value === category);
  const sorted = [...rows].sort((a, b) => (Number(a.Order ?? 0) - Number(b.Order ?? 0)) || String(a.Title).localeCompare(String(b.Title)));
  return Array.from(new Set(sorted.map((r) => String(r.Title ?? "")).filter(Boolean)));
}

/* ---------------- Escritura ---------------- */

export function useSave(key: ListKey, label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: number; values: Row }) => {
      const svc = LISTS[key];
      const res = id ? await svc.update(String(id), values) : await svc.create(values);
      return unwrap<Row>(res);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: [key] });
      toast.success(v.id ? `${label} updated` : `${label} created`);
    },
    onError: (e: Error) => toast.error(`Could not save: ${e.message}`),
  });
}

export function useDelete(key: ListKey, label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => unwrap(await LISTS[key].delete(String(id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
      toast.success(`${label} deleted`);
    },
    onError: (e: Error) => toast.error(`Could not delete: ${e.message}`),
  });
}

/**
 * Réplica del OnSuccess del formulario de proyectos en Canvas:
 * crea filas en Monthly Tracking hasta completar "# Planned Activities".
 */
export async function ensureTrackingRows(project: Row, planned: number) {
  if (!project?.ID || planned <= 0) return 0;
  const all = unwrap<Row[]>(await MonthlyTrackingService.getAll({ top: 5000 })) ?? [];
  const existing = all.filter((r) => r.ProjectName?.Id === project.ID).length;
  const missing = planned - existing;
  if (missing <= 0) return 0;

  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long" });
  for (let i = 0; i < missing; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (MonthlyTrackingService as Service).create({
      ProjectName: {
        "@odata.type": "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference",
        Id: project.ID,
        Value: project.Title ?? "",
      },
      Month: month,
      Year: now.getFullYear(),
    } as Row);
  }
  return missing;
}
