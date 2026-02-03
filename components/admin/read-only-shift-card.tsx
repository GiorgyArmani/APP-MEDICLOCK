"use client"

import type { Shift, Doctor } from "@/lib/supabase/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"
import { SHIFT_TYPES } from "@/lib/constants/shift-types"

interface ReadOnlyShiftCardProps {
    shift: Shift
    doctors: Doctor[]
}

export function ReadOnlyShiftCard({ shift, doctors }: ReadOnlyShiftCardProps) {
    const statusColors = {
        new: "bg-blue-100 text-blue-800 border-blue-200",
        free: "bg-cyan-100 text-cyan-800 border-cyan-200",
        confirmed: "bg-green-100 text-green-800 border-green-200",
        rejected: "bg-red-100 text-red-800 border-red-200",
        free_pending: "bg-amber-100 text-amber-800 border-amber-200",
    }

    const areaColors = {
        consultorio: "bg-blue-50 text-blue-700 border-blue-200",
        internacion: "bg-emerald-50 text-emerald-700 border-emerald-200",
        refuerzo: "bg-orange-50 text-orange-700 border-orange-200",
        completo: "bg-purple-50 text-purple-700 border-purple-200",
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00")
        return date.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    }

    const shiftTypeInfo = SHIFT_TYPES.find((st) => st.value === shift.shift_category)
    const shiftLabel = shiftTypeInfo?.label || shift.shift_category

    const assignedDoctor = shift.doctor_id ? doctors.find((d) => d.id === shift.doctor_id) : null

    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-slate-900">{shiftLabel}</h3>
                            <Badge className={statusColors[shift.status as keyof typeof statusColors]}>
                                {shift.status === "new"
                                    ? "Nueva"
                                    : shift.status === "free"
                                        ? "Libre"
                                        : shift.status === "confirmed"
                                            ? "Confirmada"
                                            : shift.status === "rejected"
                                                ? "Rechazada"
                                                : "Pendiente +12h"}
                            </Badge>
                            <Badge variant="outline">
                                {shift.shift_type === "assigned" ? "Asignada" : "Libre"}
                            </Badge>
                        </div>
                        {assignedDoctor && (
                            <p className="text-sm text-slate-600">
                                <span className="font-medium text-slate-900">Médico:</span> {assignedDoctor.full_name}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <Badge className={areaColors[shift.shift_area as keyof typeof areaColors]}>
                            {shift.shift_area === "consultorio"
                                ? "Consultorio"
                                : shift.shift_area === "internacion"
                                    ? "Internación"
                                    : shift.shift_area === "refuerzo"
                                        ? "Refuerzo"
                                        : "Completo"}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-900">{shift.shift_hours}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{formatDate(shift.shift_date)}</span>
                    </div>
                </div>

                {(shift.clock_in || shift.clock_out) && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 mb-4">
                        <div className="text-xs">
                            <span className="font-semibold text-emerald-700 block uppercase mb-1">Entrada Real</span>
                            <span className="text-slate-900 font-medium">
                                {shift.clock_in ? new Date(shift.clock_in).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "-"}
                            </span>
                        </div>
                        <div className="text-xs">
                            <span className="font-semibold text-blue-700 block uppercase mb-1">Salida Real</span>
                            <span className="text-slate-900 font-medium">
                                {shift.clock_out ? new Date(shift.clock_out).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "-"}
                            </span>
                        </div>
                    </div>
                )}

                {shift.notes && (
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Notas Administrativas</p>
                        <p className="text-sm text-slate-700">{shift.notes}</p>
                    </div>
                )}

                {shift.doctor_notes && (
                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 uppercase font-bold mb-1">Notas del Médico</p>
                        <p className="text-sm text-slate-700">{shift.doctor_notes}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
