"use client"

import { useState } from "react"
import type { Shift, Doctor } from "@/lib/supabase/types"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShiftCard } from "./shift-card"
import { AdminShiftCard } from "@/components/admin/admin-shift-card"
import { CalendarHeader } from "./calendar/calendar-header"
import { MonthView } from "./calendar/month-view"
import { WeekView } from "./calendar/week-view"
import { DayView } from "./calendar/day-view"
import { ShiftsFilter } from "@/components/admin/shifts-filter"

interface ShiftsCalendarProps {
  shifts: Shift[]
  doctors?: Doctor[] // Optional, only for admin view
  currentDoctor?: Doctor
}

export function ShiftsCalendar({ shifts, currentDoctor, ...props }: ShiftsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")

  // Filter State
  const [filterDoctorId, setFilterDoctorId] = useState<string>("all")
  const [filterArea, setFilterArea] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Dialog State
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filtering Logic
  const filteredShifts = shifts.filter((shift) => {
    const matchesDoctor = filterDoctorId === "all" || shift.doctor_id === filterDoctorId
    const matchesArea = filterArea === "all" || shift.shift_area === filterArea
    const matchesStatus = filterStatus === "all" || shift.status === filterStatus
    return matchesDoctor && matchesArea && matchesStatus
  })

  // Handlers
  const handleDayClick = (dayShifts: Shift[], date: Date) => {
    if (view === "month") {
      setCurrentDate(date)
      setView("day")
      return
    }

    if (dayShifts.length > 0) {
      setSelectedShifts(dayShifts)
      setSelectedDoctorId(dayShifts[0]?.doctor_id || "")
      setIsDialogOpen(true)
    }
  }

  const handleShiftClick = (shift: Shift) => {
    setSelectedShifts([shift])
    setSelectedDoctorId(shift.doctor_id || "")
    setIsDialogOpen(true)
  }

  const handleWeekDayClick = (date: Date) => {
    setCurrentDate(date)
    setView("day")
  }

  const clearFilters = () => {
    setFilterDoctorId("all")
    setFilterArea("all")
    setFilterStatus("all")
  }

  const hasFilters = filterDoctorId !== "all" || filterArea !== "all" || filterStatus !== "all"

  return (
    <>
      <Card className="shadow-lg min-h-[700px] flex flex-col">
        {/* Header Controller */}
        <CalendarHeader
          date={currentDate}
          view={view}
          onViewChange={setView}
          onDateChange={setCurrentDate}
          onToday={() => setCurrentDate(new Date())}
        />

        <CardContent className="pt-6 flex-1 space-y-6">
          {/* Admin Filters Row */}
          {props.doctors && (
            <ShiftsFilter
              doctors={props.doctors}
              filterDoctorId={filterDoctorId}
              setFilterDoctorId={setFilterDoctorId}
              filterArea={filterArea}
              setFilterArea={setFilterArea}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              onClear={clearFilters}
            />
          )}

          {/* View Legend */}
          <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100 lg:w-fit">
            <div className="flex flex-wrap gap-4">
              <StatusBadge color="bg-orange-500" label="Pendiente" />
              <StatusBadge color="bg-purple-500" label="Libre" />
              <StatusBadge color="bg-emerald-500" label="Confirmada" />
              <StatusBadge color="bg-rose-500" label="Rechazada" />
              <StatusBadge color="bg-amber-500" label="Pendiente +12h" />
            </div>
          </div>

          {/* Content Swapper */}
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              shifts={filteredShifts}
              onDayClick={handleDayClick}
            />
          )}

          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              shifts={filteredShifts}
              onDayClick={handleWeekDayClick}
              onShiftClick={handleShiftClick}
            />
          )}

          {view === "day" && (
            <DayView
              currentDate={currentDate}
              shifts={filteredShifts}
              onShiftClick={handleShiftClick}
            />
          )}

        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl capitalize">
              {selectedShifts.length > 0 &&
                new Date(selectedShifts[0].shift_date + "T00:00:00").toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              }
            </DialogTitle>
            <DialogDescription>
              {selectedShifts.length} {selectedShifts.length === 1 ? "guardia" : "guardias"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedShifts.map((shift) => (
              props.doctors ? (
                <AdminShiftCard key={shift.id} shift={shift} doctors={props.doctors} currentDoctor={currentDoctor} />
              ) : (
                <ShiftCard key={shift.id} shift={shift} doctorId={currentDoctor?.id || selectedDoctorId} />
              )
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function StatusBadge({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded ${color} shadow-sm`} />
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  )
}
