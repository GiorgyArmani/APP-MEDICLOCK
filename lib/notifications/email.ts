/**
 * Email notification service using Nodemailer (Hostinger SMTP)
 */

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@mediclock.click'

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('[Email] Missing SMTP credentials')
    return { success: false, error: 'Missing SMTP credentials' }
  }

  try {
    const info = await transporter.sendMail({
      from: `"Medi Clock" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    })

    console.log('[Email] Sent successfully:', info.messageId)
    return { success: true, emailId: info.messageId }
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
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 0; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { background: #2563eb; color: white; padding: 24px; text-align: center; }
              .content { padding: 32px; background: #f8fafc; }
              .shift-card { background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 24px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
              .detail-row { display: flex; align-items: center; margin: 12px 0; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
              .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
              .label { font-weight: 600; color: #64748b; width: 100px; }
              .value { color: #0f172a; font-weight: 500; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 8px; text-align: center; }
              .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; background: white; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🏥 Nueva Guardia Asignada</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${data.doctorName}</strong>,</p>
                <p>Se te ha asignado una nueva guardia en <strong>Medi Clock</strong>. Por favor revisa los detalles a continuación:</p>
                
                <div class="shift-card">
                  <div class="detail-row">
                    <span class="label">📅 Fecha</span>
                    <span class="value">${data.shiftDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">⏰ Horario</span>
                    <span class="value">${data.shiftHours}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">🏢 Área</span>
                    <span class="value">${data.shiftArea}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">📋 Tipo</span>
                    <span class="value">${data.shiftCategory}</span>
                  </div>
                  ${data.notes ? `
                  <div class="detail-row">
                    <span class="label">📝 Notas</span>
                    <span class="value">${data.notes}</span>
                  </div>
                  ` : ''}
                </div>
                
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://mediclock.click'}/dashboard" class="button">
                    Ver en Medi Clock
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Este es un correo automático de Medi Clock. Por favor no respondas a este mensaje.</p>
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
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 0; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { background: #f59e0b; color: white; padding: 24px; text-align: center; }
              .content { padding: 32px; background: #fffbeb; }
              .shift-card { background: white; padding: 24px; border-radius: 12px; border: 1px solid #fcd34d; margin: 24px 0; }
              .detail-row { display: flex; align-items: center; margin: 12px 0; padding-bottom: 12px; border-bottom: 1px solid #fef3c7; }
              .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
              .label { font-weight: 600; color: #92400e; width: 100px; }
              .value { color: #0f172a; font-weight: 500; }
              .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; background: white; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">⏰ Recordatorio de Guardia</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${data.doctorName}</strong>,</p>
                <p>Te recordamos que tienes una guardia programada para <strong>mañana</strong>:</p>
                
                <div class="shift-card">
                  <div class="detail-row">
                    <span class="label">📅 Fecha</span>
                    <span class="value">${data.shiftDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">⏰ Horario</span>
                    <span class="value">${data.shiftHours}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">🏢 Área</span>
                    <span class="value">${data.shiftArea}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">📋 Tipo</span>
                    <span class="value">${data.shiftCategory}</span>
                  </div>
                </div>
                
                <p style="text-align: center; font-weight: 500;">¡Que tengas una excelente guardia!</p>
              </div>
              <div class="footer">
                <p>Este es un correo automático de Medi Clock.</p>
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
  const headerColor = status === 'confirmed' ? '#059669' : '#dc2626'

  return await sendEmail(
    adminEmail,
    `Guardia ${status === 'confirmed' ? 'Confirmada' : 'Rechazada'} - ${doctorName}`,
    `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 0; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { background: ${headerColor}; color: white; padding: 24px; text-align: center; }
              .content { padding: 32px; background: #f8fafc; }
              .status-box { background: white; padding: 24px; border-radius: 12px; border-left: 6px solid ${statusColor}; margin: 24px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
              .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; background: white; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">${status === 'confirmed' ? '✅' : '❌'} Actualización de Guardia</h1>
              </div>
              <div class="content">
                <p>El médico <strong>${doctorName}</strong> ha ${statusText} la siguiente guardia:</p>
                
                <div class="status-box">
                  <p style="margin: 8px 0;"><strong>📋 Tipo:</strong> ${shiftCategory}</p>
                  <p style="margin: 8px 0;"><strong>📅 Fecha:</strong> ${shiftDate}</p>
                  <p style="margin: 8px 0;"><strong>Estado:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status.toUpperCase()}</span></p>
                </div>
              </div>
              <div class="footer">
                <p>Este es un correo automático de Medi Clock.</p>
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
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 0; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { background: #8b5cf6; color: white; padding: 24px; text-align: center; }
              .content { padding: 32px; background: #faf5ff; }
              .shift-card { background: white; padding: 24px; border-radius: 12px; border: 1px solid #e9d5ff; margin: 24px 0; }
              .detail-row { display: flex; align-items: center; margin: 12px 0; padding-bottom: 12px; border-bottom: 1px solid #f3e8ff; }
              .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
              .label { font-weight: 600; color: #7c3aed; width: 100px; }
              .value { color: #0f172a; font-weight: 500; }
              .button { display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 8px; text-align: center; }
              .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; background: white; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🆓 Nueva Guardia Libre</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${doctorName}</strong>,</p>
                <p>Hay una nueva guardia libre disponible para tu rol. ¡Sé el primero en aceptarla!</p>
                
                <div class="shift-card">
                  <div class="detail-row">
                    <span class="label">📅 Fecha</span>
                    <span class="value">${shiftDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">⏰ Horario</span>
                    <span class="value">${shiftHours}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">🏢 Área</span>
                    <span class="value">${shiftArea}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">📋 Tipo</span>
                    <span class="value">${shiftCategory}</span>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="button">
                    Aceptar Guardia
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Este es un correo automático de Medi Clock.</p>
              </div>
            </div>
          </body>
        </html>
      `
  )
}

/**
 * Send welcome email to new doctor
 */
export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  role: string
) {
  return await sendEmail(
    email,
    `Bienvenido a Medi Clock, ${fullName}`,
    `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 0; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { background: #2563eb; color: white; padding: 24px; text-align: center; }
              .content { padding: 32px; background: #f8fafc; }
              .welcome-box { background: white; padding: 24px; border-radius: 12px; border-bottom: 4px solid #2563eb; margin: 24px 0; text-align: center; }
              .role-badge { background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 16px; font-weight: 600; font-size: 14px; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 8px; text-align: center; }
              .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; background: white; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">👋 ¡Bienvenido a Medi Clock!</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${fullName}</strong>,</p>
                <p>Tu cuenta ha sido creada exitosamente. Ahora eres parte de nuestro sistema de gestión de guardias.</p>
                
                <div class="welcome-box">
                  <p style="margin-bottom: 16px; font-size: 18px;">Tu rol asignado es:</p>
                  <span class="role-badge">${role.toUpperCase()}</span>
                </div>

                <p>Con Medi Clock podrás:</p>
                <ul>
                  <li>Ver tus guardias asignadas</li>
                  <li>Recibir notificaciones de nuevas guardias</li>
                  <li>Aceptar guardias libres disponibles para tu rol</li>
                </ul>
                
                <div style="text-align: center; margin-top: 32px;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://mediclock.click'}/login" class="button">
                    Ingresar al Sistema
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Este es un correo automático de Medi Clock.</p>
              </div>
            </div>
          </body>
        </html>
      `
  )
}

/**
 * Send monthly schedule email
 */
export async function sendMonthlyScheduleEmail(
  doctorEmail: string,
  doctorName: string,
  monthName: string,
  shifts: { date: string; hours: string; category: string; area: string }[]
) {
  const shiftsRows = shifts
    .map(
      (shift) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px; font-weight: 500;">${shift.date}</td>
      <td style="padding: 12px;">${shift.hours}</td>
      <td style="padding: 12px;">${shift.category}</td>
      <td style="padding: 12px;">${shift.area}</td>
    </tr>
  `
    )
    .join("")

  return await sendEmail(
    doctorEmail,
    `Tu Cronograma de Guardias - ${monthName}`,
    `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 0; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { background: #0f172a; color: white; padding: 24px; text-align: center; }
              .content { padding: 32px; background: #f8fafc; }
              .schedule-box { background: white; padding: 0; border-radius: 12px; border: 1px solid #e2e8f0; margin: 24px 0; overflow: hidden; }
              .button { display: inline-block; background: #0f172a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 8px; text-align: center; }
              .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; background: white; border-top: 1px solid #e2e8f0; }
              table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
              th { background: #f1f5f9; padding: 12px; font-weight: 600; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">📅 Cronograma de ${monthName}</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${doctorName}</strong>,</p>
                <p>Aquí tienes el resumen de tus guardias confirmadas para el mes de <strong>${monthName}</strong>:</p>
                
                <div class="schedule-box">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Horario</th>
                        <th>Tipo</th>
                        <th>Área</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${shiftsRows}
                    </tbody>
                  </table>
                </div>

                <p>Si tienes alguna duda o necesitas realizar cambios, por favor contacta con la administración.</p>
                
                <div style="text-align: center; margin-top: 32px;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://mediclock.click'}/dashboard" class="button">
                    Ver en Medi Clock
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Este es un correo automático de Medi Clock.</p>
              </div>
            </div>
          </body>
        </html>
      `
  )
}
