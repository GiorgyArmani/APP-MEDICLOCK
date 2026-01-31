/**
 * Create in-app notifications for eligible doctors about a free shift
 */

import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { getEligibleDoctors } from "@/lib/utils/get-eligible-doctors"

export async function notifyFreeShift(
    shiftId: string,
    shiftCategory: string,
    shiftArea: string,
    shiftHours: string,
    shiftDate: string,
    excludeDoctorId?: string
) {
    const supabase = await getSupabaseAdminClient()

    // Get eligible doctors (those without conflicting shifts)
    const eligibleDoctorIds = await getEligibleDoctors(shiftDate, excludeDoctorId)

    if (eligibleDoctorIds.length === 0) {
        console.log("[Notifications] No eligible doctors for free shift notification")
        return { success: true, notified: 0 }
    }

    // Create individual notifications for each eligible doctor
    const notifications = eligibleDoctorIds.map((doctorId) => ({
        type: "free_shift_available",
        message: `Nueva guardia libre disponible: ${shiftCategory} - ${shiftArea} (${shiftHours}) el ${shiftDate}`,
        shift_id: shiftId,
        doctor_id: doctorId,
        read: false,
    }))

    const { error } = await supabase.from("notifications").insert(notifications)

    if (error) {
        console.error("[Notifications] Error creating notifications:", error)
        return { success: false, error: error.message }
    }

    console.log(`[Notifications] Created ${notifications.length} in-app notifications for free shift`)
    return { success: true, notified: notifications.length }
}
