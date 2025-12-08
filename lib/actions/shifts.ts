"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ShiftStatus, DoctorRole, Shift, ShiftInsert, Doctor, ShiftEventInsert, NotificationInsert } from "@/lib/supabase/types"
import { sendShiftAssignmentEmail, sendStatusChangeEmail, sendFreeShiftAlert } from "@/lib/notifications/email"
import { format, parseISO } from "date-fns"

export async function getShifts(): Promise<Shift[]> {
  const supabase = await getSupabaseServerClient()

  const { data: shifts, error } = await supabase.from("shifts").select("*").order("shift_date", { ascending: true })

  if (error) {
    console.error("Error fetching shifts:", error)
    return []
  }

  return shifts as Shift[]
}

export async function getShiftsByDoctor(doctorId: string): Promise<Shift[]> {
  const supabase = await getSupabaseServerClient()

  const { data: shifts, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("shift_date", { ascending: true })

  if (error) {
    console.error("Error fetching doctor shifts:", error)
    return []
  }

  return shifts as Shift[]
}

export async function createShift(shiftData: ShiftInsert) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase.from("shifts").insert(shiftData).select().single()

  if (error) {
    console.error("Error creating shift:", error)
    return { error: error.message }
  }

  const shift = data as Shift

  // Crear evento de auditoría
  const eventData: ShiftEventInsert = {
    shift_id: shift.id,
    event_type: "created",
    notes: "Guardia creada por administrador",
  }
  await supabase.from("shift_events").insert(eventData)

  // Send email if assigned to specific doctor
  if (shift.doctor_id) {
    const { data: doctorData } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", shift.doctor_id)
      .single()

    const doctor = doctorData as Doctor | null
    if (doctor) {
      await sendShiftAssignmentEmail({
        doctorName: doctor.full_name,
        doctorEmail: doctor.email,
        shiftCategory: shift.shift_category,
        shiftArea: shift.shift_area,
        shiftHours: shift.shift_hours,
        shiftDate: format(parseISO(shift.shift_date), "dd/MM/yyyy"),
        notes: shift.notes ?? undefined,
      })
    }
  }

  // Send free shift alerts
  if (shift.shift_type === "free" && shift.assigned_to_pool && shift.assigned_to_pool.length > 0) {
    const { data: eligibleDoctorsData } = await supabase
      .from("doctors")
      .select("*")
      .in("role", shift.assigned_to_pool)

    const eligibleDoctors = eligibleDoctorsData as Doctor[] | null
    if (eligibleDoctors) {
      await Promise.allSettled(
        eligibleDoctors.map((doctor) =>
          sendFreeShiftAlert(
            doctor.email,
            doctor.full_name,
            shift.shift_category,
            shift.shift_area,
            shift.shift_hours,
            format(parseISO(shift.shift_date), "dd/MM/yyyy")
          )
        )
      )
    }
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { data: shift }
}

export async function updateShiftStatus(shiftId: string, status: ShiftStatus, doctorId?: string) {
  const supabase = await getSupabaseServerClient()

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === "free_pending") {
    updates.free_pending_at = new Date().toISOString()
  }

  const { data, error } = await supabase.from("shifts").update(updates).eq("id", shiftId).select().single()

  if (error) {
    console.error("Error updating shift status:", error)
    return { error: error.message }
  }

  const shift = data as Shift

  // Crear evento de auditoría
  const eventType = status === "confirmed" ? "confirmed" : status === "rejected" ? "rejected" : "freed"
  const eventData: ShiftEventInsert = {
    shift_id: shiftId,
    event_type: eventType,
    doctor_id: doctorId,
  }
  await supabase.from("shift_events").insert(eventData)

  // Crear notificación para administrador
  const notificationType = status === "confirmed" ? "shift_confirmed" : "shift_declined"
  const notificationData: NotificationInsert = {
    type: notificationType,
    message: `Guardia ${shift.shift_category} ha sido ${status === "confirmed" ? "confirmada" : "rechazada"}`,
    shift_id: shiftId,
    recipient_role: "administrator",
  }
  await supabase.from("notifications").insert(notificationData)

  // Send email notification to admin
  if ((status === "confirmed" || status === "rejected") && doctorId) {
    const { data: doctorData } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", doctorId)
      .single()

    const doctor = doctorData as Doctor | null
    if (doctor) {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@mediclock.app"
      await sendStatusChangeEmail(
        adminEmail,
        doctor.full_name,
        shift.shift_category,
        format(parseISO(shift.shift_date), "dd/MM/yyyy"),
        status
      )
    }
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { data: shift }
}

export async function acceptFreeShift(shiftId: string, doctorId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("shifts")
    .update({
      doctor_id: doctorId,
      status: "confirmed" as ShiftStatus,
      shift_type: "assigned",
      updated_at: new Date().toISOString(),
    })
    .eq("id", shiftId)
    .select()
    .single()

  if (error) {
    console.error("Error accepting free shift:", error)
    return { error: error.message }
  }

  const shift = data as Shift

  // Crear evento de auditoría
  const eventData: ShiftEventInsert = {
    shift_id: shiftId,
    event_type: "accepted",
    doctor_id: doctorId,
  }
  await supabase.from("shift_events").insert(eventData)

  // Notificar al administrador
  const notificationData: NotificationInsert = {
    type: "free_shift_accepted",
    message: `Guardia libre ${shift.shift_category} ha sido aceptada`,
    shift_id: shiftId,
    recipient_role: "administrator",
  }
  await supabase.from("notifications").insert(notificationData)

  // Send email notifications
  const { data: doctorData } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", doctorId)
    .single()

  const doctor = doctorData as Doctor | null
  if (doctor) {
    // Send confirmation to doctor
    await sendShiftAssignmentEmail({
      doctorName: doctor.full_name,
      doctorEmail: doctor.email,
      shiftCategory: shift.shift_category,
      shiftArea: shift.shift_area,
      shiftHours: shift.shift_hours,
      shiftDate: format(parseISO(shift.shift_date), "dd/MM/yyyy"),
      notes: shift.notes ?? undefined,
    })

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@mediclock.app"
    await sendStatusChangeEmail(
      adminEmail,
      doctor.full_name,
      shift.shift_category,
      format(parseISO(shift.shift_date), "dd/MM/yyyy"),
      "confirmed"
    )
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { data: shift }
}

export async function updateShift(shiftId: string, updates: any) {
  const supabase = await getSupabaseServerClient()

  // First get the original shift to compare
  const { data: oldShiftResult } = await supabase.from("shifts").select("*").eq("id", shiftId).single()
  const oldShift = oldShiftResult as Shift

  const { data, error } = await supabase
    .from("shifts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", shiftId)
    .select()
    .single()

  if (error) {
    console.error("Error updating shift:", error)
    return { error: error.message }
  }

  const shift = data as Shift

  // Log audit event
  const eventData: ShiftEventInsert = {
    shift_id: shift.id,
    event_type: "updated",
    doctor_id: null, // Admin action
    notes: "Actualización por administrador",
  }
  await supabase.from("shift_events").insert(eventData)

  // Handle Notifications

  // Case 1: Reassigned to a new doctor (or assigned from null)
  if (updates.doctor_id && updates.doctor_id !== oldShift.doctor_id) {
    const { data: doctorData } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", updates.doctor_id)
      .single()

    const doctor = doctorData as Doctor | null
    if (doctor) {
      await sendShiftAssignmentEmail({
        doctorName: doctor.full_name,
        doctorEmail: doctor.email,
        shiftCategory: shift.shift_category,
        shiftArea: shift.shift_area,
        shiftHours: shift.shift_hours,
        shiftDate: format(parseISO(shift.shift_date), "dd/MM/yyyy"),
        notes: shift.notes ?? undefined,
      })
    }
  }

  // Case 2: Converted to free shift with pool assignment
  if (
    (updates.shift_type === "free" && updates.shift_type !== oldShift.shift_type) ||
    (shift.shift_type === "free" &&
      updates.assigned_to_pool &&
      JSON.stringify(updates.assigned_to_pool) !== JSON.stringify(oldShift.assigned_to_pool))
  ) {
    if (shift.assigned_to_pool && shift.assigned_to_pool.length > 0) {
      const { data: eligibleDoctorsData } = await supabase
        .from("doctors")
        .select("*")
        .in("role", shift.assigned_to_pool)

      const eligibleDoctors = eligibleDoctorsData as Doctor[] | null
      if (eligibleDoctors) {
        await Promise.allSettled(
          eligibleDoctors.map((doctor) =>
            sendFreeShiftAlert(
              doctor.email,
              doctor.full_name,
              shift.shift_category,
              shift.shift_area,
              shift.shift_hours,
              format(parseISO(shift.shift_date), "dd/MM/yyyy")
            )
          )
        )
      }
    }
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { data: shift }
}

export async function deleteShift(shiftId: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.from("shifts").delete().eq("id", shiftId)

  if (error) {
    console.error("Error deleting shift:", error)
    return { error: error.message }
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { success: true }
}

export async function getDoctors(): Promise<Doctor[]> {
  const supabase = await getSupabaseServerClient()

  const { data: doctors, error } = await supabase.from("doctors").select("*").order("full_name", { ascending: true })

  if (error) {
    console.error("Error fetching doctors:", error)
    return []
  }

  return doctors as Doctor[]
}
