import { Timestamp } from '@explorer/types'

import { ForcedTradeOfferTransaction } from '../../../peripherals/database/ForcedTradeOfferRepository'

interface Event {
  timestamp: Timestamp
  text: string
}

export function toForcedTradeOfferHistory(offer: ForcedTradeOfferTransaction) {
  const history: Event[] = [
    {
      timestamp: offer.createdAt,
      text: `offer created (looking for taker)`,
    },
  ]
  if (offer.accepted) {
    history.push({
      timestamp: offer.accepted.at,
      text: `taker found`,
    })
  }
  if (offer.cancelledAt) {
    history.push({
      timestamp: offer.cancelledAt,
      text: `offer cancelled`,
    })
  }
  return history
}
