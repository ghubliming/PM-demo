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

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedOption, setSelectedOption] = useState<number>(1);
  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [newMarket, setNewMarket] = useState({
    question: '',
    option1: '',
    option2: '',
    duration: '24'
  });

  // Mock data for demo
  useEffect(() => {
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
    setMarkets(mockMarkets);
  }, []);

  const calculateOdds = (market: Market) => {
    if (market.totalStaked === 0) return { option1: 50, option2: 50 };
    const option1Odds = Math.round((market.option1Stakes / market.totalStaked) * 100);
    const option2Odds = Math.round((market.option2Stakes / market.totalStaked) * 100);
    return { option1: option1Odds, option2: option2Odds };
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
    // This would interact with the smart contract in a real implementation
    alert(`Demo: Would place bet of ${betAmount} ETH on option ${selectedOption} for market "${selectedMarket?.question}"`);
    setSelectedMarket(null);
    setBetAmount('');
  };

  const handleCreateMarket = () => {
    // This would create a new market on the smart contract
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
    alert(`Demo: Market "${newMarket.question}" created successfully!`);
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
            <button
              onClick={() => setShowCreateMarket(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Create Market
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {markets.map((market) => {
            const odds = calculateOdds(market);
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                       onClick={() => setSelectedMarket(market)}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-green-600">{market.option1}</span>
                      <span className="text-sm text-gray-500">{odds.option1}%</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Staked: {market.option1Stakes} ETH
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                       onClick={() => setSelectedMarket(market)}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-red-600">{market.option2}</span>
                      <span className="text-sm text-gray-500">{odds.option2}%</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Staked: {market.option2Stakes} ETH
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Total Volume: {market.totalStaked} ETH</span>
                  <span>Market ID: #{market.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Betting Modal */}
      {selectedMarket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Place Bet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {selectedMarket.question}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Choose Option
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={1}
                      checked={selectedOption === 1}
                      onChange={(e) => setSelectedOption(parseInt(e.target.value))}
                      className="mr-2"
                    />
                    <span className="text-green-600">{selectedMarket.option1}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={2}
                      checked={selectedOption === 2}
                      onChange={(e) => setSelectedOption(parseInt(e.target.value))}
                      className="mr-2"
                    />
                    <span className="text-red-600">{selectedMarket.option2}</span>
                  </label>
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
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePlaceBet}
                disabled={!betAmount || parseFloat(betAmount) <= 0}
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
      {showCreateMarket && (
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
