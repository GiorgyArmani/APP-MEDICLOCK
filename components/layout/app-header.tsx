"use client"

import Link from "next/link"
import Image from "next/image"
import { NotificationBell } from "@/components/layout/notification-bell"
import { Badge } from "@/components/ui/badge"
import type { Doctor } from "@/lib/supabase/types"
import { useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
    doctor?: Doctor
}

const roleLabels: Record<string, string> = {
    doctor: "Médico",
    administrator: "Administrador",
    honorarios: "Honorarios",
}

export function AppHeader({ doctor }: AppHeaderProps) {
    const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
    const dashboardLink = doctor?.role === "administrator"
        ? "/admin"
        : doctor?.role === "honorarios"
            ? "/honorarios"
            : "/dashboard"

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white border-b border-slate-800 z-50 transition-all duration-300"
            )}
        >
            <div className="h-full px-4 flex items-center justify-between">
                {/* App Name/Logo - Link to dashboard on desktop, Toggle sidebar on mobile */}
                <div className="flex items-center gap-3">
                    <Link
                        href={dashboardLink}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity hidden lg:flex"
                    >
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
                            <h1 className="font-bold text-lg">Medi Clock</h1>
                            <p className="text-xs text-slate-400 hidden sm:block">Gestión de Guardias</p>
                        </div>
                    </Link>

                    {/* Mobile version (trigger) */}
                    <div
                        className="flex items-center gap-3 cursor-pointer lg:hidden"
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                    >
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
                            <h1 className="font-bold text-lg">Medi Clock</h1>
                            <p className="text-xs text-slate-400 hidden sm:block">Gestión de Guardias</p>
                        </div>
                    </div>
                </div>

                {/* Right side: User Info and Notifications */}
                <div className="flex items-center gap-6">
                    {doctor && (
                        <>
                            <div className="hidden md:flex flex-col items-end">
                                <p className="text-sm font-medium leading-none mb-1">{doctor.full_name}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-400 truncate max-w-[150px]">{doctor.email}</p>
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0 bg-slate-800 text-slate-300 border-slate-700">
                                        {roleLabels[doctor.role]}
                                    </Badge>
                                </div>
                            </div>
                            <NotificationBell doctorId={doctor.id} />
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
