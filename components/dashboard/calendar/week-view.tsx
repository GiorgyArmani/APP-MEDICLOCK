"use client"

import { useEffect, useState } from "react"
import { getWeekDays, parseShiftTime, getShiftStatusColor, getVisualShiftsForDate } from "@/lib/utils/calendar"
import type { Shift } from "@/lib/supabase/types"

interface WeekViewProps {
    currentDate: Date
    shifts: Shift[]
    onDayClick: (date: Date) => void
    onShiftClick: (shift: Shift) => void
}

export function WeekView({ currentDate, shifts, onDayClick, onShiftClick }: WeekViewProps) {
    const weekDays = getWeekDays(currentDate)
    const hours = Array.from({ length: 24 }, (_, i) => i) // 0 to 23
    const [now, setNow] = useState(new Date())

    // Refresh "now" every minute
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(interval)
    }, [])

    // Calculate current time position
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    // Helper to filter shifts for a specific day
    const getShiftsForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0]
        return shifts.filter(s => s.shift_date === dateStr)
    }

    // Determine if the current week includes today
    const isCurrentWeek = weekDays.some(d => d.toDateString() === now.toDateString())

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-white overflow-hidden">
            <div className="flex flex-col min-w-[800px]"> {/* Ensure min width for responsiveness */}

                {/* Header with Days */}
                <div className="flex border-b bg-slate-50 relative z-20">
                    <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-white" />
                    <div className="flex-1 grid grid-cols-7 divide-x divide-slate-200">
                        {weekDays.map((day, i) => {
                            const isToday = day.toDateString() === now.toDateString()
                            return (
                                <div key={i} className={`p-2 text-center ${isToday ? 'bg-blue-50' : ''}`}>
                                    <div className={`text-xs font-semibold uppercase mb-1 ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                                        {day.toLocaleDateString("es-ES", { weekday: 'short' }).slice(0, 3)}
                                    </div>
                                    <div className={`text-lg font-bold w-8 h-8 flex items-center justify-center mx-auto rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto relative">
                    <div className="flex relative min-h-[960px]"> {/* 40px * 24h = 960px */}

                        {/* Time Labels Column */}
                        <div className="w-16 flex-shrink-0 bg-white border-r border-slate-100 relative select-none z-20">
                            {hours.map((hour) => (
                                <div
                                    key={hour}
                                    className="absolute w-full text-right pr-3 text-xs text-slate-400 font-medium transform -translate-y-1/2"
                                    style={{ top: hour * 40 }} // 40px per hour
                                >
                                    {hour === 0 ? '' : `${hour}:00`}
                                </div>
                            ))}
                        </div>

                        {/* Grid Columns */}
                        <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 relative">
                            {/* Horizontal Grid Lines (background) */}
                            <div className="absolute inset-0 z-0 pointer-events-none">
                                {hours.map((hour) => (
                                    <div
                                        key={`line-${hour}`}
                                        className="border-t border-slate-100 w-full absolute"
                                        style={{ top: hour * 40 }}
                                    />
                                ))}
                            </div>

                            {/* Current Time Indicator */}
                            {isCurrentWeek && (
                                <div
                                    className="absolute left-0 w-full border-t-2 border-red-500 z-10 pointer-events-none"
                                    style={{ top: `${(now.getHours() * 40) + (now.getMinutes() * (40 / 60))}px` }}
                                >
                                    <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                                </div>
                            )}

                            {/* Day Columns */}
                            {weekDays.map((day, index) => {
                                const isToday = day.toDateString() === now.toDateString()
                                return (
                                    <div key={index} className={`relative h-full transition-colors ${isToday ? 'bg-blue-50/10' : 'bg-transparent'}`} onClick={() => onDayClick(day)}>
                                        {getVisualShiftsForDate(day, shifts).map((segment, segIdx) => {
                                            const { shift, start, end, startMinutes, endMinutes, isContinuation, isOvernightStart } = segment

                                            const HOUR_HEIGHT = 40

                                            // Calculate position
                                            const top = (start * HOUR_HEIGHT) + (startMinutes * (HOUR_HEIGHT / 60))
                                            let durationHours = end - start
                                            let durationMinutes = endMinutes - startMinutes

                                            // Safety for negative duration locally (shouldnt happen with correct segments)
                                            if (durationHours < 0) durationHours = 0

                                            const height = (durationHours * HOUR_HEIGHT) + (durationMinutes * (HOUR_HEIGHT / 60))

                                            return (
                                                <div
                                                    key={`${shift.id}-${segIdx}`}
                                                    className={`absolute inset-x-[2px] rounded border-l-4 px-2 py-1 text-xs overflow-hidden leading-tight shadow-sm cursor-pointer hover:shadow-md hover:z-30 hover:inset-x-0 transition-all group
                                                ${getShiftStatusColor(shift.status || 'new')}
                                                border-opacity-100
                                                bg-opacity-90 hover:bg-opacity-100
                                                ${isContinuation ? 'rounded-t-none border-t-0 opacity-80' : ''}
                                                ${isOvernightStart ? 'rounded-b-none border-b-0' : ''}
                                            `}
                                                    style={{
                                                        top: `${top}px`,
                                                        height: `${Math.max(height, 20)}px`,
                                                        zIndex: 10
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onShiftClick(shift)
                                                    }}
                                                >
                                                    <div className="font-semibold text-[11px] flex justify-between">
                                                        <span>{isContinuation ? 'Cont.' : shift.shift_hours}</span>
                                                    </div>
                                                    <div className="font-bold truncate text-[11px]">{shift.shift_area}</div>
                                                    {height > 30 && (
                                                        <div className="text-[10px] opacity-80 truncate hidden group-hover:block">
                                                            {shift.shift_category}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
