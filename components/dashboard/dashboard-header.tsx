"use client"

import { signOut } from "@/lib/actions/auth"
import type { Doctor } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, LogOut } from "lucide-react"

interface DashboardHeaderProps {
  doctor: Doctor
}

export function DashboardHeader({ doctor }: DashboardHeaderProps) {
  const roleLabels = {
    internacion: "Internación",
    consultorio: "Consultorio",
    completo: "Completo",
    administrator: "Administrador",
    honorarios: "Honorarios",
    doctor: "Médico",
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Panel de Guardias</h2>
            <p className="text-sm text-slate-600">{doctor.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            {roleLabels[doctor.role]}
          </Badge>
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </header>
  )
}
