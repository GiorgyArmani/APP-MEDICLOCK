"use server"

import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ShiftStatus, DoctorRole, Shift, ShiftInsert, Doctor, ShiftEventInsert, NotificationInsert } from "@/lib/supabase/types"
import {
  sendShiftAssignmentEmail,
  sendRecurringShiftAssignmentEmail,
  sendStatusChangeEmail,
  sendBulkFreeShiftAlert,
} from "@/lib/notifications/email"
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

  // Create audit logs for all shifts
  for (const shift of insertedShifts) {
    const eventData: ShiftEventInsert = {
      shift_id: shift.id,
      event_type: "created",
      notes: isRecurring ? "Guardia periódica creada por administrador" : "Guardia creada por administrador",
    }
    await supabase.from("shift_events").insert(eventData)
  }

  // Handle email notifications
  if (isRecurring && insertedShifts.length > 0) {
    // RECURRING SHIFTS: Send ONE consolidated email per doctor
    const shiftsByDoctor = new Map<string, Shift[]>()

    for (const shift of insertedShifts) {
      if (shift.doctor_id) {
        if (!shiftsByDoctor.has(shift.doctor_id)) {
          shiftsByDoctor.set(shift.doctor_id, [])
        }
        shiftsByDoctor.get(shift.doctor_id)!.push(shift)
      }
    }

    // Send consolidated email to each doctor
    for (const [doctorId, shifts] of shiftsByDoctor) {
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("full_name, email")
        .eq("id", doctorId)
        .single()

      const doctor = doctorData as { full_name: string; email: string } | null
      if (doctor) {
        await sendRecurringShiftAssignmentEmail(
          doctor.email,
          doctor.full_name,
          shifts[0].shift_category,
          shifts[0].shift_area,
          shifts[0].shift_hours,
          shifts.map(s => ({
            date: format(parseISO(s.shift_date), "dd/MM/yyyy"),
            notes: s.notes ?? undefined
          })),
          shifts[0].notes ?? undefined
        )
      }
    }

    // For recurring FREE shifts, only notify once for the first shift
    const firstShift = insertedShifts[0]
    if (firstShift.shift_type === "free") {
      // Notify ALL doctors about the free shift
      const { data: allDoctors } = await supabase
        .from("doctors")
        .select("email")

      const uniqueEmails = Array.from(new Set(allDoctors?.map(d => d.email) || []))

      if (uniqueEmails.length > 0) {
        await sendBulkFreeShiftAlert(
          uniqueEmails,
          firstShift.shift_category,
          firstShift.shift_area,
          firstShift.shift_hours,
          format(parseISO(firstShift.shift_date), "dd/MM/yyyy")
        )
      }
    }
  } else {
    // SINGLE SHIFT: Send individual emails as before
    for (const shift of insertedShifts) {
      if (shift.doctor_id) {
        const { data: doctorData } = await supabase
          .from("doctors")
          .select("full_name, email")
          .eq("id", shift.doctor_id)
          .single()

        const doctor = doctorData as { full_name: string; email: string } | null
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

      // Free shift alerts
      if (shift.shift_type === "free") {
        // Notify ALL doctors
        const { data: allDoctors } = await supabase
          .from("doctors")
          .select("email")

        const uniqueEmails = Array.from(new Set(allDoctors?.map(d => d.email) || []))

        if (uniqueEmails.length > 0) {
          await sendBulkFreeShiftAlert(
            uniqueEmails,
            shift.shift_category,
            shift.shift_area,
            shift.shift_hours,
            format(parseISO(shift.shift_date), "dd/MM/yyyy")
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
  const adminSupabase = await getSupabaseAdminClient()

  // 1. Authenticate and Authorize
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "No autenticado" }
  }

  // Get requester's detailed profile/role
  const { data: requesterProfile, error: profileError } = await supabase
    .from("doctors")
    .select("role")
    .eq("id", user.id) // Assuming doctor.id is same as user.id (usual Supabase auth link)
    .single()

  // Fallback: If doctor ID logic differs, we rely on the doctorId passed if authenticated user matches it?
  // Safe default: Check if the shift belongs to the user.

  // 1. Fetch current shift data needed for logic
  // Use admin client here to ensure we see the shift regardless of weird RLS states? 
  // Probably safe to use admin for reading too to be sure.
  const { data: currentShift, error: fetchError } = await adminSupabase
    .from("shifts")
    .select("*")
    .eq("id", shiftId)
    .single()

  if (fetchError || !currentShift) {
    return { error: "Guardia no encontrada" }
  }

  // Authorization Check:
  // Allow if:
  // 1. Requester is Administrator
  // 2. Requester is the owner of the shift (shift.doctor_id === user.id)
  // 3. (Optional) Requester is accepting a free shift? (Handled by acceptFreeShift, not this generic update)

  const isOwner = currentShift.doctor_id === user.id
  // Note: We might need to handle the case where user.id is the auth ID but doctors table uses a different ID?
  // Typically they are mapped 1:1. 

  // If requesterProfile is not found (e.g. admin might not be in doctors table if pure auth user?), 
  // let's assume if they can login they are a user. 
  // But we need to check "administrator" role.
  const isAdmin = requesterProfile?.role === 'administrator'

  if (!isOwner && !isAdmin) {
    // Edge case: "free_pending" logic might allow non-owners to update? 
    // Usually only owner can release.
    return { error: "No tienes permisos para modificar esta guardia" }
  }

  const updates: any = {
    updated_at: new Date().toISOString(),
  }

  // 2. Prepare updates based on target status
  let targetPool: DoctorRole[] = currentShift.assigned_to_pool || []

  if (status === "confirmed") {
    updates.status = "confirmed"
    // Keep existing doctor_id
  } else if (status === "rejected" || status === "free") {
    // Both 'rejected' (by doctor) and 'free' (manual release) result in a Free shift
    updates.status = "free"
    updates.shift_type = "free"
    updates.doctor_id = null

    // Calculate pool if missing or if it needs to be set for a newly freed shift
    // We intentionally recalculate/ensure it's set if currently empty
    if (targetPool.length === 0) {
      if (currentShift.shift_area === 'consultorio') targetPool = ['consultorio']
      else if (currentShift.shift_area === 'internacion') targetPool = ['internacion']
      else if (currentShift.shift_area === 'refuerzo') targetPool = ['consultorio', 'internacion']
      else targetPool = ['completo']
    }
    updates.assigned_to_pool = targetPool
  } else if (status === "free_pending") {
    updates.status = "free_pending"
    updates.free_pending_at = new Date().toISOString()
  } else {
    updates.status = status // Fallback for other statuses like 'new'
  }

  // 3. Perform Update (USING ADMIN CLIENT to bypass RLS)
  const { data, error } = await adminSupabase.from("shifts").update(updates).eq("id", shiftId).select().single()

  if (error) {
    console.error("Error updating shift status:", error)
    return { error: error.message }
  }

  const shift = data as Shift

  // 4. Audit Log
  // Record the *intent* (status argument), so 'rejected' is logged as such even if final state is 'free'
  const eventType = status === "confirmed" ? "confirmed" : status === "rejected" ? "rejected" : "freed"
  const eventData: ShiftEventInsert = {
    shift_id: shiftId,
    event_type: eventType,
    doctor_id: doctorId,
  }
  await supabase.from("shift_events").insert(eventData)

  // 5. Notifications

  // Admin Notification (Confirmed/Rejected)
  if (status === "confirmed" || status === "rejected") {
    const notificationType = status === "confirmed" ? "shift_confirmed" : "shift_declined"
    const notificationData: NotificationInsert = {
      type: notificationType,
      message: `Guardia ${shift.shift_category} ha sido ${status === "confirmed" ? "confirmada" : "rechazada"}`,
      shift_id: shiftId,
      recipient_role: "administrator",
    }
    await supabase.from("notifications").insert(notificationData)

    if (doctorId) {
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
  }

  // Free Shift Alerts (for Rejected or manually Freed shifts)
  if (status === "rejected" || status === "free") {
    // Notify ALL doctors
    const adminSupabase = await getSupabaseAdminClient()

    // Fetch all doctors
    const { data: allDoctors } = await adminSupabase
      .from("doctors")
      .select("email")

    if (allDoctors && allDoctors.length > 0) {
      const uniqueEmails = Array.from(new Set(allDoctors.map(d => d.email)))

      await sendBulkFreeShiftAlert(
        uniqueEmails,
        shift.shift_category,
        shift.shift_area,
        shift.shift_hours,
        format(parseISO(shift.shift_date), "dd/MM/yyyy")
      )
    }
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { data: shift }
}

// [MODIFIED] Use Admin Client to bypass RLS for acceptance
export async function acceptFreeShift(shiftId: string, doctorId: string) {
  const supabase = await getSupabaseAdminClient()

  // Verify doctor role permissions first
  // [MODIFIED] Fetch full profile once to reuse and avoid shadowing
  const { data: doctorData, error: doctorError } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", doctorId)
    .single()

  if (doctorError || !doctorData) {
    return { error: "No se pudo verificar el perfil del médico" }
  }

  const doctorProfile = doctorData as Doctor
  // Role check removed as per new requirements

  // Get shift to check pool requirements
  const { data: shiftCheck, error: shiftError } = await supabase
    .from("shifts")
    .select("status")
    .eq("id", shiftId)
    .single()

  if (shiftError || !shiftCheck) {
    return { error: "Guardia no encontrada" }
  }

  if (shiftCheck.status !== 'free' && shiftCheck.status !== 'free_pending') {
    return { error: "Esta guardia ya ha sido tomada" }
  }

  // Permission Logic REMOVED: Any doctor can take any free shift now.

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
  // [MODIFIED] Reusing doctorProfile fetched above
  if (doctorProfile) {
    // Send confirmation to doctor
    await sendShiftAssignmentEmail({
      doctorName: doctorProfile.full_name,
      doctorEmail: doctorProfile.email,
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
      doctorProfile.full_name,
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
        .select("email")
      // No role filter - send to all


      if (eligibleDoctorsData && eligibleDoctorsData.length > 0) {
        const emails = eligibleDoctorsData.map(d => d.email)
        await sendBulkFreeShiftAlert(
          emails,
          shift.shift_category,
          shift.shift_area,
          shift.shift_hours,
          format(parseISO(shift.shift_date), "dd/MM/yyyy")
        )
      }
    }
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { data: shift }
}

export async function deleteShift(shiftId: string, deleteAllFuture: boolean = false) {
  console.log(`[deleteShift] Action started for shiftId: ${shiftId}, deleteAllFuture: ${deleteAllFuture}`)
  const supabase = await getSupabaseServerClient()

  if (deleteAllFuture) {
    // 1. Get the shift details to find recurrence_id and date
    const { data: shift, error: fetchError } = await supabase
      .from("shifts")
      .select("recurrence_id, shift_date")
      .eq("id", shiftId)
      .single()

    if (fetchError || !shift) {
      console.error("[deleteShift] Error fetching shift details:", fetchError)
      return { error: "No se encontró la guardia para eliminar" }
    }

    if (shift.recurrence_id) {
      // 2. Delete all future shifts in the series
      console.log(`[deleteShift] Deleting recurring series ${shift.recurrence_id} from ${shift.shift_date}`)
      const { error: deleteError } = await supabase
        .from("shifts")
        .delete()
        .eq("recurrence_id", shift.recurrence_id)
        .gte("shift_date", shift.shift_date) // Delete this and all future ones

      if (deleteError) {
        console.error("[deleteShift] Error deleting series:", deleteError)
        return { error: deleteError.message }
      }
    } else {
      // Fallback if not recurring but requested (shouldn't happen UI side ideally)
      console.log("[deleteShift] Shift is not recurring, deleting single instance")
      const { error } = await supabase.from("shifts").delete().eq("id", shiftId)
      if (error) return { error: error.message }
    }
  } else {
    // Single deletion
    console.log(`[deleteShift] Attempting DELETE on 'shifts' table...`)
    const { error } = await supabase.from("shifts").delete().eq("id", shiftId)

    if (error) {
      console.error("[deleteShift] Error deleting shift:", error)
      return { error: error.message }
    }
  }

  console.log(`[deleteShift] DELETE successful. Revalidating paths...`)
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

export async function clockIn(shiftId: string, doctorId: string) {
  const supabase = await getSupabaseServerClient()

  // 1. Verify shift ownership and status
  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", shiftId)
    .single()

  if (shiftError || !shift) {
    return { error: "Guardia no encontrada" }
  }

  if (shift.doctor_id !== doctorId) {
    return { error: "No tienes permiso para gestionar esta guardia" }
  }

  if (shift.status !== "confirmed") {
    return { error: "Solo puedes iniciar guardias confirmadas" }
  }

  if (shift.clock_in) {
    return { error: "Ya has marcado entrada para esta guardia" }
  }

  // Optional: Check if it's the correct day
  const today = new Date().toISOString().split('T')[0]
  if (shift.shift_date !== today) {
    // We allow clock-in for flexibility, but maybe warn? For now, allow it.
    // return { error: "Solo puedes marcar entrada el día de la guardia" }
  }

  const { data, error } = await supabase
    .from("shifts")
    .update({
      clock_in: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", shiftId)
    .select()
    .single()

  if (error) {
    console.error("Error clocking in:", error)
    return { error: error.message }
  }

  // Audit event
  await supabase.from("shift_events").insert({
    shift_id: shiftId,
    event_type: "clock_in",
    doctor_id: doctorId,
    notes: "Entrada registrada por el médico"
  })

  revalidatePath("/dashboard")
  revalidatePath("/admin")
  return { data }
}

export async function clockOut(shiftId: string, doctorId: string) {
  const supabase = await getSupabaseServerClient()

  // 1. Verify shift ownership and status
  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", shiftId)
    .single()

  if (shiftError || !shift) {
    return { error: "Guardia no encontrada" }
  }

  if (shift.doctor_id !== doctorId) {
    return { error: "No tienes permiso para gestionar esta guardia" }
  }

  if (!shift.clock_in) {
    return { error: "Debes marcar entrada antes de marcar salida" }
  }

  if (shift.clock_out) {
    return { error: "Ya has marcado salida para esta guardia" }
  }

  const { data, error } = await supabase
    .from("shifts")
    .update({
      clock_out: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", shiftId)
    .select()
    .single()

  if (error) {
    console.error("Error clocking out:", error)
    return { error: error.message }
  }

  // Audit event
  await supabase.from("shift_events").insert({
    shift_id: shiftId,
    event_type: "clock_out",
    doctor_id: doctorId,
    notes: "Salida registrada por el médico"
  })

  revalidatePath("/dashboard")
  revalidatePath("/admin")
  return { data }
}

export async function saveDoctorNotes(shiftId: string, doctorId: string, notes: string) {
  const supabase = await getSupabaseServerClient()

  // 1. Verify shift ownership
  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", shiftId)
    .single()

  if (shiftError || !shift) {
    return { error: "Guardia no encontrada" }
  }

  if (shift.doctor_id !== doctorId) {
    return { error: "No tienes permiso para gestionar esta guardia" }
  }

  // Allow notes only for confirmed shifts (active or finished essentially)
  if (shift.status !== "confirmed") {
    return { error: "Solo puedes guardar notas en guardias confirmadas" }
  }

  const { data, error } = await supabase
    .from("shifts")
    .update({
      doctor_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq("id", shiftId)
    .select()
    .single()

  if (error) {
    console.error("Error saving notes:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { data }
}
