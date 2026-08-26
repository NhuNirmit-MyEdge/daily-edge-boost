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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          date_added: string
          id: string
          name: string
        }
        Insert: {
          date_added?: string
          id?: string
          name: string
        }
        Update: {
          date_added?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      company_updates: {
        Row: {
          company_id: string
          created_at: string
          entry_date: string
          headline: string
          id: string
          source_url: string | null
          summary: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          entry_date?: string
          headline: string
          id?: string
          source_url?: string | null
          summary?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          entry_date?: string
          headline?: string
          id?: string
          source_url?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_updates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_entries: {
        Row: {
          created_at: string
          entry_date: string
          influencers: Json
          lesson: Json | null
          news_brief: Json
          perspective_of_the_day: Json | null
          quiz: Json
          task: string | null
          term_of_the_day: Json | null
          updated_at: string
          user_id: string | null
          video_recommendation: Json | null
        }
        Insert: {
          created_at?: string
          entry_date: string
          influencers?: Json
          lesson?: Json | null
          news_brief?: Json
          perspective_of_the_day?: Json | null
          quiz?: Json
          task?: string | null
          term_of_the_day?: Json | null
          updated_at?: string
          user_id?: string | null
          video_recommendation?: Json | null
        }
        Update: {
          created_at?: string
          entry_date?: string
          influencers?: Json
          lesson?: Json | null
          news_brief?: Json
          perspective_of_the_day?: Json | null
          quiz?: Json
          task?: string | null
          term_of_the_day?: Json | null
          updated_at?: string
          user_id?: string | null
          video_recommendation?: Json | null
        }
        Relationships: []
      }
      event_stars: {
        Row: {
          event_id: string
          starred_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          starred_at?: string
          user_id?: string
        }
        Update: {
          event_id?: string
          starred_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_stars_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          location: string | null
          name: string
          relevance_note: string | null
          start_date: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          relevance_note?: string | null
          start_date?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          relevance_note?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      lesson_reflections: {
        Row: {
          answer: string
          entry_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string
          entry_date: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          answer?: string
          entry_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          id: string
          last_completed_date: string | null
          streak_count: number
          topics_covered: string[]
          user_id: string | null
        }
        Insert: {
          id?: string
          last_completed_date?: string | null
          streak_count?: number
          topics_covered?: string[]
          user_id?: string | null
        }
        Update: {
          id?: string
          last_completed_date?: string | null
          streak_count?: number
          topics_covered?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age_range: string | null
          created_at: string
          email: string
          focus_topics: string[]
          gender: string | null
          id: string
          is_admin: boolean
          name: string | null
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          created_at?: string
          email: string
          focus_topics?: string[]
          gender?: string | null
          id: string
          is_admin?: boolean
          name?: string | null
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          created_at?: string
          email?: string
          focus_topics?: string[]
          gender?: string | null
          id?: string
          is_admin?: boolean
          name?: string | null
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_tracked_companies: {
        Row: {
          company_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          user_id?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tracked_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      section_views: {
        Row: {
          section: string
          user_id: string
          view_date: string
          viewed_at: string
        }
        Insert: {
          section: string
          user_id?: string
          view_date?: string
          viewed_at?: string
        }
        Update: {
          section?: string
          user_id?: string
          view_date?: string
          viewed_at?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          correct: boolean
          created_at: string
          entry_date: string
          id: string
          question_index: number
          selected_index: number
          user_id: string
        }
        Insert: {
          correct?: boolean
          created_at?: string
          entry_date: string
          id?: string
          question_index: number
          selected_index: number
          user_id?: string
        }
        Update: {
          correct?: boolean
          created_at?: string
          entry_date?: string
          id?: string
          question_index?: number
          selected_index?: number
          user_id?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          completed: boolean
          completed_at: string | null
          entry_date: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          entry_date: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          entry_date?: string
          id?: string
          note?: string | null
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
  public: {
    Enums: {},
  },
} as const
