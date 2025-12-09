/**
 * Calendar utility functions for shift management
 */

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export interface CalendarDay {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    shifts: any[]
}

/**
 * Generate calendar grid for a given month
 */
export function generateCalendarDays(year: number, month: number): CalendarDay[] {
    const firstDay = startOfMonth(new Date(year, month))
    const lastDay = endOfMonth(new Date(year, month))

    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay })

    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay()

    // Add padding days from previous month
    const paddingDays: CalendarDay[] = []
    for (let i = 0; i < firstDayOfWeek; i++) {
        const date = new Date(firstDay)
        date.setDate(date.getDate() - (firstDayOfWeek - i))
        paddingDays.push({
            date,
            isCurrentMonth: false,
            isToday: false,
            shifts: []
        })
    }

    // Add days of current month
    const today = new Date()
    const monthDays: CalendarDay[] = daysInMonth.map(date => ({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        shifts: []
    }))

    // Add padding days from next month to complete the grid
    const totalDays = paddingDays.length + monthDays.length
    const remainingDays = 42 - totalDays // 6 rows x 7 days
    const trailingDays: CalendarDay[] = []

    for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(lastDay)
        date.setDate(date.getDate() + i)
        trailingDays.push({
            date,
            isCurrentMonth: false,
            isToday: false,
            shifts: []
        })
    }

    return [...paddingDays, ...monthDays, ...trailingDays]
}

/**
 * Group shifts by date
 */
export function groupShiftsByDate(shifts: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>()

    shifts.forEach(shift => {
        const dateKey = format(parseISO(shift.shift_date), 'yyyy-MM-dd')
        const existing = grouped.get(dateKey) || []
        grouped.set(dateKey, [...existing, shift])
    })

    return grouped
}

/**
 * Get shift color based on status
 */
