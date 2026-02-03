"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Doctor, ChatMessage } from "@/lib/supabase/types"
import { Badge } from "@/components/ui/badge"
import { Search, User as UserIcon, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ChatWindow } from "@/components/chat/chat-window"
import { cn } from "@/lib/utils"

interface AdminChatDashboardProps {
    initialDoctors: (Doctor & { unreadCount: number })[]
    adminId: string
}

export function AdminChatDashboard({ initialDoctors, adminId }: AdminChatDashboardProps) {
    const [doctors, setDoctors] = useState(initialDoctors)
    const [search, setSearch] = useState("")
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
    const supabase = createClient()

    const filteredDoctors = doctors.filter(d =>
        d.full_name.toLowerCase().includes(search.toLowerCase()) ||
        d.email.toLowerCase().includes(search.toLowerCase())
    )

    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId)

    useEffect(() => {
        const channel = supabase
            .channel('admin-chat-overview')
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                },
                (payload) => {
                    const nextMessage = payload.new as ChatMessage
                    if (nextMessage.sender_id === nextMessage.doctor_id) {
                        setDoctors(prev => prev.map(d =>
                            d.id === nextMessage.doctor_id && d.id !== selectedDoctorId
                                ? { ...d, unreadCount: d.unreadCount + 1 }
                                : d
                        ))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedDoctorId, supabase])

    const handleSelectDoctor = (id: string) => {
        setSelectedDoctorId(id)
        setDoctors(prev => prev.map(d =>
            d.id === id ? { ...d, unreadCount: 0 } : d
        ))
    }

    return (
        <div className="flex flex-col md:flex-row gap-0 h-[calc(100vh-16rem)] min-h-[500px] border rounded-xl bg-white shadow-sm overflow-hidden mt-4">
            {/* Sidebar: Doctor List */}
            <div className="w-full md:w-80 flex flex-col bg-slate-50 border-r border-slate-200 shrink-0">
                <div className="p-4 border-b bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar médico..."
                            className="pl-9 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        {filteredDoctors.map((doctor) => (
                            <div
                                key={doctor.id}
                                className={cn(
                                    "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all",
                                    selectedDoctorId === doctor.id
                                        ? "bg-blue-600 text-white shadow-md ring-1 ring-blue-400"
                                        : "hover:bg-slate-200 text-slate-700"
                                )}
                                onClick={() => handleSelectDoctor(doctor.id)}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                        selectedDoctorId === doctor.id ? "bg-blue-500" : "bg-white border"
                                    )}>
                                        <UserIcon className={cn(
                                            "h-5 w-5",
                                            selectedDoctorId === doctor.id ? "text-white" : "text-slate-500"
                                        )} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-semibold truncate text-sm">{doctor.full_name}</p>
                                        <p className={cn(
                                            "text-xs truncate opacity-70",
                                            selectedDoctorId === doctor.id ? "text-blue-100" : "text-slate-500"
                                        )}>
                                            {doctor.email}
                                        </p>
                                    </div>
                                </div>
                                {doctor.unreadCount > 0 && (
                                    <Badge variant="destructive" className="ml-2 px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                                        {doctor.unreadCount}
                                    </Badge>
                                )}
                            </div>
                        ))}
                        {filteredDoctors.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No se encontraron médicos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 h-full bg-white overflow-hidden">
                {selectedDoctor ? (
                    <ChatWindow
                        doctorId={selectedDoctor.id}
                        currentUserId={adminId}
                        recipientName={selectedDoctor.full_name}
                        isAdminView={true}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 bg-slate-50/30">
                        <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100">
                            <MessageSquare className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-600">Bandeja de Entrada</p>
                            <p className="text-sm">Selecciona un médico para comenzar a chatear</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
