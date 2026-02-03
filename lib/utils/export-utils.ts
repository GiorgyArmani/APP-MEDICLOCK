import type { Shift, Doctor } from "@/lib/supabase/types"

export interface ShiftExportData {
    doctorName: string
    doctorEmail: string
    shiftDate: string
    shiftArea: string
    shiftCategory: string
    shiftHours: string
    clockIn: string
    clockOut: string
    status: string
    adminNotes: string
    doctorNotes: string
}

/**
 * Formats shift data for export
 */
export function formatShiftDataForExport(shifts: Shift[], doctors: Doctor[]): ShiftExportData[] {
    return shifts.map((shift) => {
        const doctor = shift.doctor_id ? doctors.find((d) => d.id === shift.doctor_id) : null

        return {
            doctorName: doctor?.full_name || "Sin asignar",
            doctorEmail: doctor?.email || "-",
            shiftDate: formatDateForExport(shift.shift_date),
            shiftArea: formatArea(shift.shift_area),
            shiftCategory: shift.shift_category,
            shiftHours: shift.shift_hours,
            clockIn: shift.clock_in ? formatTimeForExport(shift.clock_in) : "-",
            clockOut: shift.clock_out ? formatTimeForExport(shift.clock_out) : "-",
            status: formatStatus(shift.status),
            adminNotes: shift.notes || "-",
            doctorNotes: shift.doctor_notes || "-",
        }
    })
}

/**
 * Generates CSV content from shift data
 */
export function generateCSV(data: ShiftExportData[]): string {
    const headers = [
        "Médico",
        "Email",
        "Fecha",
        "Área",
        "Categoría",
        "Horario",
        "Entrada",
        "Salida",
        "Estado",
        "Notas Admin",
        "Notas Médico",
    ]

    const rows = data.map((row) => [
        row.doctorName,
        row.doctorEmail,
        row.shiftDate,
        row.shiftArea,
        row.shiftCategory,
        row.shiftHours,
        row.clockIn,
        row.clockOut,
        row.status,
        row.adminNotes,
        row.doctorNotes,
    ])

    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    return csvContent
}

/**
 * Downloads CSV file
 */
export function downloadCSV(csvContent: string, filename: string) {
    // Add UTF-8 BOM to ensure proper encoding recognition by Excel
    const BOM = "\uFEFF"
    const csvWithBOM = BOM + csvContent

    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL object
    URL.revokeObjectURL(url)
}

/**
 * Generates a monthly summary report by doctor
 */
export interface DoctorMonthlySummary {
    doctorName: string
    doctorEmail: string
    totalShifts: number
    confirmedShifts: number
    totalHours: number
    shifts: ShiftExportData[]
}

export function generateMonthlySummary(
    shifts: Shift[],
    doctors: Doctor[]
): DoctorMonthlySummary[] {
    const doctorMap = new Map<string, DoctorMonthlySummary>()

    shifts.forEach((shift) => {
        if (!shift.doctor_id) return

        const doctor = doctors.find((d) => d.id === shift.doctor_id)
        if (!doctor) return

        if (!doctorMap.has(shift.doctor_id)) {
            doctorMap.set(shift.doctor_id, {
                doctorName: doctor.full_name,
                doctorEmail: doctor.email,
                totalShifts: 0,
                confirmedShifts: 0,
                totalHours: 0,
                shifts: [],
            })
        }

        const summary = doctorMap.get(shift.doctor_id)!
        summary.totalShifts++

        if (shift.status === "confirmed") {
            summary.confirmedShifts++
        }

        // Calculate hours if clock in/out are available
        if (shift.clock_in && shift.clock_out) {
            const clockIn = new Date(shift.clock_in)
            const clockOut = new Date(shift.clock_out)
            const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
            summary.totalHours += hours
        }

        summary.shifts.push({
            doctorName: doctor.full_name,
            doctorEmail: doctor.email,
            shiftDate: formatDateForExport(shift.shift_date),
            shiftArea: formatArea(shift.shift_area),
            shiftCategory: shift.shift_category,
            shiftHours: shift.shift_hours,
            clockIn: shift.clock_in ? formatTimeForExport(shift.clock_in) : "-",
            clockOut: shift.clock_out ? formatTimeForExport(shift.clock_out) : "-",
            status: formatStatus(shift.status),
            adminNotes: shift.notes || "-",
            doctorNotes: shift.doctor_notes || "-",
        })
    })

    return Array.from(doctorMap.values()).sort((a, b) =>
        a.doctorName.localeCompare(b.doctorName)
    )
}

