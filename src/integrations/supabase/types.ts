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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      edi_errors: {
        Row: {
          created_at: string | null
          details: Json | null
          element_path: string | null
          error_code: string | null
          error_message: string
          error_type: string
          file_id: string | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          segment_id: string | null
          severity: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          element_path?: string | null
          error_code?: string | null
          error_message: string
          error_type: string
          file_id?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          segment_id?: string | null
          severity: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          element_path?: string | null
          error_code?: string | null
          error_message?: string
          error_type?: string
          file_id?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          segment_id?: string | null
          severity?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edi_errors_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "edi_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edi_errors_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "edi_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_files: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_content: string
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          processed_at: string | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_content: string
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          processed_at?: string | null
          source: string
          status?: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_content?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          processed_at?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      edi_members: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          coverage_level: string | null
          created_at: string | null
          date_of_birth: string | null
          effective_date: string | null
          employer_name: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          member_id: string
          plan_code: string | null
          relationship: string | null
          ssn: string | null
          state: string | null
          status: string | null
          termination_date: string | null
          transaction_id: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          coverage_level?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          effective_date?: string | null
          employer_name?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          member_id: string
          plan_code?: string | null
          relationship?: string | null
          ssn?: string | null
          state?: string | null
          status?: string | null
          termination_date?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          coverage_level?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          effective_date?: string | null
          employer_name?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          member_id?: string
          plan_code?: string | null
          relationship?: string | null
          ssn?: string | null
          state?: string | null
          status?: string | null
          termination_date?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edi_members_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "edi_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_payments: {
        Row: {
          account_number: string | null
          created_at: string | null
          id: string
          invoice_number: string | null
          payee_name: string | null
          payer_name: string | null
          payment_amount: number
          payment_date: string
          payment_method: string | null
          posting_date: string | null
          reference_number: string | null
          routing_number: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          account_number?: string | null
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          payee_name?: string | null
          payer_name?: string | null
          payment_amount: number
          payment_date: string
          payment_method?: string | null
          posting_date?: string | null
          reference_number?: string | null
          routing_number?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          account_number?: string | null
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          payee_name?: string | null
          payer_name?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string | null
          posting_date?: string | null
          reference_number?: string | null
          routing_number?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edi_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "edi_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_transactions: {
        Row: {
          control_number: string | null
          created_at: string | null
          file_id: string | null
          id: string
          parsed_data: Json | null
          raw_segments: Json | null
          receiver_id: string | null
          segment_count: number | null
          sender_id: string | null
          transaction_date: string | null
          transaction_type: string
        }
        Insert: {
          control_number?: string | null
          created_at?: string | null
          file_id?: string | null
          id?: string
          parsed_data?: Json | null
          raw_segments?: Json | null
          receiver_id?: string | null
          segment_count?: number | null
          sender_id?: string | null
          transaction_date?: string | null
          transaction_type: string
        }
        Update: {
          control_number?: string | null
          created_at?: string | null
          file_id?: string | null
          id?: string
          parsed_data?: Json | null
          raw_segments?: Json | null
          receiver_id?: string | null
          segment_count?: number | null
          sender_id?: string | null
          transaction_date?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "edi_transactions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "edi_files"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_cache: {
        Row: {
          computed_at: string | null
          expires_at: string | null
          id: string
          metric_key: string
          metric_type: string
          metric_value: Json
        }
        Insert: {
          computed_at?: string | null
          expires_at?: string | null
          id?: string
          metric_key: string
          metric_type: string
          metric_value: Json
        }
        Update: {
          computed_at?: string | null
          expires_at?: string | null
          id?: string
          metric_key?: string
          metric_type?: string
          metric_value?: Json
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
  public: {
    Enums: {},
  },
} as const
