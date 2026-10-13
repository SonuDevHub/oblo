export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_verifications: {
        Row: {
          college_name: string
          course: string
          dl_number: string
          dl_path: string
          id: string
          id_card_path: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roll_no: string
          selfie_path: string | null
          status: string
          submitted_at: string
          user_id: string
          year: string
        }
        Insert: {
          college_name: string
          course: string
          dl_number: string
          dl_path: string
          id?: string
          id_card_path: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roll_no: string
          selfie_path?: string | null
          status?: string
          submitted_at?: string
          user_id: string
          year: string
        }
        Update: {
          college_name?: string
          course?: string
          dl_number?: string
          dl_path?: string
          id?: string
          id_card_path?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roll_no?: string
          selfie_path?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_blocked: boolean
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_blocked?: boolean
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      ride_requests: {
        Row: {
          created_at: string
          drop_stop_id: string
          fare_estimate: number | null
          id: string
          pickup_stop_id: string
          reject_reason: string | null
          ride_id: string
          rider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          drop_stop_id: string
          fare_estimate?: number | null
          id?: string
          pickup_stop_id: string
          reject_reason?: string | null
          ride_id: string
          rider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          drop_stop_id?: string
          fare_estimate?: number | null
          id?: string
          pickup_stop_id?: string
          reject_reason?: string | null
          ride_id?: string
          rider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_requests_drop_stop_id_fkey"
            columns: ["drop_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_pickup_stop_id_fkey"
            columns: ["pickup_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "v_rides_with_seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          created_at: string
          end_stop_id: string
          id: string
          owner_id: string
          rate_per_km: number
          ride_date: string
          ride_time: string
          route_id: string
          start_stop_id: string
          status: string
          total_seats: number
          vehicle_id: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          end_stop_id: string
          id?: string
          owner_id: string
          rate_per_km: number
          ride_date: string
          ride_time: string
          route_id: string
          start_stop_id: string
          status?: string
          total_seats: number
          vehicle_id: string
          vehicle_type: string
        }
        Update: {
          created_at?: string
          end_stop_id?: string
          id?: string
          owner_id?: string
          rate_per_km?: number
          ride_date?: string
          ride_time?: string
          route_id?: string
          start_stop_id?: string
          status?: string
          total_seats?: number
          vehicle_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_end_stop_id_fkey"
            columns: ["end_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_start_stop_id_fkey"
            columns: ["start_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      stops: {
        Row: {
          id: string
          km_from_start: number
          name: string
          route_id: string
          stop_order: number
        }
        Insert: {
          id?: string
          km_from_start: number
          name: string
          route_id: string
          stop_order: number
        }
        Update: {
          id?: string
          km_from_start?: number
          name?: string
          route_id?: string
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand_model: string
          color: string
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          plate_number: string
          vehicle_type: string
        }
        Insert: {
          brand_model: string
          color: string
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id: string
          plate_number: string
          vehicle_type: string
        }
        Update: {
          brand_model?: string
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          plate_number?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_rides_with_seats: {
        Row: {
          created_at: string | null
          end_km: number | null
          end_stop_id: string | null
          end_stop_name: string | null
          end_stop_order: number | null
          id: string | null
          is_full: boolean | null
          is_verified_driver: boolean | null
          owner_id: string | null
          owner_name: string | null
          rate_per_km: number | null
          ride_date: string | null
          ride_time: string | null
          route_id: string | null
          route_name: string | null
          seats_left: number | null
          start_km: number | null
          start_stop_id: string | null
          start_stop_name: string | null
          start_stop_order: number | null
          status: string | null
          total_seats: number | null
          vehicle_brand_model: string | null
          vehicle_color: string | null
          vehicle_id: string | null
          vehicle_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_end_stop_id_fkey"
            columns: ["end_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_start_stop_id_fkey"
            columns: ["start_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_vehicle: {
        Args: {
          p_brand_model: string
          p_color: string
          p_plate_number: string
          p_vehicle_type: string
        }
        Returns: {
          brand_model: string
          color: string
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          plate_number: string
          vehicle_type: string
        }
        SetofOptions: {
          from: "*"
          to: "vehicles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_override_request: {
        Args: { p_reason?: string; p_request_id: string; p_status: string }
        Returns: {
          created_at: string
          drop_stop_id: string
          fare_estimate: number | null
          id: string
          pickup_stop_id: string
          reject_reason: string | null
          ride_id: string
          rider_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ride_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_reset_demo: { Args: never; Returns: boolean }
      admin_review_verification: {
        Args: {
          p_approve: boolean
          p_reason?: string
          p_verification_id: string
        }
        Returns: {
          college_name: string
          course: string
          dl_number: string
          dl_path: string
          id: string
          id_card_path: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roll_no: string
          selfie_path: string | null
          status: string
          submitted_at: string
          user_id: string
          year: string
        }
        SetofOptions: {
          from: "*"
          to: "driver_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_revoke_driver: {
        Args: { p_reason: string; p_user_id: string }
        Returns: {
          college_name: string
          course: string
          dl_number: string
          dl_path: string
          id: string
          id_card_path: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roll_no: string
          selfie_path: string | null
          status: string
          submitted_at: string
          user_id: string
          year: string
        }
        SetofOptions: {
          from: "*"
          to: "driver_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_user_blocked: {
        Args: { p_blocked: boolean; p_user_id: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_blocked: boolean
          phone: string | null
          role: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_stats: { Args: never; Returns: Json }
      calculate_ride_fares: { Args: { p_ride_id: string }; Returns: Json }
      cancel_request: {
        Args: { p_request_id: string }
        Returns: {
          created_at: string
          drop_stop_id: string
          fare_estimate: number | null
          id: string
          pickup_stop_id: string
          reject_reason: string | null
          ride_id: string
          rider_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ride_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_ride: { Args: { p_ride_id: string }; Returns: boolean }
      create_ride: {
        Args: {
          p_end_stop_id: string
          p_rate_per_km: number
          p_ride_date: string
          p_ride_time: string
          p_route_id: string
          p_start_stop_id: string
          p_total_seats: number
          p_vehicle_id: string
        }
        Returns: {
          created_at: string
          end_stop_id: string
          id: string
          owner_id: string
          rate_per_km: number
          ride_date: string
          ride_time: string
          route_id: string
          start_stop_id: string
          status: string
          total_seats: number
          vehicle_id: string
          vehicle_type: string
        }
        SetofOptions: {
          from: "*"
          to: "rides"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_vehicle: { Args: { p_vehicle_id: string }; Returns: boolean }
      get_accepted_count: { Args: { p_ride_id: string }; Returns: number }
      get_my_verification: {
        Args: never
        Returns: {
          college_name: string
          course: string
          dl_number: string
          dl_path: string
          id: string
          id_card_path: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roll_no: string
          selfie_path: string | null
          status: string
          submitted_at: string
          user_id: string
          year: string
        }[]
        SetofOptions: {
          from: "*"
          to: "driver_verifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_ride_contact: {
        Args: { p_ride_id: string }
        Returns: {
          brand_model: string
          color: string
          owner_name: string
          owner_phone: string
          plate_number: string
          vehicle_type: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_verified_driver: { Args: { p_user_id: string }; Returns: boolean }
      request_seat: {
        Args: {
          p_drop_stop_id: string
          p_pickup_stop_id: string
          p_ride_id: string
        }
        Returns: {
          created_at: string
          drop_stop_id: string
          fare_estimate: number | null
          id: string
          pickup_stop_id: string
          reject_reason: string | null
          ride_id: string
          rider_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ride_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      respond_to_request: {
        Args: { p_request_id: string; p_status: string }
        Returns: {
          created_at: string
          drop_stop_id: string
          fare_estimate: number | null
          id: string
          pickup_stop_id: string
          reject_reason: string | null
          ride_id: string
          rider_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ride_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      search_rides: {
        Args: {
          p_date: string
          p_from_stop_id: string
          p_limit?: number
          p_page?: number
          p_pref_time?: string
          p_to_stop_id: string
          p_vehicle_type?: string
        }
        Returns: {
          end_stop_id: string
          end_stop_name: string
          estimated_fare: number
          is_exact_route: boolean
          is_full: boolean
          is_verified_driver: boolean
          owner_id: string
          owner_name: string
          rate_per_km: number
          ride_date: string
          ride_id: string
          ride_time: string
          route_id: string
          route_name: string
          seats_left: number
          start_stop_id: string
          start_stop_name: string
          status: string
          time_diff_minutes: number
          total_seats: number
          vehicle_brand_model: string
          vehicle_color: string
          vehicle_type: string
        }[]
      }
      submit_driver_verification: {
        Args: {
          p_college_name: string
          p_course: string
          p_dl_number: string
          p_dl_path: string
          p_id_card_path: string
          p_roll_no: string
          p_selfie_path?: string
          p_year: string
        }
        Returns: {
          college_name: string
          course: string
          dl_number: string
          dl_path: string
          id: string
          id_card_path: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roll_no: string
          selfie_path: string | null
          status: string
          submitted_at: string
          user_id: string
          year: string
        }
        SetofOptions: {
          from: "*"
          to: "driver_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_vehicle: {
        Args: {
          p_brand_model: string
          p_color: string
          p_plate_number: string
          p_vehicle_id: string
        }
        Returns: {
          brand_model: string
          color: string
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          plate_number: string
          vehicle_type: string
        }
        SetofOptions: {
          from: "*"
          to: "vehicles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
