import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  Deposit as DepositTransaction,
  LiquidityPool as LiquidityPoolStore,
} from "../../generated/schema";
import {
  getOrCreateLiquidityPool,
  getOrCreateDexAmmProtocol,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
<<<<<<< HEAD
=======
import { getUsdPricePerToken } from "../prices";
>>>>>>> b5219fd (Squashed All)
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "./Revenue";
import { WeightedPool as WeightedPoolContract } from "../../generated/templates/WeightedPool/WeightedPool";

export function createDepositTransaction(
  liquidityPool: LiquidityPoolStore,
  inputTokenAmounts: BigInt[],
  outputTokenMintedAmount: BigInt,
  amountUSD: BigDecimal,
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): DepositTransaction {
  let transactionId = "deposit-"
    .concat(transaction.hash.toHexString())
    .concat("-")
    .concat(transaction.index.toString());

  let depositTransaction = DepositTransaction.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new DepositTransaction(transactionId);

    depositTransaction.pool = liquidityPool.id;
    depositTransaction.protocol = getOrCreateDexAmmProtocol().id;

    depositTransaction.to = liquidityPool.id;
    depositTransaction.from = provider.toHexString();

    depositTransaction.hash = transaction.hash.toHexString();
    depositTransaction.logIndex = transaction.index.toI32();

    depositTransaction.inputTokens = liquidityPool.inputTokens;
    depositTransaction.inputTokenAmounts = inputTokenAmounts;

    depositTransaction.outputToken = liquidityPool.outputToken;
    depositTransaction.outputTokenAmount = outputTokenMintedAmount;

    depositTransaction.amountUSD = amountUSD;

    depositTransaction.timestamp = block.timestamp;
    depositTransaction.blockNumber = block.number;

    depositTransaction.save();
  }

  return depositTransaction;
}

export function UpdateMetricsAfterDeposit(block: ethereum.Block): void {
  const protocol = getOrCreateDexAmmProtocol();

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyDepositCount += 1;
  metricsHourlySnapshot.hourlyDepositCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  protocol.save();
}

export function getAddLiquidityFeesUSD(
  inputTokens: string[],
<<<<<<< HEAD
  fees: BigInt[],
  block: ethereum.Block
=======
  fees: BigInt[]
>>>>>>> b5219fd (Squashed All)
): BigDecimal {
  let totalFeesUSD = constants.BIGDECIMAL_ZERO;

  for (let idx = 0; idx < inputTokens.length; idx++) {
    if (fees.at(idx) == constants.BIGINT_ZERO) continue;

<<<<<<< HEAD
    let inputToken = utils.getOrCreateTokenFromString(
      inputTokens.at(idx),
      block.number
    );

    let inputTokenFee = fees
      .at(idx)
      .divDecimal(
        constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
      )
      .times(inputToken.lastPriceUSD!);
=======
    let inputToken = Address.fromString(inputTokens.at(idx));
    let inputTokenPrice = getUsdPricePerToken(inputToken);
    let inputTokenDecimals = utils.getTokenDecimals(inputToken);

    let inputTokenFee = fees
      .at(idx)
      .divDecimal(inputTokenDecimals)
      .times(inputTokenPrice.usdPrice)
      .div(inputTokenPrice.decimalsBaseTen);
>>>>>>> b5219fd (Squashed All)

    totalFeesUSD = totalFeesUSD.plus(inputTokenFee);
  }

  return totalFeesUSD;
}

export function Deposit(
  poolAddress: Address,
  depositedCoinAmounts: BigInt[],
  fees: BigInt[],
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  let inputTokenAmounts: BigInt[] = [];
  let inputTokenBalances = pool.inputTokenBalances;
  let depositAmountUSD = constants.BIGDECIMAL_ZERO;

  for (let idx = 0; idx < depositedCoinAmounts.length; idx++) {
<<<<<<< HEAD
    let inputToken = utils.getOrCreateTokenFromString(
      pool.inputTokens[idx],
      block.number
    );

    let inputTokenIndex = pool.inputTokens.indexOf(inputToken.id);
=======
    let inputToken = utils.getOrCreateTokenFromString(pool.inputTokens[idx]);
    let inputTokenIndex = pool.inputTokens.indexOf(inputToken.id);

    let inputTokenAddress = Address.fromString(inputToken.id);
    let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
    let inputTokenDecimals = utils.getTokenDecimals(inputTokenAddress);

>>>>>>> b5219fd (Squashed All)
    inputTokenBalances[inputTokenIndex] = inputTokenBalances[
      inputTokenIndex
    ].plus(depositedCoinAmounts[idx].minus(fees[idx]));

    inputTokenAmounts.push(depositedCoinAmounts[idx]);

    depositAmountUSD = depositAmountUSD.plus(
      depositedCoinAmounts[idx]
<<<<<<< HEAD
        .divDecimal(
          constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
        )
        .times(inputToken.lastPriceUSD!)
=======
        .divDecimal(inputTokenDecimals)
        .times(inputTokenPrice.usdPrice)
        .div(inputTokenPrice.decimalsBaseTen)
>>>>>>> b5219fd (Squashed All)
    );
  }

  let poolContract = WeightedPoolContract.bind(poolAddress);
  let totalSupplyAfterDeposit = utils.readValue<BigInt>(
    poolContract.try_totalSupply(),
    pool.outputTokenSupply!
  );
  let outputTokenMintedAmount = totalSupplyAfterDeposit.minus(
    pool.outputTokenSupply!
  );

  pool.inputTokenBalances = inputTokenBalances;
  pool.totalValueLockedUSD = utils.getPoolTVL(
    pool.inputTokens,
<<<<<<< HEAD
    pool.inputTokenBalances,
    block
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(poolAddress);
  pool.outputTokenSupply = totalSupplyAfterDeposit;
  pool.outputTokenPriceUSD = utils.getOutputTokenPriceUSD(poolAddress, block);
=======
    pool.inputTokenBalances
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(poolAddress);
  pool.outputTokenSupply = totalSupplyAfterDeposit;
>>>>>>> b5219fd (Squashed All)
  pool.save();

  createDepositTransaction(
    pool,
    inputTokenAmounts,
    outputTokenMintedAmount,
    depositAmountUSD,
    provider,
    transaction,
    block
  );

<<<<<<< HEAD
  let protocolSideRevenueUSD = getAddLiquidityFeesUSD(
    pool.inputTokens,
    fees,
    block
  );
=======
  let protocolSideRevenueUSD = getAddLiquidityFeesUSD(pool.inputTokens, fees);
>>>>>>> b5219fd (Squashed All)

  updateRevenueSnapshots(
    pool,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterDeposit(block);

  log.info(
    "[AddLiquidity] LiquidityPool: {}, sharesMinted: {}, depositAmount: [{}], inputTokenBalances: [{}], depositAmountUSD: {}, fees: {}, feesUSD: {}, TxnHash: {}",
    [
      poolAddress.toHexString(),
      outputTokenMintedAmount.toString(),
      depositedCoinAmounts.join(", "),
      inputTokenBalances.join(", "),
      depositAmountUSD.truncate(1).toString(),
      fees.join(", "),
      protocolSideRevenueUSD.truncate(1).toString(),
      transaction.hash.toHexString(),
    ]
  );
}
