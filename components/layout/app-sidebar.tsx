"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "@/lib/actions/auth"
import type { Doctor } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Calendar, LayoutDashboard, Clock, Users, LogOut, Menu } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useSidebar } from "@/contexts/sidebar-context"

interface AppSidebarProps {
    doctor: Doctor
}

export function AppSidebar({ doctor }: AppSidebarProps) {
    const pathname = usePathname()
    const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
    const isAdmin = doctor.role === "administrator"

    const navItems = isAdmin
        ? [
            { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
            { href: "/admin/calendar", label: "Calendario", icon: Calendar },
            { href: "/admin/my-shifts", label: "Mis Guardias", icon: Clock },
            { href: "/admin/doctors", label: "Médicos", icon: Users },
        ]
        : [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/dashboard/calendar", label: "Calendario", icon: Calendar },
            { href: "/dashboard/shifts", label: "Guardias", icon: Users },
            { href: "/dashboard/availability", label: "Disponibilidad", icon: Clock },
        ]

    const handleLogout = async () => {
        await signOut()
    }

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-200"
                aria-label="Toggle menu"
            >
                <Menu className="h-6 w-6 text-slate-900" />
            </button>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-full bg-slate-900 text-white flex flex-col transition-all duration-300 z-40",
                    isCollapsed ? "w-20" : "w-64",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >

                {/* Navigation - Offset by header height */}
                <nav className="flex-1 p-4 pt-20 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                                    isCollapsed && "justify-center"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Icon className="h-5 w-5" />
                                {!isCollapsed && <span className="font-medium">{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Collapse Toggle Button (Desktop only) */}
                <div className="hidden lg:block p-4 border-t border-slate-800">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full gap-3 text-slate-300 hover:bg-slate-800 hover:text-white",
                            isCollapsed ? "justify-center" : "justify-start"
                        )}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expandir" : "Contraer"}
                    >
                        {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                        {!isCollapsed && <span>Contraer</span>}
                    </Button>
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-slate-800">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full gap-3 text-slate-300 hover:bg-slate-800 hover:text-white",
                            isCollapsed ? "justify-center" : "justify-start"
                        )}
                        onClick={handleLogout}
                        title={isCollapsed ? "Cerrar sesión" : undefined}
                    >
                        <LogOut className="h-5 w-5" />
                        {!isCollapsed && <span>Cerrar sesión</span>}
                    </Button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    )
}
