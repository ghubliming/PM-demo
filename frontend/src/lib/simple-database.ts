/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseClient } from './supabase'

// Simple database service without complex typing
export const databaseService = {
  async query(query: () => Promise<any>): Promise<any> {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    try {
      return await query()
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  },

  // User operations
  async createUser(name: string) {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const { data, error } = await (supabase as any)
      .from('users')
      .insert([
        {
          id: userId,
          name: name.trim(),
          balance: 100,
          is_admin: name.toLowerCase().includes('admin')
        }
      ])
      .select()
      .single()

    return error ? null : data
  },

  async getUserByName(name: string) {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    const { data, error } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('name', name.trim())
      .single()

    return (error?.code === 'PGRST116') ? null : (error ? null : data)
  },

  async updateUserBalance(userId: string, balance: number) {
    const supabase = getSupabaseClient()
    if (!supabase) return false
    
    const { error } = await (supabase as any)
      .from('users')
      .update({ balance, updated_at: new Date().toISOString() })
      .eq('id', userId)

    return !error
  },

  // Market operations
  async getAllMarkets() {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    
    const { data, error } = await (supabase as any)
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })

    return error ? [] : (data || [])
  },

  async createMarket(market: any) {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    const { data, error } = await (supabase as any)
      .from('markets')
      .insert([market])
      .select()
      .single()

    return error ? null : data
  },

  async updateMarket(marketId: number, updates: any) {
    const supabase = getSupabaseClient()
    if (!supabase) return false
    
    const { error } = await (supabase as any)
      .from('markets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', marketId)

    return !error
  },

  // Position operations
  async upsertPosition(userId: string, marketId: number, option1Amount: number, option2Amount: number) {
    const supabase = getSupabaseClient()
    if (!supabase) return false
    
    const { error } = await (supabase as any)
      .from('positions')
      .upsert({
        user_id: userId,
        market_id: marketId,
        option1_amount: option1Amount,
        option2_amount: option2Amount,
        updated_at: new Date().toISOString()
      })

    return !error
  },

  async getUserPositions(userId: string) {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    
    const { data, error } = await (supabase as any)
      .from('positions')
      .select('*')
      .eq('user_id', userId)

    return error ? [] : (data || [])
  },

  // Bet operations
  async createBet(userId: string, marketId: number, option: number, amount: number) {
    const supabase = getSupabaseClient()
    if (!supabase) return false
    
    const { error } = await (supabase as any)
      .from('user_bets')
      .insert({
        user_id: userId,
        market_id: marketId,
        option,
        amount,
        timestamp: new Date().toISOString()
      })

    return !error
  },

  async initializeMockData() {
    const supabase = getSupabaseClient()
    if (!supabase) return true
    
    // Check if data exists
    const existing = await this.getAllMarkets()
    if (existing.length > 0) return true

    const mockMarkets = [
      {
        question: "Will Bitcoin reach $100,000 by end of 2024?",
        option1: "Yes, Bitcoin will reach $100k",
        option2: "No, Bitcoin won't reach $100k",
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        total_staked: 5.5,
        option1_stakes: 3.2,
        option2_stakes: 2.3,
        resolved: false,
        winner: 0,
        disputed: false
      },
      {
        question: "Will Ethereum price be above $4000 next week?",
        option1: "Yes, ETH > $4000",
        option2: "No, ETH <= $4000",
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        total_staked: 2.8,
        option1_stakes: 1.1,
        option2_stakes: 1.7,
        resolved: false,
        winner: 0,
        disputed: false
      },
      {
        question: "Will Apple stock close above $200 this week?",
        option1: "Yes, AAPL > $200",
        option2: "No, AAPL <= $200",
        end_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        total_staked: 4.0,
        option1_stakes: 1.5,
        option2_stakes: 2.5,
        resolved: true,
        winner: 1,
        resolution_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        disputed: false,
        dispute_end_time: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()
      }
    ]

    const { error } = await (supabase as any)
      .from('markets')
      .insert(mockMarkets)

    return !error
  }
}