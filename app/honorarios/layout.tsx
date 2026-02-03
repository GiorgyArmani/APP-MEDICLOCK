import { getCurrentDoctor } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { SidebarLayoutContent } from "@/components/layout/sidebar-layout-content"

export default async function HonorariosLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const doctor = await getCurrentDoctor()

    if (!doctor) {
        redirect("/login")
    }

    if (doctor.role !== "honorarios") {
        redirect(doctor.role === "administrator" ? "/admin" : "/dashboard")
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen">
                <AppSidebar doctor={doctor} />
                <SidebarLayoutContent doctor={doctor}>
                    {children}
                </SidebarLayoutContent>
            </div>
        </SidebarProvider>
    )
}
