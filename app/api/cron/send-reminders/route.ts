import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { sendShiftReminderEmail } from '@/lib/notifications/email'
import { addDays, format, parseISO } from 'date-fns'

/**
 * Cron job to send shift reminders 24 hours before
 * Configure in vercel.json or run daily
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await getSupabaseServerClient()

        // Get tomorrow's date
        const tomorrow = addDays(new Date(), 1)
        const tomorrowDate = format(tomorrow, 'yyyy-MM-dd')

        // Fetch all confirmed shifts for tomorrow
        const { data: shifts, error } = await supabase
            .from('shifts')
            .select(`
        *,
        doctor:doctors(*)
      `)
            .eq('shift_date', tomorrowDate)
            .eq('status', 'confirmed')
            .not('doctor_id', 'is', null)

        if (error) {
            console.error('[Cron] Error fetching shifts:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!shifts || shifts.length === 0) {
            console.log('[Cron] No shifts found for tomorrow')
            return NextResponse.json({ message: 'No shifts to remind', count: 0 })
        }

        // Send reminder emails
        const results = await Promise.allSettled(
            shifts.map(async (shift) => {
                if (!shift.doctor) {
                    console.log(`[Cron] Skipping shift ${shift.id} - no doctor assigned`)
                    return null
                }

                return sendShiftReminderEmail({
                    doctorName: shift.doctor.full_name,
                    doctorEmail: shift.doctor.email,
                    shiftCategory: shift.shift_category,
                    shiftArea: shift.shift_area,
                    shiftHours: shift.shift_hours,
                    shiftDate: format(parseISO(shift.shift_date), 'dd/MM/yyyy'),
                    notes: shift.notes,
                })
            })
        )

        const successful = results.filter((r) => r.status === 'fulfilled').length
        const failed = results.filter((r) => r.status === 'rejected').length

        console.log(`[Cron] Sent ${successful} reminders, ${failed} failed`)

        return NextResponse.json({
            message: 'Reminders sent',
            total: shifts.length,
            successful,
            failed,
        })
    } catch (error) {
        console.error('[Cron] Error in reminder job:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
