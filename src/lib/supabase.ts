import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string
          date_of_birth: string | null
          is_child: boolean | null
          parent_consent_given: boolean | null
          parent_consent_date: string | null
          privacy_settings: any | null
          created_at: string | null
          updated_at: string | null
          preferred_language: string | null
        }
        Insert: {
          id: string
          email?: string | null
          display_name: string
          date_of_birth?: string | null
          is_child?: boolean | null
          parent_consent_given?: boolean | null
          parent_consent_date?: string | null
          privacy_settings?: any | null
          created_at?: string | null
          updated_at?: string | null
          preferred_language?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string
          date_of_birth?: string | null
          is_child?: boolean | null
          parent_consent_given?: boolean | null
          parent_consent_date?: string | null
          privacy_settings?: any | null
          created_at?: string | null
          updated_at?: string | null
          preferred_language?: string | null
        }
      }
      parent_child_relationships: {
        Row: {
          id: string
          parent_id: string
          child_id: string
          relationship_type: string | null
          consent_given: boolean | null
          consent_date: string | null
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          parent_id: string
          child_id: string
          relationship_type?: string | null
          consent_given?: boolean | null
          consent_date?: string | null
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          parent_id?: string
          child_id?: string
          relationship_type?: string | null
          consent_given?: boolean | null
          consent_date?: string | null
          active?: boolean | null
          created_at?: string | null
        }
      }
      exercises: {
        Row: {
          id: string
          name_en: string
          name_ru: string | null
          description: string | null
          difficulty: string | null
          min_duration_seconds: number | null
          max_duration_seconds: number | null
          adventure_points: number | null
          is_active: boolean | null
        }
      }
    }
  }
}