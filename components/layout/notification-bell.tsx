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

interface NotificationBellProps {
    doctorId?: string
}

export function NotificationBell({ doctorId }: NotificationBellProps) {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(doctorId)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    if (!doctorId) return null

    const handleNotificationClick = async (notificationId: string, shiftId: string | null) => {
        await markAsRead(notificationId)
        setOpen(false)
        if (shiftId) {
            // Navigate to appropriate dashboard based on role (Admin or Doctor)
            // Get role from doctor object (we might need to fetch it or use a prop if available, but NotificationBell only has doctorId)
            // Wait, useNotifications doesn't give us the doctor role.
            // But we can check the current pathname or pass it as a prop.
            // Let's assume for now we can infer it or just use the current path if we are already in /admin or /dashboard.
            const isInsideAdmin = window.location.pathname.startsWith('/admin')
            const basePath = isInsideAdmin ? '/admin' : '/dashboard'
            router.push(`${basePath}?shift=${shiftId}`)
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
                                onClick={() => handleNotificationClick(notification.id, notification.shift_id)}
                            >
                                <div className="flex items-start justify-between w-full gap-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium leading-tight">
                                            {notification.type === "free_shift_available" && "🆓 Nueva Guardia Libre"}
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
