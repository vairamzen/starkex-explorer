import { ForcedTradeOfferEntry } from '@explorer/frontend'

import { getTradeOfferPriceUSDCents } from '../../../core/getTradeOfferPriceUSDCents'
import { ForcedTradeOfferTransaction } from '../../../peripherals/database/ForcedTradeOfferRepository'

export function toForcedTradeOfferEntry(
  offer: ForcedTradeOfferTransaction
): ForcedTradeOfferEntry {
  return {
    id: offer.id,
    createdAt: offer.createdAt,
    type: offer.isABuyingSynthetic ? 'buy' : 'sell',
    amount: offer.syntheticAmount,
    assetId: offer.syntheticAssetId,
    positionId: offer.positionIdA,
    price: getTradeOfferPriceUSDCents(
      offer.collateralAmount,
      offer.syntheticAssetId,
      offer.syntheticAmount
    ),
    total: offer.collateralAmount,
  }
}
