import {
  log,
  Address,
<<<<<<< HEAD
  ethereum,
  BigDecimal,
  dataSource,
  BigInt,
=======
  BigDecimal,
  dataSource,
>>>>>>> b5219fd (Squashed All)
} from "@graphprotocol/graph-ts";
import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { getForexUsdRate } from "./custom/ForexTokens";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getTokenPriceFromChainLink } from "./oracles/ChainLinkFeed";
import { getTokenPriceFromYearnLens } from "./oracles/YearnLensOracle";
import { getPriceUsdc as getPriceUsdcUniswap } from "./routers/UniswapRouter";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";
import { getTokenPriceFromCalculationCurve } from "./calculations/CalculationsCurve";

<<<<<<< HEAD
export function getUsdPricePerToken(
  tokenAddr: Address,
  block: ethereum.Block
): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING)
    return new CustomPriceType();

  // Exception: Wrong prices of crvTriCrypto
  // Ref: https://github.com/messari/subgraphs/pull/824
  if (
    tokenAddr.equals(constants.CRV_TRI_CRYPTO_ADDRESS) &&
    block.number.lt(BigInt.fromI32(12936339))
  )
    return new CustomPriceType();
=======
export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }
>>>>>>> b5219fd (Squashed All)

  let network = dataSource.network();

  // CUSTOM: Forex Oracle
  let forexPrice = getForexUsdRate(tokenAddr);
  if (!forexPrice.reverted) {
    log.debug("[forexPrice] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
<<<<<<< HEAD
      forexPrice.usdPrice.div(forexPrice.decimalsBaseTen).toString(),
=======
      forexPrice.usdPrice.div(forexPrice.decimalsBaseTen).toString()
>>>>>>> b5219fd (Squashed All)
    ]);
    return forexPrice;
  }

  // 1. Yearn Lens Oracle
  let yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, network);
  if (!yearnLensPrice.reverted) {
    log.debug("[YearnLensOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
<<<<<<< HEAD
      yearnLensPrice.usdPrice.div(yearnLensPrice.decimalsBaseTen).toString(),
=======
      yearnLensPrice.usdPrice.div(yearnLensPrice.decimalsBaseTen).toString()
>>>>>>> b5219fd (Squashed All)
    ]);
    return yearnLensPrice;
  }

  // 2. ChainLink Feed Registry
  let chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, network);
  if (!chainLinkPrice.reverted) {
    log.debug("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
<<<<<<< HEAD
      chainLinkPrice.usdPrice.div(chainLinkPrice.decimalsBaseTen).toString(),
=======
      chainLinkPrice.usdPrice.div(chainLinkPrice.decimalsBaseTen).toString()
>>>>>>> b5219fd (Squashed All)
    ]);
    return chainLinkPrice;
  }

  // 3. CalculationsCurve
  let calculationsCurvePrice = getTokenPriceFromCalculationCurve(
    tokenAddr,
    network
  );
  if (!calculationsCurvePrice.reverted) {
    log.debug("[CalculationsCurve] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsCurvePrice.usdPrice
        .div(calculationsCurvePrice.decimalsBaseTen)
<<<<<<< HEAD
        .toString(),
=======
        .toString()
>>>>>>> b5219fd (Squashed All)
    ]);
    return calculationsCurvePrice;
  }

  // 4. CalculationsSushiSwap
  let calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(
    tokenAddr,
    network
  );
  if (!calculationsSushiSwapPrice.reverted) {
    log.debug("[CalculationsSushiSwap] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsSushiSwapPrice.usdPrice
        .div(calculationsSushiSwapPrice.decimalsBaseTen)
<<<<<<< HEAD
        .toString(),
=======
        .toString()
>>>>>>> b5219fd (Squashed All)
    ]);
    return calculationsSushiSwapPrice;
  }

  // 5. Curve Router
  let curvePrice = getCurvePriceUsdc(tokenAddr, network);
  if (!curvePrice.reverted) {
    log.debug("[CurveRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
<<<<<<< HEAD
      curvePrice.usdPrice.div(curvePrice.decimalsBaseTen).toString(),
=======
      curvePrice.usdPrice.div(curvePrice.decimalsBaseTen).toString()
>>>>>>> b5219fd (Squashed All)
    ]);
    return curvePrice;
  }

  // 6. Uniswap Router
  let uniswapPrice = getPriceUsdcUniswap(tokenAddr, network);
  if (!uniswapPrice.reverted) {
    log.debug("[UniswapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
<<<<<<< HEAD
      uniswapPrice.usdPrice.div(uniswapPrice.decimalsBaseTen).toString(),
=======
      uniswapPrice.usdPrice.div(uniswapPrice.decimalsBaseTen).toString()
>>>>>>> b5219fd (Squashed All)
    ]);
    return uniswapPrice;
  }

  // 7. SushiSwap Router
  let sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
  if (!sushiswapPrice.reverted) {
    log.debug("[SushiSwapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
<<<<<<< HEAD
      sushiswapPrice.usdPrice.div(sushiswapPrice.decimalsBaseTen).toString(),
=======
      sushiswapPrice.usdPrice.div(sushiswapPrice.decimalsBaseTen).toString()
>>>>>>> b5219fd (Squashed All)
    ]);
    return sushiswapPrice;
  }

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [
    tokenAddr.toHexString(),
  ]);

  return new CustomPriceType();
}

export function getUsdPrice(
  tokenAddr: Address,
<<<<<<< HEAD
  amount: BigDecimal,
  block: ethereum.Block
): BigDecimal {
  let tokenPrice = getUsdPricePerToken(tokenAddr, block);
=======
  amount: BigDecimal
): BigDecimal {
  let tokenPrice = getUsdPricePerToken(tokenAddr);
>>>>>>> b5219fd (Squashed All)

  if (!tokenPrice.reverted) {
    return tokenPrice.usdPrice.times(amount).div(tokenPrice.decimalsBaseTen);
  }

  return constants.BIGDECIMAL_ZERO;
}
