export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      email_preferences: {
        Row: {
          family_id: string
          id: string
          reminder_days_threshold: number
          reminder_enabled: boolean
          summary_frequency: Database["public"]["Enums"]["email_frequency"]
          summary_months_ahead: number
          updated_at: string
        }
        Insert: {
          family_id: string
          id?: string
          reminder_days_threshold?: number
          reminder_enabled?: boolean
          summary_frequency?: Database["public"]["Enums"]["email_frequency"]
          summary_months_ahead?: number
          updated_at?: string
        }
        Update: {
          family_id?: string
          id?: string
          reminder_days_threshold?: number
          reminder_enabled?: boolean
          summary_frequency?: Database["public"]["Enums"]["email_frequency"]
          summary_months_ahead?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_preferences_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: true
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      event_families: {
        Row: {
          event_id: string
          family_id: string
          id: string
          shared_at: string
          shared_by: string | null
        }
        Insert: {
          event_id: string
          family_id: string
          id?: string
          shared_at?: string
          shared_by?: string | null
        }
        Update: {
          event_id?: string
          family_id?: string
          id?: string
          shared_at?: string
          shared_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_families_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_families_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["event_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["event_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["event_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean | null
          created_at: string
          creator_id: string
          date: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          time: string
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string
          creator_id: string
          date: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          time: string
        }
        Update: {
          all_day?: boolean | null
          created_at?: string
          creator_id?: string
          date?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          email: string
          family_id: string
          id: string
          joined_at: string | null
          name: string
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Insert: {
          email: string
          family_id: string
          id?: string
          joined_at?: string | null
          name?: string
          role?: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Update: {
          email?: string
          family_id?: string
          id?: string
          joined_at?: string | null
          name?: string
          role?: Database["public"]["Enums"]["family_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          email: string
          family_id: string
          id: string
          invited_at: string
          invited_by: string | null
          last_invited: string | null
          role: Database["public"]["Enums"]["family_role"]
          status: string
        }
        Insert: {
          email: string
          family_id: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          last_invited?: string | null
          role?: Database["public"]["Enums"]["family_role"]
          status?: string
        }
        Update: {
          email?: string
          family_id?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          last_invited?: string | null
          role?: Database["public"]["Enums"]["family_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          Email: string | null
          full_name: string | null
          id: string
          invitation_token: string | null
          notification_preferences: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          Email?: string | null
          full_name?: string | null
          id: string
          invitation_token?: string | null
          notification_preferences?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          Email?: string | null
          full_name?: string | null
          id?: string
          invitation_token?: string | null
          notification_preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          color_code: string
          created_at: string
          email: string
          id: string
          name: string
          password_hash: string
        }
        Insert: {
          color_code: string
          created_at?: string
          email: string
          id?: string
          name: string
          password_hash: string
        }
        Update: {
          color_code?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          password_hash?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_type?: string
          p_metadata?: Json
          p_action_url?: string
        }
        Returns: string
      }
      delete_user_profile: {
        Args: { user_id: number }
        Returns: undefined
      }
      get_all_family_members_for_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          family_id: string
          id: string
          joined_at: string | null
          name: string
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }[]
      }
      get_family_members: {
        Args: { p_family_ids: string[] }
        Returns: {
          email: string
          family_id: string
          id: string
          joined_at: string | null
          name: string
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }[]
      }
      get_family_members_by_family_id: {
        Args: { p_family_id: string }
        Returns: {
          email: string
          family_id: string
          id: string
          joined_at: string | null
          name: string
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }[]
      }
      get_family_members_without_recursion: {
        Args: { p_family_ids: string[] }
        Returns: {
          email: string
          family_id: string
          id: string
          joined_at: string | null
          name: string
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }[]
      }
      get_user_families: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          color: string
          created_by: string
          created_at: string
        }[]
      }
      get_user_profile: {
        Args: { user_id: number }
        Returns: {
          id: number
          username: string
          email: string
          created_at: string
        }[]
      }
      handle_invitation_accept: {
        Args: { invitation_id: string; user_id: string }
        Returns: boolean
      }
      is_event_owner: {
        Args: { event_id: string }
        Returns: boolean
      }
      is_family_admin: {
        Args: { family_id_param: string }
        Returns: boolean
      }
      is_family_member: {
        Args: { family_id_param: string }
        Returns: boolean
      }
      is_user_in_family: {
        Args: { family_id_param: string }
        Returns: boolean
      }
      safe_create_family: {
        Args: { p_name: string; p_user_id: string }
        Returns: string
      }
      safe_is_family_admin: {
        Args: { p_family_id: string }
        Returns: boolean
      }
      safe_is_family_member: {
        Args: { p_family_id: string }
        Returns: boolean
      }
      update_user_profile: {
        Args: { user_id: number; new_username: string; new_email: string }
        Returns: undefined
      }
      user_can_access_event: {
        Args: { event_id_param: string }
        Returns: boolean
      }
      user_families: {
        Args: Record<PropertyKey, never>
        Returns: {
          family_id: string
        }[]
      }
      user_is_admin_of_family: {
        Args: { p_family_id: string; p_user_id: string }
        Returns: boolean
      }
      user_is_family_member: {
        Args: { family_id_param: string }
        Returns: boolean
      }
      user_is_family_member_safe: {
        Args: { family_id_param: string }
        Returns: boolean
      }
      user_is_in_family: {
        Args: { family_id_param: string }
        Returns: boolean
      }
      user_is_member_of_family: {
        Args: { p_family_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      email_frequency: "daily" | "weekly" | "biweekly" | "monthly" | "never"
      event_status: "Pending" | "Accepted" | "Declined"
      family_role: "admin" | "member" | "child"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      email_frequency: ["daily", "weekly", "biweekly", "monthly", "never"],
      event_status: ["Pending", "Accepted", "Declined"],
      family_role: ["admin", "member", "child"],
    },
  },
} as const
