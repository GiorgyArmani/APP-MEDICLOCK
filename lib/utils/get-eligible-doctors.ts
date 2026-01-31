/**
 * Get eligible doctors for a free shift notification
 * Filters out doctors who:
 * - Already have a shift at the same date
 * - Are the doctor who rejected the shift
 */

import { getSupabaseAdminClient } from "@/lib/supabase/server"

export async function getEligibleDoctors(
    shiftDate: string,
    excludeDoctorId?: string
): Promise<string[]> {
    const supabase = await getSupabaseAdminClient()

    // Get all doctors
    const { data: allDoctors, error: doctorsError } = await supabase
        .from("doctors")
        .select("id")

    if (doctorsError || !allDoctors) {
        console.error("Error fetching doctors:", doctorsError)
        return []
    }

    // Get doctors who already have shifts on this date
    const { data: busyDoctors, error: shiftsError } = await supabase
        .from("shifts")
        .select("doctor_id")
        .eq("shift_date", shiftDate)
        .not("doctor_id", "is", null)

    if (shiftsError) {
        console.error("Error fetching busy doctors:", shiftsError)
        return []
    }

    const busyDoctorIds = new Set(busyDoctors?.map((s) => s.doctor_id) || [])

    // Filter out busy doctors and the excluded doctor
    const eligibleDoctors = allDoctors
        .filter((doctor) => {
            if (busyDoctorIds.has(doctor.id)) return false
            if (excludeDoctorId && doctor.id === excludeDoctorId) return false
            return true
        })
        .map((doctor) => doctor.id)

    return eligibleDoctors
}
