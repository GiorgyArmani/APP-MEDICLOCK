"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "@/lib/actions/auth"
import type { Doctor } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, LayoutDashboard, Clock, Users, LogOut, Menu } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
    doctor: Doctor
}

export function AppSidebar({ doctor }: AppSidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const isAdmin = doctor.role === "administrator"

    const roleLabels = {
        internacion: "Internación",
        consultorio: "Consultorio",
        completo: "Completo",
        administrator: "Administrador",
    }

    const navItems = isAdmin
        ? [
            { href: "/admin", label: "Panel", icon: LayoutDashboard },
            { href: "/admin/calendar", label: "Calendario", icon: Calendar },
            { href: "/admin/doctors", label: "Médicos", icon: Users },
        ]
        : [
            { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
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
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-200"
                aria-label="Toggle menu"
            >
                <Menu className="h-6 w-6 text-slate-900" />
            </button>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-full bg-slate-900 text-white w-64 flex flex-col transition-transform duration-300 z-40",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Image
                                src="/logo.png"
                                alt="Medi Clock Logo"
                                width={24}
                                height={24}
                                className="h-6 w-6 text-white"
                            />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Medi Clock</h2>
                            <p className="text-xs text-slate-400">Gestión de Guardias</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium truncate">{doctor.full_name}</p>
                        <p className="text-xs text-slate-400 truncate">{doctor.email}</p>
                        <Badge variant="secondary" className="text-xs">
                            {roleLabels[doctor.role]}
                        </Badge>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-slate-800">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5" />
                        Cerrar sesión
                    </Button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    )
}
