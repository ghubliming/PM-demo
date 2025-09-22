import { DbUser, DbMarket, DbPosition, DbUserBet } from './supabase'

// Interface adapters to convert between database and app formats
export interface User {
  id: string
  name: string
  balance: number
  positions: { [marketId: number]: { option1Amount: number; option2Amount: number } }
  isAdmin?: boolean
}

export interface Market {
  id: number
  question: string
  option1: string
  option2: string
  endTime: number
  totalStaked: number
  option1Stakes: number
  option2Stakes: number
  resolved: boolean
  winner: number
  resolutionTime?: number
  disputed?: boolean
  disputeEndTime?: number
}

export interface UserBet {
  marketId: number
  option: number
  amount: number
  timestamp: number
}

export const dataAdapter = {
  // Convert database user to app user format
  dbUserToUser: (dbUser: DbUser, positions: DbPosition[] = []): User => {
    const positionsMap: { [marketId: number]: { option1Amount: number; option2Amount: number } } = {}
    
    positions.forEach(pos => {
      positionsMap[pos.market_id] = {
        option1Amount: pos.option1_amount,
        option2Amount: pos.option2_amount
      }
    })

    return {
      id: dbUser.id,
      name: dbUser.name,
      balance: Number(dbUser.balance),
      positions: positionsMap,
      isAdmin: dbUser.is_admin
    }
  },

  // Convert database market to app market format
  dbMarketToMarket: (dbMarket: DbMarket): Market => ({
    id: dbMarket.id,
    question: dbMarket.question,
    option1: dbMarket.option1,
    option2: dbMarket.option2,
    endTime: new Date(dbMarket.end_time).getTime(),
    totalStaked: Number(dbMarket.total_staked),
    option1Stakes: Number(dbMarket.option1_stakes),
    option2Stakes: Number(dbMarket.option2_stakes),
    resolved: dbMarket.resolved,
    winner: dbMarket.winner,
    resolutionTime: dbMarket.resolution_time ? new Date(dbMarket.resolution_time).getTime() : undefined,
    disputed: dbMarket.disputed,
    disputeEndTime: dbMarket.dispute_end_time ? new Date(dbMarket.dispute_end_time).getTime() : undefined
  }),

  // Convert database bet to app bet format
  dbUserBetToUserBet: (dbUserBet: DbUserBet): UserBet => ({
    marketId: dbUserBet.market_id,
    option: dbUserBet.option,
    amount: Number(dbUserBet.amount),
    timestamp: new Date(dbUserBet.timestamp).getTime()
  }),

  // Convert app market to database market format (for creation)
  marketToDbMarket: (market: Omit<Market, 'id'>): Omit<DbMarket, 'id' | 'created_at' | 'updated_at'> => ({
    question: market.question,
    option1: market.option1,
    option2: market.option2,
    end_time: new Date(market.endTime).toISOString(),
    total_staked: market.totalStaked,
    option1_stakes: market.option1Stakes,
    option2_stakes: market.option2Stakes,
    resolved: market.resolved,
    winner: market.winner,
    resolution_time: market.resolutionTime ? new Date(market.resolutionTime).toISOString() : undefined,
    disputed: market.disputed || false,
    dispute_end_time: market.disputeEndTime ? new Date(market.disputeEndTime).toISOString() : undefined
  })
}