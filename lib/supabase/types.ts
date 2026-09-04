export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          billing_on: boolean
          created_at: string
          id: string
          plan_type: string | null
          price: number | null
          setup_id: string
          trip_type: string | null
        }
        Insert: {
          billing_on?: boolean
          created_at?: string
          id?: string
          plan_type?: string | null
          price?: number | null
          setup_id: string
          trip_type?: string | null
        }
        Update: {
          billing_on?: boolean
          created_at?: string
          id?: string
          plan_type?: string | null
          price?: number | null
          setup_id?: string
          trip_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_setup_id_fkey"
            columns: ["setup_id"]
            isOneToOne: false
            referencedRelation: "managed_setups"
            referencedColumns: ["id"]
          },
        ]
      }
      commitments: {
        Row: {
          committed_at: string
          corridor_id: string
          id: string
          user_id: string
        }
        Insert: {
          committed_at?: string
          corridor_id: string
          id?: string
          user_id: string
        }
        Update: {
          committed_at?: string
          corridor_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commitments_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
        ]
      }
      corridors: {
        Row: {
          committed_count: number
          created_at: string
          demo: boolean
          id: string
          name: string
          status: string
          threshold: number
          trunk_type: string
        }
        Insert: {
          committed_count?: number
          created_at?: string
          demo?: boolean
          id?: string
          name: string
          status?: string
          threshold?: number
          trunk_type?: string
        }
        Update: {
          committed_count?: number
          created_at?: string
          demo?: boolean
          id?: string
          name?: string
          status?: string
          threshold?: number
          trunk_type?: string
        }
        Relationships: []
      }
      demand_prefs: {
        Row: {
          contribute_anonymised: boolean
          created_at: string
          user_id: string
        }
        Insert: {
          contribute_anonymised?: boolean
          created_at?: string
          user_id: string
        }
        Update: {
          contribute_anonymised?: boolean
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demand_signals: {
        Row: {
          created_at: string
          id: string
          mode: string | null
          od_pair: string
          preferred_route: string | null
          time_window: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string | null
          od_pair: string
          preferred_route?: string | null
          time_window?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string | null
          od_pair?: string
          preferred_route?: string | null
          time_window?: string | null
        }
        Relationships: []
      }
      eligibility: {
        Row: {
          company: string | null
          created_at: string
          domain: string | null
          employee_id: string | null
          full_name: string | null
          id: string
          partnered: boolean
          user_id: string
          work_email: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          domain?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string
          partnered?: boolean
          user_id: string
          work_email?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          domain?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string
          partnered?: boolean
          user_id?: string
          work_email?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          note: string | null
          rating: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          rating: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          rating?: number
          user_id?: string | null
        }
        Relationships: []
      }
      managed_plans: {
        Row: {
          committed_window: string | null
          created_at: string
          door_to_door_min: number | null
          id: string
          legs: Json
          monthly_fare: number | null
          per_day_fare: number | null
          setup_id: string
          transfers: number | null
          walk_m: number | null
        }
        Insert: {
          committed_window?: string | null
          created_at?: string
          door_to_door_min?: number | null
          id?: string
          legs?: Json
          monthly_fare?: number | null
          per_day_fare?: number | null
          setup_id: string
          transfers?: number | null
          walk_m?: number | null
        }
        Update: {
          committed_window?: string | null
          created_at?: string
          door_to_door_min?: number | null
          id?: string
          legs?: Json
          monthly_fare?: number | null
          per_day_fare?: number | null
          setup_id?: string
          transfers?: number | null
          walk_m?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "managed_plans_setup_id_fkey"
            columns: ["setup_id"]
            isOneToOne: false
            referencedRelation: "managed_setups"
            referencedColumns: ["id"]
          },
        ]
      }
      managed_setups: {
        Row: {
          arrive_by: string | null
          corridor_id: string | null
          created_at: string
          days: string[]
          home: string | null
          id: string
          return_after: string | null
          tower: string | null
          user_id: string
        }
        Insert: {
          arrive_by?: string | null
          corridor_id?: string | null
          created_at?: string
          days?: string[]
          home?: string | null
          id?: string
          return_after?: string | null
          tower?: string | null
          user_id: string
        }
        Update: {
          arrive_by?: string | null
          corridor_id?: string | null
          created_at?: string
          days?: string[]
          home?: string | null
          id?: string
          return_after?: string | null
          tower?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "managed_setups_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
        ]
      }
      managed_trips: {
        Row: {
          booking_id: string
          created_at: string
          date: string | null
          driver: string | null
          eta_min: number | null
          id: string
          share_link: string | null
          status: string | null
          steps: Json
          vehicle: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          date?: string | null
          driver?: string | null
          eta_min?: number | null
          id?: string
          share_link?: string | null
          status?: string | null
          steps?: Json
          vehicle?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          date?: string | null
          driver?: string | null
          eta_min?: number | null
          id?: string
          share_link?: string | null
          status?: string | null
          steps?: Json
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "managed_trips_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_domains: {
        Row: {
          corridor_id: string | null
          created_at: string
          domain: string
          employer_name: string
          id: string
        }
        Insert: {
          corridor_id?: string | null
          created_at?: string
          domain: string
          employer_name: string
          id?: string
        }
        Update: {
          corridor_id?: string | null
          created_at?: string
          domain?: string
          employer_name?: string
          id?: string
        }
        Relationships: []
      }
      places: {
        Row: {
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          source: string | null
          sub_label: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          source?: string | null
          sub_label?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          source?: string | null
          sub_label?: string | null
          type?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          co2_vs_car: number | null
          created_at: string
          fare: number | null
          id: string
          legs: Json
          name: string
          on_time: boolean
          projected_arrival: string | null
          time_vs_car_min: number | null
          total_min: number
          trip_id: string
        }
        Insert: {
          co2_vs_car?: number | null
          created_at?: string
          fare?: number | null
          id?: string
          legs?: Json
          name: string
          on_time?: boolean
          projected_arrival?: string | null
          time_vs_car_min?: number | null
          total_min: number
          trip_id: string
        }
        Update: {
          co2_vs_car?: number | null
          created_at?: string
          fare?: number | null
          id?: string
          legs?: Json
          name?: string
          on_time?: boolean
          projected_arrival?: string | null
          time_vs_car_min?: number | null
          total_min?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_fields: {
        Row: {
          created_at: string
          id: string
          key: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      saved_commutes: {
        Row: {
          arrive_by: string | null
          created_at: string
          dest_place: Json
          id: string
          label: string | null
          origin_place: Json
          preferred_mode: string | null
          user_id: string
        }
        Insert: {
          arrive_by?: string | null
          created_at?: string
          dest_place: Json
          id?: string
          label?: string | null
          origin_place: Json
          preferred_mode?: string | null
          user_id: string
        }
        Update: {
          arrive_by?: string | null
          created_at?: string
          dest_place?: Json
          id?: string
          label?: string | null
          origin_place?: Json
          preferred_mode?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          arrive_by: string | null
          created_at: string
          dest_place: Json
          id: string
          origin_place: Json
          user_id: string
        }
        Insert: {
          arrive_by?: string | null
          created_at?: string
          dest_place: Json
          id?: string
          origin_place: Json
          user_id: string
        }
        Update: {
          arrive_by?: string | null
          created_at?: string
          dest_place?: Json
          id?: string
          origin_place?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

