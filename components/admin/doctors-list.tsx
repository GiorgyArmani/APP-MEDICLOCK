"use client"

import type { Doctor, Shift } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, User } from "lucide-react"

interface DoctorsListProps {
  doctors: Doctor[]
  shifts: Shift[]
}

export function DoctorsList({ doctors, shifts }: DoctorsListProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "internacion":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100"
      case "consultorio":
        return "bg-green-100 text-green-700 hover:bg-green-100"
      case "completo":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100"
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-100"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "internacion":
        return "Internación"
      case "consultorio":
        return "Consultorio"
      case "completo":
        return "Completo"
      default:
        return role
    }
  }

  const getDoctorStats = (doctorId: string) => {
    const doctorShifts = shifts.filter((s) => s.doctor_id === doctorId)
    return {
      total: doctorShifts.length,
      confirmed: doctorShifts.filter((s) => s.status === "confirmed").length,
      pending: doctorShifts.filter((s) => s.status === "new").length,
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Médicos Registrados</CardTitle>
        <CardDescription>Lista de todos los médicos en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {doctors.map((doctor) => {
            const stats = getDoctorStats(doctor.id)
            return (
              <Card key={doctor.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{doctor.full_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="h-3 w-3" />
                            {doctor.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(doctor.role)}>{getRoleLabel(doctor.role)}</Badge>
                      </div>

                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-slate-600">Total guardias: </span>
                          <span className="font-semibold text-slate-900">{stats.total}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Confirmadas: </span>
                          <span className="font-semibold text-green-600">{stats.confirmed}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Pendientes: </span>
                          <span className="font-semibold text-amber-600">{stats.pending}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
