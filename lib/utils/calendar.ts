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
