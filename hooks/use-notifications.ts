"use client"

import { useEffect, useState, useCallback } from "react"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/lib/supabase/types"
import { playNotificationSound } from "@/lib/utils/notification-sound"

export function useNotifications(doctorId?: string, recipientRole?: string) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [lastNotificationId, setLastNotificationId] = useState<string | null>(null)

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!doctorId) {
            setLoading(false)
            return
        }

        try {
            const supabase = createClient()
            let query = supabase
                .from("notifications")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20)

            if (doctorId && recipientRole) {
                query = query.or(`doctor_id.eq.${doctorId},recipient_role.eq.${recipientRole}`)
            } else if (doctorId) {
                query = query.eq("doctor_id", doctorId)
            } else if (recipientRole) {
                query = query.eq("recipient_role", recipientRole)
            } else {
                setLoading(false)
                return
            }

            const { data, error } = await query

            if (error) {
                console.error("Error fetching notifications:", error)
                return
            }

            if (data) {
                // Check for new notifications
                if (data.length > 0 && lastNotificationId && data[0].id !== lastNotificationId) {
                    // New notification arrived!
                    playNotificationSound()

                    // Request browser notification permission if not granted
                    if (typeof window !== "undefined" && "Notification" in window) {
                        if (Notification.permission === "granted") {
                            new Notification("Nueva Guardia Libre", {
                                body: data[0].message,
                                icon: "/icon.png",
                                badge: "/icon.png",
                            })
                        } else if (Notification.permission !== "denied") {
                            Notification.requestPermission()
                        }
                    }
                }

                setNotifications(data)
                setUnreadCount(data.filter((n) => !n.read).length)
                if (data.length > 0) {
                    setLastNotificationId(data[0].id)
                }
            }
        } catch (error) {
            console.error("Error in fetchNotifications:", error)
        } finally {
            setLoading(false)
        }
    }, [doctorId, lastNotificationId])

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("id", notificationId)

            if (error) {
                console.error("Error marking notification as read:", error)
                return
            }

            // Update local state
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
        } catch (error) {
            console.error("Error in markAsRead:", error)
        }
    }, [])

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        if (!doctorId) return

        try {
            const supabase = createClient()
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("doctor_id", doctorId)
                .eq("read", false)

            if (error) {
                console.error("Error marking all as read:", error)
                return
            }

            // Update local state
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Error in markAllAsRead:", error)
        }
    }, [doctorId])

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    // Request notification permission on mount
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
                Notification.requestPermission()
            }
        }
    }, [])

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead: async () => {
            if (!doctorId && !recipientRole) return

            try {
                const supabase = createClient()
                let query = supabase
                    .from("notifications")
                    .update({ read: true })
                    .eq("read", false)

                if (doctorId && recipientRole) {
                    query = query.or(`doctor_id.eq.${doctorId},recipient_role.eq.${recipientRole}`)
                } else if (doctorId) {
                    query = query.eq("doctor_id", doctorId)
                } else {
                    query = query.eq("recipient_role", recipientRole)
                }

                const { error } = await query

                if (error) {
                    console.error("Error marking all as read:", error)
                    return
                }

                // Update local state
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                setUnreadCount(0)
            } catch (error) {
                console.error("Error in markAllAsRead:", error)
            }
        },
        refresh: fetchNotifications,
    }
}
