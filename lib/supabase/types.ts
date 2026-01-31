export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DoctorRole = "doctor" | "administrator"
export type ShiftStatus = "new" | "free" | "confirmed" | "rejected" | "free_pending"
export type ShiftType = "assigned" | "free"

export interface Database {
  public: {
    Tables: {
      doctors: {
        Row: {
          id: string
          email: string
          full_name: string
          phone_number: string | null
          role: DoctorRole
          rejected_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone_number?: string | null
          role: DoctorRole
          rejected_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone_number?: string | null
          role?: DoctorRole
          rejected_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          id: string
          doctor_id: string | null
          shift_type: ShiftType
          shift_category: string
          shift_area: string
          shift_hours: string
          shift_date: string
          status: ShiftStatus
          notes: string | null
          free_pending_at: string | null
          created_at: string
          updated_at: string
          recurrence_id: string | null
          clock_in: string | null
          clock_out: string | null
          doctor_notes: string | null
        }
        Insert: {
          id?: string
          doctor_id?: string | null
          shift_type?: ShiftType
          shift_category: string
          shift_area: string
          shift_hours: string
          shift_date: string
          status?: ShiftStatus
          notes?: string | null
          assigned_to_pool?: DoctorRole[] | null
          free_pending_at?: string | null
          created_at?: string
          updated_at?: string
          recurrence_id?: string | null
          clock_in?: string | null
          clock_out?: string | null
          doctor_notes?: string | null
        }
        Update: {
          id?: string
          doctor_id?: string | null
          shift_type?: ShiftType
          shift_category?: string
          shift_area?: string
          shift_hours?: string
          shift_date?: string
          status?: ShiftStatus
          notes?: string | null
          assigned_to_pool?: DoctorRole[] | null
          free_pending_at?: string | null
          created_at?: string
          updated_at?: string
          recurrence_id?: string | null
          clock_in?: string | null
          clock_out?: string | null
          doctor_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          }
        ]
      }
      shift_events: {
        Row: {
          id: string
          shift_id: string
          event_type: string
          doctor_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shift_id: string
          event_type: string
          doctor_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shift_id?: string
          event_type?: string
          doctor_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_events_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_events_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          }
        ]
      }
      availability: {
        Row: {
          id: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          type: string
          message: string
          shift_id: string | null
          doctor_id: string | null
          recipient_role: DoctorRole | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          message: string
          shift_id?: string | null
          doctor_id?: string | null
          recipient_role?: DoctorRole | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          message?: string
          shift_id?: string | null
          doctor_id?: string | null
          recipient_role?: DoctorRole | null
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          }
        ]
      },
      users: {
        Row: {
          id: string
          role: string
        }
        Insert: {
          id: string
          role: string
        }
        Update: {
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      doctor_role: DoctorRole
      shift_status: ShiftStatus
      shift_type: ShiftType
    }
    CompositeTypes: {}
  }
}

// Export type aliases for convenience
export type Doctor = Database["public"]["Tables"]["doctors"]["Row"]
export type DoctorInsert = Database["public"]["Tables"]["doctors"]["Insert"]
export type DoctorUpdate = Database["public"]["Tables"]["doctors"]["Update"]

export type Shift = Database["public"]["Tables"]["shifts"]["Row"]
export type ShiftInsert = Database["public"]["Tables"]["shifts"]["Insert"]
export type ShiftUpdate = Database["public"]["Tables"]["shifts"]["Update"]

export type ShiftEvent = Database["public"]["Tables"]["shift_events"]["Row"]
export type ShiftEventInsert = Database["public"]["Tables"]["shift_events"]["Insert"]

export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"]