export function getShiftStatusColor(status: string): string {
    const colors: Record<string, string> = {
        new: 'bg-blue-100 text-blue-800 border-blue-200',
        confirmed: 'bg-green-100 text-green-800 border-green-200',
        rejected: 'bg-red-100 text-red-800 border-red-200',
        free: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        free_pending: 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Get shift area color
 */
export function getShiftAreaColor(area: string): string {
    const colors: Record<string, string> = {
        consultorio: 'bg-purple-500',
        internacion: 'bg-blue-500',
        refuerzo: 'bg-orange-500',
        completo: 'bg-green-500'
    }
    return colors[area] || 'bg-gray-500'
}

/**
 * Format shift hours for display
 */
export function formatShiftHours(hours: string): string {
    return hours.replace('-', ' - ')
}

/**
 * Export shifts to .ics format (iCalendar)
 */
export function exportToICS(shifts: any[], doctorName: string): string {
    const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MediClock//Shift Calendar//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Guardias MediClock',
        'X-WR-TIMEZONE:America/Argentina/Buenos_Aires'
    ]

    shifts.forEach(shift => {
        const startDate = parseISO(shift.shift_date)
        const [startHour] = shift.shift_hours.split('-')
        const [hours, minutes] = startHour.split(':').map(Number)

        startDate.setHours(hours || 8, minutes || 0, 0)

        // Calculate end time (assume 6 hour shifts if not specified)
        const endDate = new Date(startDate)
        endDate.setHours(endDate.getHours() + 6)

        const formatICSDate = (date: Date) => {
            return format(date, "yyyyMMdd'T'HHmmss")
        }

        icsLines.push(
            'BEGIN:VEVENT',
            `UID:${shift.id}@mediclock.app`,
            `DTSTAMP:${formatICSDate(new Date())}`,
            `DTSTART:${formatICSDate(startDate)}`,
            `DTEND:${formatICSDate(endDate)}`,
            `SUMMARY:Guardia ${shift.shift_area} - ${shift.shift_hours}`,
            `DESCRIPTION:${shift.shift_category}${shift.notes ? '\\n' + shift.notes : ''}`,
            `LOCATION:${shift.shift_area}`,
            `STATUS:${shift.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
            'END:VEVENT'
        )
    })

    icsLines.push('END:VCALENDAR')

    return icsLines.join('\r\n')
}

/**
 * Download .ics file
 */
export function downloadICS(icsContent: string, filename: string = 'guardias.ics') {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
}

/**
 * Parse shift hours string to get start and end hours (0-23)
 * Handles formats like: "08-14", "8-14", "08:00-14:00", "8:30 - 14:30"
 * Returns numbers for grid positioning
 */
export function parseShiftTime(shiftHours: string): { start: number; end: number; startMinutes: number; endMinutes: number } {
    try {
        // Clean up string
        const cleaned = shiftHours.replace(/\s/g, '').toLowerCase()

        let startStr = '8'
        let endStr = '14'

        if (cleaned.includes('-')) {
            const parts = cleaned.split('-')
            startStr = parts[0]
            endStr = parts[1]
        }

        // Parse start
        let start = 8
        let startMinutes = 0
        if (startStr.includes(':')) {
            const [h, m] = startStr.split(':').map(Number)
            start = h
            startMinutes = m || 0
        } else {
            start = parseInt(startStr, 10)
        }

        // Parse end
        let end = 14
        let endMinutes = 0
        if (endStr.includes(':')) {
            const [h, m] = endStr.split(':').map(Number)
            end = h
            endMinutes = m || 0
        } else {
            end = parseInt(endStr, 10)
        }

        // Validation / Fallback
        if (isNaN(start)) start = 8
        if (isNaN(end)) end = start + 6 // Default 6h duration

        // Handle overnight shifts (e.g. 20-08)
        // For visualization on a single day grid, we might cap at 24 OR verify logic
        // But the grid usually goes 0-24. If end < start, it ends next day.

        return { start, end, startMinutes, endMinutes }
    } catch (e) {
        console.error("Error parsing shift hours:", shiftHours, e)
        return { start: 8, end: 14, startMinutes: 0, endMinutes: 0 }
    }
}

/**
 * Get days for the week containing the given date
 */
export function getWeekDays(date: Date): Date[] {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay()) // Start on Sunday

    const days = []
    for (let i = 0; i < 7; i++) {
        const day = new Date(start)
        day.setDate(start.getDate() + i)
        days.push(day)
    }
    return days
}


export interface VisualShiftSegment {
    shift: any
    start: number // 0-24
    end: number   // 0-24
    startMinutes: number
    endMinutes: number
    isContinuation: boolean // true if this is the 00:00 part of an overnight shift
    isOvernightStart: boolean // true if this is the 20:00 part of an overnight shift
}

/**
 * Get visual shift segments for a specific date, handling overnight splits.
 */
export function getVisualShiftsForDate(date: Date, shifts: any[]): VisualShiftSegment[] {
    const segments: VisualShiftSegment[] = []
    const dateStr = format(date, 'yyyy-MM-dd')

    // 1. Find shifts starting on this date
    const startingShifts = shifts.filter(s => s.shift_date === dateStr)

    startingShifts.forEach(shift => {
        const { start, end, startMinutes, endMinutes } = parseShiftTime(shift.shift_hours)

        // Check if overnight (end < start implies crossing midnight in 24h format, usually)
        // Or specific logic: if 'end' is small (e.g. 8) and 'start' is big (e.g. 20).
        // Our parseShiftTime logic returns start=20, end=26 (start+6) by default if logic catches it?
        // Let's re-read parseShiftTime.
        // It says: "if (durationHours < 0) durationHours += 24" -> implies end is adjusted?
        // Actually parseShiftTime returns simple numbers. width strict 0-23 logic, end < start means overnight.
        // But the previous usage did: `if (durationHours < 0) durationHours += 24`, meaning `end` wasn't adjusted to be > start.

        let visualEnd = end
        let isOvernight = false

        // If the parsed end is smaller than start, it implies it ends the next day.
        if (end < start) {
            isOvernight = true
            visualEnd = 24 // Render until midnight
        }

        segments.push({
            shift,
            start,
            end: visualEnd,
            startMinutes,
            endMinutes: isOvernight ? 0 : endMinutes, // If overnight, current segment ends at 24:00
            isContinuation: false,
            isOvernightStart: isOvernight
        })
    })

    // 2. Find shifts starting yesterday that spill into today
    const yesterday = new Date(date)
    yesterday.setDate(date.getDate() - 1)
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

    const yesterdayShifts = shifts.filter(s => s.shift_date === yesterdayStr)

    yesterdayShifts.forEach(shift => {
        const { start, end, endMinutes } = parseShiftTime(shift.shift_hours)

        // If it was overnight
        if (end < start) {
            // This day (today) gets the segment from 00:00 to end
            segments.push({
                shift,
                start: 0,
                end: end,
                startMinutes: 0,
                endMinutes: endMinutes,
                isContinuation: true,
                isOvernightStart: false
            })
        }
    })

    return segments
}
