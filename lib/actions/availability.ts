"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface AvailabilitySlot {
    id: string
    doctor_id: string
    day_of_week: number // 0 = Sunday, 6 = Saturday
    start_time: string // HH:MM format
    end_time: string // HH:MM format
    is_available: boolean
    notes?: string
    created_at: string
    updated_at: string
}

export async function getAvailability(doctorId: string): Promise<AvailabilitySlot[]> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("day_of_week")
        .order("start_time")

    if (error) {
        console.error("Error fetching availability:", error)
        return []
    }

    return data as AvailabilitySlot[]
}

export async function setAvailability(
    doctorId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    notes?: string
) {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.from("availability").upsert(
        {
            doctor_id: doctorId,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            is_available: true,
            notes,
        },
        {
            onConflict: "doctor_id,day_of_week,start_time",
        }
    )

    if (error) {
        console.error("Error setting availability:", error)
        return { error: error.message }
    }

    revalidatePath("/dashboard/availability")
    return { success: true }
}

export async function deleteAvailability(availabilityId: string) {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.from("availability").delete().eq("id", availabilityId)

    if (error) {
        console.error("Error deleting availability:", error)
        return { error: error.message }
    }

    revalidatePath("/dashboard/availability")
    return { success: true }
}
