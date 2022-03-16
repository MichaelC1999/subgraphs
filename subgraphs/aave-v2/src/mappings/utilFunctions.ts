import {
    Address,
    BigDecimal,
    BigInt,
    dataSource,
    ethereum
} from "@graphprotocol/graph-ts";
  
import {
    Token,
    Market,
    RewardToken,
    MarketDailySnapshot,
    LendingProtocol,
    UsageMetricsDailySnapshot,
    FinancialsDailySnapshot
} from "../../generated/schema";

import { IPriceOracleGetter } from "../../generated/templates/LendingPool/IPriceOracleGetter";
  
import { IERC20 } from "../../generated/templates/LendingPool/IERC20";

export const zeroAddr = "0x0000000000000000000000000000000000000000";

export function createMarket(
    event: ethereum.Event,
    id: string,
    inputTokens: Token[],
    outputToken: Token,
    rewardTokens: Token[]
  ): Market {
    // Check if a Market entity implementation has already been created with the provided lending pool address/id
    let market = Market.load(id);
    if (market === null) {
        // If the market entity has not been created yet, create the instance
        // Populate fields with data that has been passed to the function
        // Other data fields are initialized as 0/[]/false
        let inputTokenBalances: BigDecimal[] = [];
        for (let i = 0; i < inputTokens.length; i++) {
            inputTokenBalances.push(new BigDecimal(new BigInt(0)));
        }
        const protocolId = getProtocolIdFromCtx();
        const protocol = fetchProtocolEntity(protocolId);
        market = new Market(id);
        market.protocol = protocol.name;
        market.inputTokens = inputTokens.map<string>((t) => t.id);
        market.outputToken = outputToken.id;
        market.rewardTokens = rewardTokens.map<string>((t) => t.id);
        market.inputTokenBalances = inputTokenBalances;
        market.outputTokenSupply = new BigDecimal(new BigInt(0));
        market.outputTokenPriceUSD = new BigDecimal(new BigInt(0));
        market.createdBlockNumber = event.block.number;
        market.createdTimestamp = event.block.timestamp;
        market.snapshots = [];
        market.name = "";
        market.isActive = false;
        market.canBorrowFrom = false;
        market.canUseAsCollateral = false;
        market.maximumLTV = new BigDecimal(BigInt.fromI32(0));
        market.liquidationPenalty = new BigDecimal(BigInt.fromI32(0));
        market.liquidationThreshold = new BigDecimal(BigInt.fromI32(0));
        market.depositRate = new BigDecimal(BigInt.fromI32(0));
        market.stableBorrowRate = new BigDecimal(BigInt.fromI32(0));
        market.variableBorrowRate = new BigDecimal(BigInt.fromI32(0));
        market.totalValueLockedUSD = new BigDecimal(BigInt.fromI32(0));
        market.totalVolumeUSD = new BigDecimal(BigInt.fromI32(0));
        market.deposits = [];
        market.withdraws = [];
        market.borrows = [];
        market.repays = [];
        market.liquidations = [];
        market.save();

        protocol.markets.push(market.id);
        protocol.save();
    }
    return market as Market;
  }

export function initToken(assetAddr: Address): Token {
    // In the schema Token and RewardToken entities, the id is said to be " Smart contract address of the market ". 
    // How would this work if there are multiple tokens that make up part of a market? ie a token being an input token and the corresponding aToken being the output token
    // For now, the token id is set as the asset address

    // Check if a token entity implementation has already been created with the provided asset address
    let asset = Token.load(assetAddr.toHex());
    if (asset === null) {
      // Create a new Token implementation
      asset = new Token(assetAddr.toHex());
      // Instantiate the Token with the IERC20 interface in order to access contract read methods
      let tokenInstance = IERC20.bind(assetAddr);
      // Pull the token name from the contract
      asset.name = tokenInstance.name();
      // Pull the token symbol from the contract
      asset.symbol = tokenInstance.symbol();
      // Pull the token decimals from the contract
      asset.decimals = tokenInstance.decimals();

      asset.save();
    }
    return asset as Token;
}

