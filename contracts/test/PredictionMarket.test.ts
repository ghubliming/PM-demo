import { expect } from "chai";
import { ethers } from "hardhat";
import { PredictionMarket } from "../typechain-types";

describe("PredictionMarket", function () {
  let predictionMarket: PredictionMarket;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy();
  });

  describe("Market Creation", function () {
    it("Should create a new market", async function () {
      const question = "Will Bitcoin reach $100k?";
      const option1 = "Yes";
      const option2 = "No";
      const duration = 86400; // 24 hours

      await expect(predictionMarket.createMarket(question, option1, option2, duration))
        .to.emit(predictionMarket, "MarketCreated")
        .withArgs(0, question, owner.address);

      const market = await predictionMarket.getMarket(0);
      expect(market.question).to.equal(question);
      expect(market.option1).to.equal(option1);
      expect(market.option2).to.equal(option2);
      expect(market.creator).to.equal(owner.address);
    });
  });

  describe("Position Trading", function () {
    beforeEach(async function () {
      await predictionMarket.createMarket("Test Question", "Yes", "No", 86400);
    });

    it("Should allow buying positions", async function () {
      const betAmount = ethers.parseEther("1.0");
      
      await expect(predictionMarket.connect(user1).buyPosition(0, 1, { value: betAmount }))
        .to.emit(predictionMarket, "PositionTaken")
        .withArgs(0, user1.address, 1, betAmount);

      const market = await predictionMarket.getMarket(0);
      expect(market.totalStaked).to.equal(betAmount);
      expect(market.option1Stakes).to.equal(betAmount);

      const position = await predictionMarket.getUserPosition(0, user1.address);
      expect(position.option1Amount).to.equal(betAmount);
    });

    it("Should calculate odds correctly", async function () {
      await predictionMarket.connect(user1).buyPosition(0, 1, { value: ethers.parseEther("3.0") });
      await predictionMarket.connect(user2).buyPosition(0, 2, { value: ethers.parseEther("1.0") });

      const [option1Odds, option2Odds] = await predictionMarket.getMarketOdds(0);
      expect(option1Odds).to.equal(75); // 3/4 = 75%
      expect(option2Odds).to.equal(25); // 1/4 = 25%
    });
  });

  describe("Market Resolution", function () {
    beforeEach(async function () {
      await predictionMarket.createMarket("Test Question", "Yes", "No", 1); // 1 second duration
      await predictionMarket.connect(user1).buyPosition(0, 1, { value: ethers.parseEther("2.0") });
      await predictionMarket.connect(user2).buyPosition(0, 2, { value: ethers.parseEther("1.0") });
      
      // Wait for market to end
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    it("Should resolve market and distribute rewards", async function () {
      await expect(predictionMarket.resolveMarket(0, 1))
        .to.emit(predictionMarket, "MarketResolved")
        .withArgs(0, 1);

      const market = await predictionMarket.getMarket(0);
      expect(market.resolved).to.be.true;
      expect(market.winner).to.equal(1);

      // User1 should be able to claim rewards (original bet + share of losing bets)
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      await predictionMarket.connect(user1).claimRewards(0);
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      
      // Should receive more than original bet due to winning
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });
});