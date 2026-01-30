"use client"

import { useState } from "react"
import type { Doctor, Shift } from "@/lib/supabase/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Calendar, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShiftsCalendar } from "@/components/dashboard/shifts-calendar"

interface DoctorsGridProps {
    doctors: Doctor[]
    shifts: Shift[]
}

export function DoctorsGrid({ doctors, shifts }: DoctorsGridProps) {
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const roleLabels = {
        internacion: "Internación",
        consultorio: "Consultorio",
        completo: "Completo",
        administrator: "Administrador",
    }

    const roleColors = {
        internacion: "bg-blue-100 text-blue-800",
        consultorio: "bg-green-100 text-green-800",
        completo: "bg-purple-100 text-purple-800",
        administrator: "bg-red-100 text-red-800",
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {doctors.map((doctor) => (
                    <Card
                        key={doctor.id}
                        className="hover:shadow-md transition-shadow cursor-pointer hover:border-slate-400"
                        onClick={() => handleDoctorClick(doctor)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="h-4 w-4 text-slate-600" />
                                        </div>
                                        <CardTitle className="text-lg">{doctor.full_name}</CardTitle>
                                    </div>
                                    <Badge className={roleColors[doctor.role as keyof typeof roleColors]}>
                                        {roleLabels[doctor.role as keyof typeof roleLabels]}
                                    </Badge>
                                </div>
                                <Calendar className="h-5 w-5 text-slate-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">{doctor.email}</span>
                            </div>
                            {doctor.phone_number && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone className="h-4 w-4" />
                                    <span>{doctor.phone_number}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t flex justify-between items-center">
                                <p className="text-xs text-slate-500">
                                    Registrado: {new Date(doctor.created_at).toLocaleDateString("es-ES")}
                                </p>
                                <div className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                    {shifts.filter(s => s.doctor_id === doctor.id).length} guardias
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

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
