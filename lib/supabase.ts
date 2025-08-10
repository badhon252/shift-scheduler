import { createClient, type Session, type User } from "@supabase/supabase-js"

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          employee_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          employee_id?: string
          name?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          member_id: string
          date: string // YYYY-MM-DD
          shift_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          date: string
          shift_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          member_id?: string
          date?: string
          shift_type?: string
          updated_at?: string
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  )
}

let browserClient: ReturnType<typeof createClient<Database>> | undefined

export const supabase = (() => {
  if (typeof window === "undefined") {
    // Server-side: create a new client each time
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // Client-side: use singleton pattern
  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })

    // Add some debugging for auth state changes
    browserClient.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, {
        userId: session?.user?.id,
        hasAccessToken: !!session?.access_token,
        expiresAt: session?.expires_at,
        isExpired: session?.expires_at ? session.expires_at * 1000 < Date.now() : "unknown",
      })
    })
  }
  return browserClient
})()

export type { Session, User }
export type Member = Database["public"]["Tables"]["members"]["Row"]
export type Shift = Database["public"]["Tables"]["shifts"]["Row"]
