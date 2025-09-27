export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ThemeSettings = {
  gradient: {
    colors: string[]
    angle: number
    style: 'linear' | 'radial'
  }
  fontSize: number
  lineHeight: number
  textAlign: 'left' | 'center' | 'right'
  referenceAlign: 'left' | 'center' | 'right'
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          slug: string
          title: string
          owner_user_id: string
          settings: ThemeSettings
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          owner_user_id: string
          settings: ThemeSettings
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      project_items: {
        Row: {
          id: string
          project_id: string
          order: number
          book: number
          chapter: number
          verse: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          order: number
          book: number
          chapter: number
          verse: number
          note?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['project_items']['Insert']>
      }
      admin_users: {
        Row: {
          email: string
          created_at: string
        }
        Insert: {
          email: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>
      }
      premium_users: {
        Row: {
          email: string
          created_at: string
        }
        Insert: {
          email: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['premium_users']['Insert']>
      }
    }
    Functions: {}
  }
}
