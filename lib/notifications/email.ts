/**
 * Email notification service using Resend
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.ADMIN_EMAIL || 'onboarding@resend.dev'

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email] Missing RESEND_API_KEY')
    return { success: false, error: 'Missing API key' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `MediClock <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[Email] Resend Error:', error)
      return { success: false, error }
    }

    console.log('[Email] Sent successfully:', data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('[Email] Error:', error)
    return { success: false, error }
  }
}

export interface ShiftEmailData {
  doctorName: string
  doctorEmail: string
  shiftCategory: string
  shiftArea: string
  shiftHours: string
  shiftDate: string
  notes?: string
}

/**
 * Send shift assignment email
 */
export async function sendShiftAssignmentEmail(data: ShiftEmailData) {
  return await sendEmail(
    data.doctorEmail,
    `Nueva Guardia Asignada - ${data.shiftDate}`,
    `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .shift-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
              .detail-row { margin: 10px 0; }
              .label { font-weight: bold; color: #6b7280; }
              .value { color: #111827; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🏥 Nueva Guardia Asignada</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${data.doctorName}</strong>,</p>
                <p>Se te ha asignado una nueva guardia. Por favor revisa los detalles y confirma tu disponibilidad.</p>
                
                <div class="shift-details">
                  <h2 style="margin-top: 0; color: #2563eb;">Detalles de la Guardia</h2>
                  <div class="detail-row">
                    <span class="label">📅 Fecha:</span>
                    <span class="value">${data.shiftDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">⏰ Horario:</span>
                    <span class="value">${data.shiftHours}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">🏢 Área:</span>
                    <span class="value">${data.shiftArea}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">📋 Tipo:</span>
                    <span class="value">${data.shiftCategory}</span>
                  </div>
                  ${data.notes ? `
                  <div class="detail-row">
                    <span class="label">📝 Notas:</span>
                    <span class="value">${data.notes}</span>
                  </div>
                  ` : ''}
                </div>
                
                <p style="margin-top: 20px;">Por favor ingresa al sistema para confirmar o rechazar esta guardia.</p>
                
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="button">
                  Ver en el Sistema
                </a>
                
                <div class="footer">
                  <p>Este es un correo automático de MediClock. Por favor no respondas a este mensaje.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
  )
}

/**
 * Send shift reminder email (24h before)
 */
export async function sendShiftReminderEmail(data: ShiftEmailData) {
  return await sendEmail(
    data.doctorEmail,
    `Recordatorio: Guardia Mañana - ${data.shiftDate}`,
    `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
              .reminder-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
              .detail-row { margin: 10px 0; }
              .label { font-weight: bold; color: #92400e; }
              .value { color: #111827; }
              .footer { text-align: center; margin-top: 30px; color: #92400e; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">⏰ Recordatorio de Guardia</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${data.doctorName}</strong>,</p>
                <p>Este es un recordatorio de que tienes una guardia <strong>mañana</strong>.</p>
                
                <div class="reminder-box">
                  <h2 style="margin-top: 0; color: #f59e0b;">📋 Detalles</h2>
                  <div class="detail-row">
                    <span class="label">📅 Fecha:</span>
                    <span class="value">${data.shiftDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">⏰ Horario:</span>
                    <span class="value">${data.shiftHours}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">🏢 Área:</span>
                    <span class="value">${data.shiftArea}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">📋 Tipo:</span>
                    <span class="value">${data.shiftCategory}</span>
                  </div>
                </div>
                
                <p style="margin-top: 20px;">¡Nos vemos mañana!</p>
                
                <div class="footer">
                  <p>Este es un correo automático de MediClock. Por favor no respondas a este mensaje.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
  )
}

/**
 * Send status change notification
 */
export async function sendStatusChangeEmail(
  adminEmail: string,
  doctorName: string,
  shiftCategory: string,
  shiftDate: string,
  status: 'confirmed' | 'rejected'
) {
  const statusText = status === 'confirmed' ? 'confirmó' : 'rechazó'
  const statusColor = status === 'confirmed' ? '#10b981' : '#ef4444'

  return await sendEmail(
    adminEmail,
    `Guardia ${status === 'confirmed' ? 'Confirmada' : 'Rechazada'} - ${doctorName}`,
    `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: ${statusColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .status-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">${status === 'confirmed' ? '✅' : '❌'} Actualización de Guardia</h1>
              </div>
              <div class="content">
                <p>El Dr./Dra. <strong>${doctorName}</strong> ${statusText} la guardia:</p>
                
                <div class="status-box">
                  <p><strong>📋 Tipo:</strong> ${shiftCategory}</p>
                  <p><strong>📅 Fecha:</strong> ${shiftDate}</p>
                  <p><strong>Estado:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status.toUpperCase()}</span></p>
                </div>
                
                <div class="footer">
                  <p>Este es un correo automático de MediClock.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
  )
}

/**
 * Send free shift alert
 */
export async function sendFreeShiftAlert(
  doctorEmail: string,
  doctorName: string,
  shiftCategory: string,
  shiftArea: string,
  shiftHours: string,
  shiftDate: string
) {
  return await sendEmail(
    doctorEmail,
    `Nueva Guardia Libre Disponible - ${shiftDate}`,
    `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #8b5cf6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #faf5ff; padding: 30px; border-radius: 0 0 8px 8px; }
              .alert-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
              .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🆓 Nueva Guardia Libre</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${doctorName}</strong>,</p>
                <p>Hay una nueva guardia libre disponible que coincide con tu rol:</p>
                
                <div class="alert-box">
                  <p><strong>📅 Fecha:</strong> ${shiftDate}</p>
                  <p><strong>⏰ Horario:</strong> ${shiftHours}</p>
                  <p><strong>🏢 Área:</strong> ${shiftArea}</p>
                  <p><strong>📋 Tipo:</strong> ${shiftCategory}</p>
                </div>
                
                <p>Si estás disponible, ingresa al sistema para aceptar esta guardia.</p>
                
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="button">
                  Ver Guardia
                </a>
                
                <div class="footer">
                  <p>Este es un correo automático de MediClock.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
  )
}
