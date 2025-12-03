"use client"

import { useState } from "react"
import type { Shift } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShiftCard } from "./shift-card"

interface ShiftsCalendarProps {
  shifts: Shift[]
}

export function ShiftsCalendar({ shifts }: ShiftsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getShiftsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return shifts.filter((shift) => shift.shift_date === dateStr)
  }

  const handleDayClick = (day: number) => {
    const dayShifts = getShiftsForDay(day)
    if (dayShifts.length > 0) {
      setSelectedShifts(dayShifts)
      setSelectedDoctorId(dayShifts[0]?.doctor_id || "")
      setIsDialogOpen(true)
    }
  }

  const getStatusColor = (status: Shift["status"]) => {
    switch (status) {
      case "new":
        return "bg-orange-500 animate-pulse" // Naranja pulsante para guardias nuevas pendientes
      case "free":
        return "bg-purple-500" // Púrpura para guardias libres
      case "confirmed":
        return "bg-emerald-500" // Verde esmeralda para confirmadas
      case "rejected":
        return "bg-rose-500" // Rojo rosa para rechazadas
      case "free_pending":
        return "bg-amber-500 animate-pulse" // Ámbar pulsante para pendientes +12h
      default:
        return "bg-gray-500"
    }
  }

  const renderCalendarDays = () => {
    const days = []

    // Días vacíos antes del primer día del mes
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square p-2 border border-slate-200 bg-slate-50" />)
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dayShifts = getShiftsForDay(day)
      const hasShifts = dayShifts.length > 0
      const hasPendingShifts = dayShifts.some((s) => s.status === "new" || s.status === "free_pending")
      const isToday =
        day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={`aspect-square p-2 border transition-all ${hasShifts ? "cursor-pointer hover:shadow-md hover:scale-105" : ""
            } ${hasPendingShifts
              ? "border-orange-400 bg-orange-50 ring-2 ring-orange-200"
              : hasShifts
                ? "border-slate-300 bg-white hover:bg-slate-50"
                : "border-slate-200 bg-white"
            } ${isToday ? "ring-2 ring-blue-400" : ""}`}
        >
          <div className="flex flex-col h-full">
            <span
              className={`text-sm font-semibold ${isToday ? "text-blue-600" : hasPendingShifts ? "text-orange-700" : "text-slate-700"}`}
            >
              {day}
            </span>
            {hasShifts && (
              <div className="flex-1 mt-1 space-y-1 overflow-hidden">
                {dayShifts.slice(0, 3).map((shift) => (
                  <div
                    key={shift.id}
                    className={`text-xs px-2 py-1 rounded-md text-white font-medium truncate shadow-sm ${getStatusColor(shift.status)}`}
                  >
                    {shift.shift_hours}
                  </div>
                ))}
                {dayShifts.length > 3 && (
                  <div className="text-xs text-slate-600 font-medium px-2">+{dayShifts.length - 3} más</div>
                )}
              </div>
            )}
          </div>
        </div>,
      )
    }

    return days
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Calendario de Guardias</CardTitle>
              <CardDescription>
                Vista mensual de guardias
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[180px] text-center">
                <span className="text-lg font-bold text-slate-800">
                  {monthNames[month]} {year}
                </span>
              </div>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Estado de Guardias:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500 animate-pulse shadow-sm" />
                <span className="text-sm font-medium text-slate-700">Pendiente de Aceptar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500 shadow-sm" />
                <span className="text-sm font-medium text-slate-700">Libre (Pool)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500 shadow-sm" />
                <span className="text-sm font-medium text-slate-700">Confirmada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-rose-500 shadow-sm" />
                <span className="text-sm font-medium text-slate-700">Rechazada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500 animate-pulse shadow-sm" />
                <span className="text-sm font-medium text-slate-700">Pendiente +12h</span>
              </div>
            </div>
          </div>

          {/* Nombres de los días */}
          <div className="grid grid-cols-7 gap-0 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-bold text-slate-700 py-2 bg-slate-100 rounded-t">
                {day}
              </div>
            ))}
          </div>

          {/* Días del calendario */}
          <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
        </CardContent>
      </Card>

      {/* Dialog para mostrar guardias del día */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Guardias del día{" "}
              {selectedShifts[0]?.shift_date &&
                new Date(selectedShifts[0].shift_date + "T00:00:00").toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </DialogTitle>
            <DialogDescription>
              {selectedShifts.length} {selectedShifts.length === 1 ? "guardia" : "guardias"} programadas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedShifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} doctorId={selectedDoctorId} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
