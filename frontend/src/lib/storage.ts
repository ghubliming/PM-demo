import { databaseService } from './simple-database'
import { dataAdapter, User, Market } from './adapters'

// Check if Supabase is properly configured
const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && 
         key &&
         url !== 'YOUR_SUPABASE_URL' &&
         key !== 'YOUR_SUPABASE_ANON_KEY')
}

// Fallback to localStorage for demo purposes
const localStorageService = {
  async createUser(name: string): Promise<User | null> {
    const existingUsers = JSON.parse(localStorage.getItem('allUsers') || '[]')
    const user = existingUsers.find((u: User) => u.name.toLowerCase() === name.toLowerCase())
    
    if (user) return user
    
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      balance: 100,
      positions: {},
      isAdmin: name.toLowerCase().includes('admin')
    }
    
    existingUsers.push(newUser)
    localStorage.setItem('allUsers', JSON.stringify(existingUsers))
    return newUser
  },

  async getUserByName(name: string): Promise<User | null> {
    const existingUsers = JSON.parse(localStorage.getItem('allUsers') || '[]')
    return existingUsers.find((u: User) => u.name.toLowerCase() === name.toLowerCase()) || null
  },

  async updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
    const existingUsers = JSON.parse(localStorage.getItem('allUsers') || '[]')
    const userIndex = existingUsers.findIndex((u: User) => u.id === userId)
    
    if (userIndex >= 0) {
      existingUsers[userIndex].balance = newBalance
      localStorage.setItem('allUsers', JSON.stringify(existingUsers))
      return true
    }
    return false
  },

  async getAllMarkets(): Promise<Market[]> {
    const savedMarkets = localStorage.getItem('predictionMarkets')
    if (savedMarkets) {
      return JSON.parse(savedMarkets)
    }
    
    // Initialize with mock data if none exists
    const mockMarkets: Market[] = [
      {
        id: 0,
        question: "Will Bitcoin reach $100,000 by end of 2024?",
        option1: "Yes, Bitcoin will reach $100k",
        option2: "No, Bitcoin won't reach $100k",
        endTime: Date.now() + 24 * 60 * 60 * 1000,
        totalStaked: 5.5,
        option1Stakes: 3.2,
        option2Stakes: 2.3,
        resolved: false,
        winner: 0
      },
      {
        id: 1,
        question: "Will Ethereum price be above $4000 next week?",
        option1: "Yes, ETH > $4000",
        option2: "No, ETH <= $4000",
        endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
        totalStaked: 2.8,
        option1Stakes: 1.1,
        option2Stakes: 1.7,
        resolved: false,
        winner: 0
      },
      {
        id: 2,
        question: "Will Apple stock close above $200 this week?",
        option1: "Yes, AAPL > $200",
        option2: "No, AAPL <= $200",
        endTime: Date.now() - 2 * 60 * 60 * 1000,
        totalStaked: 4.0,
        option1Stakes: 1.5,
        option2Stakes: 2.5,
        resolved: true,
        winner: 1,
        resolutionTime: Date.now() - 60 * 60 * 1000,
        disputed: false,
        disputeEndTime: Date.now() + 23 * 60 * 60 * 1000
      }
    ]
    
    localStorage.setItem('predictionMarkets', JSON.stringify(mockMarkets))
    return mockMarkets
  },

  async createMarket(market: Omit<Market, 'id'>): Promise<Market | null> {
    const markets = await this.getAllMarkets()
    const newId = Math.max(...markets.map(m => m.id), -1) + 1
    const newMarket = { ...market, id: newId }
    
    markets.unshift(newMarket)
    localStorage.setItem('predictionMarkets', JSON.stringify(markets))
    return newMarket
  },

  async updateMarket(marketId: number, updates: Partial<Market>): Promise<boolean> {
    const markets = await this.getAllMarkets()
    const marketIndex = markets.findIndex(m => m.id === marketId)
    
    if (marketIndex >= 0) {
      markets[marketIndex] = { ...markets[marketIndex], ...updates }
      localStorage.setItem('predictionMarkets', JSON.stringify(markets))
      return true
    }
    return false
  }
}

