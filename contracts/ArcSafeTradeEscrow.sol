// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ArcSafeTradeEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum TradeStatus {
        Created,
        Funded,
        Shipped,
        Completed,
        Cancelled,
        Disputed,
        Refunded
    }

    struct Trade {
        address buyer;
        address seller;
        uint256 amount;
        TradeStatus status;
        uint256 createdAt;
        uint256 fundedAt;
        uint256 shippedAt;
        uint256 completedAt;
    }

    error Unauthorized(address caller);
    error InvalidStatus(uint256 tradeId, TradeStatus currentStatus);
    error InvalidSeller(address seller);
    error InvalidAmount(uint256 amount);
    error InvalidTrade(uint256 tradeId);
    error InvalidToken(address token);

    IERC20 public immutable usdc;
    uint256 public nextTradeId;
    mapping(uint256 => Trade) public trades;

    event TradeCreated(
        uint256 indexed tradeId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );
    event TradeFunded(uint256 indexed tradeId, address indexed buyer, uint256 amount);
    event TradeShipped(uint256 indexed tradeId, address indexed seller);
    event TradeCompleted(uint256 indexed tradeId, address indexed seller, uint256 amount);
    event TradeCancelled(uint256 indexed tradeId);
    event TradeDisputed(uint256 indexed tradeId, address indexed openedBy);
    event TradeRefunded(uint256 indexed tradeId, address indexed buyer, uint256 amount);
    event DisputeResolved(uint256 indexed tradeId, bool releasedToSeller);

    constructor(address usdcToken) Ownable(msg.sender) {
        if (usdcToken == address(0)) {
            revert InvalidToken(usdcToken);
        }

        usdc = IERC20(usdcToken);
    }

    function createTrade(address seller, uint256 amount) external returns (uint256) {
        if (seller == address(0) || seller == msg.sender) {
            revert InvalidSeller(seller);
        }
        if (amount == 0) {
            revert InvalidAmount(amount);
        }

        uint256 tradeId = nextTradeId;
        nextTradeId = tradeId + 1;

        trades[tradeId] = Trade({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            status: TradeStatus.Created,
            createdAt: block.timestamp,
            fundedAt: 0,
            shippedAt: 0,
            completedAt: 0
        });

        emit TradeCreated(tradeId, msg.sender, seller, amount);
        return tradeId;
    }

    function fundTrade(uint256 tradeId) external nonReentrant {
        Trade storage trade = _requireTrade(tradeId);
        if (trade.buyer != msg.sender) {
            revert Unauthorized(msg.sender);
        }
        if (trade.status != TradeStatus.Created) {
            revert InvalidStatus(tradeId, trade.status);
        }

        usdc.safeTransferFrom(msg.sender, address(this), trade.amount);

        trade.status = TradeStatus.Funded;
        trade.fundedAt = block.timestamp;

        emit TradeFunded(tradeId, msg.sender, trade.amount);
    }

    function markShipped(uint256 tradeId) external {
        Trade storage trade = _requireTrade(tradeId);
        if (trade.seller != msg.sender) {
            revert Unauthorized(msg.sender);
        }
        if (trade.status != TradeStatus.Funded) {
            revert InvalidStatus(tradeId, trade.status);
        }

        trade.status = TradeStatus.Shipped;
        trade.shippedAt = block.timestamp;

        emit TradeShipped(tradeId, msg.sender);
    }

    function confirmReceived(uint256 tradeId) external nonReentrant {
        Trade storage trade = _requireTrade(tradeId);
        if (trade.buyer != msg.sender) {
            revert Unauthorized(msg.sender);
        }
        if (trade.status != TradeStatus.Shipped) {
            revert InvalidStatus(tradeId, trade.status);
        }

        trade.status = TradeStatus.Completed;
        trade.completedAt = block.timestamp;

        usdc.safeTransfer(trade.seller, trade.amount);

        emit TradeCompleted(tradeId, trade.seller, trade.amount);
    }

    function openDispute(uint256 tradeId) external {
        Trade storage trade = _requireTrade(tradeId);
        if (msg.sender != trade.buyer && msg.sender != trade.seller) {
            revert Unauthorized(msg.sender);
        }
        if (trade.status != TradeStatus.Funded && trade.status != TradeStatus.Shipped) {
            revert InvalidStatus(tradeId, trade.status);
        }

        trade.status = TradeStatus.Disputed;

        emit TradeDisputed(tradeId, msg.sender);
    }

    function resolveDispute(uint256 tradeId, bool releaseToSeller) external onlyOwner nonReentrant {
        Trade storage trade = _requireTrade(tradeId);
        if (trade.status != TradeStatus.Disputed) {
            revert InvalidStatus(tradeId, trade.status);
        }

        if (releaseToSeller) {
            trade.status = TradeStatus.Completed;
            trade.completedAt = block.timestamp;
            usdc.safeTransfer(trade.seller, trade.amount);

            emit TradeCompleted(tradeId, trade.seller, trade.amount);
        } else {
            trade.status = TradeStatus.Refunded;
            usdc.safeTransfer(trade.buyer, trade.amount);

            emit TradeRefunded(tradeId, trade.buyer, trade.amount);
        }

        emit DisputeResolved(tradeId, releaseToSeller);
    }

    function cancelBeforeFunding(uint256 tradeId) external {
        Trade storage trade = _requireTrade(tradeId);
        if (trade.buyer != msg.sender) {
            revert Unauthorized(msg.sender);
        }
        if (trade.status != TradeStatus.Created) {
            revert InvalidStatus(tradeId, trade.status);
        }

        trade.status = TradeStatus.Cancelled;

        emit TradeCancelled(tradeId);
    }

    function getTrade(uint256 tradeId) external view returns (Trade memory) {
        return _requireTrade(tradeId);
    }

    function _requireTrade(uint256 tradeId) internal view returns (Trade storage trade) {
        if (tradeId >= nextTradeId) {
            revert InvalidTrade(tradeId);
        }

        trade = trades[tradeId];
    }
}
