// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PredictionMarket {
    struct Market {
        uint256 id;
        string question;
        string option1;
        string option2;
        uint256 endTime;
        uint256 totalStaked;
        uint256 option1Stakes;
        uint256 option2Stakes;
        bool resolved;
        uint8 winner; // 0 = not resolved, 1 = option1, 2 = option2
        address creator;
    }
    
    struct Position {
        uint256 option1Amount;
        uint256 option2Amount;
    }
    
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Position)) public userPositions;
    mapping(address => uint256[]) public userMarkets;
    
    uint256 public marketCount;
    address public owner;
    
    event MarketCreated(uint256 indexed marketId, string question, address creator);
    event PositionTaken(uint256 indexed marketId, address indexed user, uint8 option, uint256 amount);
    event MarketResolved(uint256 indexed marketId, uint8 winner);
    event RewardsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier marketExists(uint256 marketId) {
        require(marketId < marketCount, "Market does not exist");
        _;
    }
    
    modifier marketActive(uint256 marketId) {
        require(block.timestamp < markets[marketId].endTime, "Market has ended");
        require(!markets[marketId].resolved, "Market already resolved");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        marketCount = 0;
    }
    
    function createMarket(
        string memory question,
        string memory option1,
        string memory option2,
        uint256 duration
    ) external returns (uint256) {
        uint256 marketId = marketCount++;
        uint256 endTime = block.timestamp + duration;
        
        markets[marketId] = Market({
            id: marketId,
            question: question,
            option1: option1,
            option2: option2,
            endTime: endTime,
            totalStaked: 0,
            option1Stakes: 0,
            option2Stakes: 0,
            resolved: false,
            winner: 0,
            creator: msg.sender
        });
        
        emit MarketCreated(marketId, question, msg.sender);
        return marketId;
    }
    
    function buyPosition(uint256 marketId, uint8 option) 
        external 
        payable 
        marketExists(marketId) 
        marketActive(marketId) 
    {
        require(option == 1 || option == 2, "Invalid option");
        require(msg.value > 0, "Must send ETH to buy position");
        
        Market storage market = markets[marketId];
        Position storage position = userPositions[marketId][msg.sender];
        
        if (option == 1) {
            position.option1Amount += msg.value;
            market.option1Stakes += msg.value;
        } else {
            position.option2Amount += msg.value;
            market.option2Stakes += msg.value;
        }
        
        market.totalStaked += msg.value;
        
        // Track user's markets
        bool found = false;
        for (uint256 i = 0; i < userMarkets[msg.sender].length; i++) {
            if (userMarkets[msg.sender][i] == marketId) {
                found = true;
                break;
            }
        }
        if (!found) {
            userMarkets[msg.sender].push(marketId);
        }
        
        emit PositionTaken(marketId, msg.sender, option, msg.value);
    }
    
    function resolveMarket(uint256 marketId, uint8 winner) 
        external 
        marketExists(marketId) 
    {
        Market storage market = markets[marketId];
        require(msg.sender == market.creator || msg.sender == owner, "Not authorized");
        require(block.timestamp >= market.endTime, "Market still active");
        require(!market.resolved, "Market already resolved");
        require(winner == 1 || winner == 2, "Invalid winner");
        
        market.resolved = true;
        market.winner = winner;
        
        emit MarketResolved(marketId, winner);
    }
    
    function claimRewards(uint256 marketId) 
        external 
        marketExists(marketId) 
    {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved yet");
        
        Position storage position = userPositions[marketId][msg.sender];
        uint256 winningAmount = 0;
        uint256 winningStakes = 0;
        
        if (market.winner == 1 && position.option1Amount > 0) {
            winningAmount = position.option1Amount;
            winningStakes = market.option1Stakes;
            position.option1Amount = 0;
        } else if (market.winner == 2 && position.option2Amount > 0) {
            winningAmount = position.option2Amount;
            winningStakes = market.option2Stakes;
            position.option2Amount = 0;
        }
        
        require(winningAmount > 0, "No winning position");
        
        // Calculate reward: original stake + proportional share of losing stakes
        uint256 reward = winningAmount;
        if (winningStakes > 0) {
            uint256 losingStakes = market.totalStaked - winningStakes;
            reward += (winningAmount * losingStakes) / winningStakes;
        }
        
        require(address(this).balance >= reward, "Insufficient contract balance");
        payable(msg.sender).transfer(reward);
        
        emit RewardsClaimed(marketId, msg.sender, reward);
    }
    
    function getMarket(uint256 marketId) 
        external 
        view 
        marketExists(marketId) 
        returns (Market memory) 
    {
        return markets[marketId];
    }
    
    function getUserPosition(uint256 marketId, address user) 
        external 
        view 
        marketExists(marketId) 
        returns (Position memory) 
    {
        return userPositions[marketId][user];
    }
    
    function getUserMarkets(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userMarkets[user];
    }
    
    function getMarketOdds(uint256 marketId) 
        external 
        view 
        marketExists(marketId) 
        returns (uint256 option1Odds, uint256 option2Odds) 
    {
        Market storage market = markets[marketId];
        if (market.totalStaked == 0) {
            return (50, 50); // 50/50 if no stakes
        }
        
        option1Odds = (market.option1Stakes * 100) / market.totalStaked;
        option2Odds = (market.option2Stakes * 100) / market.totalStaked;
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    receive() external payable {}
}