import { expect } from "chai";
import { ethers } from "hardhat";
import { PredictionMarket } from "../typechain-types";

describe("PredictionMarket", function () {
  let predictionMarket: PredictionMarket;
  let owner: any;
  let user1: any;
  let user2: any;
  let admin1: any;

  beforeEach(async function () {
    [owner, user1, user2, admin1] = await ethers.getSigners();
    
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy();
  });

  describe("Admin Management", function () {
    it("Should set owner as admin by default", async function () {
      expect(await predictionMarket.isAdmin(owner.address)).to.be.true;
      expect(await predictionMarket.admins(owner.address)).to.be.true;
    });

    it("Should allow owner to add admins", async function () {
      await expect(predictionMarket.addAdmin(admin1.address))
        .to.emit(predictionMarket, "AdminAdded")
        .withArgs(admin1.address);
      
      expect(await predictionMarket.isAdmin(admin1.address)).to.be.true;
    });

    it("Should allow owner to remove admins", async function () {
      await predictionMarket.addAdmin(admin1.address);
      
      await expect(predictionMarket.removeAdmin(admin1.address))
        .to.emit(predictionMarket, "AdminRemoved")
        .withArgs(admin1.address);
      
      expect(await predictionMarket.isAdmin(admin1.address)).to.be.false;
    });

    it("Should not allow removing owner as admin", async function () {
      await expect(predictionMarket.removeAdmin(owner.address))
        .to.be.revertedWith("Cannot remove owner as admin");
    });
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

    it("Should resolve market with dispute period", async function () {
      await expect(predictionMarket.resolveMarket(0, 1))
        .to.emit(predictionMarket, "MarketResolved")
        .withArgs(0, 1);

      const market = await predictionMarket.getMarket(0);
      expect(market.resolved).to.be.true;
      expect(market.winner).to.equal(1);
      expect(market.disputed).to.be.false;
      expect(market.resolutionTime).to.be.gt(0);
      expect(market.disputeEndTime).to.be.gt(market.resolutionTime);

      // Should be in dispute period
      expect(await predictionMarket.isInDisputePeriod(0)).to.be.true;
      expect(await predictionMarket.canClaimRewards(0)).to.be.false;
    });

    it("Should prevent reward claims during dispute period", async function () {
      await predictionMarket.resolveMarket(0, 1);
      
      await expect(predictionMarket.connect(user1).claimRewards(0))
        .to.be.revertedWith("Still in dispute period");
    });
  });

  describe("Dispute Mechanism", function () {
    beforeEach(async function () {
      await predictionMarket.createMarket("Test Question", "Yes", "No", 1);
      await predictionMarket.connect(user1).buyPosition(0, 1, { value: ethers.parseEther("2.0") });
      await predictionMarket.connect(user2).buyPosition(0, 2, { value: ethers.parseEther("1.0") });
      
      // Wait for market to end and resolve
      await new Promise(resolve => setTimeout(resolve, 1100));
      await predictionMarket.resolveMarket(0, 1);
    });

    it("Should allow disputing market resolution", async function () {
      const bondAmount = ethers.parseEther("0.5");
      const reason = "Evidence shows option 2 should have won";
      
      await expect(predictionMarket.connect(user2).disputeMarket(0, 2, reason, { value: bondAmount }))
        .to.emit(predictionMarket, "MarketDisputed")
        .withArgs(0, user2.address, 2, bondAmount, reason);

      const market = await predictionMarket.getMarket(0);
      expect(market.disputed).to.be.true;
      
      const disputes = await predictionMarket.getMarketDisputes(0);
      expect(disputes.length).to.equal(1);
      expect(disputes[0].disputer).to.equal(user2.address);
      expect(disputes[0].proposedWinner).to.equal(2);
      expect(disputes[0].bondAmount).to.equal(bondAmount);
      expect(disputes[0].reason).to.equal(reason);
    });

    it("Should require minimum bond to dispute", async function () {
      const insufficientBond = ethers.parseEther("0.05"); // Less than MIN_DISPUTE_BOND
      
      await expect(predictionMarket.connect(user2).disputeMarket(0, 2, "Reason", { value: insufficientBond }))
        .to.be.revertedWith("Insufficient dispute bond");
    });

    it("Should not allow disputing with same winner", async function () {
      const bondAmount = ethers.parseEther("0.5");
      
      await expect(predictionMarket.connect(user2).disputeMarket(0, 1, "Reason", { value: bondAmount }))
        .to.be.revertedWith("Cannot dispute with same winner");
    });

    it("Should not allow dispute after dispute period", async function () {
      // Fast forward past dispute period (24 hours + buffer)
      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      const bondAmount = ethers.parseEther("0.5");
      await expect(predictionMarket.connect(user2).disputeMarket(0, 2, "Reason", { value: bondAmount }))
        .to.be.revertedWith("Dispute period ended");
    });

    it("Should allow admin to resolve valid dispute", async function () {
      // Add admin
      await predictionMarket.addAdmin(admin1.address);
      
      // Create dispute
      const bondAmount = ethers.parseEther("0.5");
      await predictionMarket.connect(user2).disputeMarket(0, 2, "Valid reason", { value: bondAmount });
      
      // Admin resolves dispute as valid
      const balanceBefore = await ethers.provider.getBalance(user2.address);
      
      await expect(predictionMarket.connect(admin1).resolveDispute(0, 0, true))
        .to.emit(predictionMarket, "DisputeResolved")
        .withArgs(0, 0, true, admin1.address);
      
      const balanceAfter = await ethers.provider.getBalance(user2.address);
      expect(balanceAfter).to.be.gt(balanceBefore); // Bond returned
      
      const market = await predictionMarket.getMarket(0);
      expect(market.winner).to.equal(2); // Winner changed
      expect(market.disputed).to.be.false;
    });

    it("Should slash bond for invalid dispute", async function () {
      // Add admin
      await predictionMarket.addAdmin(admin1.address);
      
      // Create dispute
      const bondAmount = ethers.parseEther("0.5");
      await predictionMarket.connect(user2).disputeMarket(0, 2, "Invalid reason", { value: bondAmount });
      
      // Admin resolves dispute as invalid
      const balanceBefore = await ethers.provider.getBalance(user2.address);
      const contractBalanceBefore = await ethers.provider.getBalance(predictionMarket.target);
      
      await expect(predictionMarket.connect(admin1).resolveDispute(0, 0, false))
        .to.emit(predictionMarket, "DisputeResolved")
        .withArgs(0, 0, false, admin1.address);
      
      const balanceAfter = await ethers.provider.getBalance(user2.address);
      const contractBalanceAfter = await ethers.provider.getBalance(predictionMarket.target);
      
      // Bond not returned (slashed)
      expect(balanceAfter).to.equal(balanceBefore);
      expect(contractBalanceAfter).to.equal(contractBalanceBefore);
      
      const market = await predictionMarket.getMarket(0);
      expect(market.winner).to.equal(1); // Original winner maintained
      expect(market.disputed).to.be.false;
    });

    it("Should only allow admins to resolve disputes", async function () {
      // Create dispute
      const bondAmount = ethers.parseEther("0.5");
      await predictionMarket.connect(user2).disputeMarket(0, 2, "Reason", { value: bondAmount });
      
      // Non-admin tries to resolve
      await expect(predictionMarket.connect(user1).resolveDispute(0, 0, true))
        .to.be.revertedWith("Only admin can call this function");
    });
  });

  describe("Rewards After Disputes", function () {
    beforeEach(async function () {
      await predictionMarket.createMarket("Test Question", "Yes", "No", 1);
      await predictionMarket.connect(user1).buyPosition(0, 1, { value: ethers.parseEther("2.0") });
      await predictionMarket.connect(user2).buyPosition(0, 2, { value: ethers.parseEther("1.0") });
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      await predictionMarket.resolveMarket(0, 1);
    });

    it("Should allow reward claims after dispute period without disputes", async function () {
      // Fast forward past dispute period
      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      expect(await predictionMarket.canClaimRewards(0)).to.be.true;
      
      // User1 should be able to claim rewards
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      await predictionMarket.connect(user1).claimRewards(0);
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should allow correct winner to claim after valid dispute resolution", async function () {
      await predictionMarket.addAdmin(admin1.address);
      
      // Create and resolve valid dispute (changes winner to option 2)
      const bondAmount = ethers.parseEther("0.5");
      await predictionMarket.connect(user2).disputeMarket(0, 2, "Valid dispute", { value: bondAmount });
      await predictionMarket.connect(admin1).resolveDispute(0, 0, true);
      
      expect(await predictionMarket.canClaimRewards(0)).to.be.true;
      
      // Now user2 should be able to claim rewards (winner changed to option 2)
      const balanceBefore = await ethers.provider.getBalance(user2.address);
      await predictionMarket.connect(user2).claimRewards(0);
      const balanceAfter = await ethers.provider.getBalance(user2.address);
      
      expect(balanceAfter).to.be.gt(balanceBefore);
      
      // User1 should not be able to claim (no longer winner)
      await expect(predictionMarket.connect(user1).claimRewards(0))
        .to.be.revertedWith("No winning position");
    });
  });
});