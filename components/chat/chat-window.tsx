"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ChatMessage, Doctor } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, User as UserIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getChatMessages, sendChatMessage, markChatAsRead } from "@/lib/actions/chat"

interface ChatWindowProps {
    doctorId: string
    currentUserId: string
    recipientName: string
    isAdminView?: boolean
}

export function ChatWindow({ doctorId, currentUserId, recipientName, isAdminView = false }: ChatWindowProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchMessages = async () => {
            setIsLoading(true)
            const data = await getChatMessages(doctorId)
            setMessages(data)
            setIsLoading(false)
            scrollToBottom()
            await markChatAsRead(doctorId, currentUserId)
        }

        fetchMessages()

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`chat:${doctorId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                    filter: `doctor_id=eq.${doctorId}`,
                },
                async (payload) => {
                    const nextMessage = payload.new as ChatMessage
                    setMessages((prev) => [...prev, nextMessage])

                    if (nextMessage.sender_id !== currentUserId) {
                        await markChatAsRead(doctorId, currentUserId)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [doctorId, currentUserId, supabase])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isSending) return

        setIsSending(true)
        const content = newMessage.trim()
        setNewMessage("")

        const result = await sendChatMessage(doctorId, currentUserId, content)
        if (result.error) {
            console.error(result.error)
            setNewMessage(content) // restore if failed
        }
        setIsSending(false)
    }

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-slate-300" />
                </div>
                <div>
                    <h3 className="font-semibold">{recipientName}</h3>
                    <p className="text-xs text-slate-400">
                        {isAdminView ? "Conversación con el Médico" : "Administración Mediclock"}
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-slate-50">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                        <p>No hay mensajes en esta conversación.</p>
                        <p className="text-sm">Inicia la comunicación enviando un mensaje abajo.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === currentUserId
                            return (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[80%]",
                                        isMe ? "ml-auto items-end" : "mr-auto items-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "px-4 py-2 rounded-2xl text-sm",
                                            isMe
                                                ? "bg-blue-600 text-white rounded-tr-none"
                                                : "bg-white border text-slate-800 rounded-tl-none"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1">
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                        {isMe && msg.is_read && (
                                            <span className="ml-1 text-blue-500 font-medium">Leído</span>
                                        )}
                                    </span>
                                </div>
                            )
                        })}
                        <div ref={scrollRef} />
                    </div>
                )}
            </ScrollArea>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
                <Input
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                    className="flex-1"
                />
                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                    {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </form>
        </div>
    )
}
