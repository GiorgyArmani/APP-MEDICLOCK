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

// Helper types for the action
interface CreateShiftParams extends ShiftInsert {
  isRecurring?: boolean
  recurrenceEndDate?: string
}

export async function createShift(shiftData: CreateShiftParams) {
  const supabase = await getSupabaseServerClient()
  const { isRecurring, recurrenceEndDate, ...baseShiftData } = shiftData

  // Prepare batch of shifts to insert
  const shiftsToInsert: ShiftInsert[] = []

  // If recurring, generate series
  if (isRecurring && recurrenceEndDate) {
    const startDate = parseISO(baseShiftData.shift_date)
    const endDate = parseISO(recurrenceEndDate)

    // Generate recurrence_id for the series
    const recurrenceId = crypto.randomUUID()

    let currentDate = startDate
    while (currentDate <= endDate) {
      shiftsToInsert.push({
        ...baseShiftData,
        shift_date: format(currentDate, "yyyy-MM-dd"),
        recurrence_id: recurrenceId
      })

      // Add 7 days
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 7))
    }
  } else {
    // Single shift
    shiftsToInsert.push(baseShiftData)
  }

  const createdShifts: Shift[] = []

  // Insert shifts (sequentially to handle potential errors gracefully, mostly for simplicity here)
  // Optimization: Could use bulk insert but we need to run logic (email etc) for each or summary.
  // Given standard usage (e.g. 52 weeks), loop is acceptable but bulk DB insert is better.

  // Bulk insert to DB first
  const { data, error } = await supabase.from("shifts").insert(shiftsToInsert).select()

  if (error) {
    console.error("Error creating shifts key:", error)
    return { error: error.message }
  }

  const insertedShifts = data as Shift[]

  // Process notifications and emails asynchronously/iteratively
  // Recommendation: For bulk, maybe send ONE summary email? 
  // For now, to ensure consistent behavior with existing logic, we process the first one fully + others silently or simply iterate.
  // Iterating all for now to maintain behavior (notifications for each shift).

  for (const shift of insertedShifts) {
    // Audit log
    const eventData: ShiftEventInsert = {
      shift_id: shift.id,
      event_type: "created",
      notes: isRecurring ? "Guardia periódica creada por administrador" : "Guardia creada por administrador",
    }
    await supabase.from("shift_events").insert(eventData)

    // Send email/notifications logic (reused from original)
    // Optimization: If > 1 shift, we might want to consolidate, but for "perpetual" usually correctness > noise initially.
    // Let's keep original logic for each shift to ensure every week is treated as a valid assignment.

    if (shift.doctor_id) {
      // ... (Send notification logic)
      // We can optimize this by checking if we already sent an email to this doctor in this batch? 
      // For now, let's keep it simple.

      const { data: doctorData } = await supabase
        .from("doctors")
        .select("full_name, email") // Optimizing select
        .eq("id", shift.doctor_id)
        .single()

      const doctor = doctorData as { full_name: string; email: string } | null
      if (doctor) {
        // Only send for the FIRST shift if it is a recurrence to avoid spamming 50 emails
        // Or send for all? Standard practice is usually a summary.
        // Let's send only for the first one if recurring to avoid spam bomb.

        const isFirstInSeries = shift.shift_date === baseShiftData.shift_date
        if (!isRecurring || isFirstInSeries) {
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
    }

    // Free shift alerts
    if (shift.shift_type === "free" && shift.assigned_to_pool && shift.assigned_to_pool.length > 0) {
      // Similar spam protection: only alert for first one if recurring? 
      // Actually for pool, maybe we DO want to alert for all? Or just first. 
      // Let's stick to first one for now to prevents 52 emails to the whole pool.

      const isFirstInSeries = shift.shift_date === baseShiftData.shift_date
      if (!isRecurring || isFirstInSeries) {
        const { data: eligibleDoctorsData } = await supabase
          .from("doctors")
          .select("email, full_name")
          .in("role", shift.assigned_to_pool)

        const eligibleDoctors = eligibleDoctorsData as { email: string; full_name: string }[] | null
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
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { data: insertedShifts[0] } // Return first one for UI feedback
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

  const { isRecurring, recurrenceEndDate, ...shiftUpdates } = updates

  // First get the original shift to compare
  const { data: oldShiftResult } = await supabase.from("shifts").select("*").eq("id", shiftId).single()
  const oldShift = oldShiftResult as Shift

  // Prepare updates object
  let finalUpdates = { ...shiftUpdates, updated_at: new Date().toISOString() }

  // If converting to recurring
  let newRecurrenceId = null
  if (isRecurring && recurrenceEndDate && !oldShift.recurrence_id) {
    newRecurrenceId = crypto.randomUUID()
    finalUpdates.recurrence_id = newRecurrenceId
  }

  const { data, error } = await supabase
    .from("shifts")
    .update(finalUpdates)
    .eq("id", shiftId)
    .select()
    .single()

  if (error) {
    console.error("Error updating shift:", error)
    return { error: error.message }
  }

  const shift = data as Shift

  // If we just made it recurring, generate the future shifts
  if (newRecurrenceId && recurrenceEndDate) {
    const startDate = parseISO(shift.shift_date)
    // Start from next week since the current shift is the "first" one
    const firstFutureDate = new Date(startDate)
    firstFutureDate.setDate(firstFutureDate.getDate() + 7)

    const endDate = parseISO(recurrenceEndDate)
    const shiftsToInsert: ShiftInsert[] = []

    let currentDate = firstFutureDate
    while (currentDate <= endDate) {
      shiftsToInsert.push({
        doctor_id: shift.doctor_id, // Keep assignment if any
        shift_type: shift.shift_type,
        shift_category: shift.shift_category,
        shift_area: shift.shift_area,
        shift_hours: shift.shift_hours,
        shift_date: format(currentDate, "yyyy-MM-dd"),
        status: shift.status === 'confirmed' ? 'confirmed' : 'new', // If original is confirmed, confirm futures? Or keep new? safest is keep same status but maybe 'new' if manual confirm needed. Let's copy strictly for "Perpetual" meaning "Same as this".
        notes: shift.notes,
        assigned_to_pool: shift.assigned_to_pool,
        recurrence_id: newRecurrenceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      // Add 7 days
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 7))
    }

    if (shiftsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("shifts").insert(shiftsToInsert)
      if (insertError) {
        console.error("Error generating recurring shifts:", insertError)
        // Non-fatal for the update itself, but should be noted.
      } else {
        // Log event for bulk creation
        const eventData: ShiftEventInsert = {
          shift_id: shift.id,
          event_type: "recurrence_generated",
          notes: `Generadas ${shiftsToInsert.length} guardias futuras`,
        }
        await supabase.from("shift_events").insert(eventData)
      }
    }
  }

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
  if (shiftUpdates.doctor_id && shiftUpdates.doctor_id !== oldShift.doctor_id) {
    const { data: doctorData } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", shiftUpdates.doctor_id)
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
    (shiftUpdates.shift_type === "free" && shiftUpdates.shift_type !== oldShift.shift_type) ||
    (shift.shift_type === "free" &&
      shiftUpdates.assigned_to_pool &&
      JSON.stringify(shiftUpdates.assigned_to_pool) !== JSON.stringify(oldShift.assigned_to_pool))
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
  console.log(`[deleteShift] Action started for shiftId: ${shiftId}`)
  const supabase = await getSupabaseServerClient()

  // Optimization: Now that we have ON DELETE CASCADE in the database,
  // we can simply delete the shift and the DB handles the rest.
  console.log(`[deleteShift] Attempting DELETE on 'shifts' table...`)

  const { error } = await supabase.from("shifts").delete().eq("id", shiftId)

  if (error) {
    console.error("[deleteShift] Error deleting shift:", error)
    return { error: error.message }
  }

  console.log(`[deleteShift] DELETE successful. Revalidating paths...`)
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  console.log(`[deleteShift] Revalidation executing.`)

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
