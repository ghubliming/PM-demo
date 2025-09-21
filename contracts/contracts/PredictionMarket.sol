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
        uint256 resolutionTime; // When market was initially resolved
        bool disputed; // Whether market is currently disputed
        uint256 disputeEndTime; // When dispute period ends
    }
    
    struct Dispute {
        uint256 marketId;
        address disputer;
        uint8 proposedWinner; // Disputer's proposed winner
        uint256 bondAmount; // Amount bonded by disputer
        uint256 disputeTime;
        bool resolved;
        bool disputeValid; // Whether dispute was found valid
        string reason; // Reason for dispute
    }
    
    struct Position {
        uint256 option1Amount;
        uint256 option2Amount;
    }
    
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Position)) public userPositions;
    mapping(address => uint256[]) public userMarkets;
    mapping(uint256 => Dispute[]) public marketDisputes; // All disputes for a market
    mapping(address => bool) public admins; // Admin addresses
    
    uint256 public marketCount;
    address public owner;
    uint256 public constant DISPUTE_PERIOD = 24 hours; // Time to dispute after resolution
    uint256 public constant MIN_DISPUTE_BOND = 0.1 ether; // Minimum bond to dispute
    uint256 public disputeCount;
    
    event MarketCreated(uint256 indexed marketId, string question, address creator);
    event PositionTaken(uint256 indexed marketId, address indexed user, uint8 option, uint256 amount);
    event MarketResolved(uint256 indexed marketId, uint8 winner);
    event RewardsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event MarketDisputed(uint256 indexed marketId, address indexed disputer, uint8 proposedWinner, uint256 bondAmount, string reason);
    event DisputeResolved(uint256 indexed marketId, uint256 indexed disputeIndex, bool disputeValid, address indexed admin);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == owner || admins[msg.sender], "Only admin can call this function");
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
        disputeCount = 0;
        admins[msg.sender] = true; // Owner is automatically an admin
    }
    
    // Admin management functions
    function addAdmin(address admin) external onlyOwner {
        require(admin != address(0), "Invalid admin address");
        require(!admins[admin], "Already an admin");
        admins[admin] = true;
        emit AdminAdded(admin);
    }
    
    function removeAdmin(address admin) external onlyOwner {
        require(admin != owner, "Cannot remove owner as admin");
        require(admins[admin], "Not an admin");
        admins[admin] = false;
        emit AdminRemoved(admin);
    }
    
    function isAdmin(address account) external view returns (bool) {
        return account == owner || admins[account];
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
            creator: msg.sender,
            resolutionTime: 0,
            disputed: false,
            disputeEndTime: 0
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
        market.resolutionTime = block.timestamp;
        market.disputeEndTime = block.timestamp + DISPUTE_PERIOD;
        
        emit MarketResolved(marketId, winner);
    }
    
    // UMA-like dispute mechanism
    function disputeMarket(uint256 marketId, uint8 proposedWinner, string memory reason) 
        external 
        payable
        marketExists(marketId) 
    {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved yet");
        require(!market.disputed, "Market already disputed");
        require(block.timestamp <= market.disputeEndTime, "Dispute period ended");
        require(proposedWinner == 1 || proposedWinner == 2, "Invalid proposed winner");
        require(proposedWinner != market.winner, "Cannot dispute with same winner");
        require(msg.value >= MIN_DISPUTE_BOND, "Insufficient dispute bond");
        require(bytes(reason).length > 0, "Must provide dispute reason");
        
        market.disputed = true;
        
        marketDisputes[marketId].push(Dispute({
            marketId: marketId,
            disputer: msg.sender,
            proposedWinner: proposedWinner,
            bondAmount: msg.value,
            disputeTime: block.timestamp,
            resolved: false,
            disputeValid: false,
            reason: reason
        }));
        
        disputeCount++;
        
        emit MarketDisputed(marketId, msg.sender, proposedWinner, msg.value, reason);
    }
    
    // Admin function to resolve disputes
    function resolveDispute(uint256 marketId, uint256 disputeIndex, bool disputeValid) 
        external 
        onlyAdmin
        marketExists(marketId) 
    {
        Market storage market = markets[marketId];
        require(market.disputed, "Market not disputed");
        require(disputeIndex < marketDisputes[marketId].length, "Invalid dispute index");
        
        Dispute storage dispute = marketDisputes[marketId][disputeIndex];
        require(!dispute.resolved, "Dispute already resolved");
        
        dispute.resolved = true;
        dispute.disputeValid = disputeValid;
        
        if (disputeValid) {
            // Update market winner to disputed winner
            market.winner = dispute.proposedWinner;
            // Return bond to disputer
            payable(dispute.disputer).transfer(dispute.bondAmount);
        } else {
            // Bond is slashed (kept by contract)
            // Original resolution stands
        }
        
        market.disputed = false;
        
        emit DisputeResolved(marketId, disputeIndex, disputeValid, msg.sender);
    }
    
    function claimRewards(uint256 marketId) 
        external 
        marketExists(marketId) 
    {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved yet");
        require(!market.disputed, "Market is disputed, cannot claim yet");
        require(block.timestamp > market.disputeEndTime, "Still in dispute period");
        
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
    
    // Get dispute information for a market
    function getMarketDisputes(uint256 marketId) 
        external 
        view 
        marketExists(marketId) 
        returns (Dispute[] memory) 
    {
        return marketDisputes[marketId];
    }
    
    function getDisputeCount(uint256 marketId) 
        external 
        view 
        marketExists(marketId) 
        returns (uint256) 
    {
        return marketDisputes[marketId].length;
    }
    
    // Check if market is in dispute period
    function isInDisputePeriod(uint256 marketId) 
        external 
        view 
        marketExists(marketId) 
        returns (bool) 
    {
        Market storage market = markets[marketId];
        return market.resolved && 
               !market.disputed && 
               block.timestamp <= market.disputeEndTime;
    }
    
    // Check if rewards can be claimed
    function canClaimRewards(uint256 marketId) 
        external 
        view 
        marketExists(marketId) 
        returns (bool) 
    {
        Market storage market = markets[marketId];
        return market.resolved && 
               !market.disputed && 
               block.timestamp > market.disputeEndTime;
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    receive() external payable {}
}