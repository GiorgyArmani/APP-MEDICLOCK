"use client"

import { parseShiftTime, getShiftStatusColor, getVisualShiftsForDate } from "@/lib/utils/calendar"
import type { Shift } from "@/lib/supabase/types"

interface DayViewProps {
    currentDate: Date
    shifts: Shift[]
    onShiftClick: (shift: Shift) => void
}

export function DayView({ currentDate, shifts, onShiftClick }: DayViewProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i) // 0 to 23

    // Filter shifts for the specific day
    const dayShifts = shifts.filter(s =>
        s.shift_date === currentDate.toISOString().split('T')[0]
    )

    const HOUR_HEIGHT = 40

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-white overflow-hidden">
            {/* Header */}
            <div className="flex border-b bg-slate-50 py-3 px-4">
                <div className="w-16 flex-shrink-0" />
                <div className="flex-1 text-center">
                    <h2 className="text-xl font-bold text-slate-800 capitalize">
                        {currentDate.toLocaleDateString("es-ES", { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {dayShifts.length} {dayShifts.length === 1 ? 'guardia programada' : 'guardias programadas'}
                    </p>
                </div>
            </div>

            {/* Body: Time Grid */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="flex relative min-h-[960px]">

                    {/* Time Labels */}
                    <div className="w-16 flex-shrink-0 bg-slate-50 border-r relative select-none">
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="absolute w-full text-right pr-2 text-xs text-slate-400 -mt-2"
                                style={{ top: hour * HOUR_HEIGHT }} // 40px per hour
                            >
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Grid Content */}
                    <div className="flex-1 relative">
                        {/* Horizontal Grid Lines */}
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            {hours.map((hour) => (
                                <div
                                    key={`line-${hour}`}
                                    className="border-t border-slate-100 w-full absolute"
                                    style={{ top: hour * HOUR_HEIGHT }}
                                />
                            ))}
                        </div>

                        {/* Shifts */}
                        {getVisualShiftsForDate(currentDate, shifts).map((segment, index) => {
                            const { shift, start, end, startMinutes, endMinutes, isContinuation, isOvernightStart } = segment

                            // Calculate position
                            const top = (start * HOUR_HEIGHT) + (startMinutes * (HOUR_HEIGHT / 60))

                            let durationHours = end - start
                            let durationMinutes = endMinutes - startMinutes
                            if (durationHours < 0) durationHours = 0 // Safety

                            const height = (durationHours * HOUR_HEIGHT) + (durationMinutes * (HOUR_HEIGHT / 60))

                            return (
                                <div
                                    key={`${shift.id}-${index}`}
                                    className={`absolute inset-x-2 rounded-md p-3 border shadow-sm cursor-pointer hover:shadow-lg hover:z-20 transition-all flex flex-col justify-center
                            ${getShiftStatusColor(shift.status || 'new')}
                            ${isContinuation ? 'rounded-t-none border-t-0 opacity-90' : ''}
                            ${isOvernightStart ? 'rounded-b-none border-b-0' : ''}
                        `}
                                    style={{
                                        top: `${top}px`,
                                        height: `${Math.max(height, 50)}px` // Min height 50px for readability
                                    }}
                                    onClick={() => onShiftClick(shift)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-base">
                                                {isContinuation ? 'Cont. ' : ''}{shift.shift_hours}
                                            </div>
                                            <div className="font-medium text-sm">{shift.shift_category}</div>
                                        </div>
                                        <div className="text-xs px-2 py-1 bg-white/50 rounded-full font-medium uppercase">
                                            {shift.status === 'confirmed' ? 'Confirmada' :
                                                shift.status === 'free' ? 'Libre' :
                                                    shift.status === 'new' ? 'Nueva' : shift.status}
                                        </div>
                                    </div>
                                    <div className="mt-1 text-sm opacity-90">
                                        {shift.shift_area}
                                    </div>
                                    {shift.notes && (
                                        <div className="mt-2 text-xs opacity-75 truncate max-w-full">
                                            {shift.notes}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {/* Empty State message if no shifts */}
                        {dayShifts.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none">
                                <p>No hay guardias programadas para este día</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}
