"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateShiftStatus, acceptFreeShift, clockIn, clockOut, saveDoctorNotes } from "@/lib/actions/shifts"
import { cancelShift } from "@/lib/actions/cancel-shift"
import { SHIFT_TYPES } from "@/lib/constants/shift-types"
import type { Shift } from "@/lib/supabase/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, CheckCircle2, XCircle, Users, AlertCircle, MapPin } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ShiftCardProps {
  shift: Shift
  doctorId: string
}

export function ShiftCard({ shift, doctorId }: ShiftCardProps) {
  const [isPending, startTransition] = useTransition()
  const [doctorNotes, setDoctorNotes] = useState(shift.doctor_notes || "")
  const router = useRouter()

  const handleStatusUpdate = async (status: "confirmed" | "rejected") => {
    startTransition(async () => {
      const result = await updateShiftStatus(shift.id, status, doctorId)
      if (result.error) {
        toast.error(`Error: ${result.error}`)
      } else {
        toast.success(status === "confirmed" ? "Guardia confirmada" : "Guardia rechazada")
        router.refresh()
      }
    })
  }

  const handleRejectToFree = async () => {
    startTransition(async () => {
      const result = await updateShiftStatus(shift.id, "free")
      if (result.error) {
        toast.error(`Error: ${result.error}`)
      } else {
        toast.success("Guardia liberada")
        router.refresh()
      }
    })
  }

  const handleAcceptFreeShift = async () => {
    startTransition(async () => {
      const result = await acceptFreeShift(shift.id, doctorId)
      if (result.error) {
        toast.error(`Error: ${result.error}`)
      } else {
        toast.success("Guardia aceptada exitosamente")
        router.refresh()
      }
    })
  }

  const handleCancelShift = async () => {
    startTransition(async () => {
      const result = await cancelShift(shift.id)
      if (result.error) {
        toast.error(`Error: ${result.error}`)
      } else {
        toast.success("Guardia cancelada y liberada para otros médicos")
        router.refresh()
      }
    })
  }

  const handleClockIn = async () => {
    startTransition(async () => {
      const result = await clockIn(shift.id, doctorId)
      if (result.error) {
        toast.error(`Error: ${result.error}`)
      } else {
        toast.success("Entrada registrada exitosamente")
        router.refresh()
      }
    })
  }

  const handleClockOut = async () => {
    startTransition(async () => {
      const result = await clockOut(shift.id, doctorId)
      if (result.error) {
        toast.error(`Error: ${result.error}`)
      } else {
        toast.success("Salida registrada exitosamente")
        router.refresh()
      }
    })
  }

  const handleSaveNotes = async () => {
    startTransition(async () => {
      const result = await saveDoctorNotes(shift.id, doctorId, doctorNotes)
      if (result.error) {
        toast.error(`Error: ${result.error}`)
      } else {
        toast.success("Notas guardadas correctamente")
        router.refresh()
      }
    })
  }

  const statusColors = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    free: "bg-cyan-100 text-cyan-800 border-cyan-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    free_pending: "bg-amber-100 text-amber-800 border-amber-200",
  }

  const typeColors = {
    assigned: "bg-purple-100 text-purple-800 border-purple-200",
    free: "bg-cyan-100 text-cyan-800 border-cyan-200",
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

  const canAcceptFreeShift = (shift.status === "free" || shift.status === "free_pending")
  const isAssignedToMe = shift.doctor_id === doctorId

  return (
    <Card
      id={`shift-${shift.id}`}
      className={cn(
        "transition-all duration-200",
        "hover:shadow-md transition-shadow"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-lg font-semibold text-slate-900">{shiftLabel}</h3>
              <Badge className={statusColors[shift.status]}>
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
              <Badge className={typeColors[shift.shift_type]}>
                {shift.shift_type === "free" && <Users className="h-3 w-3 mr-1" />}
                {shift.shift_type === "assigned" ? "Asignada" : "Libre"}
              </Badge>
              {shift.status === "free_pending" && (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  12+ horas
                </Badge>
              )}
              {(() => {
                const today = new Date()
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
                return shift.shift_date === todayStr && (
                  <Badge className="bg-emerald-600 text-white border-emerald-700 shadow-sm animate-pulse">
                    HOY
                  </Badge>
                )
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
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
            <span className="font-medium">{shift.shift_hours}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>{formatDate(shift.shift_date)}</span>
          </div>
        </div>

        {shift.notes && (
          <div className="mb-4 p-3 bg-slate-50 rounded-md">
            <p className="text-sm text-slate-700">
              <span className="font-medium">Notas:</span> {shift.notes}
            </p>
          </div>
        )}

        {shift.status === "new" && shift.shift_type === "assigned" && isAssignedToMe && (
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={() => handleStatusUpdate("confirmed")}
              disabled={isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
            <Button onClick={handleRejectToFree} disabled={isPending} variant="destructive" className="flex-1">
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar (Liberar)
            </Button>
          </div>
        )}

        {shift.status === "confirmed" && isAssignedToMe && (
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
            {/* Clock In / Out Logic */}
            {!shift.clock_in && (
              // Simple logic: Allow clock in if confirmed. 
              // Ideally check date, but backend does loose check. UI can be strict or loose.
              // Let's simple check if it's today or generally allowed.
              <Button
                onClick={handleClockIn}
                disabled={isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Clock className="h-4 w-4 mr-2" />
                Marcar Entrada (Check-In)
              </Button>
            )}

            {shift.clock_in && !shift.clock_out && (
              <div className="space-y-2">
                <div className="text-sm text-center text-emerald-700 font-medium bg-emerald-50 p-2 rounded">
                  Entrada: {new Date(shift.clock_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <Button
                  onClick={handleClockOut}
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Marcar Salida (Check-Out)
                </Button>
              </div>
            )}

            {shift.clock_in && shift.clock_out && (
              <div className="grid grid-cols-2 gap-2 text-sm text-center bg-slate-50 p-2 rounded">
                <div className="text-emerald-700">
                  <span className="block text-xs font-semibold uppercase">Entrada</span>
                  {new Date(shift.clock_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-blue-700">
                  <span className="block text-xs font-semibold uppercase">Salida</span>
                  {new Date(shift.clock_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}

            <div className="pt-2 pb-2">
              <Label htmlFor={`notes-${shift.id}`} className="text-sm font-medium mb-2 block">Mis Notas del Turno</Label>
              <Textarea
                id={`notes-${shift.id}`}
                placeholder="Escriba aquí notas sobre el turno, pacientes, novedades..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="mb-2 bg-white"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={isPending}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Guardar Notas
              </Button>
            </div>

            <Button
              onClick={handleCancelShift}
              disabled={isPending}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Guardia
            </Button>
          </div>
        )}

        {canAcceptFreeShift && (
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={handleAcceptFreeShift}
              disabled={isPending}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aceptar Esta Guardia
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