// WILL COMBINE THIS WITH THE initToken FUNCTION INTO ONE DUAL-PURPOSE FUNCTION
// HOW WOULD ONE GET THE TOKEN TYPE(DEPOSIT/BORROW)? SEE aToken.ts
export function initRewardToken(assetAddr: Address, market: Market): RewardToken {
    // See initToken() function above
    let asset = RewardToken.load(assetAddr.toHex());
    if (asset === null) {
      asset = new RewardToken(assetAddr.toHex());
      let tokenInstance = IERC20.bind(assetAddr);
      // Pull the reward token name from the contract
      asset.name = tokenInstance.name();
      // Pull the reward token symbol from the contract
      asset.symbol = tokenInstance.symbol();
      // Pull the reward token decimals from the contract
      asset.decimals = tokenInstance.decimals();
      let type = "DEPOSIT"
      asset.type = type;
      asset.save();
    }
    // Add the reward token to the market
    let rewardTokens = market.rewardTokens;
    if (rewardTokens === null) {
        rewardTokens = [asset.id]
    } else if (!rewardTokens.includes(asset.id)) {
        rewardTokens.push(asset.id);
    }
    
    market.rewardTokens = rewardTokens;
    market.save();
    
    return asset as RewardToken;
}

export function fetchProtocolEntity(protocolId: string): LendingProtocol {
    // Load or create the Lending Protocol entity implementation
    // Protocol Id is currently 'aave-v2' rather than a UUID. Need to ask what the UUID should be, ie. a hash, just a number, mix of values etc
    let lendingProtocol = LendingProtocol.load(protocolId);
    if (!lendingProtocol) {
        lendingProtocol = new LendingProtocol(protocolId);
        // Should these values be hardcoded?
        lendingProtocol.name = 'Aave-v2';
        lendingProtocol.slug = 'aave-v2';
        lendingProtocol.network = 'ETHEREUM';
        // Are these options correct?
        lendingProtocol.type = 'LENDING';
        lendingProtocol.lendingType = 'POOLED';
        lendingProtocol.riskType = 'ISOLATED';
        // Initialize empty arrays
        lendingProtocol.usageMetrics = [];
        lendingProtocol.financialMetrics = [];
        lendingProtocol.markets = [];
    }    
    return lendingProtocol as LendingProtocol;
}

// SNAPSHOT FUNCTIONS

export function updateMarketDailySnapshot(
    event: ethereum.Event,
    market: Market,
  ): MarketDailySnapshot {
    // Create a snapshot of market data throughout the day. One snapshot per market per day.
    // Attempt to load Snapshot entity implementation based on days since epoch in id. 
    // Snapshot is created at the start of a new day and updated after transactions change certain market data.
    const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
    let id = market.id.concat("-").concat(daysSinceEpoch.toString());
    const protocolId = getProtocolIdFromCtx();
    const protocol = fetchProtocolEntity(protocolId);
    let marketSnapshot = MarketDailySnapshot.load(id);
    if (marketSnapshot === null) {
        // Data needed upon Snapshot initialization
        marketSnapshot = new MarketDailySnapshot(id);
        marketSnapshot.market = market.id;
        marketSnapshot.protocol = protocol.id;
        market.snapshots.push(id);
        market.save();
    }
    // Data potentially updated whether the snapshot instance is new or loaded
    // The following fields are pulled from the current Market Entity Implementation's data.
    // As this function is called AFTER a transaction is completed, each snapshot's data will vary from the previous snapshot
    marketSnapshot.inputTokenBalances = market.inputTokenBalances[0];
    // Market does not have inputTokenPricesUSD property
    // Either pass in or call getAssetPriceInUSDC() on the input token from here
    marketSnapshot.inputTokenPricesUSD = [];
    marketSnapshot.outputTokenSupply = market.outputTokenSupply;
    marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketSnapshot.blockNumber = event.block.number;
    marketSnapshot.timestamp = event.block.timestamp;
    marketSnapshot.depositRate = market.depositRate;
    marketSnapshot.stableBorrowRate = market.stableBorrowRate;
    marketSnapshot.variableBorrowRate = market.variableBorrowRate;
    marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
    marketSnapshot.rewardTokenEmissionsAmount = marketSnapshot.rewardTokenEmissionsAmount || [];
    marketSnapshot.rewardTokenEmissionsUSD = marketSnapshot.rewardTokenEmissionsUSD || [];
    marketSnapshot.save();

    return marketSnapshot as MarketDailySnapshot;
}

