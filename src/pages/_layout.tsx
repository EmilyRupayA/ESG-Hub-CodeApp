/**
 * Layout principal: barra lateral fija (escritorio) / menú desplegable (móvil)
 * + barra superior con usuario y modo oscuro. Reemplaza el componente Header del Canvas.
 */
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FolderKanban, CalendarCheck, HandHelping, Home, Settings, Menu, X,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-user";
import esgLogo from "@/assets/esg-hub.png";
import logoMsc from "@/assets/logo-msc.gif";
import logoMedlog from "@/assets/logo-medlog.gif";

type NavItem = { to: string; label: string; icon: typeof Home; end?: boolean };

export const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/monthly-tracking", label: "Monthly Tracking", icon: CalendarCheck },
  { to: "/assistance", label: "Assistance", icon: HandHelping },
];
const ADMIN: NavItem = { to: "/admin", label: "Admin Panel", icon: Settings };

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const { pathname } = useLocation();
  const current = [...NAV, ADMIN].find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));

  const links = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((n) => <SideLink key={n.to} {...n} onClick={() => setOpen(false)} />)}
      <div className="mt-auto border-t pt-3">
        <SideLink {...ADMIN} onClick={() => setOpen(false)} />
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-muted/40">
      {/* Sidebar escritorio */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <Brand />
        {links}
      </aside>

      {/* Sidebar móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <button onClick={() => setOpen(false)} className="rounded p-2 hover:bg-muted" aria-label="Close menu"><X className="size-5" /></button>
            </div>
            {links}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur">
          <button onClick={() => setOpen(true)} className="rounded p-2 hover:bg-muted lg:hidden" aria-label="Open menu"><Menu className="size-5" /></button>
          <span className="font-medium">{current?.label ?? "ESG Hub"}</span>
          <div className="ml-auto flex items-center gap-3">
            <img src={logoMsc} alt="MSC" className="hidden h-5 sm:block" />
            <img src={logoMedlog} alt="MEDLOG" className="hidden h-4 sm:block" />
            <ModeToggle />
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-full bg-esg-navy text-xs font-semibold text-white">{user?.initials ?? "…"}</div>
              <span className="hidden text-sm md:block">{user?.fullName}</span>
            </div>
          </div>
        </header>
        {/* Franja dorada de marca */}
        <div className="h-1 bg-gradient-to-r from-esg-navy via-esg-gold to-esg-teal" />

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <img src={esgLogo} alt="" className="size-10" />
      <div className="leading-tight">
        <p className="font-semibold text-esg-navy dark:text-foreground">ESG Hub</p>
        <p className="text-xs text-muted-foreground">Sustainability platform</p>
      </div>
    </div>
  );
}

function SideLink({ to, label, icon: Icon, end, onClick }: NavItem & { onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive ? "bg-esg-navy text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  );
}
