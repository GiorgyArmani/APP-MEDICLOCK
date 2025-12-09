"use client"

import { useState } from "react"
import type { Shift } from "@/lib/supabase/types"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShiftCard } from "./shift-card"
import { CalendarHeader } from "./calendar/calendar-header"
import { MonthView } from "./calendar/month-view"
import { WeekView } from "./calendar/week-view"
import { DayView } from "./calendar/day-view"

interface ShiftsCalendarProps {
  shifts: Shift[]
}

export function ShiftsCalendar({ shifts }: ShiftsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")

  // Dialog State
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Handlers
  const handleDayClick = (dayShifts: Shift[], date: Date) => {
    // If in month view, clicking a day switches to day view
    if (view === "month") {
      setCurrentDate(date)
      setView("day")
      return
    }

    // Otherwise (if we keep this handler for other views), existing logic?
    // WeekView now uses onShiftClick for shifts, onDayClick(date) for background.
    // If this is triggered with shifts, it implies "show details". 
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

  // Week View specific backend click (empty slot) - optional
  const handleWeekDayClick = (date: Date) => {
    // Could open "Create Shift" dialog pre-filled with this date
    // For now, no-op or switch to day view?
    setCurrentDate(date)
    setView("day")
  }

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

        <CardContent className="pt-6 flex-1">
          {/* View Legend - Only show for Month/Week maybe? Or always? */}
          <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-200 lg:w-fit">
            <div className="flex flex-wrap gap-3">
              <StatusBadge color="bg-orange-500 animate-pulse" label="Pendiente" />
              <StatusBadge color="bg-purple-500" label="Libre" />
              <StatusBadge color="bg-emerald-500" label="Confirmada" />
              <StatusBadge color="bg-rose-500" label="Rechazada" />
              <StatusBadge color="bg-amber-500 animate-pulse" label="Pendiente +12h" />
            </div>
          </div>

          {/* Content Swapper */}
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              shifts={shifts}
              onDayClick={handleDayClick}
            />
          )}

          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              shifts={shifts}
              onDayClick={handleWeekDayClick}
              onShiftClick={handleShiftClick}
            />
          )}

          {view === "day" && (
            <DayView
              currentDate={currentDate}
              shifts={shifts}
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
              <ShiftCard key={shift.id} shift={shift} doctorId={selectedDoctorId} />
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
