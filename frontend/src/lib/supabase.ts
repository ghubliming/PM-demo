import { createClient } from '@supabase/supabase-js'

// Create Supabase client only when properly configured
let supabase: ReturnType<typeof createClient> | null = null

const getSupabaseClient = () => {
  if (!supabase && isSupabaseConfigured()) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabase
}

// Check if Supabase is properly configured
const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && 
         key &&
         url !== 'YOUR_SUPABASE_URL' &&
         key !== 'YOUR_SUPABASE_ANON_KEY')
}

// Database Types
export interface DbUser {
  id: string
  name: string
  balance: number
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface DbMarket {
  id: number
  question: string
  option1: string
  option2: string
  end_time: string
  total_staked: number
  option1_stakes: number
  option2_stakes: number
  resolved: boolean
  winner: number
  resolution_time?: string
  disputed: boolean
  dispute_end_time?: string
  created_at: string
  updated_at: string
}

export interface DbPosition {
  id: number
  user_id: string
  market_id: number
  option1_amount: number
  option2_amount: number
  created_at: string
  updated_at: string
}

export interface DbDispute {
  id: number
  market_id: number
  disputer_id: string
  proposed_winner: number
  bond_amount: number
  dispute_time: string
  resolved: boolean
  dispute_valid: boolean
  reason: string
  created_at: string
  updated_at: string
}

export interface DbUserBet {
  id: number
  user_id: string
  market_id: number
  option: number
  amount: number
  timestamp: string
  created_at: string
}

export { getSupabaseClient }