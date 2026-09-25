/**
 * Usuario actual (equivalente a User().FullName / Office365Users.MyProfile()).
 * Usa el contexto del host de Power Apps; en local (npm run dev sin host) devuelve "Guest".
 */
import { useQuery } from "@tanstack/react-query";
import { getContext } from "@microsoft/power-apps/app";

export type CurrentUser = { fullName: string; email: string; initials: string };

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    staleTime: Infinity,
    queryFn: async (): Promise<CurrentUser> => {
      try {
        const ctx = await getContext();
        const fullName = ctx?.user?.fullName ?? "Guest";
        const email = ctx?.user?.userPrincipalName ?? "";
        return { fullName, email, initials: initials(fullName) };
      } catch {
        return { fullName: "Guest", email: "", initials: "G" };
      }
    },
  });
}

const initials = (n: string) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