/**
 * Generates CSV for monthly summary
 */
export function generateMonthlySummaryCSV(summaries: DoctorMonthlySummary[]): string {
    const headers = [
        "Médico",
        "Email",
        "Total Guardias",
        "Guardias Confirmadas",
        "Horas Totales",
    ]

    const rows = summaries.map((summary) => [
        summary.doctorName,
        summary.doctorEmail,
        summary.totalShifts.toString(),
        summary.confirmedShifts.toString(),
        summary.totalHours.toFixed(2),
    ])

    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    return csvContent
}

/**
 * Generates PDF for detailed shift report using jspdf
 */
export async function generatePDF(data: ShiftExportData[], title: string, logoBase64?: string) {
    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default

    const doc = new jsPDF()

    // Add Logo if provided
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, "PNG", 160, 10, 35, 12)
        } catch (e) {
            console.error("Error adding logo to PDF:", e)
        }
    }

    // Title
    doc.setFontSize(22)
    doc.setTextColor(30, 41, 59) // slate-800
    doc.text(title, 14, 22)

    // Subheader
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30)

    // Table
    autoTable(doc, {
        startY: 40,
        head: [["Médico", "Fecha", "Área", "Horario", "Entrada", "Salida", "Estado"]],
        body: data.map(r => [
            r.doctorName,
            r.shiftDate,
            r.shiftArea,
            r.shiftHours,
            r.clockIn,
            r.clockOut,
            r.status
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 }, // blue-500
        alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
    })

    doc.save(`${title.replace(/\s+/g, "_")}.pdf`)
}

/**
 * Generates PDF for monthly summary using jspdf
 */
export async function generateMonthlySummaryPDF(summaries: DoctorMonthlySummary[], title: string, logoBase64?: string) {
    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default

    const doc = new jsPDF()

    // Add Logo if provided
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, "PNG", 160, 10, 35, 12)
        } catch (e) {
            console.error("Error adding logo to PDF:", e)
        }
    }

    // Title
    doc.setFontSize(22)
    doc.setTextColor(30, 41, 59)
    doc.text(title, 14, 22)

    // Subheader
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30)

    // Table
    autoTable(doc, {
        startY: 40,
        head: [["Médico", "Email", "Total Guardias", "Confirmadas", "Horas Totales"]],
        body: summaries.map(s => [
            s.doctorName,
            s.doctorEmail,
            s.totalShifts.toString(),
            s.confirmedShifts.toString(),
            s.totalHours.toFixed(2)
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 }, // blue-600
        alternateRowStyles: { fillColor: [248, 250, 252] },
    })

    doc.save(`${title.replace(/\s+/g, "_")}.pdf`)
}

// Helper functions
function formatDateForExport(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" })
}

function formatTimeForExport(dateTimeStr: string): string {
    return new Date(dateTimeStr).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
}

function formatArea(area: string): string {
    const areaMap: Record<string, string> = {
        consultorio: "Consultorio",
        internacion: "Internación",
        refuerzo: "Refuerzo",
        completo: "Completo",
    }
    return areaMap[area] || area
}

function formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
        new: "Nueva",
        free: "Libre",
        confirmed: "Confirmada",
        rejected: "Rechazada",
        free_pending: "Pendiente +12h",
    }
    return statusMap[status] || status
}

/**
 * Converts an image URL to a base64 string
 */
export async function getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            resolve("")
            return
        }
        const img = new Image()
        img.setAttribute("crossOrigin", "anonymous")
        img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext("2d")
            ctx?.drawImage(img, 0, 0)
            const dataURL = canvas.toDataURL("image/png")
            resolve(dataURL)
        }
        img.onerror = (error) => {
            reject(error)
        }
        img.src = url
    })
}
