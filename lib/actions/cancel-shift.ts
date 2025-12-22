"use server"

import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendBulkFreeShiftAlert } from "@/lib/notifications/email"
import { getDoctors } from "./doctors"
import type { Shift } from "@/lib/supabase/types"

/**
 * Cancel a shift - converts it to "free" type instead of deleting
 * This allows other doctors to pick up the shift
 */
export async function cancelShift(shiftId: string) {
    // Use admin client to bypass RLS restrictions
    const supabase = await getSupabaseAdminClient()

    // Get shift details before updating
    const { data: shift } = await supabase
        .from("shifts")
        .select("*")
        .eq("id", shiftId)
        .single()

    if (!shift) {
        return { error: "Shift not found" }
    }

    // Update the shift to be free type and remove doctor assignment
    const { error } = await supabase
        .from("shifts")
        .update({
            shift_type: "free",
            doctor_id: null,
            status: "free",
        })
        .eq("id", shiftId)

    if (error) {
        console.error("Error canceling shift:", error)
        return { error: error.message }
    }

    // Create event log
    await supabase.from("shift_events").insert({
        shift_id: shiftId,
        event_type: "freed",
        notes: "Guardia liberada por el médico",
    })

    // Notify relevant doctors about the free shift (Pool + Completo)
    const { data: poolDoctors } = await supabase
        .from("doctors")
        .select("email")
        .in("role", shift.assigned_to_pool || [])

    const { data: completoDoctors } = await supabase
        .from("doctors")
        .select("email")
        .eq("role", "completo")

    const emails = Array.from(new Set([
        ...(poolDoctors?.map(d => d.email) || []),
        ...(completoDoctors?.map(d => d.email) || [])
    ]))

    if (emails.length > 0) {
        await sendBulkFreeShiftAlert(
            emails,
            shift.shift_category,
            shift.shift_area,
            shift.shift_hours,
            shift.shift_date
        )
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/shifts")
    revalidatePath("/admin")

    return { success: true }
}
