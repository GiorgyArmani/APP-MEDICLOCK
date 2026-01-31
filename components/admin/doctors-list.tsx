"use client"

import { useState } from "react"
import type { Doctor, Shift } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, User, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShiftsCalendar } from "@/components/dashboard/shifts-calendar"

interface DoctorsListProps {
  doctors: Doctor[]
  shifts: Shift[]
}

export function DoctorsList({ doctors, shifts }: DoctorsListProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "administrator":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100"
      case "doctor":
      default:
        return "bg-blue-100 text-blue-700 hover:bg-blue-100"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "administrator":
        return "Administrador"
      case "doctor":
        return "Médico"
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

  const handleDoctorClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setIsModalOpen(true)
  }

  const filteredShifts = selectedDoctor
    ? shifts.filter((s) => s.doctor_id === selectedDoctor.id)
    : []

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Médicos Registrados</CardTitle>
          <CardDescription>Lista de todos los médicos en el sistema. Haz clic en un médico para ver su calendario.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {doctors.map((doctor) => {
              const stats = getDoctorStats(doctor.id)
              return (
                <Card
                  key={doctor.id}
                  className="cursor-pointer hover:border-slate-400 transition-colors"
                  onClick={() => handleDoctorClick(doctor)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between">
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
                          <div className="text-slate-400">
                            <Calendar className="h-5 w-5" />
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
                            <span className="text-slate-600">Rechazadas: </span>
                            <span className="font-semibold text-red-600">{doctor.rejected_count || 0}</span>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] w-[1200px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-slate-700" />
              Calendario de {selectedDoctor?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ShiftsCalendar shifts={filteredShifts} doctors={doctors} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
