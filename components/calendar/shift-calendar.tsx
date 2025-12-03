"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    generateCalendarDays,
    groupShiftsByDate,
    getShiftStatusColor,
    getShiftAreaColor,
    exportToICS,
    downloadICS,
    type CalendarDay,
} from "@/lib/utils/calendar"

interface ShiftCalendarProps {
    shifts: any[]
    doctorName?: string
}

export function ShiftCalendar({ shifts, doctorName = "Doctor" }: ShiftCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState<Date | null>(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const calendarDays = generateCalendarDays(year, month)
    const shiftsByDate = groupShiftsByDate(shifts)

    // Add shifts to calendar days
    const daysWithShifts = calendarDays.map((day) => {
        const dateKey = format(day.date, "yyyy-MM-dd")
        const dayShifts = shiftsByDate.get(dateKey) || []
        return { ...day, shifts: dayShifts }
    })

    const handlePreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1))
    }

    const handleToday = () => {
        setCurrentDate(new Date())
    }

    const handleExport = () => {
        const icsContent = exportToICS(shifts, doctorName)
        downloadICS(icsContent, `guardias-${format(currentDate, "yyyy-MM")}.ics`)
    }

    const selectedDayShifts = selectedDay
        ? shiftsByDate.get(format(selectedDay, "yyyy-MM-dd")) || []
        : []

    return (
        <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold min-w-[200px] text-center">
                        {format(currentDate, "MMMM yyyy", { locale: es })}
                    </h2>
                    <Button variant="outline" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleToday}>
                        Hoy
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar .ics
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                    {daysWithShifts.map((day, index) => (
                        <CalendarDayCell
                            key={index}
                            day={day}
                            isSelected={selectedDay ? format(selectedDay, "yyyy-MM-dd") === format(day.date, "yyyy-MM-dd") : false}
                            onClick={() => setSelectedDay(day.date)}
                        />
                    ))}
                </div>
            </Card>

            {/* Selected Day Details */}
            {selectedDay && selectedDayShifts.length > 0 && (
                <Card className="p-4">
                    <h3 className="font-semibold mb-3">
                        Guardias del {format(selectedDay, "d 'de' MMMM", { locale: es })}
                    </h3>
                    <div className="space-y-2">
                        {selectedDayShifts.map((shift) => (
                            <div
                                key={shift.id}
                                className={`p-3 rounded-lg border ${getShiftStatusColor(shift.status)}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-3 h-3 rounded-full ${getShiftAreaColor(shift.shift_area)}`} />
                                            <span className="font-medium">{shift.shift_category}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Horario: {shift.shift_hours}
                                        </p>
                                        {shift.notes && (
                                            <p className="text-sm mt-1">{shift.notes}</p>
                                        )}
                                    </div>
                                    <Badge variant="outline">{shift.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Legend */}
            <Card className="p-4">
                <h3 className="font-semibold mb-3">Leyenda</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-sm">Consultorio</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm">Internación</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-sm">Refuerzo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Completo</span>
                    </div>
                </div>
            </Card>
        </div>
    )
}

function CalendarDayCell({
    day,
    isSelected,
    onClick,
}: {
    day: CalendarDay
    isSelected: boolean
    onClick: () => void
}) {
    const hasShifts = day.shifts.length > 0

    return (
        <button
            onClick={onClick}
            className={`
        min-h-[80px] p-2 rounded-lg border transition-colors
        ${day.isCurrentMonth ? "bg-background" : "bg-muted/50"}
        ${day.isToday ? "border-primary border-2" : "border-border"}
        ${isSelected ? "ring-2 ring-primary" : ""}
        ${hasShifts ? "cursor-pointer hover:bg-accent" : ""}
      `}
        >
            <div className="text-right">
                <span
                    className={`
            text-sm
            ${day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"}
            ${day.isToday ? "font-bold" : ""}
          `}
                >
                    {format(day.date, "d")}
                </span>
            </div>

            {/* Shift indicators */}
            {hasShifts && (
                <div className="mt-1 space-y-1">
                    {day.shifts.slice(0, 2).map((shift, index) => (
                        <div
                            key={index}
                            className={`w-full h-1.5 rounded-full ${getShiftAreaColor(shift.shift_area)}`}
                            title={shift.shift_category}
                        />
                    ))}
                    {day.shifts.length > 2 && (
                        <div className="text-xs text-center text-muted-foreground">
                            +{day.shifts.length - 2}
                        </div>
                    )}
                </div>
            )}
        </button>
    )
}