export const storageService = {
  // User operations
  async loginUser(name: string): Promise<User | null> {
    if (isSupabaseConfigured()) {
      try {
        let dbUser = await databaseService.getUserByName(name)
        if (!dbUser) {
          dbUser = await databaseService.createUser(name)
        }
        if (dbUser) {
          const positions = await databaseService.getUserPositions(dbUser.id)
          return dataAdapter.dbUserToUser(dbUser, positions)
        }
        return null
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error)
        return localStorageService.createUser(name)
      }
    } else {
      return localStorageService.createUser(name)
    }
  },

  async updateUserBalance(user: User, newBalance: number): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        return await databaseService.updateUserBalance(user.id, newBalance)
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error)
        return localStorageService.updateUserBalance(user.id, newBalance)
      }
    } else {
      return localStorageService.updateUserBalance(user.id, newBalance)
    }
  },

  // Market operations
  async getMarkets(): Promise<Market[]> {
    if (isSupabaseConfigured()) {
      try {
        // Initialize mock data if needed
        await databaseService.initializeMockData()
        const dbMarkets = await databaseService.getAllMarkets()
        return dbMarkets.map(dataAdapter.dbMarketToMarket)
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error)
        return localStorageService.getAllMarkets()
      }
    } else {
      return localStorageService.getAllMarkets()
    }
  },

  async createMarket(market: Omit<Market, 'id'>): Promise<Market | null> {
    if (isSupabaseConfigured()) {
      try {
        const dbMarket = await databaseService.createMarket(dataAdapter.marketToDbMarket(market))
        return dbMarket ? dataAdapter.dbMarketToMarket(dbMarket) : null
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error)
        return localStorageService.createMarket(market)
      }
    } else {
      return localStorageService.createMarket(market)
    }
  },

  async updateMarket(marketId: number, updates: Partial<Market>): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        // Convert updates to database format
        const dbUpdates: Record<string, unknown> = {}
        if (updates.totalStaked !== undefined) dbUpdates.total_staked = updates.totalStaked
        if (updates.option1Stakes !== undefined) dbUpdates.option1_stakes = updates.option1Stakes
        if (updates.option2Stakes !== undefined) dbUpdates.option2_stakes = updates.option2Stakes
        if (updates.resolved !== undefined) dbUpdates.resolved = updates.resolved
        if (updates.winner !== undefined) dbUpdates.winner = updates.winner
        if (updates.resolutionTime !== undefined) dbUpdates.resolution_time = new Date(updates.resolutionTime).toISOString()
        if (updates.disputed !== undefined) dbUpdates.disputed = updates.disputed
        if (updates.disputeEndTime !== undefined) dbUpdates.dispute_end_time = new Date(updates.disputeEndTime).toISOString()

        return await databaseService.updateMarket(marketId, dbUpdates)
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error)
        return localStorageService.updateMarket(marketId, updates)
      }
    } else {
      return localStorageService.updateMarket(marketId, updates)
    }
  },

  // Position operations
  async updatePosition(user: User, marketId: number, option1Amount: number, option2Amount: number): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        return await databaseService.upsertPosition(user.id, marketId, option1Amount, option2Amount)
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error)
        // Update localStorage as fallback
        const existingUsers = JSON.parse(localStorage.getItem('allUsers') || '[]')
        const userIndex = existingUsers.findIndex((u: User) => u.id === user.id)
        
        if (userIndex >= 0) {
          existingUsers[userIndex].positions[marketId] = { option1Amount, option2Amount }
          localStorage.setItem('allUsers', JSON.stringify(existingUsers))
          return true
        }
        return false
      }
    } else {
      // Update localStorage
      const existingUsers = JSON.parse(localStorage.getItem('allUsers') || '[]')
      const userIndex = existingUsers.findIndex((u: User) => u.id === user.id)
      
      if (userIndex >= 0) {
        existingUsers[userIndex].positions[marketId] = { option1Amount, option2Amount }
        localStorage.setItem('allUsers', JSON.stringify(existingUsers))
        return true
      }
      return false
    }
  },

  // Bet operations
  async createBet(user: User, marketId: number, option: number, amount: number): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        return await databaseService.createBet(user.id, marketId, option, amount)
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error)
        // Update localStorage as fallback
        const existingBets = JSON.parse(localStorage.getItem('userBets') || '[]')
        existingBets.push({
          marketId,
          option,
          amount,
          timestamp: Date.now()
        })
        localStorage.setItem('userBets', JSON.stringify(existingBets))
        return true
      }
    } else {
      // Update localStorage
      const existingBets = JSON.parse(localStorage.getItem('userBets') || '[]')
      existingBets.push({
        marketId,
        option,
        amount,
        timestamp: Date.now()
      })
      localStorage.setItem('userBets', JSON.stringify(existingBets))
      return true
    }
  },

  // Check if using online database
  isOnline(): boolean {
    return isSupabaseConfigured()
  }
}