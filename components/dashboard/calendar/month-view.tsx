"use client"

import { generateCalendarDays, getShiftStatusColor } from "@/lib/utils/calendar"
import type { Shift } from "@/lib/supabase/types"

interface MonthViewProps {
    currentDate: Date
    shifts: Shift[]
    onDayClick: (shifts: Shift[], date: Date) => void
}

export function MonthView({ currentDate, shifts, onDayClick }: MonthViewProps) {
    const days = generateCalendarDays(currentDate.getFullYear(), currentDate.getMonth())
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

    // Optimized lookup
    const getShiftsForDay = (date: Date) => {
        // Note: This matches the original logic but could be optimized with a Map
        // For now keeping it simple as per original
        const dateStr = date.toISOString().split('T')[0]
        return shifts.filter(s => s.shift_date === dateStr)
    }

    return (
        <>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0 mb-2">
                {dayNames.map((day) => (
                    <div key={day} className="text-center text-sm font-bold text-slate-700 py-2 bg-slate-100 rounded-t">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((dayObj, index) => {
                    const dayShifts = getShiftsForDay(dayObj.date)
                    const hasShifts = dayShifts.length > 0
                    const hasPendingShifts = dayShifts.some((s) => s.status === "new" || s.status === "free_pending")

                    return (
                        <div
                            key={index}
                            onClick={() => onDayClick(dayShifts, dayObj.date)}
                            className={`min-h-[100px] p-2 border transition-all 
                ${hasShifts ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : ""} 
                ${hasPendingShifts
                                    ? "border-orange-400 bg-orange-50 ring-2 ring-orange-200"
                                    : hasShifts
                                        ? "border-slate-300 bg-white hover:bg-slate-50"
                                        : "border-slate-200 bg-white"
                                } 
                ${dayObj.isToday ? "ring-2 ring-blue-400" : ""}
                ${!dayObj.isCurrentMonth ? "opacity-50 bg-slate-50" : ""}
              `}
                        >
                            <div className="flex flex-col h-full">
                                <span
                                    className={`text-sm font-semibold mb-1 ${dayObj.isToday ? "text-blue-600" : hasPendingShifts ? "text-orange-700" : "text-slate-700"
                                        }`}
                                >
                                    {dayObj.date.getDate()}
                                </span>

                                {hasShifts && (
                                    <div className="flex-1 space-y-1 overflow-hidden">
                                        {dayShifts.slice(0, 3).map((shift) => (
                                            <div
                                                key={shift.id}
                                                className={`text-[10px] px-1.5 py-0.5 rounded text-white font-medium truncate shadow-sm ${getShiftStatusColor(shift.status || 'new')}`}
                                                title={`${shift.shift_hours} - ${shift.shift_area}`}
                                            >
                                                {shift.shift_hours}
                                            </div>
                                        ))}
                                        {dayShifts.length > 3 && (
                                            <div className="text-[10px] text-slate-500 font-medium px-1">
                                                +{dayShifts.length - 3} más
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}
