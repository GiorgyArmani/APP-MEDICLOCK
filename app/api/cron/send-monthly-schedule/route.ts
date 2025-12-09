import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { sendMonthlyScheduleEmail } from "@/lib/notifications/email"
import { addMonths, startOfMonth, endOfMonth, format, subDays, isSameDay } from "date-fns"
import { es } from "date-fns/locale"

// Force dynamic to ensure we get fresh date
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        // 1. Authorization check
        const authHeader = request.headers.get("authorization")
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const today = new Date()
        const nextMonthDate = addMonths(today, 1)
        const startOfNextMonth = startOfMonth(nextMonthDate)

        // 2. Check if today is exactly 7 days before next month
        // We want to send this email ONLY on that specific day
        const triggerDate = subDays(startOfNextMonth, 7)

        // Safe check: allow manual override via query param ?force=true
        const url = new URL(request.url)
        const force = url.searchParams.get("force") === "true"

        if (!isSameDay(today, triggerDate) && !force) {
            return NextResponse.json({
                message: "Not the scheduled date",
                today: format(today, "yyyy-MM-dd"),
                triggerDate: format(triggerDate, "yyyy-MM-dd")
            })
        }

        console.log("[Cron] Starting monthly schedule emails...")

        const supabase = await getSupabaseServerClient()
        const endOfNextMonth = endOfMonth(nextMonthDate)

        const startStr = format(startOfNextMonth, "yyyy-MM-dd")
        const endStr = format(endOfNextMonth, "yyyy-MM-dd")
        const monthName = format(nextMonthDate, "MMMM", { locale: es })

        // Capitalize month name
        const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

        // 3. Get all confirmed shifts for next month
        const { data: shifts, error } = await supabase
            .from("shifts")
            .select(`
        *,
        doctors (
          full_name,
          email
        )
      `)
            .eq("status", "confirmed")
            .gte("shift_date", startStr)
            .lte("shift_date", endStr)
            .order("shift_date", { ascending: true })

        if (error) {
            console.error("[Cron] Error fetching shifts:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!shifts || shifts.length === 0) {
            return NextResponse.json({ message: "No confirmed shifts found for next month" })
        }

        // 4. Group by doctor
        const shiftsByDoctor: Record<string, typeof shifts> = {}

        shifts.forEach(shift => {
            if (shift.doctor_id) {
                if (!shiftsByDoctor[shift.doctor_id]) {
                    shiftsByDoctor[shift.doctor_id] = []
                }
                shiftsByDoctor[shift.doctor_id].push(shift)
            }
        })

        // 5. Send emails
        const results = await Promise.allSettled(
            Object.entries(shiftsByDoctor).map(async ([doctorId, doctorShifts]) => {
                const doctor = doctorShifts[0].doctors as any // Joined data
                if (!doctor?.email) return { doctorId, status: 'skipped', reason: 'no email' }

                const formattedShifts = doctorShifts.map(s => ({
                    date: format(new Date(s.shift_date + 'T00:00:00'), 'dd/MM/yyyy'),
                    hours: s.shift_hours,
                    category: s.shift_category,
                    area: s.shift_area
                }))

                await sendMonthlyScheduleEmail(
                    doctor.email,
                    doctor.full_name,
                    formattedMonth,
                    formattedShifts
                )
                return { doctorId, status: 'sent' }
            })
        )

        const successful = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length

        console.log(`[Cron] Sent monthly schedules: ${successful} success, ${failed} failed`)

        return NextResponse.json({
            message: "Monthly schedules processed",
            total_doctors: Object.keys(shiftsByDoctor).length,
            successful,
            failed
        })

    } catch (error) {
        console.error("[Cron] Internal error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
