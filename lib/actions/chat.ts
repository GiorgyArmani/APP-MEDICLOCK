"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ChatMessage } from "@/lib/supabase/types"

export async function getChatMessages(doctorId: string) {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: true })

    if (error) {
        console.error("Error fetching chat messages:", error)
        return []
    }

    return data as ChatMessage[]
}

export async function sendChatMessage(doctorId: string, senderId: string, content: string) {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
        .from("chat_messages")
        .insert({
            doctor_id: doctorId,
            sender_id: senderId,
            content: content,
            is_read: false,
        })
        .select()
        .single()

    if (error) {
        console.error("Error sending chat message:", error)
        return { error: error.message }
    }

    // --- Create Notification ---
    // Fetch sender to determine roles
    const { data: sender } = await supabase
        .from("doctors")
        .select("role, full_name")
        .eq("id", senderId)
        .single()

    if (sender) {
        const isFromAdmin = sender.role === "administrator"

        await supabase.from("notifications").insert({
            type: "new_chat_message",
            message: `Nuevo mensaje de ${sender.full_name}: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
            doctor_id: isFromAdmin ? doctorId : null,
            recipient_role: isFromAdmin ? null : "administrator",
            read: false
        })
    }

    return { success: true, message: data }
}

export async function markChatAsRead(doctorId: string, currentUserId: string) {
    const supabase = await getSupabaseServerClient()

    // Mark as read all messages in this thread that were NOT sent by the current user
    const { error } = await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("doctor_id", doctorId)
        .neq("sender_id", currentUserId)
        .eq("is_read", false)

    if (error) {
        console.error("Error marking messages as read:", error)
        return { error: error.message }
    }

    return { success: true }
}

export async function getDoctorsWithUnreadCount() {
    const supabase = await getSupabaseServerClient()

    // This is a bit complex in a single query with Supabase/PostgREST without a custom function
    // We'll fetch all doctors and then get unread counts
    const { data: doctors, error: dError } = await supabase
        .from("doctors")
        .select("*")
        .neq("role", "administrator")
        .order("full_name")

    if (dError) {
        console.error("Error fetching doctors for chat:", dError)
        return []
    }

    const { data: unreadCounts, error: uError } = await supabase
        .from("chat_messages")
        .select("doctor_id")
        .eq("is_read", false)
    // We only care about messages NOT sent by admins (though in doctor-specific threads, 
    // usually it's just the doctor sending if it's unread for admin)
    // But to be safe, let's assume if it's unread, the "other side" needs to see it.
    // For admin dashboard, we want to see messages from doctors.

    // A better approach for the dashboard is to join or use a view, 
    // but for now let's process in JS if the doctor count is small.

    const countsMap = (unreadCounts || []).reduce((acc: any, curr) => {
        acc[curr.doctor_id] = (acc[curr.doctor_id] || 0) + 1
        return acc
    }, {})

    return doctors.map(d => ({
        ...d,
        unreadCount: countsMap[d.id] || 0
    }))
}
