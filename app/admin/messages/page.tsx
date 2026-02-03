import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getDoctorsWithUnreadCount } from "@/lib/actions/chat"
import { AdminChatDashboard } from "@/components/admin/admin-chat-dashboard"
import { MessageSquare } from "lucide-react"

export default async function AdminMessagesPage() {
    const currentDoctor = await getCurrentDoctor()

    if (!currentDoctor) {
        redirect("/login")
    }

    if (currentDoctor.role !== "administrator") {
        redirect("/dashboard")
    }

    const doctors = await getDoctorsWithUnreadCount()

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-2">
                <MessageSquare className="h-8 w-8 text-slate-900" />
                <h1 className="text-3xl font-bold text-slate-900">Mensajes</h1>
            </div>

            <p className="text-slate-600 max-w-2xl">
                Comunícate directamente con los médicos. Los mensajes son en tiempo real y quedan registrados para futuras revisiones.
            </p>

            <AdminChatDashboard initialDoctors={doctors} adminId={currentDoctor.id} />
        </div>
    )
}
