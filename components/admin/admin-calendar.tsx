"use client"

import type { Shift } from "@/lib/supabase/types"
import { ShiftsCalendar } from "@/components/dashboard/shifts-calendar"

interface AdminCalendarProps {
  shifts: Shift[]
}

export function AdminCalendar({ shifts }: AdminCalendarProps) {
  return <ShiftsCalendar shifts={shifts} />
}
