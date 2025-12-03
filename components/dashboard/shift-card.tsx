"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateShiftStatus, acceptFreeShift } from "@/lib/actions/shifts"
import { cancelShift } from "@/lib/actions/cancel-shift"
import { SHIFT_TYPES } from "@/lib/constants/shift-types"
import type { Shift } from "@/lib/supabase/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle2, XCircle, Users, AlertCircle, MapPin } from "lucide-react"
import { toast } from "sonner"

interface ShiftCardProps {
  shift: Shift
  doctorId: string
}

export function ShiftCard({ shift, doctorId }: ShiftCardProps) {
  const [isPending, startTransition] = useTransition()
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
        toast.success("Guardia liberada al pool")
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
    <Card className="hover:shadow-md transition-shadow">
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

        {shift.shift_type === "free" && shift.assigned_to_pool && (
          <div className="mb-4 p-3 bg-cyan-50 rounded-md border border-cyan-200">
            <p className="text-sm text-cyan-900">
              <span className="font-medium">Disponible para:</span>{" "}
              {shift.assigned_to_pool
                .map((role) => {
                  if (role === "internacion") return "Internación"
                  if (role === "consultorio") return "Consultorio"
                  if (role === "completo") return "Completo"
                  return role
                })
                .join(", ")}
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
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={handleCancelShift}
              disabled={isPending}
              variant="outline"
              className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
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
