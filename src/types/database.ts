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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      claim_events: {
        Row: {
          claim_id: string
          created_at: string
          event_type: string
          id: string
          key: string | null
          source: string | null
          value: string | null
        }
        Insert: {
          claim_id: string
          created_at?: string
          event_type: string
          id?: string
          key?: string | null
          source?: string | null
          value?: string | null
        }
        Update: {
          claim_id?: string
          created_at?: string
          event_type?: string
          id?: string
          key?: string | null
          source?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_events_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_subjects: {
        Row: {
          call_category: string | null
          claim_id: string
          company_identified: boolean
          company_name: string | null
          created_at: string
          exempt_reason: string | null
          id: string
          is_exempt: boolean
          metadata: Json | null
          phone_number: string | null
          phone_number_normalized: string | null
          registered_agent_address: string | null
          registered_agent_lookup_source: string | null
          registered_agent_name: string | null
          spam_db_complaint_count: number | null
          spam_db_confidence_score: number | null
          spam_db_source: string | null
        }
        Insert: {
          call_category?: string | null
          claim_id: string
          company_identified?: boolean
          company_name?: string | null
          created_at?: string
          exempt_reason?: string | null
          id?: string
          is_exempt?: boolean
          metadata?: Json | null
          phone_number?: string | null
          phone_number_normalized?: string | null
          registered_agent_address?: string | null
          registered_agent_lookup_source?: string | null
          registered_agent_name?: string | null
          spam_db_complaint_count?: number | null
          spam_db_confidence_score?: number | null
          spam_db_source?: string | null
        }
        Update: {
          call_category?: string | null
          claim_id?: string
          company_identified?: boolean
          company_name?: string | null
          created_at?: string
          exempt_reason?: string | null
          id?: string
          is_exempt?: boolean
          metadata?: Json | null
          phone_number?: string | null
          phone_number_normalized?: string | null
          registered_agent_address?: string | null
          registered_agent_lookup_source?: string | null
          registered_agent_name?: string | null
          spam_db_complaint_count?: number | null
          spam_db_confidence_score?: number | null
          spam_db_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_subjects_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          anonymous_session_id: string | null
          claim_strength: string | null
          created_at: string
          estimated_value_high_cents: number | null
          estimated_value_low_cents: number | null
          estimated_value_realistic_cents: number | null
          id: string
          status: string
          updated_at: string
          user_id: string | null
          violation_type: string
        }
        Insert: {
          anonymous_session_id?: string | null
          claim_strength?: string | null
          created_at?: string
          estimated_value_high_cents?: number | null
          estimated_value_low_cents?: number | null
          estimated_value_realistic_cents?: number | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          violation_type: string
        }
        Update: {
          anonymous_session_id?: string | null
          claim_strength?: string | null
          created_at?: string
          estimated_value_high_cents?: number | null
          estimated_value_low_cents?: number | null
          estimated_value_realistic_cents?: number | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_violation_type_fkey"
            columns: ["violation_type"]
            isOneToOne: false
            referencedRelation: "violation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      dnc_check_results: {
        Row: {
          claim_id: string
          claim_subject_id: string | null
          created_at: string
          federal_dnc_checked_at: string | null
          federal_dnc_eligible: boolean | null
          federal_dnc_registered: boolean | null
          federal_dnc_registration_date: string | null
          id: string
          internal_dnc_stop_request_date: string | null
          internal_dnc_stop_request_method: string | null
          internal_dnc_violated: boolean | null
          phone_number_normalized: string
          state_dnc_applicable: boolean | null
          state_dnc_checked_at: string | null
          state_dnc_registered: boolean | null
          state_dnc_state: string | null
        }
        Insert: {
          claim_id: string
          claim_subject_id?: string | null
          created_at?: string
          federal_dnc_checked_at?: string | null
          federal_dnc_eligible?: boolean | null
          federal_dnc_registered?: boolean | null
          federal_dnc_registration_date?: string | null
          id?: string
          internal_dnc_stop_request_date?: string | null
          internal_dnc_stop_request_method?: string | null
          internal_dnc_violated?: boolean | null
          phone_number_normalized: string
          state_dnc_applicable?: boolean | null
          state_dnc_checked_at?: string | null
          state_dnc_registered?: boolean | null
          state_dnc_state?: string | null
        }
        Update: {
          claim_id?: string
          claim_subject_id?: string | null
          created_at?: string
          federal_dnc_checked_at?: string | null
          federal_dnc_eligible?: boolean | null
          federal_dnc_registered?: boolean | null
          federal_dnc_registration_date?: string | null
          id?: string
          internal_dnc_stop_request_date?: string | null
          internal_dnc_stop_request_method?: string | null
          internal_dnc_violated?: boolean | null
          phone_number_normalized?: string
          state_dnc_applicable?: boolean | null
          state_dnc_checked_at?: string | null
          state_dnc_registered?: boolean | null
          state_dnc_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dnc_check_results_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dnc_check_results_claim_subject_id_fkey"
            columns: ["claim_subject_id"]
            isOneToOne: false
            referencedRelation: "claim_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_lead_declines: {
        Row: {
          created_at: string
          firm_id: string
          id: string
          lead_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          firm_id: string
          id?: string
          lead_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          firm_id?: string
          id?: string
          lead_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "firm_lead_declines_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_lead_declines_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          firm_id: string
          full_name: string | null
          id: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          firm_id: string
          full_name?: string | null
          id?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          firm_id?: string
          full_name?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_users_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      law_firms: {
        Row: {
          contact_email: string
          created_at: string
          id: string
          is_active: boolean
          lead_fee_cents: number | null
          min_claim_strength: string | null
          min_claim_value_cents: number | null
          name: string
          stripe_connect_account_id: string | null
          stripe_connect_charges_enabled: boolean
          stripe_connect_details_submitted: boolean
          target_states: string[] | null
          violation_types: string[] | null
        }
        Insert: {
          contact_email: string
          created_at?: string
          id?: string
          is_active?: boolean
          lead_fee_cents?: number | null
          min_claim_strength?: string | null
          min_claim_value_cents?: number | null
          name: string
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean
          stripe_connect_details_submitted?: boolean
          target_states?: string[] | null
          violation_types?: string[] | null
        }
        Update: {
          contact_email?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lead_fee_cents?: number | null
          min_claim_strength?: string | null
          min_claim_value_cents?: number | null
          name?: string
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean
          stripe_connect_details_submitted?: boolean
          target_states?: string[] | null
          violation_types?: string[] | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          accepted_at: string | null
          assigned_firm_id: string | null
          claim_id: string
          claim_strength: string | null
          closed_at: string | null
          consumer_state: string | null
          contacted_at: string | null
          created_at: string
          estimated_value_high_cents: number | null
          estimated_value_low_cents: number | null
          estimated_value_realistic_cents: number | null
          evidence_pdf_url: string | null
          firm_status_reminder_sent_at: string | null
          id: string
          lead_fee_cents: number | null
          retained_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
          violation_type: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_firm_id?: string | null
          claim_id: string
          claim_strength?: string | null
          closed_at?: string | null
          consumer_state?: string | null
          contacted_at?: string | null
          created_at?: string
          firm_status_reminder_sent_at?: string | null
          estimated_value_high_cents?: number | null
          estimated_value_low_cents?: number | null
          estimated_value_realistic_cents?: number | null
          evidence_pdf_url?: string | null
          id?: string
          lead_fee_cents?: number | null
          retained_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
          violation_type: string
        }
        Update: {
          accepted_at?: string | null
          assigned_firm_id?: string | null
          claim_id?: string
          claim_strength?: string | null
          closed_at?: string | null
          consumer_state?: string | null
          contacted_at?: string | null
          created_at?: string
          estimated_value_high_cents?: number | null
          estimated_value_low_cents?: number | null
          estimated_value_realistic_cents?: number | null
          evidence_pdf_url?: string | null
          firm_status_reminder_sent_at?: string | null
          id?: string
          lead_fee_cents?: number | null
          retained_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_firm_id_fkey"
            columns: ["assigned_firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_violation_type_fkey"
            columns: ["violation_type"]
            isOneToOne: false
            referencedRelation: "violation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          amount_paid_cents: number
          claim_id: string
          claim_subject_id: string | null
          created_at: string
          demand_scenario: string | null
          downloaded_at: string | null
          generated_at: string | null
          id: string
          letter_content: string | null
          letter_prompt: string | null
          pdf_url: string | null
          stripe_payment_intent_id: string | null
          user_id: string
          violation_type: string | null
        }
        Insert: {
          amount_paid_cents?: number
          claim_id: string
          claim_subject_id?: string | null
          created_at?: string
          demand_scenario?: string | null
          downloaded_at?: string | null
          generated_at?: string | null
          id?: string
          letter_content?: string | null
          letter_prompt?: string | null
          pdf_url?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
          violation_type?: string | null
        }
        Update: {
          amount_paid_cents?: number
          claim_id?: string
          claim_subject_id?: string | null
          created_at?: string
          demand_scenario?: string | null
          downloaded_at?: string | null
          generated_at?: string | null
          id?: string
          letter_content?: string | null
          letter_prompt?: string | null
          pdf_url?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
          violation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "letters_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_claim_subject_id_fkey"
            columns: ["claim_subject_id"]
            isOneToOne: false
            referencedRelation: "claim_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_violation_type_fkey"
            columns: ["violation_type"]
            isOneToOne: false
            referencedRelation: "violation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_waitlist: {
        Row: {
          anonymous_session_id: string | null
          claim_id: string | null
          created_at: string
          email: string
          email_hash: string
          id: string
          marketing_consent: boolean
          source: string
        }
        Insert: {
          anonymous_session_id?: string | null
          claim_id?: string | null
          created_at?: string
          email: string
          email_hash: string
          id?: string
          marketing_consent?: boolean
          source: string
        }
        Update: {
          anonymous_session_id?: string | null
          claim_id?: string | null
          created_at?: string
          email?: string
          email_hash?: string
          id?: string
          marketing_consent?: boolean
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_waitlist_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          action: string
          bucket_key: string
          hit_count: number
          scope: string
          window_start: string
        }
        Insert: {
          action: string
          bucket_key: string
          hit_count?: number
          scope: string
          window_start: string
        }
        Update: {
          action?: string
          bucket_key?: string
          hit_count?: number
          scope?: string
          window_start?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          receiving_phone: string | null
          receiving_phone_normalized: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          receiving_phone?: string | null
          receiving_phone_normalized?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          receiving_phone?: string | null
          receiving_phone_normalized?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      violation_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          standard_damages_cents: number | null
          statute: string | null
          statute_of_limitations_years: number | null
          willful_damages_cents: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          label: string
          standard_damages_cents?: number | null
          statute?: string | null
          statute_of_limitations_years?: number | null
          willful_damages_cents?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          standard_damages_cents?: number | null
          statute?: string | null
          statute_of_limitations_years?: number | null
          willful_damages_cents?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_rate_limit: {
        Args: {
          p_action: string
          p_bucket_key: string
          p_max_count: number
          p_scope: string
          p_window_secs?: number
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
