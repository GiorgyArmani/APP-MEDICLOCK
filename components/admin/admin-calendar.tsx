"use client"

import type { Shift, Doctor } from "@/lib/supabase/types"
import { ShiftsCalendar } from "@/components/dashboard/shifts-calendar"

interface AdminCalendarProps {
  shifts: Shift[]
  doctors: Doctor[]
  currentDoctor?: Doctor
}

export function AdminCalendar({ shifts, doctors, currentDoctor }: AdminCalendarProps) {
  return <ShiftsCalendar shifts={shifts} doctors={doctors} currentDoctor={currentDoctor} />
}
