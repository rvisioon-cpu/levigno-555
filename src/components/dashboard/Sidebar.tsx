"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building,
  Image as ImageIcon,
  BookOpen,
  Hammer,
  Palette,
  Settings,
  Map as MapIcon,
  Video,
  Route,
  MonitorPlay,
  Box,
  Calendar,
  History,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const navigation = [
    { name: "Métricas", href: "/dashboard", icon: LayoutDashboard, visible: true },
    { name: "Calendario", href: "/dashboard/calendar", icon: Calendar, visible: true },
    { name: "Contenido", href: "/dashboard/content", icon: FileText, visible: isAdmin },
    { name: "Usuarios", href: "/dashboard/users", icon: Users, visible: isAdmin },
    { name: "Unidades", href: "/dashboard/units", icon: Building, visible: true },
    { name: "Multimedia", href: "/dashboard/media", icon: ImageIcon, visible: true },
    { name: "Galerías", href: "/dashboard/galleries", icon: ImageIcon, visible: isSuperAdmin },
    { name: "Brochure", href: "/dashboard/brochure", icon: BookOpen, visible: true },
    { name: "Avances de Obra", href: "/dashboard/progress", icon: Hammer, visible: isAdmin },
    { name: "Identidad", href: "/dashboard/identity", icon: Palette, visible: isSuperAdmin },
    { name: "Features", href: "/dashboard/features", icon: Settings, visible: isSuperAdmin },
    { name: "Mapa", href: "/dashboard/map", icon: MapIcon, visible: isSuperAdmin },
    { name: "El Edificio", href: "/dashboard/building", icon: Building, visible: isSuperAdmin },
    { name: "Recorridos", href: "/dashboard/tours", icon: Route, visible: isSuperAdmin },
    { name: "Video y Amenidades", href: "/dashboard/video-amenities", icon: Video, visible: isSuperAdmin },
    { name: "Maqueta", href: "/dashboard/maqueta", icon: Box, visible: isSuperAdmin },
    { name: "Logs (Restaurar)", href: "/dashboard/logs", icon: History, visible: isSuperAdmin },
  ];

  return (
    <div className={`${isCollapsed ? "w-[72px]" : "w-64"} bg-livigno-teal text-livigno-sand shadow-md flex flex-col h-full transition-[width] duration-200`}>
      <div className={`${isCollapsed ? "justify-center px-2" : "px-6"} h-[72px] border-b border-white/15 flex items-center gap-3`}>
        {!isCollapsed && (
          <img
            src="/identity/livigno-logo-tight.png"
            alt="Livigno 555"
            className="h-8 w-[142px] object-contain object-left"
          />
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed((previous) => !previous)}
          className={`${isCollapsed ? "" : "ml-auto"} btn btn-ghost btn-sm btn-square text-livigno-sand hover:bg-white/10 hover:text-livigno-gold`}
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="menu w-full bg-transparent text-livigno-sand">
          {navigation.map(
            (item) =>
              item.visible && (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3 px-4"} py-2 text-livigno-sand hover:bg-white/10 hover:text-white ${
                      pathname === item.href ? "active font-bold !text-livigno-teal !bg-livigno-gold hover:!bg-livigno-gold" : ""
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              )
          )}
        </ul>
      </div>
    </div>
  );
}
