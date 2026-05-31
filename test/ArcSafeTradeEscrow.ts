import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

const STATUS = {
  Created: 0n,
  Funded: 1n,
  Shipped: 2n,
  Completed: 3n,
  Cancelled: 4n,
  Disputed: 5n,
  Refunded: 6n,
} as const;

describe("ArcSafeTradeEscrow", function () {
  async function deployFixture() {
    const [admin, buyer, seller, other] = await ethers.getSigners();
    const usdc = await ethers.deployContract("MockUSDC");
    const escrow = await ethers.deployContract("ArcSafeTradeEscrow", [
      await usdc.getAddress(),
    ]);

    return { admin, buyer, seller, other, usdc, escrow };
  }

  async function createTradeFixture() {
    const fixture = await deployFixture();
    const amount = 25_000_000n;

    await fixture.escrow
      .connect(fixture.buyer)
      .createTrade(await fixture.seller.getAddress(), amount);

    return { ...fixture, amount, tradeId: 0n };
  }

  async function fundedTradeFixture() {
    const fixture = await createTradeFixture();
    await fixture.usdc.mint(await fixture.buyer.getAddress(), fixture.amount);
    await fixture.usdc
      .connect(fixture.buyer)
      .approve(await fixture.escrow.getAddress(), fixture.amount);
    await fixture.escrow.connect(fixture.buyer).fundTrade(fixture.tradeId);

    return fixture;
  }

  async function shippedTradeFixture() {
    const fixture = await fundedTradeFixture();
    await fixture.escrow.connect(fixture.seller).markShipped(fixture.tradeId);

    return fixture;
  }

  it("creates a trade", async function () {
    const { buyer, seller, escrow, amount, tradeId } = await createTradeFixture();
    const trade = await escrow.getTrade(tradeId);

    expect(trade.buyer).to.equal(await buyer.getAddress());
    expect(trade.seller).to.equal(await seller.getAddress());
    expect(trade.amount).to.equal(amount);
    expect(trade.status).to.equal(STATUS.Created);
    expect(trade.createdAt).to.be.greaterThan(0n);
  });

  it("funds a trade", async function () {
    const { buyer, escrow, usdc, amount, tradeId } = await fundedTradeFixture();
    const trade = await escrow.getTrade(tradeId);

    expect(trade.status).to.equal(STATUS.Funded);
    expect(trade.fundedAt).to.be.greaterThan(0n);
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(amount);
    expect(await usdc.balanceOf(await buyer.getAddress())).to.equal(0n);
  });

  it("marks a trade as shipped", async function () {
    const { escrow, tradeId } = await shippedTradeFixture();
    const trade = await escrow.getTrade(tradeId);

    expect(trade.status).to.equal(STATUS.Shipped);
    expect(trade.shippedAt).to.be.greaterThan(0n);
  });

  it("releases USDC to the seller when the buyer confirms receipt", async function () {
    const { buyer, escrow, seller, usdc, amount, tradeId } = await shippedTradeFixture();

    await expect(escrow.connect(buyer).confirmReceived(tradeId))
      .to.emit(escrow, "TradeCompleted")
      .withArgs(tradeId, await seller.getAddress(), amount);

    const trade = await escrow.getTrade(tradeId);
    expect(trade.status).to.equal(STATUS.Completed);
    expect(trade.completedAt).to.be.greaterThan(0n);
    expect(await usdc.balanceOf(await seller.getAddress())).to.equal(amount);
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0n);
  });

  it("refunds the buyer when a dispute is resolved in the buyer's favor", async function () {
    const { escrow, buyer, usdc, amount, tradeId } = await fundedTradeFixture();

    await escrow.connect(buyer).openDispute(tradeId);
    await expect(escrow.resolveDispute(tradeId, false))
      .to.emit(escrow, "DisputeResolved")
      .withArgs(tradeId, false);

    const trade = await escrow.getTrade(tradeId);
    expect(trade.status).to.equal(STATUS.Refunded);
    expect(await usdc.balanceOf(await buyer.getAddress())).to.equal(amount);
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0n);
  });

  it("releases funds to the seller when a dispute is resolved for the seller", async function () {
    const { escrow, seller, usdc, amount, tradeId } = await fundedTradeFixture();

    await escrow.connect(seller).openDispute(tradeId);
    await expect(escrow.resolveDispute(tradeId, true))
      .to.emit(escrow, "DisputeResolved")
      .withArgs(tradeId, true);

    const trade = await escrow.getTrade(tradeId);
    expect(trade.status).to.equal(STATUS.Completed);
    expect(trade.completedAt).to.be.greaterThan(0n);
    expect(await usdc.balanceOf(await seller.getAddress())).to.equal(amount);
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0n);
  });

  it("rejects unauthorized calls", async function () {
    const { buyer, seller, other, escrow, usdc, amount, tradeId } =
      await fundedTradeFixture();

    await expect(escrow.connect(other).markShipped(tradeId))
      .to.be.revertedWithCustomError(escrow, "Unauthorized")
      .withArgs(await other.getAddress());

    await expect(escrow.connect(seller).fundTrade(tradeId))
      .to.be.revertedWithCustomError(escrow, "Unauthorized")
      .withArgs(await seller.getAddress());

    await expect(escrow.connect(other).openDispute(tradeId))
      .to.be.revertedWithCustomError(escrow, "Unauthorized")
      .withArgs(await other.getAddress());

    await escrow.connect(seller).markShipped(tradeId);

    await expect(escrow.connect(other).confirmReceived(tradeId))
      .to.be.revertedWithCustomError(escrow, "Unauthorized")
      .withArgs(await other.getAddress());

    await escrow.connect(buyer).openDispute(tradeId);

    await expect(escrow.connect(other).resolveDispute(tradeId, false))
      .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount")
      .withArgs(await other.getAddress());

    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(amount);
  });
});
