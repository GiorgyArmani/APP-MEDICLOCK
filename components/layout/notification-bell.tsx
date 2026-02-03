"use client"

import { useState } from "react"
import { Bell, Check, CheckCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/hooks/use-notifications"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useEffect, useCallback } from "react"
import { getCurrentDoctor } from "@/lib/actions/auth"
import type { Doctor } from "@/lib/supabase/types"

interface NotificationBellProps {
    doctorId?: string
    recipientRole?: string
}

export function NotificationBell({ doctorId, recipientRole }: NotificationBellProps) {
    const [isMounted, setIsMounted] = useState(false)
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(doctorId, recipientRole)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!doctorId || !isMounted) return <Button variant="ghost" size="icon" className="relative"><Bell className="h-5 w-5" /></Button>

    const handleNotificationClick = async (notification: any) => {
        await markAsRead(notification.id)
        setOpen(false)

        if (notification.type === "new_chat_message") {
            const isAdmin = recipientRole === "administrator" || window.location.pathname.startsWith('/admin')
            if (isAdmin) {
                const url = `/admin/messages${notification.doctor_id ? `?doctor=${notification.doctor_id}` : ''}`
                router.push(url)
            } else {
                router.push("/dashboard/messages")
            }
            return
        }

        if (notification.shift_id) {
            const isInsideAdmin = window.location.pathname.startsWith('/admin')
            const isHonorarios = window.location.pathname.startsWith('/honorarios')
            const basePath = isInsideAdmin ? '/admin' : isHonorarios ? '/honorarios' : '/dashboard'
            router.push(`${basePath}?shift=${notification.shift_id}`)
        }
    }

    const handleMarkAllRead = async () => {
        await markAllAsRead()
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-2 py-2">
                    <h3 className="font-semibold text-sm">Notificaciones</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="h-7 text-xs"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Marcar todas
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No hay notificaciones
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.read ? "bg-blue-50 hover:bg-blue-100" : ""
                                    }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start justify-between w-full gap-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium leading-tight">
                                            {notification.type === "free_shift_available" && "🆓 Nueva Guardia Libre"}
                                            {notification.type === "new_chat_message" && "💬 Nuevo Mensaje"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                                locale: es,
                                            })}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
