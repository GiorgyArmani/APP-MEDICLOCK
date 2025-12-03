"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function getDoctors() {
    const supabase = await getSupabaseServerClient()

    const { data: doctors, error } = await supabase
        .from("doctors")
        .select("*")
        .order("full_name", { ascending: true })

    if (error) {
        console.error("Error fetching doctors:", error)
        return []
    }

    return doctors
}
