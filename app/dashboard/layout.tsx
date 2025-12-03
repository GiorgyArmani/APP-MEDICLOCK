import { getCurrentDoctor } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const doctor = await getCurrentDoctor()

    if (!doctor) {
        redirect("/login")
    }

    if (doctor.role === "administrator") {
        redirect("/admin")
    }

    return (
        <div className="flex min-h-screen">
            <AppSidebar doctor={doctor} />
            <main className="flex-1 lg:ml-64 bg-slate-50">
                {children}
            </main>
        </div>
    )
}