export function updateMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
    // Load or create the current date's UsageMetricsDailySnapshot implementation
    const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
    let metricsDailySnapshot = UsageMetricsDailySnapshot.load(daysSinceEpoch);
    if (!metricsDailySnapshot) {
        metricsDailySnapshot = new UsageMetricsDailySnapshot(daysSinceEpoch);
        const protocolId = getProtocolIdFromCtx();
        const protocol = fetchProtocolEntity(protocolId);
        metricsDailySnapshot.protocol = protocol.id;
        // Initialize zero values
        metricsDailySnapshot.activeUsers = 0;
        metricsDailySnapshot.totalUniqueUsers = 0;
        metricsDailySnapshot.dailyTransactionCount = 0;
        // Push the new day's entity implementation to the protocol array
        protocol.usageMetrics.push(metricsDailySnapshot.id);
        protocol.save();
    }
    metricsDailySnapshot.blockNumber = event.block.number;
    metricsDailySnapshot.timestamp = event.block.timestamp;
    metricsDailySnapshot.save();
    return metricsDailySnapshot as UsageMetricsDailySnapshot;
}

export function updateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
    // Load or create the current date's FinancialsDailySnapshot implementation
    const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
    const protocolId = getProtocolIdFromCtx();
    const protocol = fetchProtocolEntity(protocolId);
    let financialsDailySnapshot = FinancialsDailySnapshot.load(daysSinceEpoch);
    if (!financialsDailySnapshot) {
        financialsDailySnapshot = new FinancialsDailySnapshot(daysSinceEpoch);
        financialsDailySnapshot.protocol = protocol.id;
        // Initialize zero values
        financialsDailySnapshot.totalValueLockedUSD = new BigDecimal(new BigInt(0));
        financialsDailySnapshot.totalVolumeUSD = new BigDecimal(new BigInt(0));
        financialsDailySnapshot.supplySideRevenueUSD = new BigDecimal(new BigInt(0));
        financialsDailySnapshot.protocolSideRevenueUSD = new BigDecimal(new BigInt(0));
        financialsDailySnapshot.feesUSD = new BigDecimal(new BigInt(0));
        // Push the new day's entity implementation to the protocol array
        protocol.financialMetrics.push(financialsDailySnapshot.id);
        protocol.save();
    }
    financialsDailySnapshot.blockNumber = event.block.number;
    financialsDailySnapshot.timestamp = event.block.timestamp;
    financialsDailySnapshot.save();
    return financialsDailySnapshot as FinancialsDailySnapshot;
}

// PRICE/ORACLE FUNCTIONS

export function getPriceOracle(): IPriceOracleGetter {
    // priceOracle is set the address of the price oracle contract of the address provider contract, pulled from context
    const priceOracle = dataSource.context().getString("priceOracle");
    return IPriceOracleGetter.bind(Address.fromString(priceOracle));
}

export function getAssetPriceInUSDC(token: Token): BigInt {
    const tokenAddress = Address.fromString(token.id);
    // Get the oracle contract instance
    const oracle = getPriceOracle();
    // The Aave protocol oracle contracts only contain a method for getting an asset price in ETH
    // Current idea is to fetch price in ETH, then get the Aave USDC price in ETH to calc an asset price in USDC.
    // Get the asset price in ETH
    const assetPriceInEth = oracle.getAssetPrice(tokenAddress);
    
    // FETCH USDC PRICE IN ETH
    // CALCULATE THE ASSET PRICE IN USDC

    // return price per asset in USDC
    return new BigInt(0);
}

// CONTEXT FUNCTIONS

export function getLendingPoolFromCtx(): string {
    // Get the lending pool/market address with context
    // Need to verify that context is available here, not just the lendingPoolConfigurator.ts script
    let context = dataSource.context();
    return context.getString("lendingPool");
}

export function getProtocolIdFromCtx(): string {
    // Get the lending pool/market address with context
    // Need to verify that context is available here, not just the lendingPoolConfigurator.ts script
    let context = dataSource.context();
    return context.getString("protocolId");
}

// MATH FUNCTIONS

export function rayDivision(a: BigInt, b: BigInt): BigInt {
    let halfB = b.div(BigInt.fromI32(2));
    let result = a.times(BigInt.fromI32(10).pow(27));
  result = result.plus(halfB);
  let division = result.div(b);
  return division;
}

export function rayMultiplication(a: BigInt, b: BigInt): BigInt {
  let result = a.times(b);
  result = result.plus((BigInt.fromI32(10).pow(27)).div(BigInt.fromI32(2)));
  let mult = result.div(BigInt.fromI32(10).pow(27));
  return mult;
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
    return (Math.floor(secondsSinceEpoch/86400)).toString();
}