export const SHIFT_TYPES = [
    { value: "consultorio_a_8_14", label: "Consultorio A 8-14", area: "consultorio", hours: "8-14" },
    { value: "consultorio_a_14_20", label: "Consultorio A 14-20", area: "consultorio", hours: "14-20" },
    { value: "consultorio_c10_8_14", label: "Consultorio C 10 8-14", area: "consultorio", hours: "8-14" },
    { value: "consultorio_c10_14_20", label: "Consultorio C 10 14-20", area: "consultorio", hours: "14-20" },
    { value: "refuerzo_8_20", label: "Refuerzo 8-20", area: "refuerzo", hours: "8-20" },
    { value: "refuerzo_14_20", label: "Refuerzo 14-20", area: "refuerzo", hours: "14-20" },
    { value: "internacion_5000_8_14", label: "Internación clínica 8-14 (5000)", area: "internacion", hours: "8-14" },
    { value: "internacion_5000_14_20", label: "Internación clínica 14-20 (5000)", area: "internacion", hours: "14-20" },
    { value: "internacion_pb_8_14", label: "Internación clínica 8-14 (PB)", area: "internacion", hours: "8-14" },
    { value: "internacion_pb_14_20", label: "Internación clínica 14-20 (PB)", area: "internacion", hours: "14-20" },
    { value: "noche_consultorio_a", label: "Noche consultorio A", area: "consultorio", hours: "20-8" },
    { value: "noche_internacion_1", label: "Noche Internación", area: "internacion", hours: "20-8" },
    { value: "noche_internacion_2", label: "Noche Internación", area: "internacion", hours: "20-8" },
    { value: "remplazo_socios", label: "Reemplazo Socios", area: "completo", hours: "variable" },
] as const

export type ShiftTypeValue = (typeof SHIFT_TYPES)[number]["value"]
