/**
 * Helpers para leer/escribir campos de SharePoint desde los servicios generados
 * por `pac code add-data-source`.
 *
 * SharePoint devuelve:
 *  - Texto / número / fecha  -> valor plano
 *  - Choice                  -> { Value: "In Progress" }
 *  - Lookup                  -> { Id: 12, Value: "Nombre del proyecto" }
 *  - Persona                 -> { DisplayName, Email, Claims, ... }
 *
 * Todo el código de las páginas usa estos helpers, así si algo del modelo
 * generado es distinto solo se corrige aquí.
 */

type AnyRec = Record<string, unknown>;

/** Lee cualquier campo como texto (plano, choice, lookup, persona o arreglo). */
export function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(str).filter(Boolean).join("; ");
  if (typeof v === "object") {
    const o = v as AnyRec;
    return str(o.Value ?? o.DisplayName ?? o.Title ?? o.Email ?? "");
  }
  return "";
}

/** Lee un número (acepta strings "12", null, etc.). */
export function num(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : Number(str(v));
  return Number.isFinite(n) ? n : 0;
}

/** Id de un campo lookup. */
export function lookupId(v: unknown): number | undefined {
  if (v && typeof v === "object" && "Id" in (v as AnyRec)) {
    const id = Number((v as AnyRec).Id);
    return Number.isFinite(id) ? id : undefined;
  }
  return undefined;
}

/** Email de un campo persona. */
export function personEmail(v: unknown): string {
  if (v && typeof v === "object") return str((v as AnyRec).Email).toLowerCase();
  return "";
}

/* ---------- Escritura ---------- */

const REF = "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference";
const USER = "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser";

/** Valor para escribir en una columna Choice. */
export function toChoice(value: string | undefined | null) {
  if (!value) return null;
  return { "@odata.type": REF, Value: value };
}

/** Valor para escribir en una columna Lookup. */
export function toLookup(id: number | undefined | null, value = "") {
  if (!id) return null;
  return { "@odata.type": REF, Id: id, Value: value };
}

/** Valor para escribir en una columna Persona. */
export function toPerson(email: string | undefined | null, displayName = "") {
  if (!email) return null;
  return {
    "@odata.type": USER,
    Claims: `i:0#.f|membership|${email.toLowerCase()}`,
    DisplayName: displayName,
    Email: email,
  };
}

/** Fecha ISO (yyyy-mm-dd) para inputs type="date". */
export function toDateInput(v: unknown): string {
  const s = str(v);
  return s ? s.slice(0, 10) : "";
}

/** Formatos */
export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
export const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n);
export const fmtDate = (v: unknown) => {
  const s = str(v);
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** Búsqueda insensible a mayúsculas/acentos sobre varios campos. */
export function matches(search: string, ...fields: unknown[]) {
  const q = normalize(search);
  if (!q) return true;
  return fields.some((f) => normalize(str(f)).includes(q));
}
const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
