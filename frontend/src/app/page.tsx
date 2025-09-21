'use client';

import { useState, useEffect } from 'react';

interface Market {
  id: number;
  question: string;
  option1: string;
  option2: string;
  endTime: number;
  totalStaked: number;
  option1Stakes: number;
  option2Stakes: number;
  resolved: boolean;
  winner: number;
}

interface User {
  id: string;
  name: string;
  balance: number;
  positions: { [marketId: number]: { option1Amount: number; option2Amount: number } };
}

interface UserBet {
  marketId: number;
  option: number;
  amount: number;
  timestamp: number;
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedOption, setSelectedOption] = useState<number>(1);
  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [newMarket, setNewMarket] = useState({
    question: '',
    option1: '',
    option2: '',
    duration: '24'
  });

  // Initialize user system and mock data
  useEffect(() => {
    // Load saved user from localStorage
    const savedUser = localStorage.getItem('predictionMarketUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Load saved bets from localStorage  
    const savedBets = localStorage.getItem('userBets');
    if (savedBets) {
      setUserBets(JSON.parse(savedBets));
    }

    const mockMarkets: Market[] = [
      {
        id: 0,
        question: "Will Bitcoin reach $100,000 by end of 2024?",
        option1: "Yes, Bitcoin will reach $100k",
        option2: "No, Bitcoin won't reach $100k",
        endTime: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
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
        endTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        totalStaked: 2.8,
        option1Stakes: 1.1,
        option2Stakes: 1.7,
        resolved: false,
        winner: 0
      }
    ];
    
    // Load saved markets or use defaults
    const savedMarkets = localStorage.getItem('predictionMarkets');
    if (savedMarkets) {
      setMarkets(JSON.parse(savedMarkets));
    } else {
      setMarkets(mockMarkets);
      localStorage.setItem('predictionMarkets', JSON.stringify(mockMarkets));
    }
  }, []);

  // Save user data whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('predictionMarketUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Save bets whenever userBets changes
  useEffect(() => {
    localStorage.setItem('userBets', JSON.stringify(userBets));
  }, [userBets]);

  // Save markets whenever they change
  useEffect(() => {
    if (markets.length > 0) {
      localStorage.setItem('predictionMarkets', JSON.stringify(markets));
    }
  }, [markets]);

  // Enhanced Market Maker Algorithm using LMSR (Logarithmic Market Scoring Rule)
  // This provides continuous liquidity and more accurate pricing similar to Polymarket
  const calculateLMSRPrices = (market: Market) => {
    // LMSR parameters - liquidity parameter controls market depth
    const b = Math.max(10, market.totalStaked * 0.1); // Adaptive liquidity parameter
    
    // If no stakes, return neutral prices
    if (market.totalStaked === 0) {
      return {
        option1Price: 0.50,
        option2Price: 0.50,
        option1Odds: 50,
        option2Odds: 50,
        spread: 0.02 // 2% spread
      };
    }

    // Calculate LMSR prices
    const q1 = market.option1Stakes;
    const q2 = market.option2Stakes;
    
    // LMSR price formula: p_i = exp(q_i/b) / sum(exp(q_j/b))
    const exp1 = Math.exp(q1 / b);
    const exp2 = Math.exp(q2 / b);
    const sum = exp1 + exp2;
    
    const option1Price = exp1 / sum;
    const option2Price = exp2 / sum;
    
    // Calculate spread based on liquidity depth
    const spreadFactor = Math.max(0.01, 1 / Math.sqrt(market.totalStaked + 1));
    const spread = Math.min(0.1, spreadFactor * 2); // Cap spread at 10%
    
    return {
      option1Price,
      option2Price,
      option1Odds: Math.round(option1Price * 100),
      option2Odds: Math.round(option2Price * 100),
      spread
    };
  };

  // Calculate bid/ask prices with spread
  const calculateBidAskPrices = (market: Market) => {
    const { option1Price, option2Price, spread } = calculateLMSRPrices(market);
    
    return {
      option1: {
        bid: Math.max(0.01, option1Price - spread/2),
        ask: Math.min(0.99, option1Price + spread/2),
        mid: option1Price
      },
      option2: {
        bid: Math.max(0.01, option2Price - spread/2),
        ask: Math.min(0.99, option2Price + spread/2),
        mid: option2Price
      }
    };
  };

  // Legacy odds calculation for backwards compatibility
  const calculateOdds = (market: Market) => {
    const prices = calculateLMSRPrices(market);
    return { option1: prices.option1Odds, option2: prices.option2Odds };
  };

  // Calculate price impact for a given bet size
  const calculatePriceImpact = (market: Market, betOption: number, betAmount: number) => {
    const currentPrices = calculateLMSRPrices(market);
    const currentPrice = betOption === 1 ? currentPrices.option1Price : currentPrices.option2Price;
    
    // Simulate the bet
    const simulatedMarket = { ...market };
    if (betOption === 1) {
      simulatedMarket.option1Stakes += betAmount;
    } else {
      simulatedMarket.option2Stakes += betAmount;
    }
    simulatedMarket.totalStaked += betAmount;
    
    const newPrices = calculateLMSRPrices(simulatedMarket);
    const newPrice = betOption === 1 ? newPrices.option1Price : newPrices.option2Price;
    
    const priceImpact = Math.abs(newPrice - currentPrice) / currentPrice;
    return {
      currentPrice,
      newPrice,
      priceImpact,
      priceImpactPercent: priceImpact * 100
    };
  };

  // Enhanced Market Maker with continuous liquidity provision
  const applyMarketMakerBalancing = (market: Market, betOption: number, betAmount: number) => {
    const newMarket = { ...market };
    
    // Add the user's bet first
    if (betOption === 1) {
      newMarket.option1Stakes += betAmount;
    } else {
      newMarket.option2Stakes += betAmount;
    }
    newMarket.totalStaked += betAmount;

    // Enhanced market making: Add liquidity based on price impact and imbalance
    const priceImpact = calculatePriceImpact(market, betOption, betAmount);
    const prices = calculateLMSRPrices(newMarket);
    
    // Add counter-liquidity if price impact is high or market is imbalanced
    let liquidityAdded = 0;
    const highImpactThreshold = 0.05; // 5% price impact
    const maxPrice = 0.85; // Maximum price before intervention
    const minPrice = 0.15; // Minimum price before intervention
    
    const targetPrice = betOption === 1 ? prices.option1Price : prices.option2Price;
    
    if (priceImpact.priceImpact > highImpactThreshold || targetPrice > maxPrice || targetPrice < minPrice) {
      // Add liquidity to the opposite side to moderate price movement
      const counterOption = betOption === 1 ? 2 : 1;
      const liquidityAmount = Math.min(betAmount * 0.3, 5); // Max 30% of bet or 5 ETH
      
      if (counterOption === 1) {
        newMarket.option1Stakes += liquidityAmount;
      } else {
        newMarket.option2Stakes += liquidityAmount;
      }
      
      newMarket.totalStaked += liquidityAmount;
      liquidityAdded = liquidityAmount;
    }

    // Ensure minimum liquidity on both sides
    const minLiquidity = Math.max(1, newMarket.totalStaked * 0.05); // 5% minimum
    if (newMarket.option1Stakes < minLiquidity) {
      const needed = minLiquidity - newMarket.option1Stakes;
      newMarket.option1Stakes += needed;
      newMarket.totalStaked += needed;
      liquidityAdded += needed;
    }
    if (newMarket.option2Stakes < minLiquidity) {
      const needed = minLiquidity - newMarket.option2Stakes;
      newMarket.option2Stakes += needed;
      newMarket.totalStaked += needed;
      liquidityAdded += needed;
    }

    return { 
      market: newMarket, 
      liquidityAdded,
      priceImpact: priceImpact.priceImpactPercent
    };
  };

  const createUser = (name: string): User => {
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      balance: 100, // Starting balance of 100 ETH
      positions: {}
    };
    return newUser;
  };

  const loginUser = (name: string) => {
    if (!name.trim()) return;
    
    // Try to load existing user from localStorage
    const existingUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    let user = existingUsers.find((u: User) => u.name.toLowerCase() === name.toLowerCase());
    
    if (!user) {
      // Create new user
      user = createUser(name);
      existingUsers.push(user);
      localStorage.setItem('allUsers', JSON.stringify(existingUsers));
    }
    
    setCurrentUser(user);
    setShowUserLogin(false);
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('predictionMarketUser');
  };

  const getUserPosition = (marketId: number) => {
    if (!currentUser || !currentUser.positions[marketId]) {
      return { option1Amount: 0, option2Amount: 0 };
    }
    return currentUser.positions[marketId];
  };

  const formatTimeLeft = (endTime: number) => {
    const timeLeft = endTime - Date.now();
    if (timeLeft <= 0) return "Ended";
    
    const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handlePlaceBet = () => {
    if (!currentUser) {
      alert('Please login first to place bets!');
      return;
    }

    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid bet amount!');
      return;
    }

    if (amount > currentUser.balance) {
      alert('Insufficient balance! You only have ' + currentUser.balance.toFixed(3) + ' ETH');
      return;
    }

    if (!selectedMarket) return;

    // Calculate price impact before placing bet
    const priceImpact = calculatePriceImpact(selectedMarket, selectedOption, amount);
    
    // Warn user about high price impact
    if (priceImpact.priceImpactPercent > 5) {
      const proceed = confirm(
        `This bet will have a ${priceImpact.priceImpactPercent.toFixed(2)}% price impact.\n` +
        `Price will move from ${(priceImpact.currentPrice * 100).toFixed(1)}¢ to ${(priceImpact.newPrice * 100).toFixed(1)}¢.\n` +
        `Do you want to proceed?`
      );
      if (!proceed) return;
    }

    // Apply market maker balancing with enhanced algorithm
    const { market: updatedMarket, liquidityAdded, priceImpact: finalPriceImpact } = applyMarketMakerBalancing(selectedMarket, selectedOption, amount);
    
    // Show market maker intervention if significant liquidity was added
    if (liquidityAdded > 0.1) {
      console.log(`Market maker added ${liquidityAdded.toFixed(3)} ETH in counter-liquidity`);
      console.log(`Final price impact: ${finalPriceImpact.toFixed(2)}%`);
    }
    
    // Update markets
    const newMarkets = markets.map(m => m.id === selectedMarket.id ? updatedMarket : m);
    setMarkets(newMarkets);

    // Update user balance and position
    const updatedUser = { ...currentUser };
    updatedUser.balance -= amount;
    
    if (!updatedUser.positions[selectedMarket.id]) {
      updatedUser.positions[selectedMarket.id] = { option1Amount: 0, option2Amount: 0 };
    }
    
    if (selectedOption === 1) {
      updatedUser.positions[selectedMarket.id].option1Amount += amount;
    } else {
      updatedUser.positions[selectedMarket.id].option2Amount += amount;
    }
    
    setCurrentUser(updatedUser);
    
    // Save user bet history
    const newBet: UserBet = {
      marketId: selectedMarket.id,
      option: selectedOption,
      amount: amount,
      timestamp: Date.now()
    };
    setUserBets([...userBets, newBet]);

    // Update all users in localStorage
    const existingUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const userIndex = existingUsers.findIndex((u: User) => u.id === updatedUser.id);
    if (userIndex !== -1) {
      existingUsers[userIndex] = updatedUser;
      localStorage.setItem('allUsers', JSON.stringify(existingUsers));
    }

    let message = `Bet placed successfully! ${amount} ETH on "${selectedOption === 1 ? selectedMarket.option1 : selectedMarket.option2}"`;
    if (liquidityAdded > 0) {
      message += `\n\nMarket Maker added ${liquidityAdded.toFixed(3)} ETH liquidity to balance the market.`;
    }
    
    alert(message);
    setSelectedMarket(null);
    setBetAmount('');
  };

  const handleCreateMarket = () => {
    if (!currentUser) {
      alert('Please login first to create markets!');
      return;
    }

    if (!newMarket.question || !newMarket.option1 || !newMarket.option2) {
      alert('Please fill in all fields!');
      return;
    }

    const newMarketData: Market = {
      id: markets.length,
      question: newMarket.question,
      option1: newMarket.option1,
      option2: newMarket.option2,
      endTime: Date.now() + parseInt(newMarket.duration) * 60 * 60 * 1000,
      totalStaked: 0,
      option1Stakes: 0,
      option2Stakes: 0,
      resolved: false,
      winner: 0
    };
    
    setMarkets([...markets, newMarketData]);
    setShowCreateMarket(false);
    setNewMarket({ question: '', option1: '', option2: '', duration: '24' });
    alert(`Market "${newMarket.question}" created successfully!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎯 PM Demo - Prediction Markets
            </h1>
            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Welcome, {currentUser.name}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-bold">
                      Balance: {currentUser.balance.toFixed(3)} ETH
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateMarket(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Create Market
                  </button>
                  <button
                    onClick={logoutUser}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowUserLogin(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {markets.map((market) => {
            const odds = calculateOdds(market);
            const lmsrPrices = calculateLMSRPrices(market);
            const bidAskPrices = calculateBidAskPrices(market);
            const userPosition = getUserPosition(market.id);
            const hasPosition = userPosition.option1Amount > 0 || userPosition.option2Amount > 0;
            
            return (
              <div key={market.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {market.question}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimeLeft(market.endTime)}
                  </span>
                </div>
                
                {/* Enhanced Market Info */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-300">
                    <div>
                      <span className="font-medium">Market Depth:</span><br/>
                      Liquidity: {(Math.max(10, market.totalStaked * 0.1)).toFixed(1)} ETH
                    </div>
                    <div>
                      <span className="font-medium">Spread:</span><br/>
                      {(lmsrPrices.spread * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                {/* User Position Display */}
                {currentUser && hasPosition && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Your Position:
                    </div>
                    <div className="flex gap-4 text-sm">
                      {userPosition.option1Amount > 0 && (
                        <span className="text-green-600 dark:text-green-400">
                          Option 1: {userPosition.option1Amount.toFixed(3)} ETH
                        </span>
                      )}
                      {userPosition.option2Amount > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          Option 2: {userPosition.option2Amount.toFixed(3)} ETH
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className={`border rounded-lg p-4 ${currentUser ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                       onClick={() => currentUser && setSelectedMarket(market)}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-green-600">{market.option1}</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{odds.option1}%</div>
                        <div className="text-xs text-gray-400">
                          {(bidAskPrices.option1.mid * 100).toFixed(1)}¢
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Bid: {(bidAskPrices.option1.bid * 100).toFixed(1)}¢</span>
                      <span>Ask: {(bidAskPrices.option1.ask * 100).toFixed(1)}¢</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Staked: {market.option1Stakes.toFixed(3)} ETH
                    </div>
                  </div>
                  
                  <div className={`border rounded-lg p-4 ${currentUser ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                       onClick={() => currentUser && setSelectedMarket(market)}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-red-600">{market.option2}</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{odds.option2}%</div>
                        <div className="text-xs text-gray-400">
                          {(bidAskPrices.option2.mid * 100).toFixed(1)}¢
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Bid: {(bidAskPrices.option2.bid * 100).toFixed(1)}¢</span>
                      <span>Ask: {(bidAskPrices.option2.ask * 100).toFixed(1)}¢</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Staked: {market.option2Stakes.toFixed(3)} ETH
                    </div>
                  </div>
                </div>
                
                {!currentUser && (
                  <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                    Login to place bets on this market
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Total Volume: {market.totalStaked.toFixed(3)} ETH</span>
                  <span>Market ID: #{market.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* User Login Modal */}
      {showUserLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Login / Sign Up
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Enter your username to login or create a new account. New users start with 100 ETH!
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Enter your username..."
                  id="username-input"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      loginUser(input.value);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  const input = document.getElementById('username-input') as HTMLInputElement;
                  loginUser(input.value);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Login / Sign Up
              </button>
              <button
                onClick={() => setShowUserLogin(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Betting Modal */}
      {selectedMarket && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Place Bet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {selectedMarket.question}
            </p>
            
            {/* Balance Display */}
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                Your Balance: {currentUser.balance.toFixed(3)} ETH
              </div>
            </div>
            
            {/* Current Position */}
            {(() => {
              const position = getUserPosition(selectedMarket.id);
              const hasPosition = position.option1Amount > 0 || position.option2Amount > 0;
              return hasPosition ? (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Current Position:
                  </div>
                  <div className="text-sm">
                    {position.option1Amount > 0 && (
                      <div className="text-green-600 dark:text-green-400">
                        Option 1: {position.option1Amount.toFixed(3)} ETH
                      </div>
                    )}
                    {position.option2Amount > 0 && (
                      <div className="text-red-600 dark:text-red-400">
                        Option 2: {position.option2Amount.toFixed(3)} ETH
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Choose Option
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(() => {
                    const prices = calculateLMSRPrices(selectedMarket);
                    const bidAsk = calculateBidAskPrices(selectedMarket);
                    
                    return (
                      <>
                        <label className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              value={1}
                              checked={selectedOption === 1}
                              onChange={(e) => setSelectedOption(parseInt(e.target.value))}
                              className="mr-3"
                            />
                            <span className="text-green-600 font-medium">{selectedMarket.option1}</span>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">{prices.option1Odds}%</div>
                            <div className="text-xs text-gray-500">
                              {(bidAsk.option1.mid * 100).toFixed(1)}¢
                            </div>
                          </div>
                        </label>
                        <label className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              value={2}
                              checked={selectedOption === 2}
                              onChange={(e) => setSelectedOption(parseInt(e.target.value))}
                              className="mr-3"
                            />
                            <span className="text-red-600 font-medium">{selectedMarket.option2}</span>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">{prices.option2Odds}%</div>
                            <div className="text-xs text-gray-500">
                              {(bidAsk.option2.mid * 100).toFixed(1)}¢
                            </div>
                          </div>
                        </label>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bet Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.1"
                  max={currentUser.balance}
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Max: {currentUser.balance.toFixed(3)} ETH
                </div>
                
                {/* Price Impact Display */}
                {betAmount && parseFloat(betAmount) > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    {(() => {
                      const amount = parseFloat(betAmount);
                      const impact = calculatePriceImpact(selectedMarket, selectedOption, amount);
                      const isHighImpact = impact.priceImpactPercent > 5;
                      
                      return (
                        <div className="text-sm">
                          <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                            Price Impact Analysis
                          </div>
                          <div className="space-y-1 text-yellow-700 dark:text-yellow-300">
                            <div>Current Price: {(impact.currentPrice * 100).toFixed(1)}¢</div>
                            <div>New Price: {(impact.newPrice * 100).toFixed(1)}¢</div>
                            <div className={isHighImpact ? 'text-red-600 font-medium' : ''}>
                              Price Impact: {impact.priceImpactPercent.toFixed(2)}%
                            </div>
                            {isHighImpact && (
                              <div className="text-xs text-red-600 mt-2">
                                ⚠️ High price impact! Consider splitting into smaller orders.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePlaceBet}
                disabled={!betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > currentUser.balance}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                Place Bet
              </button>
              <button
                onClick={() => setSelectedMarket(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Market Modal */}
      {showCreateMarket && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Market
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question
                </label>
                <input
                  type="text"
                  placeholder="Will X happen by Y date?"
                  value={newMarket.question}
                  onChange={(e) => setNewMarket({...newMarket, question: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Option 1 (Yes)
                </label>
                <input
                  type="text"
                  placeholder="Yes, it will happen"
                  value={newMarket.option1}
                  onChange={(e) => setNewMarket({...newMarket, option1: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Option 2 (No)
                </label>
                <input
                  type="text"
                  placeholder="No, it won't happen"
                  value={newMarket.option2}
                  onChange={(e) => setNewMarket({...newMarket, option2: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newMarket.duration}
                  onChange={(e) => setNewMarket({...newMarket, duration: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateMarket}
                disabled={!newMarket.question || !newMarket.option1 || !newMarket.option2}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                Create Market
              </button>
              <button
                onClick={() => setShowCreateMarket(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
