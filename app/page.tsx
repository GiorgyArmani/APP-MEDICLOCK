import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"

export default async function HomePage() {
  const doctor = await getCurrentDoctor()

  if (!doctor) {
    redirect("/login")
  }

  if (doctor.role === "administrator") {
    redirect("/admin")
  } else {
    redirect("/dashboard")
  }
}
